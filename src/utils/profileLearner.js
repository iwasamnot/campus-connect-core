/**
 * Profile Learner - Long-Term Memory RAG Component
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * RESEARCH VALUE: "Personalized Context Injection via Multi-Hop Retrieval"
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This module implements the "Memory B" component of the Dual-Memory Architecture:
 * - Memory A: University Knowledge (static, shared by all users)
 * - Memory B: User Profile (dynamic, unique per student)
 * 
 * The Profile Learner:
 * 1. Analyzes user messages for permanent attributes (Major, Year, Interests)
 * 2. Extracts and embeds these facts
 * 3. Stores them in Pinecone's user_profiles namespace
 * 4. Enables personalized responses in future conversations
 * 
 * Academic Citation:
 * "The system maintains a secondary vector index dedicated to user attributes.
 * During inference, the RAG engine performs Multi-Hop Retrieval—fetching
 * institutional policies AND user preferences simultaneously."
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Configuration
const getEnvVar = (viteName, regularName, defaultValue = '') => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[viteName] || import.meta.env[regularName] || defaultValue;
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[regularName] || process.env[viteName] || defaultValue;
  }
  return defaultValue;
};

const PINECONE_API_KEY = getEnvVar('VITE_PINECONE_API_KEY', 'PINECONE_API_KEY');
const PINECONE_INDEX_NAME = getEnvVar('VITE_PINECONE_INDEX_NAME', 'PINECONE_INDEX_NAME', 'campus-connect-index');
const GEMINI_API_KEY = getEnvVar('VITE_GEMINI_API_KEY', 'GEMINI_API_KEY');

// Models
const EXTRACTION_MODEL = 'gemini-2.0-flash';
const EMBEDDING_MODEL = 'text-embedding-004';

// User Profile Namespace
const USER_PROFILE_NAMESPACE = 'user_profiles';

// Lazy-initialized clients
let pineconeClient = null;
let genAI = null;

function getPineconeClient() {
  if (!PINECONE_API_KEY) return null;
  if (!pineconeClient) {
    pineconeClient = new Pinecone({ apiKey: PINECONE_API_KEY });
  }
  return pineconeClient;
}

function getGenAIClient() {
  if (!GEMINI_API_KEY) return null;
  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return genAI;
}

/**
 * Profile fact categories for structured extraction
 */
const PROFILE_CATEGORIES = {
  ACADEMIC: ['major', 'course', 'year', 'semester', 'gpa', 'credits'],
  PERSONAL: ['name', 'age', 'nationality', 'language'],
  PREFERENCES: ['interests', 'goals', 'struggles', 'learning_style'],
  CONTEXT: ['work_status', 'visa_type', 'accommodation'],
};

/**
 * Extract permanent attributes from user message
 * Uses Gemini to identify facts worth remembering
 */
async function extractProfileFacts(userMessage) {
  const client = getGenAIClient();
  if (!client) {
    console.warn('Profile Learner: Gemini not configured');
    return null;
  }

  try {
    const model = client.getGenerativeModel({ model: EXTRACTION_MODEL });
    
    const extractionPrompt = `You are a profile extraction AI for a university student assistant.

Analyze this student message and extract PERMANENT attributes worth remembering.

EXTRACT these types of facts:
- Academic: Major, Course, Year level, Semester
- Personal: Name (if shared), Nationality, Background
- Preferences: Interests, Goals, Struggles, Learning style
- Context: Work status, Visa type, Living situation

DO NOT extract:
- Temporary states ("I'm tired today")
- Questions (they're asking, not telling)
- Vague statements without concrete info

Student Message: "${userMessage}"

Respond in JSON format:
{
  "has_info": true/false,
  "facts": [
    {
      "category": "academic|personal|preferences|context",
      "fact": "Student is in 2nd year of Bachelor of IT",
      "confidence": 0.95
    }
  ]
}

If no permanent facts found, return: {"has_info": false, "facts": []}`;

    const result = await model.generateContent(extractionPrompt);
    const text = result.response.text();
    
    // Clean up JSON (Gemini sometimes adds markdown)
    const jsonStr = text.replace(/```json|```/g, '').trim();
    
    try {
      const data = JSON.parse(jsonStr);
      return data;
    } catch (parseError) {
      console.warn('Profile Learner: Failed to parse extraction result');
      return { has_info: false, facts: [] };
    }
  } catch (error) {
    console.error('Profile Learner: Extraction failed:', error.message);
    return { has_info: false, facts: [] };
  }
}

/**
 * Generate embedding for a profile fact
 */
async function generateFactEmbedding(factText) {
  const client = getGenAIClient();
  if (!client) return null;

  try {
    const model = client.getGenerativeModel({ model: EMBEDDING_MODEL });
    const result = await model.embedContent(factText);
    return result.embedding.values;
  } catch (error) {
    console.error('Profile Learner: Embedding failed:', error.message);
    return null;
  }
}

/**
 * Store profile facts in Pinecone (User Namespace)
 */
