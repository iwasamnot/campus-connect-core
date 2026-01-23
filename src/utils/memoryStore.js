/**
 * Hierarchical Memory Store - MemGPT Style
 * Manages core memory (persistent facts) and archival memory (conversation summaries)
 * Uses localStorage for browser-based storage (can be migrated to Firestore)
 */

const MEMORY_STORAGE_KEY = 'user_memory';
const DEFAULT_MEMORY = {
  core_memory: {
    user_name: null,
    job: null,
    goals: [],
    preferences: {},
    facts: [] // Array of learned facts about the user
  },
  archival_memory: [] // Array of past conversation summaries
};

/**
 * Load memory from storage
 * @param {string} userId - User ID (for multi-user support)
 * @returns {Object} - Memory object
 */
export const loadMemory = (userId = 'default') => {
  try {
    const storageKey = `${MEMORY_STORAGE_KEY}_${userId}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure structure
      return {
        core_memory: {
          ...DEFAULT_MEMORY.core_memory,
          ...parsed.core_memory
        },
        archival_memory: parsed.archival_memory || []
      };
    }
  } catch (error) {
    console.error('Error loading memory:', error);
  }
  
  // Return default if loading fails
  return JSON.parse(JSON.stringify(DEFAULT_MEMORY));
};

/**
 * Save memory to storage
 * @param {Object} memory - Memory object to save
 * @param {string} userId - User ID (for multi-user support)
 * @returns {boolean} - Success status
 */
export const saveMemory = (memory, userId = 'default') => {
  try {
    const storageKey = `${MEMORY_STORAGE_KEY}_${userId}`;
    localStorage.setItem(storageKey, JSON.stringify(memory, null, 2));
    console.log('💾 [Memory] Saved memory to storage');
    return true;
  } catch (error) {
    console.error('Error saving memory:', error);
    return false;
  }
};

/**
 * Update core memory
 * @param {Object} updates - Partial core memory updates
 * @param {string} userId - User ID
 * @returns {Object} - Updated memory
 */
export const updateCoreMemory = (updates, userId = 'default') => {
  const memory = loadMemory(userId);
  
  // Deep merge updates
  memory.core_memory = {
    ...memory.core_memory,
    ...updates,
    // Handle arrays specially (goals, facts)
    goals: updates.goals !== undefined ? updates.goals : memory.core_memory.goals,
    facts: updates.facts !== undefined ? updates.facts : memory.core_memory.facts,
    preferences: {
      ...memory.core_memory.preferences,
      ...(updates.preferences || {})
    }
  };
  
  saveMemory(memory, userId);
  return memory;
};

/**
 * Add a fact to core memory
 * @param {string} fact - Fact to add (e.g., "User prefers morning classes")
 * @param {string} userId - User ID
 * @returns {Object} - Updated memory
 */
export const addFact = (fact, userId = 'default') => {
  const memory = loadMemory(userId);
  
  // Avoid duplicates
  if (!memory.core_memory.facts.includes(fact)) {
    memory.core_memory.facts.push(fact);
    saveMemory(memory, userId);
    console.log(`💾 [Memory] Added fact: ${fact}`);
  }
  
  return memory;
};

/**
 * Add conversation summary to archival memory
 * @param {string} summary - Conversation summary
 * @param {string} timestamp - ISO timestamp
 * @param {string} userId - User ID
 * @returns {Object} - Updated memory
 */
export const addToArchivalMemory = (summary, timestamp = new Date().toISOString(), userId = 'default') => {
  const memory = loadMemory(userId);
  
  memory.archival_memory.push({
    summary,
    timestamp,
    id: `archival_${Date.now()}`
  });
  
  // Keep only last 50 summaries to prevent storage bloat
  if (memory.archival_memory.length > 50) {
    memory.archival_memory = memory.archival_memory.slice(-50);
  }
  
  saveMemory(memory, userId);
  console.log(`💾 [Memory] Added to archival memory: ${summary.substring(0, 50)}...`);
  return memory;
};

/**
 * Get core memory as formatted string for system prompt
 * @param {string} userId - User ID
 * @returns {string} - Formatted core memory string
 */
export const getCoreMemoryContext = (userId = 'default') => {
  const memory = loadMemory(userId);
  const core = memory.core_memory;
  
  const parts = [];
  
  if (core.user_name) {
    parts.push(`Name: ${core.user_name}`);
  }
  
  if (core.job) {
    parts.push(`Job: ${core.job}`);
  }
  
  if (core.goals && core.goals.length > 0) {
    parts.push(`Goals: ${core.goals.join(', ')}`);
  }
  
  if (core.facts && core.facts.length > 0) {
    parts.push(`Known Facts: ${core.facts.join('; ')}`);
  }
  
  if (Object.keys(core.preferences || {}).length > 0) {
    const prefs = Object.entries(core.preferences)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    parts.push(`Preferences: ${prefs}`);
  }
  
  return parts.length > 0 
    ? parts.join('\n')
    : 'No core memory available yet.';
};

/**
 * Clear all memory (for testing/reset)
 * @param {string} userId - User ID
 */
export const clearMemory = (userId = 'default') => {
  const storageKey = `${MEMORY_STORAGE_KEY}_${userId}`;
  localStorage.removeItem(storageKey);
  console.log('💾 [Memory] Cleared all memory');
};
