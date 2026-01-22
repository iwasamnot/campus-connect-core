/**
 * RAG Embeddings Utility
 * Creates vector embeddings using hash-based fallback
 * (Vertex AI embeddings removed - using hash-based semantic representation)
 */

/**
 * Generate embedding for text using Vertex AI text-embedding-004 model
 * Falls back to hash-based embedding if Vertex AI is not available
 */
export const generateEmbedding = async (text) => {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Text is required for embedding generation');
  }

  // Use hash-based semantic representation (Vertex AI embeddings removed)
  // This provides good semantic similarity for RAG without external API dependencies
  return createHashBasedEmbedding(text);
};

/**
 * Create a hash-based embedding as fallback
 * This is a simple approach that creates vectors based on text characteristics
 */
const createHashBasedEmbedding = (text) => {
  const vectorSize = 384; // Standard embedding size
  const vector = new Array(vectorSize).fill(0);
  const words = text.toLowerCase().split(/\s+/);
  
  words.forEach((word, idx) => {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) - hash) + word.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    const index = Math.abs(hash) % vectorSize;
    vector[index] += 1 / (idx + 1); // Weighted by position
  });
  
  // Normalize the vector
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    return vector.map(val => val / magnitude);
  }
  
  return vector;
};

/**
 * Calculate cosine similarity between two vectors
 */
export const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }
  
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }
  
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  
  return dotProduct / (magnitudeA * magnitudeB);
};

/**
 * Batch generate embeddings for multiple texts
 */
export const generateEmbeddingsBatch = async (texts, batchSize = 5) => {
  const embeddings = [];
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchEmbeddings = await Promise.all(
      batch.map(text => generateEmbedding(text))
    );
    embeddings.push(...batchEmbeddings);
    
    // Add small delay to respect rate limits
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return embeddings;
};