async function storeProfileFacts(userId, facts) {
  const pinecone = getPineconeClient();
  if (!pinecone) {
    console.warn('Profile Learner: Pinecone not configured');
    return [];
  }

  const storedFacts = [];
  const index = pinecone.index(PINECONE_INDEX_NAME);
  const namespace = index.namespace(USER_PROFILE_NAMESPACE);

  for (const factObj of facts) {
    try {
      const embedding = await generateFactEmbedding(factObj.fact);
      if (!embedding) continue;

      const factId = `user_${userId}_${factObj.category}_${Date.now()}`;
      
      await namespace.upsert([{
        id: factId,
        values: embedding,
        metadata: {
          userId: userId,
          text: factObj.fact,
          category: factObj.category,
          confidence: factObj.confidence || 0.8,
          type: 'profile_fact',
          createdAt: new Date().toISOString(),
        },
      }]);

      storedFacts.push(factObj.fact);
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Profile Learner: Failed to store fact: ${error.message}`);
    }
  }

  return storedFacts;
}

/**
 * Main function: Update user profile based on their message
 * Called asynchronously after each chat interaction
 * 
 * @param {string} userId - Unique user identifier
 * @param {string} userMessage - The user's message to analyze
 * @returns {Promise<Object>} - Learning results
 */
export async function updateUserProfile(userId, userMessage) {
  if (!userId || !userMessage) {
    return { learned: false, facts: [] };
  }

  // Skip very short messages
  if (userMessage.trim().length < 10) {
    return { learned: false, facts: [], reason: 'message_too_short' };
  }

  console.log(`🧠 Profile Learner: Analyzing message for user ${userId.substring(0, 8)}...`);

  // Step 1: Extract facts from message
  const extraction = await extractProfileFacts(userMessage);
  
  if (!extraction || !extraction.has_info || extraction.facts.length === 0) {
    console.log('🧠 Profile Learner: No permanent facts found');
    return { learned: false, facts: [] };
  }

  // Filter high-confidence facts (>= 0.7)
  const confidentFacts = extraction.facts.filter(f => (f.confidence || 0.8) >= 0.7);
  
  if (confidentFacts.length === 0) {
    console.log('🧠 Profile Learner: No high-confidence facts');
    return { learned: false, facts: [] };
  }

  // Step 2: Store facts in Pinecone
  const storedFacts = await storeProfileFacts(userId, confidentFacts);

  if (storedFacts.length > 0) {
    console.log(`🧠 Profile Learner: Learned ${storedFacts.length} facts:`, storedFacts);
  }

  return {
    learned: storedFacts.length > 0,
    facts: storedFacts,
    totalExtracted: extraction.facts.length,
    totalStored: storedFacts.length,
  };
}

/**
 * Retrieve user profile facts from Pinecone
 * Used during RAG to personalize responses
 * 
 * @param {string} userId - User identifier
 * @param {number[]} queryEmbedding - Query vector for relevance matching
 * @param {number} topK - Number of facts to retrieve
 * @returns {Promise<Array>} - Relevant profile facts
 */
export async function getUserProfile(userId, queryEmbedding, topK = 3) {
  const pinecone = getPineconeClient();
  if (!pinecone || !userId) {
    return [];
  }

  try {
    const index = pinecone.index(PINECONE_INDEX_NAME);
    const namespace = index.namespace(USER_PROFILE_NAMESPACE);

    const results = await namespace.query({
      vector: queryEmbedding,
      topK: topK,
      filter: { userId: userId }, // Security: Only this user's facts
      includeMetadata: true,
    });

    return results.matches || [];
  } catch (error) {
    console.warn('Profile Learner: Failed to retrieve profile:', error.message);
    return [];
  }
}

/**
 * Get all stored facts for a user (for debugging/display)
 * 
 * @param {string} userId - User identifier
 * @returns {Promise<Array>} - All profile facts
 */
export async function getAllUserFacts(userId) {
  const pinecone = getPineconeClient();
  if (!pinecone || !userId) {
    return [];
  }

  try {
    const index = pinecone.index(PINECONE_INDEX_NAME);
    const namespace = index.namespace(USER_PROFILE_NAMESPACE);

    // Create a generic query vector (we want all facts, not specific ones)
    const dummyVector = new Array(768).fill(0.01);
    
    const results = await namespace.query({
      vector: dummyVector,
      topK: 20, // Get up to 20 facts
      filter: { userId: userId },
      includeMetadata: true,
    });

    return (results.matches || []).map(m => ({
      fact: m.metadata?.text,
      category: m.metadata?.category,
      createdAt: m.metadata?.createdAt,
    }));
  } catch (error) {
    console.warn('Profile Learner: Failed to get all facts:', error.message);
    return [];
  }
}

/**
 * Delete all profile facts for a user (GDPR compliance)
 * 
 * @param {string} userId - User identifier
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteUserProfile(userId) {
  const pinecone = getPineconeClient();
  if (!pinecone || !userId) {
    return false;
  }

  try {
    const index = pinecone.index(PINECONE_INDEX_NAME);
    const namespace = index.namespace(USER_PROFILE_NAMESPACE);

    // Delete by filter
    await namespace.deleteMany({ userId: userId });
    
    console.log(`🗑️ Profile Learner: Deleted profile for user ${userId.substring(0, 8)}`);
    return true;
  } catch (error) {
    console.error('Profile Learner: Failed to delete profile:', error.message);
    return false;
  }
}

/**
 * Check if profile learning is properly configured
 */
export function isProfileLearningConfigured() {
  return !!(PINECONE_API_KEY && GEMINI_API_KEY);
}

export default {
  updateUserProfile,
  getUserProfile,
  getAllUserFacts,
  deleteUserProfile,
  isProfileLearningConfigured,
};
