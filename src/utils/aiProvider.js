/**
 * Multi-AI Provider System - Ollama & Groq Only
 * Ollama: Self-hosted GPU droplet (RTX 6000) - Primary
 * Groq: Cloud API - Fallback
 * 
 * CRITICAL: Ollama is checked FIRST and bypasses all other logic
 * 
 * Connection Matcher: Intent clustering and user matching system
 */

import { collection, addDoc, query, where, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';

// Use window.__firebaseDb to avoid import/export issues
const db = typeof window !== 'undefined' && window.__firebaseDb 
  ? window.__firebaseDb 
  : null;

// Provider priorities (order matters - first available is used)
const PROVIDER_PRIORITY = [
  'ollama',  // Self-hosted Ollama (RTX 6000 GPU droplet) - highest priority
  'groq',    // Groq API - fallback with generous free tier
];

/**
 * Get AI provider configuration
 * PRIORITY: Ollama is checked FIRST - if VITE_OLLAMA_URL exists, use it immediately
 */
export const getAIProvider = () => {
  // CRITICAL: Check Ollama FIRST - bypass all other logic if configured
  const ollamaUrl = import.meta.env.VITE_OLLAMA_URL?.trim();
  if (ollamaUrl && ollamaUrl !== '') {
    console.log('✅ [OLLAMA] Ollama URL detected, using self-hosted GPU instance');
    console.log('⚡ [OLLAMA] Forcing 8B model (32B disabled to prevent timeouts)');
    return {
      provider: 'ollama',
      baseUrl: ollamaUrl,
      model: 'deepseek-r1:8b', // FORCED: 8B model (32B disabled to prevent timeouts)
      maxTokens: 4096,
      temperature: 0.7
    };
  }

  // Fallback: Check for Groq (only if Ollama is not configured)
  const groqApiKey = import.meta.env.VITE_GROQ_API_KEY?.trim();
  if (groqApiKey && groqApiKey !== '') {
    console.log('⚠️ [FALLBACK] Using Groq (Ollama not configured)');
    return {
      provider: 'groq',
      apiKey: groqApiKey,
      model: 'llama-3.1-8b-instant',
      baseUrl: 'https://api.groq.com/openai/v1',
      maxTokens: 2048,
      temperature: 0.7
    };
  }

  return null;
};

/**
 * Call AI with automatic provider fallback
 */
export const callAI = async (prompt, options = {}) => {
  const config = getAIProvider();
  
  if (!config) {
    throw new Error('No AI provider configured. Please set VITE_OLLAMA_URL or VITE_GROQ_API_KEY in environment variables.');
  }

  try {
    switch (config.provider) {
      case 'ollama':
        return await callOllama(prompt, config, options);
      case 'groq':
        return await callGroq(prompt, config, options);
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }
  } catch (error) {
    // Try fallback provider if primary fails
    if (config.provider === 'ollama') {
      const groqConfig = getAIProvider();
      if (groqConfig && groqConfig.provider === 'groq') {
        console.warn('❌ [OLLAMA] Failed, trying Groq fallback:', error.message);
        return await callGroq(prompt, groqConfig, options);
      }
    }
    throw error;
  }
};

/**
 * Call Ollama API (Self-hosted GPU droplet - best performance)
 * Uses DeepSeek R1 32B model with proper chat format
 * 
 * CRITICAL: This function constructs the payload correctly:
 * - System role: Contains the "Virtual Senior" persona
 * - User role: Contains the User Question + RAG Context
 * - Standard chat format (no complex JSON schemas)
 * 
 * MIXED CONTENT FIX: If page is HTTPS and Ollama is HTTP, use Cloud Function proxy
 */
const callOllama = async (prompt, config, options = {}) => {
  const baseUrl = config.baseUrl || import.meta.env.VITE_OLLAMA_URL?.trim() || 'http://localhost:11434';
  
  // FORCE 8B MODEL: 32B model is too heavy and times out
  // Override any .env variable to use the faster 8B model
  const model = 'deepseek-r1:8b';
  console.log(`⚡ [OLLAMA] Switching to fast model: deepseek-r1:8b (32B model disabled to prevent timeouts)`);
  
  // Build messages array with proper role structure
  // System role: Virtual Senior persona
  // User role: Full prompt (includes RAG context + user question)
  const messages = [];
  
  // System prompt: Smart Researcher persona (witty + rigorous with citations + fun facts)
  // Blended persona: Engaging like Grok but academically rigorous with citations
  const SYSTEM_PROMPT = `You are the Campus Connect AI.
IDENTITY:
You are a witty, highly intelligent, and rigorous research assistant. You are like a very intelligent, charismatic senior student who knows their stuff and isn't afraid to show it. You are NOT a boring, generic chatbot. You write with flair, confidence, and precision.

CORE INSTRUCTIONS:
1. **THE VIBE:** Be direct and engaging. Avoid robotic fillers like "I hope this helps" or "Certainly!". Write like a smart senior student who knows their stuff and enjoys sharing knowledge.
2. **THE PROOF (Citations):** You deal in facts. Whenever you state a fact from the context, you MUST cite the source immediately in brackets. 
   - Example: "The tuition fee for the Bachelors program is $20,000 [Source: Fees_2025.pdf], which is actually pretty competitive."
3. **FUN FACTS:** When relevant, sprinkle in interesting tidbits or fun facts that make the answer more engaging. These should be:
   - Related to the topic
   - Actually interesting or surprising
   - Natural, not forced
   - Example: "SISTC opened in 2020 [Source: About_SISTC.pdf], which makes it relatively new - but they've already got ACS certification, which is pretty impressive for a young institution."
4. **THE FORMAT:**
   - Use Markdown headers (###) to organize your thoughts.
   - Use bullet points for lists.
   - Keep paragraphs punchy.

GOAL:
Produce an answer that is fun to read (like chatting with a charismatic senior student) but academically solid enough to be put in a report.
Current Date: ${new Date().toLocaleDateString()}`;

  // Use custom system prompt if provided, otherwise use Smart Researcher persona
  const systemPrompt = options.systemPrompt || SYSTEM_PROMPT;
  
  messages.push({ 
    role: 'system', 
    content: systemPrompt 
  });
  
  // User message: Contains the full prompt (RAG context + question)
  messages.push({ 
    role: 'user', 
    content: prompt 
  });

  // MIXED CONTENT FIX: Detect if we're on HTTPS and Ollama is HTTP
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const isHttpOllama = baseUrl.startsWith('http://');
  const useProxy = isHttps && isHttpOllama;

  // Use Cloud Function proxy if mixed content detected
  const targetUrl = useProxy 
    ? `https://us-central1-campus-connect-sistc.cloudfunctions.net/ollamaProxy`
    : `${baseUrl}/api/chat`;

  console.log(`🚀 [OLLAMA] Sending request to ${targetUrl}${useProxy ? ' (via HTTPS proxy)' : ''}`);
  console.log(`📦 [OLLAMA] Model: ${model}`);
  console.log(`💬 [OLLAMA] Messages: ${messages.length} (System: ${options.systemPrompt ? 'Yes' : 'No'}, User: Yes)`);
  console.log(`📏 [OLLAMA] Prompt length: ${prompt.length} characters`);

  // Create AbortController for timeout
  // Increased to 120 seconds (2 minutes) to handle reasoning model "thinking" phase
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout (2 minutes)

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: messages, // Standard chat format - no complex schemas
        stream: false, // Non-streaming for simplicity
        options: {
          temperature: options.temperature || config.temperature || 0.7,
          num_ctx: 4096,      // Larger context window for reasoning models
          num_predict: 2048,  // Allow 2048 tokens to generate (prevents cutoff during thinking)
        }
      }),
      signal: controller.signal, // Timeout support
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText } };
      }
      throw new Error(errorData.error?.message || `Ollama API error: ${response.statusText} (${response.status})`);
    }

    const data = await response.json();
    
    // CRITICAL: Parse response correctly from data.message.content
    let responseText = null;
    if (data.message?.content) {
      responseText = data.message.content.trim();
    } else if (data.message?.thinking) {
      // Fallback: Some API versions return thinking separately
      console.warn('⚠️ [OLLAMA] Response has thinking field but no content, using thinking as fallback');
      responseText = data.message.thinking.trim();
    } else if (data.response && typeof data.response === 'string') {
      // Fallback: try response field (legacy format)
      console.log(`⚠️ [OLLAMA] Using legacy response format`);
      responseText = data.response.trim();
    } else {
      // Debug: log full response if parsing fails
      console.error('❌ [OLLAMA] Unexpected response format:', JSON.stringify(data, null, 2));
      throw new Error('Ollama API returned unexpected response format. Expected data.message.content');
    }
    
    // Handle empty content (model ran out of tokens during thinking)
    if (!responseText || responseText.length === 0) {
      console.warn('⚠️ [OLLAMA] Empty response content - model may have run out of tokens during thinking phase');
      if (data.message?.thinking) {
        // If thinking exists, try to extract any useful info from it
        const thinkingText = data.message.thinking.trim();
        if (thinkingText.length > 0) {
          console.warn('⚠️ [OLLAMA] Using thinking content as fallback (may be incomplete)');
          responseText = thinkingText;
        } else {
          throw new Error('Ollama returned empty response. The model may have run out of tokens. Try reducing prompt length or increasing num_predict.');
        }
      } else {
        throw new Error('Ollama returned empty response. The model may have run out of tokens during the thinking phase.');
      }
    }
    
    // DEEPSEEK-R1 CLEANUP: Remove reasoning tags (<think>...</think>)
    // DeepSeek R1 is a reasoning model that includes internal "thinking" in the output
    // We remove these tags so users only see the final clean answer
    // Use global regex with multiline support to catch all thinking blocks
    let cleanedResponse = responseText;
    
    // Remove all <think>...</think> blocks (including nested or multiple blocks)
    const thinkTagRegex = /<think>[\s\S]*?<\/think>/gi;
    if (thinkTagRegex.test(cleanedResponse)) {
      const beforeLength = cleanedResponse.length;
      cleanedResponse = cleanedResponse.replace(thinkTagRegex, '').trim();
      console.log(`🧠 [OLLAMA] Removed thinking tags: ${beforeLength} chars → ${cleanedResponse.length} chars`);
    }
    
    // Also remove any remaining XML-like tags that might be artifacts
    const finalResponse = cleanedResponse.replace(/<[^>]+>/g, '').trim();
    
    // Final validation: Ensure we have actual content after cleaning
    if (!finalResponse || finalResponse.length === 0) {
      console.error('❌ [OLLAMA] Response is empty after cleaning thinking tags');
      throw new Error('Ollama response was empty after removing thinking tags. The model may have only generated reasoning without a final answer.');
    }
    
    console.log(`✅ [OLLAMA] Response received: ${responseText.length} chars → ${finalResponse.length} chars (cleaned)`);
    
    // CONNECTION MATCHER: Run intent analysis asynchronously (don't block response)
    // Extract user query from prompt (remove system context)
    const userQuery = extractUserQuery(prompt);
    if (userQuery && options.userId) {
      // Run in background - don't await (fire and forget)
      // This analyzes intent, stores interest, and checks for matches
      analyzeUserIntentAndMatch(userQuery, options.userId).catch(err => {
        console.warn('🔗 [Connection Matcher] Background analysis failed (non-critical):', err);
      });
    }
    
    return finalResponse;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Detect mixed content errors and provide helpful message
    if (error.message && error.message.includes('Mixed Content')) {
      console.error('❌ [OLLAMA] Mixed content error detected. Using proxy should fix this.');
      throw new Error('Mixed content error: HTTPS page cannot call HTTP API. The proxy should handle this automatically.');
    }
    
    if (error.name === 'AbortError') {
      throw new Error('Ollama request timed out after 60 seconds. The model may be loading or processing a large request.');
    }
    
    console.error('❌ [OLLAMA] Request failed:', error);
    throw error;
  }
};

