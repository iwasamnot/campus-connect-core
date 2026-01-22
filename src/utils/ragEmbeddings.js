/**
 * RAG Embeddings Utility
 * Creates vector embeddings using Vertex AI text-embedding-004 model
 * Updated for Vertex AI enterprise tier
 */

/**
 * Generate embedding for text using Vertex AI text-embedding-004 model
 * Falls back to hash-based embedding if Vertex AI is not available
 */
export const generateEmbedding = async (text) => {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Text is required for embedding generation');
  }

  // Check for Vertex AI configuration
  const projectId = import.meta.env.VITE_GCP_PROJECT_ID?.trim();
  const location = import.meta.env.VITE_GCP_LOCATION?.trim() || 'us-central1';
  const vertexFunctionUrl = import.meta.env.VITE_VERTEX_AI_FUNCTION_URL?.trim();

  // Try Vertex AI text-embedding-004 model via Cloud Function
  // Use the embedding endpoint (generateVertexAIEmbedding)
  if (vertexFunctionUrl && projectId) {
    try {
      // Extract base URL and use the embedding function endpoint
      const baseUrl = vertexFunctionUrl.replace('/generateVertexAIResponse', '');
      const embedUrl = `${baseUrl}/generateVertexAIEmbedding`;
      
      const response = await fetch(embedUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model: 'text-embedding-004',
          projectId,
          location,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.embedding && Array.isArray(data.embedding)) {
          console.log('✅ Using Vertex AI text-embedding-004 for embeddings');
          return data.embedding;
        }
      }
    } catch (error) {
      console.warn('Vertex AI embedding failed, using fallback:', error);
    }
  }

  // Fallback: Use hash-based semantic representation
  console.log('⚠️ Using hash-based embedding fallback (Vertex AI not configured)');
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
