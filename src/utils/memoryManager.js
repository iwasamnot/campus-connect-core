/**
 * Memory Manager - AI-Powered Memory Management
 * Uses DeepSeek to analyze conversations and update core memory
 */

import { callAI } from './aiProvider';
import { loadMemory, updateCoreMemory, addFact, addToArchivalMemory } from './memoryStore';

/**
 * Analyze interaction and determine if core memory should be updated
 * @param {string} userMessage - User's message
 * @param {string} aiResponse - AI's response
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} - Memory updates or null
 */
export const analyzeMemoryUpdate = async (userMessage, aiResponse, userId = 'default') => {
  try {
    const currentMemory = loadMemory(userId);
    const coreMemoryContext = Object.entries(currentMemory.core_memory)
      .filter(([key, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
      .join('\n');

    const analysisPrompt = `Analyze this conversation and determine if we learned new facts about the user.

Current Core Memory:
${coreMemoryContext || 'No core memory yet'}

User Message: "${userMessage}"
AI Response: "${aiResponse}"

Instructions:
1. Did the user reveal NEW information about themselves? (name, job, goals, preferences, facts)
2. Is this information IMPORTANT enough to remember long-term?
3. If yes, output a JSON object with ONLY the fields that should be updated:
   {
     "shouldUpdate": true,
     "updates": {
       "user_name": "John" (only if new name mentioned),
       "job": "Software Engineer" (only if new job mentioned),
       "goals": ["Goal1", "Goal2"] (add new goals, keep existing),
       "facts": ["New fact 1", "New fact 2"] (add new facts),
       "preferences": {"key": "value"} (add new preferences)
     }
   }
4. If NO new information, output: {"shouldUpdate": false}
5. Do NOT include fields that haven't changed
6. For goals and facts, include BOTH existing (from current memory) AND new ones

Output ONLY valid JSON, no explanations.`;

    const response = await callAI(analysisPrompt, {
      systemPrompt: 'You are a memory analysis system. Analyze conversations and extract important user information. Output only valid JSON.',
      maxTokens: 500,
      temperature: 0.3
    });

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('💾 [Memory] No JSON found in AI response');
      return null;
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    if (analysis.shouldUpdate && analysis.updates) {
      console.log('💾 [Memory] AI detected memory updates:', analysis.updates);
      return analysis.updates;
    }

    return null;
  } catch (error) {
    console.error('💾 [Memory] Error analyzing memory update:', error);
    return null;
  }
};

/**
 * Manage memory after an interaction
 * @param {string} userMessage - User's message
 * @param {string} aiResponse - AI's response
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Updated memory object
 */
export const manageMemory = async (userMessage, aiResponse, userId = 'default') => {
  try {
    // Step 1: Analyze if memory should be updated
    const updates = await analyzeMemoryUpdate(userMessage, aiResponse, userId);
    
    if (updates) {
      // Step 2: Update core memory
      const updatedMemory = updateCoreMemory(updates, userId);
      
      // Step 3: Handle facts array separately (addFact ensures no duplicates)
      if (updates.facts && Array.isArray(updates.facts)) {
        updates.facts.forEach(fact => {
          if (fact && typeof fact === 'string') {
            addFact(fact, userId);
          }
        });
      }
      
      console.log('💾 [Memory] Core memory updated successfully');
      return updatedMemory;
    }
    
    return loadMemory(userId);
  } catch (error) {
    console.error('💾 [Memory] Error managing memory:', error);
    return loadMemory(userId);
  }
};

/**
 * Summarize conversation for archival memory
 * @param {Array} conversationHistory - Array of {role: 'user'|'assistant', content: string}
 * @param {string} userId - User ID
 * @returns {Promise<string>} - Conversation summary
 */
export const summarizeForArchival = async (conversationHistory, userId = 'default') => {
  if (!conversationHistory || conversationHistory.length === 0) {
    return null;
  }

  try {
    const conversationText = conversationHistory
      .slice(-10) // Last 10 messages
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');

    const summaryPrompt = `Summarize this conversation in 2-3 sentences. Focus on:
- Main topics discussed
- Key information exchanged
- Any decisions or conclusions reached

Conversation:
${conversationText}

Provide a concise summary:`;

    const summary = await callAI(summaryPrompt, {
      systemPrompt: 'You are a conversation summarizer. Create concise, informative summaries.',
      maxTokens: 200,
      temperature: 0.5
    });

    if (summary && summary.trim()) {
      addToArchivalMemory(summary.trim(), new Date().toISOString(), userId);
      return summary.trim();
    }

    return null;
  } catch (error) {
    console.error('💾 [Memory] Error summarizing conversation:', error);
    return null;
  }
};

/**
 * Get relevant archival memory for context
 * @param {string} query - Current query/topic
 * @param {number} limit - Number of summaries to retrieve
 * @param {string} userId - User ID
 * @returns {Array} - Relevant archival memory entries
 */
export const getRelevantArchivalMemory = (query, limit = 5, userId = 'default') => {
  const memory = loadMemory(userId);
  
  if (!memory.archival_memory || memory.archival_memory.length === 0) {
    return [];
  }

  // Simple keyword matching (could be enhanced with semantic search)
  const queryLower = query.toLowerCase();
  const relevant = memory.archival_memory
    .filter(entry => {
      const summaryLower = entry.summary.toLowerCase();
      return queryLower.split(' ').some(word => 
        word.length > 3 && summaryLower.includes(word)
      );
    })
    .slice(-limit); // Most recent relevant entries

  return relevant;
};
