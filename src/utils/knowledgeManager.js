/**
 * Smart Knowledge Manager
 * Organizes, updates, and maintains the RAG knowledge base
 */

import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { getAdvancedRAG } from './advancedRAGSystem';
import { getWebLearning } from './webLearningModule';

class KnowledgeManager {
  constructor() {
    this.db = getFirestore();
    this.categories = new Map();
    this.updateQueue = [];
    this.isUpdating = false;
  }

  // Initialize knowledge categories
  async initializeCategories() {
    const defaultCategories = [
      {
        id: 'academic',
        name: 'Academic Subjects',
        description: 'Mathematics, Science, History, Literature, etc.',
        priority: 1,
        autoUpdate: true
      },
      {
        id: 'campus',
        name: 'Campus Information',
        description: 'University buildings, services, policies, etc.',
        priority: 2,
        autoUpdate: true
      },
      {
        id: 'technology',
        name: 'Technology',
        description: 'Programming, AI, software, hardware, etc.',
        priority: 1,
        autoUpdate: true
      },
      {
        id: 'careers',
        name: 'Career Development',
        description: 'Job search, interviews, skills, industries, etc.',
        priority: 2,
        autoUpdate: true
      },
      {
        id: 'wellness',
        name: 'Health & Wellness',
        description: 'Mental health, physical health, lifestyle, etc.',
        priority: 3,
        autoUpdate: true
      }
    ];

    for (const category of defaultCategories) {
      this.categories.set(category.id, category);
    }

    // Load custom categories from Firestore
    await this.loadCustomCategories();
  }

  async loadCustomCategories() {
    try {
      const categoriesRef = collection(this.db, 'knowledgeCategories');
      const querySnapshot = await getDocs(categoriesRef);

      for (const doc of querySnapshot.docs) {
        const category = doc.data();
        this.categories.set(doc.id, category);
      }
    } catch (error) {
      console.error('Error loading custom categories:', error);
    }
  }

  // Add knowledge with automatic categorization
  async addKnowledge(content, source = 'manual', suggestedCategory = null) {
    try {
      // Categorize the content
      const category = suggestedCategory || await this.categorizeContent(content);
      
      // Create knowledge document
      const knowledgeRef = doc(collection(this.db, 'knowledgeBase'));
      const knowledge = {
        content,
        source,
        category,
        timestamp: Date.now(),
        type: 'knowledge',
        verified: false,
        usageCount: 0,
        lastUsed: null,
        embeddings: null // Will be added by RAG system
      };

      await setDoc(knowledgeRef, knowledge);

      // Add to RAG system
      const rag = getAdvancedRAG();
      await rag.addToKnowledgeBase([content], source);

      // Schedule verification if needed
      if (source === 'web' || source === 'user') {
        this.scheduleVerification(knowledgeRef.id);
      }

      console.log(`Added knowledge to category: ${category}`);
      return knowledgeRef.id;

    } catch (error) {
      console.error('Error adding knowledge:', error);
      return null;
    }
  }

  // Automatically categorize content using AI
  async categorizeContent(content) {
    try {
      const { callAI } = await import('./aiProvider');
      
      const categoryList = Array.from(this.categories.keys()).join(', ');
      
      const prompt = `Categorize this content into one of these categories: ${categoryList}

Content: ${content.substring(0, 500)}...

Respond with only the category name (exact match from the list):`;

      const response = await callAI(prompt, {
        provider: 'groq',
        model: 'llama3-70b-8192'
      });

      const category = response.trim().toLowerCase();
      
      // Validate category
      if (this.categories.has(category)) {
        return category;
      }

      // Fallback to 'academic' if category not found
      return 'academic';

    } catch (error) {
      console.error('Error categorizing content:', error);
      return 'academic';
    }
  }

