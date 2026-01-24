/**
 * RAG Evaluator Module
 * Implements "Semantic Verification" to filter high-quality information
 * before storing in Pinecone, preventing conversational noise pollution
 */

import { callAI } from './aiProvider';

/**
 * Trust Level Tiers for Source Weighting
 */
export const TRUST_TIERS = {
  TIER_1_HIGH: {
    level: 1,
    weight: 1.5,
    sources: ['universityData.json', 'fallbackKnowledge.js', 'manual_upload'],
    description: 'Manual uploads and verified data'
  },
  TIER_2_MEDIUM: {
    level: 2,
    weight: 1.0,
    sources: ['pdf_extraction', 'website_scraper', 'official_document'],
    description: 'Official documents and website data'
  },
  TIER_3_LOW: {
    level: 3,
    weight: 0.7,
    sources: ['web_auto_learned', 'user_chat', 'conversation'],
    description: 'Learned from user chats (provisional)'
  }
};

/**
 * Dual-Brain Evaluator: Classify and extract information into public vs private
 * Routes university facts to public namespace, user profile to private namespace
 * 
 * @param {string} userMessage - User's message to analyze
 * @param {string} userId - User ID for personal context (optional)
 * @returns {Promise<{valid: boolean, type: string, fact: string, category: string} | null>}
 */
export const evaluateAndLearn = async (userMessage, userId = null) => {
  try {
    if (!userMessage || userMessage.trim().length < 10) {
      return null;
    }

    const EVALUATOR_PROMPT = `You are the Memory Manager for CampusConnect. Your job is to analyze the user's latest message and extract VALUABLE information to save for the future.

CLASSIFY and EXTRACT information into two categories:
1. "university_fact": Permanent facts about the school (Fees, Locations, Courses, Staff, Policies, Facilities).
2. "user_profile": Personal details about the user (Name, Job, Studies, Preferences, Schedule, Work).

RULES:
- IGNORE casual chit-chat ("hello", "thanks", "lol", "ok", "sure").
- REWRITE the info as a standalone fact.
- User Context: The user's name might be mentioned in history, but verify if stated in this message.
- If information is about the university/school → university_fact
- If information is about the user personally → user_profile

INPUT EXAMPLE 1: 
"I just found out the library closes at 5pm on Fridays."
OUTPUT: 
{ "valid": true, "type": "university_fact", "fact": "The SISTC Library closes at 5:00 PM on Fridays.", "category": "facilities" }

INPUT EXAMPLE 2:
"By the way, I work night shifts at Sentinel Security so I study mostly at night."
OUTPUT:
{ "valid": true, "type": "user_profile", "fact": "User works night shifts at Sentinel Security and prefers studying at night.", "category": "personal_context" }

INPUT EXAMPLE 3:
"Can you help me?"
OUTPUT:
{ "valid": false }

Analyze this user message and return JSON only:`;

    const response = await callAI(EVALUATOR_PROMPT + `\n\nUser message: "${userMessage}"`, {
      systemPrompt: 'You are a Memory Manager. Classify information into university_fact or user_profile. Return valid JSON only.',
      maxTokens: 300,
      temperature: 0.1,
      model: 'deepseek-r1:8b'
    });

    if (!response) {
      return null;
    }

    // Parse JSON response
    let result;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = JSON.parse(response);
      }
    } catch (parseError) {
      console.warn('🧠 [Dual-Brain] Failed to parse JSON:', parseError);
      return null;
    }

    if (!result.valid) {
      console.log('🧠 [Dual-Brain] Rejected: Casual chat or no valuable information');
      return null;
    }

    return {
      valid: true,
      type: result.type || 'university_fact',
      fact: result.fact || userMessage.trim(),
      category: result.category || 'general'
    };

  } catch (error) {
    console.error('🧠 [Dual-Brain] Error evaluating:', error);
    return null;
  }
};

/**
 * Evaluator Step: Grade information before storing (Legacy - kept for backward compatibility)
 * Uses a fast AI model to determine if text contains factual, verifiable information
 * 
 * @param {string} text - Text to evaluate
 * @param {string} context - Optional context about where this came from
 * @returns {Promise<{shouldStore: boolean, cleanedText: string, confidence: number}>}
 */
