const functions = require('firebase-functions');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { Pinecone } = require('@pinecone-database/pinecone');
const { v4: uuidv4 } = require('uuid');
const OpenAI = require('openai');

// Read secrets from runtime config or environment variables
const PINECONE_API_KEY =
  process.env.PINECONE_API_KEY || functions.config().pinecone?.api_key;
const PINECONE_INDEX_NAME =
  process.env.PINECONE_INDEX_NAME || functions.config().pinecone?.index;
const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY || functions.config().openai?.api_key;

const CORS_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://campus-connect-sistc.web.app',
  'https://campus-connect-sistc.firebaseapp.com',
  'https://sistc.app',
  'https://www.sistc.app',
];

// Validate configuration early
if (!PINECONE_API_KEY) {
  console.warn('ragService: PINECONE_API_KEY is not set');
}
if (!PINECONE_INDEX_NAME) {
  console.warn('ragService: PINECONE_INDEX_NAME is not set');
}
if (!OPENAI_API_KEY) {
  console.warn('ragService: OPENAI_API_KEY is not set');
}

const pineconeClient =
  PINECONE_API_KEY && PINECONE_INDEX_NAME
    ? new Pinecone({ apiKey: PINECONE_API_KEY })
    : null;

const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

const getIndex = () => {
  if (!pineconeClient || !PINECONE_INDEX_NAME) {
    throw new HttpsError(
      'failed-precondition',
      'Pinecone is not configured'
    );
  }
  return pineconeClient.index(PINECONE_INDEX_NAME);
};

const embedText = async (text) => {
  if (!openai) {
    throw new HttpsError(
      'failed-precondition',
      'OpenAI is not configured'
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
exports.ragUpsert = onCall(
  {
    region: 'us-central1',
    cors: CORS_ORIGINS,
  },
  async (request) => {
    const { documents } = request.data || {};

    if (!Array.isArray(documents) || documents.length === 0) {
      throw new HttpsError(
        'invalid-argument',
        'documents array is required'
      );
    }

    if (!openai || !pineconeClient) {
      throw new HttpsError(
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
  }
);

// Search Pinecone and return top matches with metadata
exports.ragSearch = onCall(
  {
    region: 'us-central1',
    cors: CORS_ORIGINS,
  },
  async (request) => {
    const { query, topK = 8, filter } = request.data || {};

    if (!query || typeof query !== 'string') {
      throw new HttpsError(
        'invalid-argument',
        'query is required'
      );
    }

    if (!openai || !pineconeClient) {
      throw new HttpsError(
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
  }
);

