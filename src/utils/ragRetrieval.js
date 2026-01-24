/**
 * RAG Retrieval System
 * Retrieves relevant documents from knowledge base using vector similarity search
 * NOW USES PINECONE for actual vector search
 */

import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { generateEmbedding, cosineSimilarity } from './ragEmbeddings';
import { Pinecone } from '@pinecone-database/pinecone';

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
    this.documents = []; // In-memory document store (fallback)
    this.pineconeClient = null;
    this.pineconeIndex = null;
    this.pineconeConfigured = false;
    
    // Initialize Pinecone if API key is available
    this.initPinecone();
  }
  
  /**
   * Initialize Pinecone client if API key is configured
   */
  initPinecone() {
    const apiKey = import.meta.env.VITE_PINECONE_API_KEY?.trim();
    const indexName = import.meta.env.VITE_PINECONE_INDEX_NAME?.trim() || 'campus-connect-index';
    
    if (apiKey && apiKey !== '') {
      try {
        this.pineconeClient = new Pinecone({ apiKey });
        this.pineconeIndex = this.pineconeClient.index(indexName);
        this.pineconeConfigured = true;
        console.log(`✅ [Pinecone] Initialized with index: ${indexName}`);
        console.log(`📊 [Pinecone] API Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
      } catch (error) {
        console.error('❌ [Pinecone] Failed to initialize:', error);
        this.pineconeConfigured = false;
      }
    } else {
      console.warn('⚠️ [Pinecone] VITE_PINECONE_API_KEY not configured in environment variables');
      console.warn('⚠️ [Pinecone] Using local document fallback (Firestore/in-memory)');
      console.warn('💡 [Pinecone] To enable Pinecone: Add VITE_PINECONE_API_KEY to your .env file');
      this.pineconeConfigured = false;
    }
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
   * Retrieve relevant documents for a query from both public and private namespaces
   * NOW QUERIES PINECONE if configured, otherwise falls back to local documents
   * 
   * @param {string} queryText - Query text
   * @param {number} topK - Number of results per namespace
   * @param {number} minSimilarity - Minimum similarity threshold
   * @param {string} userId - Optional user ID for private namespace queries
   * @returns {Promise<Array>} - Combined results from public and private namespaces
   */
  async retrieve(queryText, topK = 10, minSimilarity = 0.3, userId = null) {
    if (!queryText || queryText.trim().length === 0) {
      return [];
    }

    // PRIORITY 1: Query Pinecone if configured
    if (this.pineconeConfigured && this.pineconeIndex) {
      try {
        console.log(`🔍 [Pinecone] Querying for: "${queryText.substring(0, 50)}..."`);
        
        // Generate embedding for query
        const queryEmbedding = await generateEmbedding(queryText.trim());
        if (!queryEmbedding || !Array.isArray(queryEmbedding)) {
          console.warn('⚠️ [Pinecone] Could not generate query embedding, falling back to local');
          return this.retrieveLocal(queryText, topK, minSimilarity);
        }

        // Validate embedding dimensions match Pinecone index (768)
        if (queryEmbedding.length !== 768) {
          console.error(`❌ [Pinecone] Embedding dimension mismatch! Expected 768, got ${queryEmbedding.length}`);
          console.error(`💡 [Pinecone] Your Pinecone index requires 768-dimensional vectors`);
          console.error(`💡 [Pinecone] Current embedding generator creates ${queryEmbedding.length}-dimensional vectors`);
          return this.retrieveLocal(queryText, topK, minSimilarity);
        }

        // ✅ UPGRADED: Query both public and private namespaces
        const allDocuments = [];
        
        // 1. Query Public Namespace (University Facts)
        console.log(`🔍 [Pinecone] Querying PUBLIC namespace with ${queryEmbedding.length}-dimensional vector`);
        try {
          const publicNamespace = this.pineconeIndex.namespace('sistc-public');
          const publicResults = await publicNamespace.query({
            vector: queryEmbedding,
            topK: Math.floor(topK * 0.7), // 70% from public
            includeMetadata: true,
          });
          
          if (publicResults.matches && publicResults.matches.length > 0) {
            console.log(`✅ [Pinecone] Retrieved ${publicResults.matches.length} matches from PUBLIC namespace`);
            allDocuments.push(...this.convertMatchesToDocuments(publicResults.matches, minSimilarity, 'public'));
          }
        } catch (namespaceError) {
          console.warn('⚠️ [Pinecone] Public namespace query failed, trying default:', namespaceError);
          // Fallback to default namespace
          const results = await this.pineconeIndex.query({
            vector: queryEmbedding,
            topK: topK,
            includeMetadata: true,
          });
          if (results.matches && results.matches.length > 0) {
            allDocuments.push(...this.convertMatchesToDocuments(results.matches, minSimilarity, 'default'));
          }
        }
        
        // 2. Query Private Namespace (User Profile) - Only if userId provided
        if (userId) {
          try {
            const userNamespace = this.pineconeIndex.namespace(`user_context_${userId}`);
            const userResults = await userNamespace.query({
              vector: queryEmbedding,
              topK: Math.floor(topK * 0.3), // 30% from user profile
              includeMetadata: true,
            });
            
            if (userResults.matches && userResults.matches.length > 0) {
              console.log(`👤 [Pinecone] Retrieved ${userResults.matches.length} matches from USER namespace`);
              allDocuments.push(...this.convertMatchesToDocuments(userResults.matches, minSimilarity, 'user'));
            }
          } catch (userNamespaceError) {
            console.warn('⚠️ [Pinecone] User namespace query failed (may not exist yet):', userNamespaceError.message);
          }
        }
        
        // Use combined results if we have namespace results, otherwise fall back to old method
        if (allDocuments.length > 0) {
          // Remove duplicates and sort by weighted score
          const uniqueDocs = this.deduplicateDocuments(allDocuments);
          const sortedDocs = uniqueDocs.sort((a, b) => (b.metadata.weightedScore || 0) - (a.metadata.weightedScore || 0));
          
          console.log(`✅ [Pinecone] Returning ${sortedDocs.length} combined documents (public + user)`);
          return sortedDocs.slice(0, topK); // Limit to topK
        }
        
        // Fallback: Query default namespace if namespace queries failed
        console.log(`🔍 [Pinecone] Querying DEFAULT namespace with ${queryEmbedding.length}-dimensional vector (topK: ${topK}, minSimilarity: ${minSimilarity})`);
        const results = await this.pineconeIndex.query({
          vector: queryEmbedding,
          topK: topK,
          includeMetadata: true,
        });

        if (results.matches && results.matches.length > 0) {
          console.log(`✅ [Pinecone] Retrieved ${results.matches.length} matches from Pinecone`);
          const documents = this.convertMatchesToDocuments(results.matches, minSimilarity, 'default');
          
          if (documents.length > 0) {
            console.log(`✅ [Pinecone] Returning ${documents.length} documents after filtering`);
            return documents;
          } else {
            console.warn(`⚠️ [Pinecone] All ${results.matches.length} matches filtered out (threshold too high: ${minSimilarity})`);
            console.warn(`💡 [Pinecone] Try lowering minSimilarity threshold or check if embeddings match`);
            return this.retrieveLocal(queryText, topK, minSimilarity);
          }
        } else {
          console.warn(`⚠️ [Pinecone] No matches found in index`);
          console.warn(`💡 [Pinecone] Possible issues:`);
          console.warn(`   - Index is empty (no documents indexed)`);
          console.warn(`   - Embeddings don't match (different embedding model used)`);
          console.warn(`   - Query embedding generation failed`);
          return this.retrieveLocal(queryText, topK, minSimilarity);
        }
      } catch (error) {
        console.error('❌ [Pinecone] Query error:', error);
        console.log('🔄 [Pinecone] Falling back to local retrieval');
        return this.retrieveLocal(queryText, topK, minSimilarity);
      }
    }

    // PRIORITY 2: Fallback to local document search
    return this.retrieveLocal(queryText, topK, minSimilarity);
  }

  /**
   * Convert Pinecone matches to KnowledgeDocument format
   * @private
   */
  convertMatchesToDocuments(matches, minSimilarity, namespaceType = 'default') {
    return matches
      .filter(match => {
        const baseScore = match.score || 0;
        if (baseScore < minSimilarity) {
          console.log(`   ⚠️ Filtered out match (score: ${baseScore.toFixed(3)} < ${minSimilarity})`);
          return false;
        }
        return true;
      })
      .map(match => {
        // Apply trust weight to score (higher trust = boosted score)
        const trustWeight = match.metadata?.retrieval_weight || match.metadata?.trust_weight || 1.0;
        const trustTier = match.metadata?.trust_tier || 3;
        const weightedScore = (match.score || 0) * trustWeight;
        
        const doc = new KnowledgeDocument({
          id: match.id,
          text: match.metadata?.text || match.metadata?.content || '',
          metadata: {
            title: match.metadata?.title || 'Document',
            category: match.metadata?.category || 'general',
            source: match.metadata?.source || 'Pinecone',
            namespace: namespaceType,
            score: match.score, // Original score
            weightedScore: weightedScore, // Weighted score for sorting
            trustTier: trustTier,
            trustWeight: trustWeight,
            confidence: match.metadata?.confidence || 1.0
          },
          embedding: null // Don't store embedding in document object
        });
        
        const trustLabel = trustTier === 1 ? '🔒 High' : trustTier === 2 ? '📄 Medium' : '💬 Low';
        const namespaceLabel = namespaceType === 'user' ? '👤' : namespaceType === 'public' ? '🌍' : '📚';
        console.log(`   ${namespaceLabel} Match: "${doc.metadata.title}" (score: ${match.score?.toFixed(3)}, weighted: ${weightedScore.toFixed(3)}, ${trustLabel} trust)`);
        return doc;
      });
  }

  /**
   * Remove duplicate documents based on ID
   * @private
   */
  deduplicateDocuments(documents) {
    const seen = new Set();
    return documents.filter(doc => {
      if (seen.has(doc.id)) {
        return false;
      }
      seen.add(doc.id);
      return true;
    });
  }
  
  /**
   * Retrieve from local documents (fallback when Pinecone not available)
   */
  async retrieveLocal(queryText, topK = 10, minSimilarity = 0.3) {
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
      console.error('RAG: Error during local retrieval:', error);
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
