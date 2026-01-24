/**
 * Knowledge Base Learning Module
 * Handles self-learning from web search results
 * Automatically updates Pinecone with new information
 * 
 * ✅ UPGRADED: Now uses Semantic Verification (Evaluator + De-duplication + Source Weighting)
 */

import { generateEmbedding } from './ragEmbeddings';
import { ragRetrieval } from './ragRetrieval';
import { callAI } from './aiProvider';
import { 
  evaluateInformation, 
  getTrustTier, 
  calculateRetrievalWeight,
  TRUST_TIERS 
} from './ragEvaluator';

/**
 * Learn from web search results and update knowledge base
 * @param {string} userQuery - Original user query
 * @param {Array} webResults - Web search results from Tavily/DuckDuckGo
 * @returns {Promise<boolean>} - Success status
 */
export const learnFromWeb = async (userQuery, webResults) => {
  try {
    if (!webResults || webResults.length === 0) {
      console.warn('🧠 [Learning] No web results to learn from');
      return false;
    }
    
    console.log(`🧠 [Learning] Processing ${webResults.length} web results for learning...`);
    
    // Step 1: Combine web results into raw text
    const rawText = webResults
      .map(result => `${result.title || ''}\n${result.content || result.snippet || ''}`)
      .join('\n\n---\n\n');
    
    // Step 2: Ask DeepSeek to summarize into clean, factual paragraph about SISTC
    const summarizationPrompt = `Summarize this new information into a clean, factual paragraph about SISTC (Sydney International School of Technology and Commerce). 
Focus on:
- Key facts and information
- Relevance to SISTC students
- Accuracy and clarity

Raw information:
${rawText.substring(0, 3000)} ${rawText.length > 3000 ? '...' : ''}

Provide a concise, factual summary (2-4 sentences) that can be stored in the knowledge base.`;
    
    const summary = await callAI(summarizationPrompt, {
      systemPrompt: 'You are a knowledge base summarizer. Create clean, factual summaries suitable for storage in a knowledge base. Focus on accuracy and relevance to SISTC.',
      maxTokens: 300,
      temperature: 0.3
    });
    
    if (!summary || summary.trim().length < 50) {
      console.warn('🧠 [Learning] Summary too short or empty, skipping learning');
      return false;
    }
    
    console.log(`🧠 [Learning] Generated summary: ${summary.substring(0, 100)}...`);
    
    // ✅ NEW STEP 2.5: Evaluate information quality (Semantic Verification)
    const evaluation = await evaluateInformation(summary, `From web search results for query: "${userQuery}"`);
    
    if (!evaluation.shouldStore) {
      console.warn(`🧠 [Evaluator] Rejected: ${evaluation.reason} (confidence: ${evaluation.confidence.toFixed(2)})`);
      console.warn(`🧠 [Evaluator] Text: "${summary.substring(0, 100)}..."`);
      return false;
    }
    
    const cleanedText = evaluation.cleanedText || summary.trim();
    console.log(`✅ [Evaluator] Approved with confidence ${evaluation.confidence.toFixed(2)}: ${evaluation.reason}`);
    console.log(`📝 [Evaluator] Cleaned text: "${cleanedText.substring(0, 100)}..."`);
    
    // Step 3: Chunk the cleaned summary
    const chunks = [cleanedText];
    
    // Step 4: Generate embeddings and check for duplicates before upserting
    let learnedCount = 0;
    for (const chunk of chunks) {
      try {
        // Generate embedding
        const embedding = await generateEmbedding(chunk);
        
        if (!embedding || !Array.isArray(embedding) || embedding.length !== 768) {
          console.warn('🧠 [Learning] Invalid embedding generated, skipping chunk');
          continue;
        }
        
        // ✅ NEW STEP 4.5: Semantic De-duplication - Check for similar vectors
        const isDuplicate = await checkForDuplicate(embedding, chunk, 0.90); // 90% similarity threshold
        
        if (isDuplicate) {
          console.log(`🔄 [De-duplication] Similar fact already exists, updating instead of creating duplicate`);
          // Update existing record instead of creating new one
          const updateSuccess = await updateExistingRecord(isDuplicate.id, chunk, embedding, {
            source: 'web_auto_learned',
            date: Date.now(),
            query: userQuery,
            originalResults: webResults.length,
            trust_tier: TRUST_TIERS.TIER_3_LOW.level,
            trust_weight: TRUST_TIERS.TIER_3_LOW.weight,
            confidence: evaluation.confidence,
            retrieval_weight: calculateRetrievalWeight(TRUST_TIERS.TIER_3_LOW, evaluation.confidence),
            lastUpdated: new Date().toISOString()
          });
          
          if (updateSuccess) {
            learnedCount++;
            console.log(`✅ [De-duplication] Updated existing record: ${isDuplicate.id}`);
          }
        } else {
          // ✅ NEW: Add source weighting to metadata
          const trustTier = getTrustTier('web_auto_learned');
          const retrievalWeight = calculateRetrievalWeight(trustTier, evaluation.confidence);
          
          // Upsert to Pinecone with trust metadata
          const success = await upsertToPinecone(chunk, embedding, {
            source: 'web_auto_learned',
            date: Date.now(),
            query: userQuery,
            originalResults: webResults.length,
            trust_tier: trustTier.level,
            trust_weight: trustTier.weight,
            confidence: evaluation.confidence,
            retrieval_weight: retrievalWeight,
            evaluated: true,
            evaluation_reason: evaluation.reason
          });
          
          if (success) {
            learnedCount++;
            console.log(`🧠 [Learning] Successfully learned and saved chunk ${learnedCount}/${chunks.length}`);
          }
        }
      } catch (chunkError) {
        console.error('🧠 [Learning] Error processing chunk:', chunkError);
      }
    }
    
    if (learnedCount > 0) {
      console.log(`🧠 I just learned something new and saved it to memory. (${learnedCount} chunks)`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('🧠 [Learning] Error in learnFromWeb:', error);
    return false;
  }
};

/**
 * Check for duplicate/similar vectors in Pinecone (Semantic De-duplication)
 * @param {Array} embedding - Vector embedding to check
 * @param {string} text - Text content for additional verification
 * @param {number} similarityThreshold - Minimum similarity score (0-1)
 * @returns {Promise<{id: string, score: number} | null>} - Duplicate match or null
 */
export const checkForDuplicate = async (embedding, text, similarityThreshold = 0.90) => {
  try {
    if (!ragRetrieval.pineconeConfigured || !ragRetrieval.pineconeIndex) {
      return null;
    }
    
    // Query Pinecone for similar vectors
    const results = await ragRetrieval.pineconeIndex.query({
      vector: embedding,
      topK: 5, // Check top 5 matches
      includeMetadata: true,
      filter: {
        source: { $eq: 'web_auto_learned' } // Only check within same source type
      }
    });
    
    if (results.matches && results.matches.length > 0) {
      // Find matches above similarity threshold
      const highSimilarityMatches = results.matches.filter(
        match => match.score >= similarityThreshold
      );
      
      if (highSimilarityMatches.length > 0) {
        // Return the highest scoring match
        const bestMatch = highSimilarityMatches[0];
        console.log(`🔄 [De-duplication] Found similar vector: ${bestMatch.id} (similarity: ${bestMatch.score.toFixed(3)})`);
        return {
          id: bestMatch.id,
          score: bestMatch.score,
          metadata: bestMatch.metadata
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('🧠 [De-duplication] Error checking for duplicates:', error);
    return null;
  }
};

/**
 * Update an existing Pinecone record instead of creating a duplicate
 * @param {string} id - Existing vector ID
 * @param {string} text - Updated text
 * @param {Array} embedding - Updated embedding
 * @param {Object} metadata - Updated metadata
 * @returns {Promise<boolean>} - Success status
 */
export const updateExistingRecord = async (id, text, embedding, metadata = {}) => {
  try {
    if (!ragRetrieval.pineconeConfigured || !ragRetrieval.pineconeIndex) {
      return false;
    }
    
    const fullMetadata = {
      text: text.substring(0, 1000),
      ...metadata,
      lastUpdated: new Date().toISOString(),
      updateCount: (metadata.updateCount || 0) + 1
    };
    
    await ragRetrieval.pineconeIndex.upsert([
      {
        id: id,
        values: embedding,
        metadata: fullMetadata
      }
    ]);
    
    console.log(`✅ [De-duplication] Updated existing record: ${id}`);
    return true;
  } catch (error) {
    console.error('🧠 [De-duplication] Error updating record:', error);
    return false;
  }
};

/**
 * Upsert a document to Pinecone
 * @param {string} text - Document text
 * @param {Array} embedding - Vector embedding (768 dimensions)
 * @param {Object} metadata - Metadata object (now includes trust_tier, trust_weight, retrieval_weight)
 * @returns {Promise<boolean>} - Success status
 */
const upsertToPinecone = async (text, embedding, metadata = {}) => {
  try {
    // Check if Pinecone is configured
    if (!ragRetrieval.pineconeConfigured || !ragRetrieval.pineconeIndex) {
      console.warn('🧠 [Learning] Pinecone not configured, cannot upsert');
      return false;
    }
    
    // Generate unique ID
    const id = `learned_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Prepare metadata with trust weighting
    const fullMetadata = {
      text: text.substring(0, 1000), // Store first 1000 chars in metadata
      ...metadata,
      learnedAt: new Date().toISOString(),
      // Ensure trust metadata is included
      trust_tier: metadata.trust_tier || TRUST_TIERS.TIER_3_LOW.level,
      trust_weight: metadata.trust_weight || TRUST_TIERS.TIER_3_LOW.weight,
      retrieval_weight: metadata.retrieval_weight || 1.0
    };
    
    // Upsert to Pinecone
    await ragRetrieval.pineconeIndex.upsert([
      {
        id: id,
        values: embedding,
        metadata: fullMetadata
      }
    ]);
    
    console.log(`🧠 [Learning] Upserted to Pinecone: ${id} (trust_tier: ${fullMetadata.trust_tier}, weight: ${fullMetadata.retrieval_weight.toFixed(2)})`);
    return true;
  } catch (error) {
    console.error('🧠 [Learning] Error upserting to Pinecone:', error);
    return false;
  }
};