/**
 * Connection Matcher: Intent Clustering & User Matching
 * Analyzes user queries to generate topic tags and match users with similar interests
 */

/**
 * Extract user query from prompt (removes system context and RAG context)
 * @param {string} prompt - Full prompt including system context
 * @returns {string|null} - Extracted user query or null
 */
const extractUserQuery = (prompt) => {
  if (!prompt || typeof prompt !== 'string') return null;
  
  // Try to find "User Question:" or "**User Question:**" markers
  const userQuestionMatch = prompt.match(/(?:User Question|User Question:|\*\*User Question:\*\*)\s*(.+?)(?:\n\n|\*\*|$)/i);
  if (userQuestionMatch && userQuestionMatch[1]) {
    return userQuestionMatch[1].trim();
  }
  
  // Fallback: If prompt is short and doesn't contain context markers, use it as-is
  if (prompt.length < 500 && !prompt.includes('Retrieved Knowledge Base') && !prompt.includes('Context:')) {
    return prompt.trim();
  }
  
  // Last resort: Return last 200 chars (likely the actual question)
  return prompt.slice(-200).trim();
};

/**
 * Analyze user intent and generate topic tag using DeepSeek
 * Uses direct API call to avoid circular dependency with callAI
 * @param {string} userQuery - User's question/query
 * @returns {Promise<string|null>} - 2-3 word topic tag or null
 */