export const evaluateInformation = async (text, context = '') => {
  try {
    if (!text || text.trim().length < 20) {
      return {
        shouldStore: false,
        cleanedText: '',
        confidence: 0,
        reason: 'Text too short'
      };
    }

    // Use a fast, small model for evaluation (deepseek-r1:8b or similar)
    const evaluationPrompt = `You are an information quality evaluator for a university knowledge base.

Evaluate this text and determine if it contains factual, verifiable information about the university (e.g., dates, policies, locations, names, procedures).

**Rules:**
- REJECT conversational noise like "you just said its jane smith" or "as I mentioned before"
- REJECT questions, opinions, or uncertain statements
- ACCEPT only clear, factual statements that can stand alone
- If the text contains facts, rewrite it as a clean, standalone fact

**Text to evaluate:**
${text.substring(0, 2000)}${text.length > 2000 ? '...' : ''}

${context ? `**Context:** ${context}` : ''}

**Respond in this exact JSON format:**
{
  "shouldStore": true or false,
  "cleanedText": "rewritten fact as standalone statement, or empty string if rejected",
  "confidence": 0.0 to 1.0,
  "reason": "brief explanation"
}

Examples:
- Input: "you just said its jane smith" → {"shouldStore": false, "cleanedText": "", "confidence": 0.0, "reason": "Conversational reference, not a fact"}
- Input: "The dean of SISTC is Greg Whateley" → {"shouldStore": true, "cleanedText": "Dean of SISTC: Greg Whateley", "confidence": 0.9, "reason": "Clear factual statement"}
- Input: "I think the campus might be in Sydney" → {"shouldStore": false, "cleanedText": "", "confidence": 0.2, "reason": "Uncertain statement, not verifiable"}`;

    const response = await callAI(evaluationPrompt, {
      systemPrompt: 'You are a strict information quality evaluator. Only accept factual, verifiable information. Return valid JSON only.',
      maxTokens: 300,
      temperature: 0.1, // Low temperature for consistent evaluation
      model: 'deepseek-r1:8b' // Use fast model for evaluation
    });

    if (!response) {
      return {
        shouldStore: false,
        cleanedText: '',
        confidence: 0,
        reason: 'AI evaluation failed'
      };
    }

    // Parse JSON response
    let evaluation;
    try {
      // Try to extract JSON from response (handle markdown code blocks)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        evaluation = JSON.parse(jsonMatch[0]);
      } else {
        evaluation = JSON.parse(response);
      }
    } catch (parseError) {
      console.warn('🧠 [Evaluator] Failed to parse JSON, using fallback logic:', parseError);
      // Fallback: Simple heuristic check
      const hasFactualIndicators = /(?:is|are|was|were|located|address|phone|email|dean|director|founded|established|offers|provides)/i.test(text);
      const hasConversationalNoise = /(?:you (?:just |said|mentioned)|as I (?:said|mentioned)|I think|maybe|might|probably)/i.test(text);
      
      return {
        shouldStore: hasFactualIndicators && !hasConversationalNoise,
        cleanedText: hasFactualIndicators && !hasConversationalNoise ? text.trim() : '',
        confidence: hasFactualIndicators && !hasConversationalNoise ? 0.6 : 0.2,
        reason: hasConversationalNoise ? 'Contains conversational noise' : (hasFactualIndicators ? 'Heuristic match' : 'No factual indicators')
      };
    }

    // Validate evaluation result
    if (typeof evaluation.shouldStore !== 'boolean') {
      evaluation.shouldStore = evaluation.confidence > 0.5;
    }

    if (evaluation.shouldStore && (!evaluation.cleanedText || evaluation.cleanedText.trim().length < 10)) {
      // If should store but no cleaned text, use original (trimmed)
      evaluation.cleanedText = text.trim().substring(0, 500);
    }

    return {
      shouldStore: evaluation.shouldStore || false,
      cleanedText: (evaluation.cleanedText || '').trim(),
      confidence: Math.max(0, Math.min(1, evaluation.confidence || 0.5)),
      reason: evaluation.reason || 'Evaluated'
    };

  } catch (error) {
    console.error('🧠 [Evaluator] Error evaluating information:', error);
    // Fail-safe: reject if evaluation fails
    return {
      shouldStore: false,
      cleanedText: '',
      confidence: 0,
      reason: `Evaluation error: ${error.message}`
    };
  }
};

/**
 * Determine trust tier for a source
 * @param {string} source - Source identifier
 * @returns {Object} Trust tier configuration
 */
export const getTrustTier = (source) => {
  if (!source) return TRUST_TIERS.TIER_3_LOW;

  const sourceLower = source.toLowerCase();
  
  // Check Tier 1 (High Trust)
  if (TRUST_TIERS.TIER_1_HIGH.sources.some(s => sourceLower.includes(s))) {
    return TRUST_TIERS.TIER_1_HIGH;
  }
  
  // Check Tier 2 (Medium Trust)
  if (TRUST_TIERS.TIER_2_MEDIUM.sources.some(s => sourceLower.includes(s))) {
    return TRUST_TIERS.TIER_2_MEDIUM;
  }
  
  // Default to Tier 3 (Low Trust)
  return TRUST_TIERS.TIER_3_LOW;
};

/**
 * Calculate retrieval weight based on trust tier and confidence
 * @param {Object} trustTier - Trust tier object
 * @param {number} confidence - Confidence score (0-1)
 * @returns {number} Weight multiplier for retrieval
 */
export const calculateRetrievalWeight = (trustTier, confidence = 1.0) => {
  return trustTier.weight * confidence;
};

/**
 * Save fact to Pinecone with namespace routing
 * @param {string} fact - Fact text to save
 * @param {string} namespace - Pinecone namespace (e.g., 'sistc-public' or 'user_context_userId')
 * @param {string} source - Source identifier
 * @param {Array} embedding - Vector embedding (768 dimensions)
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<boolean>} - Success status
 */
export const saveToPineconeNamespace = async (fact, namespace, source, embedding, metadata = {}) => {
  try {
    // Import ragRetrieval dynamically to avoid circular dependencies
    const { ragRetrieval } = await import('./ragRetrieval');
    
    if (!ragRetrieval.pineconeConfigured || !ragRetrieval.pineconeIndex) {
      console.warn(`🧠 [Dual-Brain] Pinecone not configured, cannot save to namespace: ${namespace}`);
      return false;
    }

    // Get namespace-specific index
    const namespaceIndex = ragRetrieval.pineconeIndex.namespace(namespace);
    
    const id = `mem_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const fullMetadata = {
      text: fact.substring(0, 1000),
      source: source,
      created_at: new Date().toISOString(),
      ...metadata
    };

    await namespaceIndex.upsert([{
      id: id,
      values: embedding,
      metadata: fullMetadata
    }]);

    console.log(`✅ [Dual-Brain] Saved to namespace "${namespace}": ${id}`);
    return true;
  } catch (error) {
    console.error(`🧠 [Dual-Brain] Error saving to namespace ${namespace}:`, error);
    return false;
  }
};
