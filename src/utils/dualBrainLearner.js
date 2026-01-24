/**
 * Dual-Brain Learning System
 * Routes information to public (university facts) or private (user profile) namespaces
 * 
 * This module handles the intelligent classification and storage of information
 * learned from user conversations.
 */

import { evaluateAndLearn, saveToPineconeNamespace } from './ragEvaluator';
import { generateEmbedding } from './ragEmbeddings';
import { checkForDuplicate, updateExistingRecord } from './knowledgeBase';
import { ragRetrieval } from './ragRetrieval';
import { getTrustTier, calculateRetrievalWeight, TRUST_TIERS } from './ragEvaluator';

/**
 * Learn from user message and route to appropriate namespace
 * @param {string} userMessage - User's message
 * @param {string} userId - User ID (required for user_profile type)
 * @returns {Promise<{learned: boolean, type: string, fact: string}>}
 */
export const learnFromUserMessage = async (userMessage, userId = null) => {
  try {
    if (!userMessage || userMessage.trim().length < 10) {
      return { learned: false, reason: 'message_too_short' };
    }

    // Step 1: Evaluate and classify the message
    const evaluation = await evaluateAndLearn(userMessage, userId);
    
    if (!evaluation || !evaluation.valid) {
      console.log('🧠 [Dual-Brain] No valuable information to learn');
      return { learned: false, reason: 'no_valuable_info' };
    }

    // Step 2: Generate embedding
    const embedding = await generateEmbedding(evaluation.fact);
    
    if (!embedding || !Array.isArray(embedding) || embedding.length !== 768) {
      console.warn('🧠 [Dual-Brain] Invalid embedding generated');
      return { learned: false, reason: 'embedding_failed' };
    }

    // Step 3: Route to appropriate namespace
    if (evaluation.type === 'university_fact') {
      // 🌍 Public Knowledge - Available to everyone
      console.log(`🌍 [Dual-Brain] Learning new University Fact: ${evaluation.fact}`);
      
      // Check for duplicates in public namespace before storing
      const isDuplicate = await checkForDuplicateInNamespace(embedding, evaluation.fact, 'sistc-public', 0.90);
      
      if (isDuplicate) {
        console.log(`🔄 [Dual-Brain] Similar university fact exists, updating...`);
        const updateSuccess = await updateExistingRecordInNamespace(
          isDuplicate.id, 
          evaluation.fact, 
          embedding, 
          'sistc-public',
          {
            source: 'user_learned',
            type: 'university_fact',
            category: evaluation.category,
            trust_tier: TRUST_TIERS.TIER_3_LOW.level,
            trust_weight: TRUST_TIERS.TIER_3_LOW.weight,
            retrieval_weight: calculateRetrievalWeight(TRUST_TIERS.TIER_3_LOW, 0.8),
            lastUpdated: new Date().toISOString()
          }
        );
        
        if (updateSuccess) {
          return { learned: true, type: 'university_fact', fact: evaluation.fact, updated: true };
        }
      } else {
        // Save to public namespace
        const success = await saveToPineconeNamespace(
          evaluation.fact,
          'sistc-public', // Public namespace for university facts
          'user_learned',
          embedding,
          {
            type: 'university_fact',
            category: evaluation.category,
            trust_tier: TRUST_TIERS.TIER_3_LOW.level,
            trust_weight: TRUST_TIERS.TIER_3_LOW.weight,
            retrieval_weight: calculateRetrievalWeight(TRUST_TIERS.TIER_3_LOW, 0.8)
          }
        );
        
        if (success) {
          return { learned: true, type: 'university_fact', fact: evaluation.fact };
        }
      }
    } else if (evaluation.type === 'user_profile') {
      // 👤 Private Knowledge - Only for this specific user
      if (!userId) {
        console.warn('🧠 [Dual-Brain] User ID required for user_profile type');
        return { learned: false, reason: 'user_id_required' };
      }
      
      console.log(`👤 [Dual-Brain] Updating User Context: ${evaluation.fact}`);
      
      // Save to user-specific namespace
      const userNamespace = `user_context_${userId}`;
      const success = await saveToPineconeNamespace(
        evaluation.fact,
        userNamespace,
        'personal_memory',
        embedding,
        {
          type: 'user_profile',
          category: evaluation.category,
          userId: userId,
          trust_tier: TRUST_TIERS.TIER_3_LOW.level,
          trust_weight: TRUST_TIERS.TIER_3_LOW.weight,
          retrieval_weight: calculateRetrievalWeight(TRUST_TIERS.TIER_3_LOW, 0.8)
        }
      );
      
      if (success) {
        return { learned: true, type: 'user_profile', fact: evaluation.fact };
      }
    }

    return { learned: false, reason: 'storage_failed' };
  } catch (error) {
    console.error('🧠 [Dual-Brain] Error learning from message:', error);
    return { learned: false, reason: `error: ${error.message}` };
  }
};

/**
 * Check for duplicates in a specific namespace
 */
const checkForDuplicateInNamespace = async (embedding, text, namespace, similarityThreshold = 0.90) => {
  try {
    if (!ragRetrieval.pineconeConfigured || !ragRetrieval.pineconeIndex) {
      return null;
    }
    
    const namespaceIndex = ragRetrieval.pineconeIndex.namespace(namespace);
    const results = await namespaceIndex.query({
      vector: embedding,
      topK: 5,
      includeMetadata: true
    });
    
    if (results.matches && results.matches.length > 0) {
      const highSimilarityMatches = results.matches.filter(
        match => match.score >= similarityThreshold
      );
      
      if (highSimilarityMatches.length > 0) {
        const bestMatch = highSimilarityMatches[0];
        return {
          id: bestMatch.id,
          score: bestMatch.score,
          metadata: bestMatch.metadata
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('🧠 [Dual-Brain] Error checking duplicates in namespace:', error);
    return null;
  }
};

/**
 * Update existing record in a specific namespace
 */
const updateExistingRecordInNamespace = async (id, text, embedding, namespace, metadata = {}) => {
  try {
    if (!ragRetrieval.pineconeConfigured || !ragRetrieval.pineconeIndex) {
      return false;
    }
    
    const namespaceIndex = ragRetrieval.pineconeIndex.namespace(namespace);
    const fullMetadata = {
      text: text.substring(0, 1000),
      ...metadata,
      lastUpdated: new Date().toISOString(),
      updateCount: (metadata.updateCount || 0) + 1
    };
    
    await namespaceIndex.upsert([{
      id: id,
      values: embedding,
      metadata: fullMetadata
    }]);
    
    return true;
  } catch (error) {
    console.error('🧠 [Dual-Brain] Error updating record in namespace:', error);
    return false;
  }
};
