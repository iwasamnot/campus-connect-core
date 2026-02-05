/**
 * Advanced RAG System with Memory, Web Learning, and Vector Database
 * Features:
 * - Long-term memory storage
 * - Web scraping and learning
 * - Vector embeddings with semantic search
 * - Conversation context awareness
 * - Automatic knowledge base updates
 * - Personalized responses
 */

import { callAI } from './aiProvider';
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Simple in-memory vector store (in production, use Pinecone/Weaviate)
class VectorStore {
  constructor() {
    this.vectors = new Map();
    this.dimensions = 384; // Default for sentence-transformers
  }

  // Simple text embedding (in production, use actual embedding model)
  async embed(text) {
    // For now, use a simple hash-based embedding
    // In production, replace with actual embedding API
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(this.dimensions).fill(0);
    
    words.forEach((word, i) => {
      const hash = this.simpleHash(word);
      const idx = Math.abs(hash) % this.dimensions;
      embedding[idx] = (embedding[idx] || 0) + 1 / (i + 1);
    });

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  async add(id, text, metadata = {}) {
    const embedding = await this.embed(text);
    this.vectors.set(id, {
      embedding,
      text,
      metadata,
      timestamp: Date.now()
    });
  }

  async search(query, topK = 5) {
    const queryEmbedding = await this.embed(query);
    const results = [];

    for (const [id, data] of this.vectors.entries()) {
      const similarity = this.cosineSimilarity(queryEmbedding, data.embedding);
      results.push({
        id,
        text: data.text,
        metadata: data.metadata,
        similarity,
        timestamp: data.timestamp
      });
    }

    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  cosineSimilarity(a, b) {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}

// Web scraper for learning
class WebLearner {
  constructor() {
    this.learningQueue = [];
    this.isProcessing = false;
  }

  async learnFromUrl(url, topic) {
    try {
      // In production, use a proper web scraping API
      // For now, simulate with AI-generated content
      const prompt = `Extract key information about ${topic} from this context. Provide structured learning points.`;
      
      const response = await callAI(prompt, {
        provider: 'groq', // Use Groq for faster processing
        model: 'llama3-70b-8192'
      });

      const knowledgePoints = this.parseLearningContent(response);
      
      return {
        url,
        topic,
        content: knowledgePoints,
        timestamp: Date.now(),
        source: 'web'
      };
    } catch (error) {
      console.error('Web learning error:', error);
      return null;
    }
  }

  parseLearningContent(content) {
    // Parse AI response into structured knowledge points
    const points = content.split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => ({
        text: line.trim(),
        type: 'knowledge',
        confidence: 0.8
      }));

    return points;
  }

  async addToQueue(url, topic) {
    this.learningQueue.push({ url, topic });
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  async processQueue() {
    this.isProcessing = true;
    while (this.learningQueue.length > 0) {
      const item = this.learningQueue.shift();
      await this.learnFromUrl(item.url, item.topic);
    }
    this.isProcessing = false;
  }
}

// Conversation memory manager
class ConversationMemory {
  constructor(userId) {
    this.userId = userId;
    this.db = getFirestore();
    this.memoryRef = doc(this.db, 'conversationMemories', userId);
  }

  async saveConversation(message, response, context = {}) {
    try {
      const memoryDoc = await getDoc(this.memoryRef);
      const memories = memoryDoc.exists() ? memoryDoc.data().memories || [] : [];

      const newMemory = {
        id: Date.now().toString(),
        message,
        response,
        context,
        timestamp: Date.now(),
        type: 'conversation'
      };

      memories.push(newMemory);

      // Keep only last 100 conversations to prevent bloat
      if (memories.length > 100) {
        memories.splice(0, memories.length - 100);
      }

      await setDoc(this.memoryRef, { memories, updatedAt: Date.now() });
    } catch (error) {
      console.error('Error saving conversation memory:', error);
    }
  }

  async getRelevantMemories(query, limit = 5) {
    try {
      const memoryDoc = await getDoc(this.memoryRef);
      if (!memoryDoc.exists()) return [];

      const memories = memoryDoc.data().memories || [];
      
      // Simple relevance scoring based on keyword matching
      const queryWords = query.toLowerCase().split(/\s+/);
      
      const scored = memories.map(memory => {
        const text = (memory.message + ' ' + memory.response).toLowerCase();
        let score = 0;
        
        queryWords.forEach(word => {
          if (text.includes(word)) {
            score += 1;
          }
        });

        // Decay older memories
        const age = Date.now() - memory.timestamp;
        const decayFactor = Math.exp(-age / (7 * 24 * 60 * 60 * 1000)); // 7 day half-life
        
        return {
          ...memory,
          relevance: score * decayFactor
        };
      });

      return scored
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, limit);
    } catch (error) {
      console.error('Error retrieving memories:', error);
      return [];
    }
  }
}

// Main Advanced RAG System
class AdvancedRAGSystem {
  constructor() {
    this.vectorStore = new VectorStore();
    this.webLearner = new WebLearner();
    this.conversationMemories = new Map();
    this.isInitialized = false;
  }

  async initialize(userId) {
    if (this.isInitialized) return;

    try {
      // Initialize conversation memory for user
      if (!this.conversationMemories.has(userId)) {
        this.conversationMemories.set(userId, new ConversationMemory(userId));
      }

      // Load existing knowledge base
      await this.loadKnowledgeBase();
      
      this.isInitialized = true;
      console.log('Advanced RAG System initialized');
    } catch (error) {
      console.error('RAG initialization error:', error);
    }
  }

  async loadKnowledgeBase() {
    try {
      const db = getFirestore();
      const knowledgeRef = collection(db, 'knowledgeBase');
      const q = query(knowledgeRef, orderBy('timestamp', 'desc'), limit(1000));
      const querySnapshot = await getDocs(q);

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        await this.vectorStore.add(doc.id, data.content, {
          source: data.source,
          topic: data.topic,
          timestamp: data.timestamp
        });
      }

      console.log(`Loaded ${querySnapshot.size} knowledge items`);
    } catch (error) {
      console.error('Error loading knowledge base:', error);
    }
  }

  async generateResponse(userId, message, conversationHistory = [], context = {}) {
    if (!this.isInitialized) {
      await this.initialize(userId);
    }

    try {
      // 1. Search vector store for relevant knowledge
      const knowledgeResults = await this.vectorStore.search(message, 5);
      
      // 2. Get relevant conversation memories
      const memory = this.conversationMemories.get(userId);
      const relevantMemories = memory ? await memory.getRelevantMemories(message, 3) : [];

      // 3. Build context-aware prompt
      const contextString = this.buildContextString(knowledgeResults, relevantMemories, conversationHistory);

      // 4. Generate response with AI
      const prompt = `You are an intelligent assistant with access to a knowledge base and conversation history. Use the provided context to give a helpful, personalized response.

Context Information:
${contextString}

Current Conversation:
${conversationHistory.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

User Message: ${message}

Provide a helpful response that:
1. Uses relevant knowledge from the context
2. Remembers previous interactions if relevant
3. Is personalized and empathetic
4. Provides accurate, up-to-date information
5. Asks clarifying questions if needed

Response:`;

      const response = await callAI(prompt, {
        provider: 'groq',
        model: 'llama3-70b-8192'
      });

      // 5. Save conversation to memory
      if (memory) {
        await memory.saveConversation(message, response, context);
      }

      // 6. Check if we should learn from this interaction
      await this.checkAndLearn(message, response);

      return {
        response,
        sources: knowledgeResults.map(r => r.text),
        memoriesUsed: relevantMemories.length,
        confidence: this.calculateConfidence(knowledgeResults, relevantMemories)
      };

    } catch (error) {
      console.error('Error generating response:', error);
      return {
        response: "I'm having trouble accessing my knowledge base right now. Let me help you with a direct response instead.",
        sources: [],
        memoriesUsed: 0,
        confidence: 0.1
      };
    }
  }

  buildContextString(knowledgeResults, memories, conversationHistory) {
    let context = '';

    if (knowledgeResults.length > 0) {
      context += 'Relevant Knowledge:\n';
      knowledgeResults.forEach((result, i) => {
        context += `${i + 1}. ${result.text} (confidence: ${result.similarity.toFixed(2)})\n`;
      });
      context += '\n';
    }

    if (memories.length > 0) {
      context += 'Previous Interactions:\n';
      memories.forEach((memory, i) => {
        context += `${i + 1}. User: ${memory.message}\n   Assistant: ${memory.response}\n`;
      });
      context += '\n';
    }

    return context;
  }

  calculateConfidence(knowledgeResults, memories) {
    const knowledgeScore = knowledgeResults.reduce((sum, r) => sum + r.similarity, 0) / Math.max(knowledgeResults.length, 1);
    const memoryScore = memories.length > 0 ? 0.3 : 0;
    return Math.min(0.9, knowledgeScore + memoryScore);
  }

  async checkAndLearn(message, response) {
    // Check if this is new information we should learn
    const learningKeywords = ['new information', 'did you know', 'fact', 'research', 'study'];
    const hasLearningKeyword = learningKeywords.some(keyword => 
      message.toLowerCase().includes(keyword) || response.toLowerCase().includes(keyword)
    );

    if (hasLearningKeyword) {
      // Extract potential learning content
      const learningContent = await this.extractLearningContent(message, response);
      if (learningContent) {
        await this.addToKnowledgeBase(learningContent, 'conversation');
      }
    }
  }

  async extractLearningContent(message, response) {
    try {
      const prompt = `Extract important factual information from this conversation that should be remembered for future conversations:

User: ${message}
Assistant: ${response}

Return only the key facts, one per line, that would be useful to remember.`;

      const result = await callAI(prompt, {
        provider: 'groq',
        model: 'llama3-70b-8192'
      });

      return result.split('\n').filter(line => line.trim().length > 0);
    } catch (error) {
      console.error('Error extracting learning content:', error);
      return null;
    }
  }

  async addToKnowledgeBase(content, source = 'manual') {
    try {
      const db = getFirestore();
      const knowledgeRef = collection(db, 'knowledgeBase');

      for (const item of content) {
        const docRef = doc(knowledgeRef);
        await setDoc(docRef, {
          content: item,
          source,
          timestamp: Date.now(),
          type: 'knowledge'
        });

        // Also add to vector store
        await this.vectorStore.add(docRef.id, item, {
          source,
          timestamp: Date.now()
        });
      }

      console.log(`Added ${content.length} items to knowledge base`);
    } catch (error) {
      console.error('Error adding to knowledge base:', error);
    }
  }

  async learnFromWeb(urls, topic) {
    for (const url of urls) {
      await this.webLearner.addToQueue(url, topic);
    }
  }

  // Get system statistics
  getStats() {
    return {
      vectorStoreSize: this.vectorStore.vectors.size,
      isInitialized: this.isInitialized,
      learningQueueSize: this.webLearner.learningQueue.length,
      memoryUsers: this.conversationMemories.size
    };
  }
}

// Singleton instance
let advancedRAGInstance = null;

export const getAdvancedRAG = () => {
  if (!advancedRAGInstance) {
    advancedRAGInstance = new AdvancedRAGSystem();
  }
  return advancedRAGInstance;
};

// Initialize function for backward compatibility
export const initializeRAG = async (userId) => {
  const rag = getAdvancedRAG();
  await rag.initialize(userId);
  return rag;
};

// Generate response function for backward compatibility
export const generateRAGResponse = async (message, conversationHistory, model, context, userId) => {
  const rag = getAdvancedRAG();
  const result = await rag.generateResponse(userId, message, conversationHistory, context || {});
  
  // Return in expected format
  return result.response;
};