const analyzeUserIntent = async (userQuery) => {
  if (!userQuery || userQuery.trim().length === 0) {
    return null;
  }

  try {
    const intentPrompt = `Analyze this query and output a single 2-3 word 'Topic Tag' representing the core interest (e.g., 'Data Structures', 'Visa Help', 'Football', 'Part-time Jobs'). Return ONLY the tag. No explanations, no quotes, just the tag.

Query: "${userQuery}"`;

    // Direct API call to avoid circular dependency (bypass callAI)
    const config = getAIProvider();
    if (!config) {
      return null;
    }

    let tag = null;
    
    if (config.provider === 'ollama') {
      // Direct Ollama API call
      const baseUrl = config.baseUrl || import.meta.env.VITE_OLLAMA_URL?.trim() || 'http://localhost:11434';
      const model = 'deepseek-r1:8b';
      
      // Check if we need proxy (HTTPS page calling HTTP API)
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const isHttpUrl = baseUrl.startsWith('http://');
      const useProxy = isHttps && isHttpUrl;
      
      const url = useProxy
        ? `https://us-central1-campus-connect-sistc.cloudfunctions.net/ollamaProxy/api/chat`
        : `${baseUrl}/api/chat`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You are a topic classifier. Return only the 2-3 word topic tag, nothing else.' },
            { role: 'user', content: intentPrompt }
          ],
          stream: false,
          options: {
            num_ctx: 512,  // Small context for fast response
            num_predict: 20 // Very short response (just the tag)
          }
        }),
        signal: AbortSignal.timeout(10000) // 10 second timeout for intent analysis
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      tag = data.message?.content?.trim() || data.response?.trim() || '';
      
      // Remove thinking tags if present
      tag = tag.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    } else if (config.provider === 'groq') {
      // Direct Groq API call
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: 'You are a topic classifier. Return only the 2-3 word topic tag, nothing else.' },
            { role: 'user', content: intentPrompt }
          ],
          max_tokens: 15,
          temperature: 0.2,
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.statusText}`);
      }

      const data = await response.json();
      tag = data.choices[0]?.message?.content?.trim() || '';
    }

    if (!tag) {
      return null;
    }

    // Clean and validate the tag (2-3 words)
    const cleanedTag = tag.trim().replace(/['"]/g, ''); // Remove quotes
    const words = cleanedTag.split(/\s+/).filter(w => w.length > 0);
    
    if (words.length >= 2 && words.length <= 3) {
      return words.join(' ');
    }
    
    // Fallback: Generate from keywords if AI fails
    const queryWords = userQuery.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    if (queryWords.length >= 2) {
      return queryWords.slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    
    return null;
  } catch (error) {
    console.warn('🔗 [Connection Matcher] Failed to analyze intent:', error);
    return null;
  }
};

/**
 * Store active interest in Firestore
 * @param {string} userId - User ID
 * @param {string} topicTag - Topic tag
 * @param {string} userQuery - Original query
 * @returns {Promise<string|null>} - Document ID if successful
 */
const storeActiveInterest = async (userId, topicTag, userQuery) => {
  if (!db || !userId || !topicTag) {
    return null;
  }

  try {
    const interestRef = await addDoc(collection(db, 'activeInterests'), {
      userId,
      topicTag,
      query: userQuery.substring(0, 200), // Store first 200 chars
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    });

    console.log(`🔗 [Connection Matcher] Stored interest: "${topicTag}" for user ${userId.substring(0, 8)}...`);
    return interestRef.id;
  } catch (error) {
    console.error('🔗 [Connection Matcher] Error storing interest:', error);
    return null;
  }
};

/**
 * Check for matching users with same topic tag within time window (The Polly Protocol)
 * @param {string} currentTag - Current topic tag
 * @param {string} currentUserId - Current user ID
 * @param {number} timeWindowMinutes - Time window in minutes (default: 30)
 * @returns {Promise<Array>} - Array of matching user objects
 */
const checkForMatches = async (currentTag, currentUserId, timeWindowMinutes = 30) => {
  if (!db || !currentTag || !currentUserId) {
    return [];
  }

  try {
    // Calculate time threshold (30 minutes ago)
    const timeThreshold = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    
    // Query for same topic tag within time window, excluding current user
    const q = query(
      collection(db, 'activeInterests'),
      where('topicTag', '==', currentTag),
      where('timestamp', '>=', Timestamp.fromDate(timeThreshold))
    );

    const snapshot = await getDocs(q);
    const matches = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      // Exclude current user
      if (data.userId && data.userId !== currentUserId && data.userId.trim() !== '') {
        matches.push({
          userId: data.userId,
          query: data.query || '',
          timestamp: data.timestamp
        });
      }
    });

    // Remove duplicates (same user asking multiple times)
    const uniqueMatches = matches.reduce((acc, match) => {
      if (!acc.find(m => m.userId === match.userId)) {
        acc.push(match);
      }
      return acc;
    }, []);

    console.log(`🔗 [Connection Matcher] Found ${uniqueMatches.length} matches for tag: "${currentTag}"`);
    return uniqueMatches;
  } catch (error) {
    console.error('🔗 [Connection Matcher] Error checking matches:', error);
    return [];
  }
};

/**
 * Main connection matcher function (runs asynchronously after AI response)
 * Analyzes intent, stores interest, and checks for matches
 * @param {string} userQuery - User's query
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} - Match info if found, null otherwise
 */
const analyzeUserIntentAndMatch = async (userQuery, userId) => {
  if (!userQuery || !userId) {
    return null;
  }

  try {
    // Step 1: Analyze intent and generate topic tag
    const topicTag = await analyzeUserIntent(userQuery);
    if (!topicTag) {
      console.log('🔗 [Connection Matcher] No topic tag generated, skipping match check');
      return null;
    }

    // Step 2: Store active interest
    await storeActiveInterest(userId, topicTag, userQuery);

    // Step 3: Check for matches (30-minute window)
    const matches = await checkForMatches(topicTag, userId, 30);
    
    // Step 4: If matches found (>= 2 other students), return match info
    if (matches.length >= 2) {
      const matchInfo = {
        topicTag,
        matchCount: matches.length,
        message: `psst... ${matches.length} other students are asking about ${topicTag} right now. Would you like to join their anonymous study group?`
      };
      console.log(`🔗 [Connection Matcher] Match found! ${matches.length} students interested in: ${topicTag}`);
      
      // Store match info in a way that can be retrieved by the caller
      // For now, we'll use a custom event or store in a global cache
      if (typeof window !== 'undefined') {
        window.__lastConnectionMatch = matchInfo;
        // Dispatch custom event for components to listen
        window.dispatchEvent(new CustomEvent('connectionMatch', { detail: matchInfo }));
      }
      
      return matchInfo;
    }

    return null;
  } catch (error) {
    console.warn('🔗 [Connection Matcher] Error in background analysis:', error);
    return null;
  }
};

/**
 * Call Groq API (Fallback - very generous free tier)
 */
const callGroq = async (prompt, config, options) => {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: options.systemPrompt || 'You are a helpful assistant.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: options.maxTokens || config.maxTokens,
      temperature: options.temperature || config.temperature,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Groq API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
};

/**
 * Get provider by name (for manual selection)
 */
export const getProviderByPriority = (providerName) => {
  switch (providerName) {
    case 'ollama':
      const ollamaUrl = import.meta.env.VITE_OLLAMA_URL?.trim();
      if (ollamaUrl && ollamaUrl !== '') {
        return {
          provider: 'ollama',
          baseUrl: ollamaUrl,
          model: 'deepseek-r1:8b', // FORCED: 8B model (32B disabled to prevent timeouts)
          maxTokens: 4096,
          temperature: 0.7
        };
      }
      break;
    case 'groq':
      const groqKey = import.meta.env.VITE_GROQ_API_KEY?.trim();
      if (groqKey && groqKey !== '') {
        return {
          provider: 'groq',
          apiKey: groqKey,
          model: 'llama-3.1-8b-instant',
          baseUrl: 'https://api.groq.com/openai/v1',
          maxTokens: 2048,
          temperature: 0.7
        };
      }
      break;
  }
  return null;
};

/**
 * Get current provider info
 */
export const getProviderInfo = () => {
  const config = getAIProvider();
  if (!config) {
    return {
      provider: 'none',
      name: 'No AI Provider',
      status: 'not_configured',
      limits: 'N/A'
    };
  }

  const providerInfo = {
    'ollama': {
      name: 'Ollama (Self-Hosted GPU)',
      status: 'active',
      limits: 'Unlimited - RTX 6000 48GB VRAM',
      website: 'https://ollama.com',
      signup: 'Self-hosted on GPU droplet'
    },
    'groq': {
      name: 'Groq (Recommended for Students)',
      status: 'active',
      limits: 'Very generous free tier - 14,400 requests/day',
      website: 'https://console.groq.com',
      signup: 'https://console.groq.com/signup'
    },
  };

  return {
    provider: config.provider,
    ...providerInfo[config.provider] || { name: config.provider, status: 'active' }
  };
};

export default { callAI, getAIProvider, getProviderInfo };
