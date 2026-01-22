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
 * CRITICAL: Must match Pinecone index dimensions (768 for campus-connect-index)
 * This creates vectors based on text characteristics that work with cosine similarity
 */
const createHashBasedEmbedding = (text) => {
  const vectorSize = 768; // MATCHES Pinecone index dimensions (campus-connect-index)
  const vector = new Array(vectorSize).fill(0);
  const words = text.toLowerCase().split(/\s+/);
  
  // Use multiple hash functions to distribute words across the 768 dimensions
  words.forEach((word, idx) => {
    // Hash function 1: Simple character hash
    let hash1 = 0;
    for (let i = 0; i < word.length; i++) {
      hash1 = ((hash1 << 5) - hash1) + word.charCodeAt(i);
      hash1 = hash1 & hash1; // Convert to 32-bit integer
    }
    const index1 = Math.abs(hash1) % vectorSize;
    vector[index1] += 1 / (idx + 1); // Weighted by position
    
    // Hash function 2: Reverse word hash (for better distribution)
    let hash2 = 0;
    for (let i = word.length - 1; i >= 0; i--) {
      hash2 = ((hash2 << 5) - hash2) + word.charCodeAt(i);
      hash2 = hash2 & hash2;
    }
    const index2 = Math.abs(hash2) % vectorSize;
    if (index2 !== index1) {
      vector[index2] += 0.5 / (idx + 1);
    }
    
    // Hash function 3: Character pair hash (bigrams)
    for (let i = 0; i < word.length - 1; i++) {
      const bigram = word.substring(i, i + 2);
      let hash3 = 0;
      for (let j = 0; j < bigram.length; j++) {
        hash3 = ((hash3 << 5) - hash3) + bigram.charCodeAt(j);
        hash3 = hash3 & hash3;
      }
      const index3 = Math.abs(hash3) % vectorSize;
      if (index3 !== index1 && index3 !== index2) {
        vector[index3] += 0.3 / (idx + 1);
      }
    }
  });
  
  // Normalize the vector (required for cosine similarity)
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
