/**
 * RAG Retrieval System
 * Retrieves relevant documents from knowledge base using vector similarity search
 */

import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { generateEmbedding, cosineSimilarity } from './ragEmbeddings';

/**
 * Document structure for knowledge base
 */
export class KnowledgeDocument {
  constructor({ id, text, metadata = {}, embedding = null }) {
    this.id = id;
    this.text = text;
    this.metadata = metadata; // { category, source, title, etc. }
    this.embedding = embedding;
  }
}

/**
 * RAG Retrieval System
 */
export class RAGRetrieval {
  constructor() {
    this.cache = new Map(); // Cache for embeddings
    this.documents = []; // In-memory document store
  }

  /**
   * Load documents from Firestore or use in-memory knowledge base
   */
  async loadDocuments() {
    try {
      // Try to load from Firestore first
      if (db) {
        const q = query(collection(db, 'knowledgeBase'), limit(1000));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          this.documents = snapshot.docs.map(doc => {
            const data = doc.data();
            return new KnowledgeDocument({
              id: doc.id,
              text: data.text || '',
              metadata: data.metadata || {},
              embedding: data.embedding || null
            });
          });
          console.log(`RAG: Loaded ${this.documents.length} documents from Firestore`);
          return;
        }
      }
    } catch (error) {
      console.warn('RAG: Could not load from Firestore, using in-memory knowledge base:', error);
    }
    
    // Fallback: Use in-memory knowledge base (converted from existing SISTC_KNOWLEDGE_BASE)
    // This will be initialized by the knowledge base processor
  }

  /**
   * Initialize with documents
   */
  initializeDocuments(documents) {
    this.documents = documents.map(doc => 
      doc instanceof KnowledgeDocument ? doc : new KnowledgeDocument(doc)
    );
  }

  /**
   * Retrieve relevant documents for a query
   * Updated for Vertex AI enterprise tier - increased default topK to 10
   */
  async retrieve(queryText, topK = 10, minSimilarity = 0.3) {
    if (!queryText || queryText.trim().length === 0) {
      return [];
    }

    try {
      // Generate embedding for query
      const queryEmbedding = await generateEmbedding(queryText.trim());
      if (!queryEmbedding) {
        console.warn('RAG: Could not generate query embedding, using keyword fallback');
        return this.retrieveByKeywords(queryText, topK);
      }

      // Calculate similarity for each document
      const similarities = this.documents
        .map(doc => {
          let similarity = 0;
          
          if (doc.embedding && Array.isArray(doc.embedding)) {
            similarity = cosineSimilarity(queryEmbedding, doc.embedding);
          } else {
            // Fallback: Use keyword matching if no embedding
            similarity = this.calculateKeywordSimilarity(queryText, doc.text);
          }
          
          return {
            document: doc,
            similarity
          };
        })
        .filter(item => item.similarity >= minSimilarity)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);

      return similarities.map(item => item.document);
    } catch (error) {
      console.error('RAG: Error during retrieval:', error);
      // Fallback to keyword search
      return this.retrieveByKeywords(queryText, topK);
    }
  }

  /**
   * Retrieve documents using keyword matching (fallback)
   */
  retrieveByKeywords(queryText, topK = 5) {
    const queryLower = queryText.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
    
    const scored = this.documents.map(doc => {
      const textLower = doc.text.toLowerCase();
      let score = 0;
      
      queryWords.forEach(word => {
        if (textLower.includes(word)) {
          score += 1;
        }
      });
      
      // Bonus for exact phrase match
      if (textLower.includes(queryLower)) {
        score += 5;
      }
      
      return { document: doc, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(item => item.document);
    
    return scored;
  }

  /**
   * Calculate keyword-based similarity (fallback method)
   */
  calculateKeywordSimilarity(query, text) {
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const textLower = text.toLowerCase();
    const textWords = textLower.split(/\s+/);
    
    if (queryWords.length === 0) return 0;
    
    let matches = 0;
    queryWords.forEach(word => {
      if (textWords.includes(word)) {
        matches++;
      }
    });
    
    return matches / queryWords.length;
  }

  /**
   * Format retrieved documents into context string
   * Updated to format all 10 results as a clean, numbered string for better AI processing
   */
  formatContext(documents, maxLength = 3000) {
    if (!documents || documents.length === 0) {
      return '';
    }

    let context = '';
    documents.forEach((doc, index) => {
      const docText = doc.metadata?.title 
        ? `[${doc.metadata.title}]\n${doc.text}`
        : doc.text;
      
      // Number each result for better AI processing
      const numberedDoc = `${index + 1}. ${docText}`;
      
      if (context.length + numberedDoc.length > maxLength) {
        const remaining = maxLength - context.length - 100;
        context += numberedDoc.substring(0, remaining) + '...\n\n';
        return; // Break out of forEach
      }
      
      context += numberedDoc + '\n\n';
    });

    return context.trim();
  }
}

// Export singleton instance
export const ragRetrieval = new RAGRetrieval();