  // Update knowledge with new information
  async updateKnowledge(knowledgeId, newContent, updateReason = '') {
    try {
      const knowledgeRef = doc(this.db, 'knowledgeBase', knowledgeId);
      const knowledgeDoc = await getDoc(knowledgeRef);

      if (!knowledgeDoc.exists()) {
        throw new Error('Knowledge not found');
      }

      const oldKnowledge = knowledgeDoc.data();
      
      // Create update record
      const updateRef = doc(collection(this.db, 'knowledgeUpdates'));
      await setDoc(updateRef, {
        knowledgeId,
        oldContent: oldKnowledge.content,
        newContent,
        updateReason,
        timestamp: Date.now(),
        updatedBy: 'system'
      });

      // Update the knowledge
      await setDoc(knowledgeRef, {
        ...oldKnowledge,
        content: newContent,
        lastUpdated: Date.now(),
        updateCount: (oldKnowledge.updateCount || 0) + 1
      });

      // Update RAG system
      const rag = getAdvancedRAG();
      await rag.addToKnowledgeBase([newContent], 'updated');

      console.log(`Updated knowledge: ${knowledgeId}`);
      return true;

    } catch (error) {
      console.error('Error updating knowledge:', error);
      return false;
    }
  }

  // Verify knowledge accuracy
  async verifyKnowledge(knowledgeId) {
    try {
      const knowledgeRef = doc(this.db, 'knowledgeBase', knowledgeId);
      const knowledgeDoc = await getDoc(knowledgeRef);

      if (!knowledgeDoc.exists()) {
        return false;
      }

      const knowledge = knowledgeDoc.data();
      
      // Use AI to verify content
      const { callAI } = await import('./aiProvider');
      
      const prompt = `Verify the accuracy of this information. Check for:
      1. Factual correctness
      2. Current validity (not outdated)
      3. Completeness
      4. Any contradictions

Content: ${knowledge.content}

Respond with:
- ACCURATE if the information is correct and current
- NEEDS_UPDATE if it's partially correct or outdated
- INCORRECT if it's wrong

Also provide a brief explanation (max 100 words).`;

      const response = await callAI(prompt, {
        provider: 'groq',
        model: 'llama3-70b-8192'
      });

      const [status, explanation] = response.split('\n').map(s => s.trim());

      await setDoc(knowledgeRef, {
        ...knowledge,
        verified: true,
        verificationStatus: status,
        verificationExplanation: explanation,
        verifiedAt: Date.now()
      });

      return status === 'ACCURATE';

    } catch (error) {
      console.error('Error verifying knowledge:', error);
      return false;
    }
  }

  // Schedule verification for knowledge
  scheduleVerification(knowledgeId) {
    // Schedule verification in 1 hour
    setTimeout(async () => {
      await this.verifyKnowledge(knowledgeId);
    }, 60 * 60 * 1000);
  }

