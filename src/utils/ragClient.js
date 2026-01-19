import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebaseConfig';
import { processKnowledgeBase } from './knowledgeBaseProcessor';

const ragSearchFn = () => httpsCallable(functions, 'ragSearch');
const ragUpsertFn = () => httpsCallable(functions, 'ragUpsert');

const LOCAL_FLAG_KEY = 'rag_upsert_done';

/**
 * Upsert our static knowledge base into Pinecone via Cloud Function.
 * We gate with localStorage to avoid repeated uploads on the client.
 */
export const ensureKnowledgeBaseIndexed = async () => {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(LOCAL_FLAG_KEY)) return;

  try {
    const documents = processKnowledgeBase();
    if (!Array.isArray(documents) || documents.length === 0) return;

    await ragUpsertFn()({
      documents: documents.map((doc) => ({
        id: doc.id || doc.title || Math.random().toString(36).slice(2),
        text: doc.text || '',
        metadata: doc.metadata || {},
      })),
    });

    localStorage.setItem(LOCAL_FLAG_KEY, '1');
    console.info(`RAG: Upserted ${documents.length} knowledge base docs`);
  } catch (error) {
    console.warn('RAG: Failed to upsert knowledge base', error);
  }
};

/**
 * Query Pinecone for top matches for a user question.
 */
export const searchRag = async (query, topK = 8) => {
  try {
    const { data } = await ragSearchFn()({ query, topK });
    return data?.matches || [];
  } catch (error) {
    console.warn('RAG: search fallback (vector service unavailable)', error);
    return [];
  }
};

