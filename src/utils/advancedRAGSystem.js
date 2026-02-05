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
import { RAGRetrieval, KnowledgeDocument } from './ragRetrieval';

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
    this.vectorStore = new RAGRetrieval(); // Use proper vector database
    this.webLearner = new WebLearner();
    this.conversationMemories = new Map();
    this.isInitialized = false;
    this.autoLearningEnabled = true;
    this.learningStats = {
      conversationsLearned: 0,
      webSearchesPerformed: 0,
      knowledgeItemsAdded: 0,
      lastLearningActivity: null
    };
  }

  async initialize(userId) {
    if (this.isInitialized) return;

    try {
      // Initialize conversation memory for user
      if (!this.conversationMemories.has(userId)) {
        this.conversationMemories.set(userId, new ConversationMemory(userId));
        await this.conversationMemories.get(userId).loadMemories();
      }

      // Load documents into vector store
      await this.vectorStore.loadDocuments();

      this.isInitialized = true;
      console.log('Advanced RAG System initialized with Pinecone vector database');
    } catch (error) {
      console.error('Error initializing RAG system:', error);
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
      // 1. Search vector store for relevant knowledge using Pinecone
      const knowledgeResults = await this.vectorStore.retrieve(message, 5, 0.3);
      
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

      // 7. Trigger automatic web learning if needed
      await this.checkAndLearnFromWeb(message);

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

  async checkAndLearnFromWeb(message) {
    if (!this.autoLearningEnabled) return;

    // Check if message contains questions that need web research
    const researchKeywords = [
      'what is', 'latest', 'current', 'recent', 'news', 'update',
      'how to', 'tutorial', 'guide', 'explain', 'definition',
      'statistics', 'data', 'research', 'study', 'report'
    ];
    
    const hasResearchKeyword = researchKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );

    if (hasResearchKeyword) {
      // Extract potential search terms from the message
      const searchTerms = this.extractSearchTerms(message);
      
      if (searchTerms.length > 0) {
        // Schedule web learning (don't block the response)
        setTimeout(async () => {
          try {
            const { learnFromSearch } = await import('./webLearningModule');
            
            let totalItemsLearned = 0;
            for (const term of searchTerms.slice(0, 2)) { // Limit to 2 searches
              const results = await learnFromSearch(term, 'auto-learn', 3);
              totalItemsLearned += results.reduce((sum, r) => sum + (r.pointsAdded || 0), 0);
              
              // Small delay between searches
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            this.learningStats.webSearchesPerformed += searchTerms.slice(0, 2).length;
            this.learningStats.knowledgeItemsAdded += totalItemsLearned;
            this.learningStats.lastLearningActivity = Date.now();
            
            console.log(`Auto-learned from web for: ${searchTerms.join(', ')}`);
          } catch (error) {
            console.error('Auto web learning failed:', error);
          }
        }, 1000); // Delay to not interfere with response
      }
    }
  }

  extractSearchTerms(message) {
    // Extract key phrases that would make good search terms
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'what', 'how', 'when', 'where', 'why'];
    
    const words = message.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
    
    // Look for 2-3 word phrases
    const phrases = [];
    for (let i = 0; i < words.length - 1; i++) {
      phrases.push(words[i] + ' ' + words[i + 1]);
    }
    
    for (let i = 0; i < words.length - 2; i++) {
      phrases.push(words[i] + ' ' + words[i + 1] + ' ' + words[i + 2]);
    }
    
    // Return unique phrases, prioritized by length
    return [...new Set(phrases)]
      .sort((a, b) => b.length - a.length)
      .slice(0, 5);
  }

  calculateConfidence(knowledgeResults, memories) {
    const knowledgeScore = knowledgeResults.reduce((sum, r) => sum + r.similarity, 0) / Math.max(knowledgeResults.length, 1);
    const memoryScore = memories.length > 0 ? 0.3 : 0;
    return Math.min(0.9, knowledgeScore + memoryScore);
  }

  async checkAndLearn(message, response) {
    if (!this.autoLearningEnabled) return;

    // Check if this is new information we should learn
    const learningKeywords = ['new information', 'did you know', 'fact', 'research', 'study', 'important', 'remember', 'note'];
    const hasLearningKeyword = learningKeywords.some(keyword => 
      message.toLowerCase().includes(keyword) || response.toLowerCase().includes(keyword)
    );

    // Also learn from corrections and detailed explanations
    const isCorrection = message.toLowerCase().includes('actually') || message.toLowerCase().includes('correct');
    const isDetailedExplanation = response.length > 300 && message.includes('?');

    if (hasLearningKeyword || isCorrection || isDetailedExplanation) {
      // Extract potential learning content
      const learningContent = await this.extractLearningContent(message, response);
      if (learningContent) {
        await this.addToKnowledgeBase(learningContent, 'conversation');
        this.learningStats.conversationsLearned++;
        this.learningStats.knowledgeItemsAdded += learningContent.length;
        this.learningStats.lastLearningActivity = Date.now();
      }
    }
  }

  async extractLearningContent(message, response) {
    try {
      const prompt = `Extract important factual information from this conversation that should be remembered for future conversations:

User: ${message}
Assistant: ${response}

Return only the key facts, one per line, that would be useful to remember:
- Facts and definitions
- Important procedures or steps
- Key insights or explanations
- Corrections to misconceptions

Format as a numbered list.`;

      const result = await callAI(prompt, {
        provider: 'groq',
        model: 'llama3-70b-8192'
      });

      const facts = result.split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 15);

      return facts.length > 0 ? facts : null;
    } catch (error) {
      console.error('Error extracting learning content:', error);
      return null;
    }
  }

  async addToKnowledgeBase(content, source = 'manual') {
    try {
      const db = getFirestore();
      const knowledgeRef = collection(db, 'knowledgeBase');
      
      // Add each knowledge item to Firebase
      // Vector embeddings will be created when documents are loaded
      for (const text of content) {
        const docId = `${source}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Save to Firebase
        await setDoc(doc(knowledgeRef, docId), {
          text: text,
          metadata: {
            source,
            timestamp: Date.now(),
            category: 'general'
          },
          timestamp: Date.now(),
          source: source
        });
      }
      
      // Reload documents to pick up new items
      await this.vectorStore.loadDocuments();
      
      console.log(`Added ${content.length} items to knowledge base and vector database`);
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
      vectorStoreSize: this.vectorStore.documents?.length || 0,
      pineconeConfigured: this.vectorStore.pineconeConfigured,
      isInitialized: this.isInitialized,
      learningQueueSize: this.webLearner.learningQueue?.length || 0,
      memoryUsers: this.conversationMemories.size,
      autoLearningEnabled: this.autoLearningEnabled,
      learningStats: { ...this.learningStats }
    };
  }

  // Control auto-learning
  setAutoLearning(enabled) {
    this.autoLearningEnabled = enabled;
    console.log(`Auto-learning ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Get detailed learning statistics
  getLearningStats() {
    return {
      ...this.learningStats,
      autoLearningEnabled: this.autoLearningEnabled,
      lastLearningActivityFormatted: this.learningStats.lastLearningActivity 
        ? new Date(this.learningStats.lastLearningActivity).toLocaleString()
        : 'Never'
    };
  }

  // Reset learning statistics
  resetLearningStats() {
    this.learningStats = {
      conversationsLearned: 0,
      webSearchesPerformed: 0,
      knowledgeItemsAdded: 0,
      lastLearningActivity: null
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
