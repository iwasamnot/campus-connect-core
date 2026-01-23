/**
 * Knowledge Base Learning Module
 * Handles self-learning from web search results
 * Automatically updates Pinecone with new information
 */

import { generateEmbedding } from './ragEmbeddings';
import { ragRetrieval } from './ragRetrieval';
import { callAI } from './aiProvider';

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
    
    // Step 3: Chunk the summary (for now, use the whole summary as one chunk)
    // In production, you might want to split into smaller chunks
    const chunks = [summary.trim()];
    
    // Step 4: Generate embeddings and upsert to Pinecone
    let learnedCount = 0;
    for (const chunk of chunks) {
      try {
        // Generate embedding
        const embedding = await generateEmbedding(chunk);
        
        if (!embedding || !Array.isArray(embedding) || embedding.length !== 768) {
          console.warn('🧠 [Learning] Invalid embedding generated, skipping chunk');
          continue;
        }
        
        // Upsert to Pinecone
        const success = await upsertToPinecone(chunk, embedding, {
          source: 'web_auto_learned',
          date: Date.now(),
          query: userQuery,
          originalResults: webResults.length
        });
        
        if (success) {
          learnedCount++;
          console.log(`🧠 [Learning] Successfully learned and saved chunk ${learnedCount}/${chunks.length}`);
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
 * Upsert a document to Pinecone
 * @param {string} text - Document text
 * @param {Array} embedding - Vector embedding (768 dimensions)
 * @param {Object} metadata - Metadata object
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
    
    // Prepare metadata
    const fullMetadata = {
      text: text.substring(0, 1000), // Store first 1000 chars in metadata
      ...metadata,
      learnedAt: new Date().toISOString()
    };
    
    // Upsert to Pinecone
    await ragRetrieval.pineconeIndex.upsert([
      {
        id: id,
        values: embedding,
        metadata: fullMetadata
      }
    ]);
    
    console.log(`🧠 [Learning] Upserted to Pinecone: ${id}`);
    return true;
  } catch (error) {
    console.error('🧠 [Learning] Error upserting to Pinecone:', error);
    return false;
  }
};
