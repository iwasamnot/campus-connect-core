/**
 * Serverless Vector RAG Engine - Query Logic
 * 
 * This module provides RAG (Retrieval-Augmented Generation) functionality
 * using Pinecone for vector search and Google Gemini for embeddings and generation.
 * 
 * Main function: askVirtualSenior(userQuestion)
 * 
 * Environment Variables Required (via import.meta.env or process.env):
 *   - VITE_PINECONE_API_KEY or PINECONE_API_KEY: Your Pinecone API key
 *   - VITE_PINECONE_INDEX_NAME or PINECONE_INDEX_NAME: The Pinecone index name
 *   - VITE_GEMINI_API_KEY or GEMINI_API_KEY: Your Google Gemini API key
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Configuration - Support both Vite env vars and regular env vars
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

// Model configurations
const EMBEDDING_MODEL = 'text-embedding-004';
const GENERATION_MODEL = 'gemini-2.0-flash';
const TOP_K_MATCHES = 3;

// Lazy-initialized clients
let pineconeClient = null;
let pineconeIndex = null;
let genAI = null;

/**
 * Initialize or get the Pinecone client
 */
function getPineconeClient() {
  if (!PINECONE_API_KEY) {
    throw new Error('PINECONE_API_KEY is not configured. Please set VITE_PINECONE_API_KEY in your environment.');
  }
  
  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: PINECONE_API_KEY,
    });
  }
  
  return pineconeClient;
}

/**
 * Initialize or get the Pinecone index
 */
function getPineconeIndex() {
  if (!pineconeIndex) {
    const client = getPineconeClient();
    pineconeIndex = client.index(PINECONE_INDEX_NAME);
  }
  
  return pineconeIndex;
}

/**
 * Initialize or get the Google Generative AI client
 */
function getGenAIClient() {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured. Please set VITE_GEMINI_API_KEY in your environment.');
  }
  
  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  
  return genAI;
}

/**
 * Step A: Convert user question into an embedding using text-embedding-004
 * 
 * @param {string} text - The text to convert to embedding
 * @returns {Promise<number[]>} - The embedding vector
 */
