const functions = require('firebase-functions');
const { Pinecone } = require('@pinecone-database/pinecone');
const { v4: uuidv4 } = require('uuid');
const OpenAI = require('openai');

// Read secrets from runtime config or environment variables
// Pinecone credentials
const PINECONE_API_KEY =
  process.env.PINECONE_API_KEY || functions.config().pinecone?.api_key;
const PINECONE_INDEX_NAME =
  process.env.PINECONE_INDEX_NAME || functions.config().pinecone?.index;

// Groq API key for embeddings (we use Groq's OpenAI-compatible API instead of OpenAI)
// This avoids depending on OpenAI while keeping the same embeddings flow.
const GROQ_API_KEY =
  process.env.GROQ_API_KEY || functions.config().groq?.api_key;

// Validate configuration early
if (!PINECONE_API_KEY) {
  console.warn('ragService: PINECONE_API_KEY is not set');
}
if (!PINECONE_INDEX_NAME) {
  console.warn('ragService: PINECONE_INDEX_NAME is not set');
}
if (!GROQ_API_KEY) {
  console.warn('ragService: GROQ_API_KEY is not set (RAG embeddings will be disabled)');
}

const pineconeClient =
  PINECONE_API_KEY && PINECONE_INDEX_NAME
    ? new Pinecone({ apiKey: PINECONE_API_KEY })
    : null;

// Use Groq's OpenAI-compatible API as the embeddings provider
// Base URL: https://api.groq.com/openai/v1
const openai = GROQ_API_KEY
  ? new OpenAI({ apiKey: GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' })
  : null;

const getIndex = () => {
  if (!pineconeClient || !PINECONE_INDEX_NAME) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Pinecone is not configured'
    );
  }
  return pineconeClient.index(PINECONE_INDEX_NAME);
};

const embedText = async (text) => {
  if (!openai) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Groq embeddings are not configured'
    );
  }
  const trimmed = (text || '').slice(0, 6000); // keep prompt small for embeddings
  const resp = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: trimmed,
  });
  return resp.data[0].embedding;
};

// Upsert a batch of documents into Pinecone
// Uses process.env / functions.config() for configuration; secrets are optional
exports.ragUpsert = functions
  .region('us-central1')
  .https.onCall(async (data, context) => {
    try {
      const { documents } = data || {};

      if (!Array.isArray(documents) || documents.length === 0) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'documents array is required'
        );
      }

      if (!openai || !pineconeClient) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Vector service is not configured'
        );
      }

      const index = getIndex();

      // Limit batch size to avoid timeouts
      const batch = documents.slice(0, 200);

      const vectors = [];
      for (const doc of batch) {
        const text = doc.text || '';
        const id = doc.id || uuidv4();
        const metadata = doc.metadata || {};
        const embedding = await embedText(text);
        vectors.push({
          id,
          values: embedding,
          metadata: {
            text,
            ...metadata,
          },
        });
      }

      await index.upsert(vectors);

      return { upserted: vectors.length };
    } catch (error) {
      console.error('ragUpsert error:', error);
      // Re-throw HttpsError as is
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError('internal', error.message);
    }
  });

// Search Pinecone and return top matches with metadata
// Uses process.env / functions.config() for configuration; secrets are optional
exports.ragSearch = functions
  .region('us-central1')
  .https.onCall(async (data, context) => {
    try {
      const { query, topK = 8, filter } = data || {};

      if (!query || typeof query !== 'string') {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'query is required'
        );
      }

      if (!openai || !pineconeClient) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Vector service is not configured'
        );
      }

      const index = getIndex();

      const vector = await embedText(query);

      const result = await index.query({
        topK: Math.min(Number(topK) || 8, 20),
        vector,
        includeMetadata: true,
        filter: filter || undefined,
      });

      const matches =
        result.matches?.map((m) => ({
          id: m.id,
          score: m.score,
          text: m.metadata?.text || '',
          metadata: m.metadata || {},
        })) || [];

      return { matches };
    } catch (error) {
      console.error('ragSearch error:', error);
      // Re-throw HttpsError as is
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError('internal', error.message);
    }
  });