  // Get knowledge by category
  async getKnowledgeByCategory(category, limit = 50) {
    try {
      const knowledgeRef = collection(this.db, 'knowledgeBase');
      const q = query(
        knowledgeRef,
        where('category', '==', category),
        orderBy('timestamp', 'desc'),
        limit(limit)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    } catch (error) {
      console.error('Error getting knowledge by category:', error);
      return [];
    }
  }

  // Search knowledge
  async searchKnowledge(query, category = null, limit = 20) {
    try {
      const rag = getAdvancedRAG();
      const results = await rag.vectorStore.search(query, limit);

      // Filter by category if specified
      if (category) {
        // In a real implementation, you'd filter by metadata
        // For now, return all results
      }

      return results;

    } catch (error) {
      console.error('Error searching knowledge:', error);
      return [];
    }
  }

  // Get outdated knowledge
  async getOutdatedKnowledge(daysOld = 30) {
    try {
      const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
      
      const knowledgeRef = collection(this.db, 'knowledgeBase');
      const q = query(
        knowledgeRef,
        where('timestamp', '<', cutoffTime),
        orderBy('timestamp', 'asc'),
        limit(100)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    } catch (error) {
      console.error('Error getting outdated knowledge:', error);
      return [];
    }
  }

  // Clean up old/unverified knowledge
  async cleanupKnowledge() {
    try {
      const outdatedKnowledge = await this.getOutdatedKnowledge(90); // 90 days
      let deletedCount = 0;

      for (const knowledge of outdatedKnowledge) {
        if (!knowledge.verified || knowledge.verificationStatus === 'INCORRECT') {
          await deleteDoc(doc(this.db, 'knowledgeBase', knowledge.id));
          deletedCount++;
        }
      }

      console.log(`Cleaned up ${deletedCount} outdated knowledge items`);
      return deletedCount;

    } catch (error) {
      console.error('Error cleaning up knowledge:', error);
      return 0;
    }
  }

  // Update knowledge from web sources
  async updateFromWeb(category = null) {
    try {
      const webLearner = getWebLearning();
      
      // Define sources for each category
      const sources = {
        academic: [
          'https://en.wikipedia.org/wiki/Main_Page',
          'https://www.khanacademy.org',
          'https://www.coursera.org'
        ],
        campus: [
          'https://www.students.gov',
          'https://educationusa.state.gov'
        ],
        technology: [
          'https://github.com/trending',
          'https://www.techcrunch.com',
          'https://stackoverflow.com/questions'
        ],
        careers: [
          'https://www.linkedin.com/jobs',
          'https://www.indeed.com',
          'https://www.glassdoor.com'
        ],
        wellness: [
          'https://www.who.int/health-topics',
          'https://www.mayoclinic.org',
          'https://www.nimh.nih.gov/health'
        ]
      };

      const sourcesToUpdate = category ? 
        { [category]: sources[category] || [] } : 
        sources;

      const results = [];
      
      for (const [cat, urls] of Object.entries(sourcesToUpdate)) {
        for (const url of urls) {
          const result = await webLearner.learnFromUrl(url, { 
            topic: cat,
            followLinks: false 
          });
          
          if (result) {
            results.push(result);
          }
          
          // Respectful delay
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      console.log(`Updated knowledge from ${results.length} web sources`);
      return results;

    } catch (error) {
      console.error('Error updating from web:', error);
      return [];
    }
  }

  // Get knowledge statistics
  async getStats() {
    try {
      const knowledgeRef = collection(this.db, 'knowledgeBase');
      const querySnapshot = await getDocs(knowledgeRef);
      
      const stats = {
        totalKnowledge: querySnapshot.size,
        byCategory: {},
        bySource: {},
        verifiedCount: 0,
        outdatedCount: 0,
        averageUsageCount: 0
      };

      let totalUsage = 0;

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        
        // Category stats
        stats.byCategory[data.category] = (stats.byCategory[data.category] || 0) + 1;
        
        // Source stats
        stats.bySource[data.source] = (stats.bySource[data.source] || 0) + 1;
        
        // Verification stats
        if (data.verified) {
          stats.verifiedCount++;
        }
        
        // Outdated stats
        if (Date.now() - data.timestamp > 30 * 24 * 60 * 60 * 1000) {
          stats.outdatedCount++;
        }
        
        // Usage stats
        totalUsage += data.usageCount || 0;
      }

      stats.averageUsageCount = querySnapshot.size > 0 ? totalUsage / querySnapshot.size : 0;

      return stats;

    } catch (error) {
      console.error('Error getting stats:', error);
      return null;
    }
  }

  // Create custom category
  async createCategory(id, name, description, priority = 3) {
    try {
      const category = {
        id,
        name,
        description,
        priority,
        autoUpdate: false,
        createdAt: Date.now()
      };

      const categoryRef = doc(this.db, 'knowledgeCategories', id);
      await setDoc(categoryRef, category);
      
      this.categories.set(id, category);
      
      console.log(`Created category: ${name}`);
      return true;

    } catch (error) {
      console.error('Error creating category:', error);
      return false;
    }
  }
}

// Singleton instance
let knowledgeManagerInstance = null;

export const getKnowledgeManager = () => {
  if (!knowledgeManagerInstance) {
    knowledgeManagerInstance = new KnowledgeManager();
  }
  return knowledgeManagerInstance;
};

// Convenience functions
export const addKnowledge = (content, source, category) => {
  const manager = getKnowledgeManager();
  return manager.addKnowledge(content, source, category);
};

export const searchKnowledge = (query, category, limit) => {
  const manager = getKnowledgeManager();
  return manager.searchKnowledge(query, category, limit);
};