async function generateEmbedding(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Text is required for embedding generation');
  }

  try {
    const client = getGenAIClient();
    const model = client.getGenerativeModel({ model: EMBEDDING_MODEL });
    
    const result = await model.embedContent(text.trim());
    const embedding = result.embedding.values;
    
    if (!embedding || embedding.length === 0) {
      throw new Error('Empty embedding returned from API');
    }
    
    return embedding;
  } catch (error) {
    console.error('RAG Engine: Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

/**
 * Step B: Query the Pinecone index for the top K most similar matches
 * 
 * @param {number[]} queryEmbedding - The query embedding vector
 * @param {number} topK - Number of top matches to retrieve
 * @returns {Promise<Array>} - Array of matches from Pinecone
 */
async function queryPinecone(queryEmbedding, topK = TOP_K_MATCHES) {
  try {
    const index = getPineconeIndex();
    
    const results = await index.query({
      vector: queryEmbedding,
      topK: topK,
      includeMetadata: true,
    });
    
    return results.matches || [];
  } catch (error) {
    console.error('RAG Engine: Error querying Pinecone:', error);
    throw new Error(`Failed to query Pinecone: ${error.message}`);
  }
}

/**
 * Step C: Extract metadata.text from matches to form a Context String
 * 
 * @param {Array} matches - Array of Pinecone matches
 * @param {number} maxLength - Maximum context length in characters
 * @returns {string} - Formatted context string
 */
function buildContextString(matches, maxLength = 3000) {
  if (!matches || matches.length === 0) {
    return '';
  }
  
  let context = '';
  
  for (const match of matches) {
    const title = match.metadata?.title || 'Information';
    const text = match.metadata?.text || '';
    const score = match.score ? `(${(match.score * 100).toFixed(0)}% match)` : '';
    
    // Format with clear document title for easy citation
    // The AI should cite as [Source: {title}]
    const chunk = `📄 DOCUMENT: "${title}" ${score}\n${text}\n---\n\n`;
    
    // Stop if we exceed max length
    if (context.length + chunk.length > maxLength) {
      // Add truncated version if there's room
      const remaining = maxLength - context.length - 50;
      if (remaining > 100) {
        context += `📄 DOCUMENT: "${title}"\n${text.substring(0, remaining)}...\n---\n\n`;
      }
      break;
    }
    
    context += chunk;
  }
  
  return context.trim();
}

/**
 * Step D: Pass Context + User Question to Gemini for generation
 * 
 * @param {string} context - The retrieved context from Pinecone
 * @param {string} userQuestion - The user's original question
 * @returns {Promise<string>} - The AI-generated response
 */
async function generateResponse(context, userQuestion) {
  try {
    const client = getGenAIClient();
    const model = client.getGenerativeModel({ model: GENERATION_MODEL });
    
    const systemPrompt = `You are a helpful Virtual Senior at Sydney International School of Technology and Commerce (SISTC). Your role is to assist students, prospective students, and visitors with questions about the institution.

## CRITICAL RULE - Source Citations:
You MUST cite the source document title for every fact you mention. This builds trust and proves your answers are grounded in real data.

**Citation Format:** Include [Source: Document Title] after each key fact.

**Example Response:**
"The Bachelor of IT is a 3-year degree [Source: Bachelor of Information Technology]. You can apply online through our website [Source: Application Process]. The course is ACS accredited [Source: ACS Certification]."

## Your Knowledge Base:
${context || 'No specific context was retrieved. Please rely on your general knowledge about educational institutions.'}

## Guidelines:
1. **Cite Your Sources**: Always include [Source: Title] after facts from the knowledge base.
2. **Be Helpful and Friendly**: Answer like an experienced senior student would.
3. **Use the Context**: Base answers primarily on the provided knowledge base.
4. **Be Accurate**: If context doesn't contain enough info, say so honestly.
5. **Be Concise**: Use bullet points or numbered lists when appropriate.
6. **Stay On Topic**: Focus on SISTC, courses, student life, applications.

## User Question:
${userQuestion}

Provide a helpful, well-cited response:`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();
    
    if (!text || text.trim().length === 0) {
      throw new Error('Empty response from generation model');
    }
    
    return text.trim();
  } catch (error) {
    console.error('RAG Engine: Error generating response:', error);
    throw new Error(`Failed to generate response: ${error.message}`);
  }
}

/**
 * Main RAG Query Function: askVirtualSenior
 * 
 * This function orchestrates the full RAG pipeline:
 *   Step A: Convert userQuestion into an embedding
 *   Step B: Query Pinecone for top 3 similar matches
 *   Step C: Extract context from matches
 *   Step D: Generate response with Gemini
 *   Step E: Return the AI's answer
 * 
 * @param {string} userQuestion - The user's question
 * @param {Object} options - Optional configuration
 * @param {number} options.topK - Number of matches to retrieve (default: 3)
 * @param {number} options.maxContextLength - Max context length in chars (default: 3000)
 * @param {boolean} options.includeDebugInfo - Include debug info in response (default: false)
 * @returns {Promise<Object>} - Object containing the answer and optional debug info
 */
export async function askVirtualSenior(userQuestion, options = {}) {
  const {
    topK = TOP_K_MATCHES,
    maxContextLength = 3000,
    includeDebugInfo = false,
  } = options;

  // Validate input
  if (!userQuestion || typeof userQuestion !== 'string') {
    throw new Error('User question is required and must be a string');
  }
  
  const trimmedQuestion = userQuestion.trim();
  if (trimmedQuestion.length === 0) {
    throw new Error('User question cannot be empty');
  }
  
  if (trimmedQuestion.length > 2000) {
    throw new Error('User question is too long (max 2000 characters)');
  }

  const debugInfo = {
    question: trimmedQuestion,
    steps: [],
    matches: [],
    contextLength: 0,
    processingTime: 0,
  };

  const startTime = Date.now();

  try {
    // Step A: Generate embedding for the question
    debugInfo.steps.push('Generating embedding...');
    const questionEmbedding = await generateEmbedding(trimmedQuestion);
    debugInfo.steps.push(`Embedding generated (${questionEmbedding.length} dimensions)`);

    // Step B: Query Pinecone for similar matches
    debugInfo.steps.push('Querying Pinecone...');
    const matches = await queryPinecone(questionEmbedding, topK);
    debugInfo.steps.push(`Found ${matches.length} matches`);
    debugInfo.matches = matches.map(m => ({
      id: m.id,
      score: m.score,
      title: m.metadata?.title,
    }));

    // Step C: Build context string from matches
    debugInfo.steps.push('Building context...');
    const context = buildContextString(matches, maxContextLength);
    debugInfo.contextLength = context.length;
    debugInfo.steps.push(`Context built (${context.length} chars)`);

    // Step D: Generate response with Gemini
    debugInfo.steps.push('Generating response...');
    const answer = await generateResponse(context, trimmedQuestion);
    debugInfo.steps.push('Response generated');

    // Calculate processing time
    debugInfo.processingTime = Date.now() - startTime;

    // Step E: Return the result
    if (includeDebugInfo) {
      return {
        answer,
        debug: debugInfo,
      };
    }

    return { answer };

  } catch (error) {
    debugInfo.steps.push(`Error: ${error.message}`);
    debugInfo.processingTime = Date.now() - startTime;

    // Log error for debugging
    console.error('RAG Engine: askVirtualSenior failed:', error);

    // Return a user-friendly error response
    const errorResponse = {
      answer: "I apologize, but I'm having trouble processing your question right now. Please try again in a moment, or contact the SISTC support team for assistance.",
      error: error.message,
    };

    if (includeDebugInfo) {
      errorResponse.debug = debugInfo;
    }

    return errorResponse;
  }
}

/**
 * Check if the RAG engine is properly configured
 * 
 * @returns {Object} - Configuration status
 */
export function checkConfiguration() {
  const status = {
    isConfigured: true,
    missing: [],
    configured: [],
  };

  if (!PINECONE_API_KEY) {
    status.isConfigured = false;
    status.missing.push('PINECONE_API_KEY (or VITE_PINECONE_API_KEY)');
  } else {
    status.configured.push('Pinecone API Key');
  }

  if (!GEMINI_API_KEY) {
    status.isConfigured = false;
    status.missing.push('GEMINI_API_KEY (or VITE_GEMINI_API_KEY)');
  } else {
    status.configured.push('Gemini API Key');
  }

  status.indexName = PINECONE_INDEX_NAME;
  status.embeddingModel = EMBEDDING_MODEL;
  status.generationModel = GENERATION_MODEL;

  return status;
}

/**
 * Test the RAG engine with a sample query
 * 
 * @returns {Promise<Object>} - Test results
 */
export async function testRAGEngine() {
  const testQuestion = 'What courses does SISTC offer?';
  
  console.log('🧪 Testing RAG Engine...');
  console.log(`   Question: "${testQuestion}"`);
  
  try {
    const result = await askVirtualSenior(testQuestion, { includeDebugInfo: true });
    
    console.log('✅ Test passed!');
    console.log(`   Processing time: ${result.debug?.processingTime}ms`);
    console.log(`   Matches found: ${result.debug?.matches?.length || 0}`);
    console.log(`   Answer preview: ${result.answer.substring(0, 100)}...`);
    
    return {
      success: true,
      result,
    };
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Default export for convenience
export default {
  askVirtualSenior,
  checkConfiguration,
  testRAGEngine,
};
