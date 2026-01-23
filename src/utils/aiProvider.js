/**
 * Multi-AI Provider System - Ollama & Groq Only
 * Ollama: Self-hosted GPU droplet (RTX 6000) - Primary
 * Groq: Cloud API - Fallback
 * 
 * CRITICAL: Ollama is checked FIRST and bypasses all other logic
 */

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
    console.log('Γ£à [OLLAMA] Ollama URL detected, using self-hosted GPU instance');
    console.log('ΓÜí [OLLAMA] Forcing 8B model (32B disabled to prevent timeouts)');
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
    console.log('ΓÜá∩╕Å [FALLBACK] Using Groq (Ollama not configured)');
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
        console.warn('Γ¥î [OLLAMA] Failed, trying Groq fallback:', error.message);
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
  // Use dynamic URL getter (checks localStorage first, then .env, then default)
  const baseUrl = config.baseUrl || getOllamaURL();
  
  // FORCE 8B MODEL: 32B model is too heavy and times out
  // Override any .env variable to use the faster 8B model
  const model = 'deepseek-r1:8b';
  console.log(`ΓÜí [OLLAMA] Switching to fast model: deepseek-r1:8b (32B model disabled to prevent timeouts)`);
  
  // Build messages array with proper role structure
  // System role: Virtual Senior persona
  // User role: Full prompt (includes RAG context + user question)
  const messages = [];
  
  // Load core memory for context injection
  let coreMemoryContext = '';
  if (options.userId) {
    try {
      const { getCoreMemoryContext } = await import('./memoryStore');
      const memoryContext = getCoreMemoryContext(options.userId);
      if (memoryContext && memoryContext !== 'No core memory available yet.') {
        coreMemoryContext = `\n\nUSER CONTEXT (Core Memory):\n${memoryContext}\n\nUse this context to personalize your responses. Reference the user's name, goals, and preferences when relevant.`;
      }
    } catch (error) {
      console.warn('💾 [Memory] Failed to load core memory:', error);
    }
  }
  
  // System prompt: Smart Researcher persona (witty + rigorous with citations + fun facts)
  // Blended persona: Engaging like Grok but academically rigorous with citations
  const SYSTEM_PROMPT = `You are the Campus Connect AI.
IDENTITY:
You are a witty, highly intelligent, and rigorous research assistant. You are like a very intelligent, charismatic senior student who knows their stuff and isn't afraid to show it. You are NOT a boring, generic chatbot. You write with flair, confidence, and precision.${coreMemoryContext}

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
5. **FORM AUTO-FILLER:** If the user asks for a "Special Consideration" or "Extension" form, do NOT output text. Instead, extract their details and output a JSON block:
   \`\`\`json
   {
     "type": "FILL_FORM",
     "formName": "special_consideration",
     "data": {
       "name": "...",
       "studentId": "...",
       "course": "...",
       "reason": "..."
     }
   }
   \`\`\`
   - For extension forms, use "formName": "extension" and include "assignment" in data.
   - Extract information from the user's message or use reasonable defaults if not provided.

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
      
      // Log memory context if injected
      if (coreMemoryContext) {
        console.log('💾 [Memory] Core memory context injected into system prompt');
      }

  // MIXED CONTENT FIX: Detect if we're on HTTPS and Ollama is HTTP
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const isHttpOllama = baseUrl.startsWith('http://');
  const useProxy = isHttps && isHttpOllama;

  // Use Cloud Function proxy if mixed content detected
  const targetUrl = useProxy 
    ? `https://us-central1-campus-connect-sistc.cloudfunctions.net/ollamaProxy`
    : `${baseUrl}/api/chat`;

  console.log(`≡ƒÜÇ [OLLAMA] Sending request to ${targetUrl}${useProxy ? ' (via HTTPS proxy)' : ''}`);
  console.log(`≡ƒôª [OLLAMA] Model: ${model}`);
  console.log(`≡ƒÆ¼ [OLLAMA] Messages: ${messages.length} (System: ${options.systemPrompt ? 'Yes' : 'No'}, User: Yes)`);
  console.log(`≡ƒôÅ [OLLAMA] Prompt length: ${prompt.length} characters`);

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
      console.warn('ΓÜá∩╕Å [OLLAMA] Response has thinking field but no content, using thinking as fallback');
      responseText = data.message.thinking.trim();
    } else if (data.response && typeof data.response === 'string') {
      // Fallback: try response field (legacy format)
      console.log(`ΓÜá∩╕Å [OLLAMA] Using legacy response format`);
      responseText = data.response.trim();
    } else {
      // Debug: log full response if parsing fails
      console.error('Γ¥î [OLLAMA] Unexpected response format:', JSON.stringify(data, null, 2));
      throw new Error('Ollama API returned unexpected response format. Expected data.message.content');
    }
    
    // Handle empty content (model ran out of tokens during thinking)
    if (!responseText || responseText.length === 0) {
      console.warn('ΓÜá∩╕Å [OLLAMA] Empty response content - model may have run out of tokens during thinking phase');
      if (data.message?.thinking) {
        // If thinking exists, try to extract any useful info from it
        const thinkingText = data.message.thinking.trim();
        if (thinkingText.length > 0) {
          console.warn('ΓÜá∩╕Å [OLLAMA] Using thinking content as fallback (may be incomplete)');
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
      console.log(`≡ƒºá [OLLAMA] Removed thinking tags: ${beforeLength} chars ΓåÆ ${cleanedResponse.length} chars`);
    }
    
    // Also remove any remaining XML-like tags that might be artifacts
    const finalResponse = cleanedResponse.replace(/<[^>]+>/g, '').trim();
    
    // Final validation: Ensure we have actual content after cleaning
    if (!finalResponse || finalResponse.length === 0) {
      console.error('Γ¥î [OLLAMA] Response is empty after cleaning thinking tags');
      throw new Error('Ollama response was empty after removing thinking tags. The model may have only generated reasoning without a final answer.');
    }
    
    console.log(`Γ£à [OLLAMA] Response received: ${responseText.length} chars ΓåÆ ${finalResponse.length} chars (cleaned)`);
    return finalResponse;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Detect mixed content errors and provide helpful message
    if (error.message && error.message.includes('Mixed Content')) {
      console.error('Γ¥î [OLLAMA] Mixed content error detected. Using proxy should fix this.');
      throw new Error('Mixed content error: HTTPS page cannot call HTTP API. The proxy should handle this automatically.');
    }
    
    if (error.name === 'AbortError') {
      throw new Error('Ollama request timed out after 60 seconds. The model may be loading or processing a large request.');
    }
    
    console.error('Γ¥î [OLLAMA] Request failed:', error);
    throw error;
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
      const ollamaUrl = getOllamaURL();
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

/**
 * Translate message to English (slang-aware, casual translation)
 * Used for Universal Group Chat where everyone speaks their own language but reads in English
 * @param {string} text - Text to translate
 * @param {string} sourceLang - Source language (e.g., 'Urdu', 'Mandarin', 'Spanish')
 * @returns {Promise<string>} - Translated text in English
 */
export const translateMessage = async (text, sourceLang = 'auto') => {
  if (!text || text.trim().length === 0) {
    return text;
  }

  // If already English, return as-is
  if (sourceLang === 'English' || sourceLang === 'english') {
    return text;
  }

  try {
    const translatePrompt = `Translate the following text from ${sourceLang} to English. 
    
Rules:
- Preserve emojis exactly as they are
- Keep the casual, conversational tone (do NOT make it formal)
- Preserve slang and informal expressions
- Keep the same energy and emotion
- Output ONLY the translated text, no explanations

Text to translate:
"${text}"`;

    const config = getAIProvider();
    if (!config) {
      console.warn('🔗 [Translation] No AI provider available, returning original text');
      return text;
    }

    // Use direct API call to avoid triggering connection matcher
    let translatedText = null;
    
    if (config.provider === 'ollama') {
      const baseUrl = config.baseUrl || getOllamaURL();
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
            { 
              role: 'system', 
              content: 'You are a slang-aware translator. Translate the input text to English. Preserve emojis, tone, and casual speech. Do NOT be formal. Output ONLY the translated text.' 
            },
            { role: 'user', content: translatePrompt }
          ],
          stream: false,
          options: {
            num_ctx: 2048,
            num_predict: 512
          }
        }),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      translatedText = data.message?.content?.trim() || data.response?.trim() || '';
      
      // Remove thinking tags if present
      translatedText = translatedText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    } else if (config.provider === 'groq') {
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { 
              role: 'system', 
              content: 'You are a slang-aware translator. Translate the input text to English. Preserve emojis, tone, and casual speech. Do NOT be formal. Output ONLY the translated text.' 
            },
            { role: 'user', content: translatePrompt }
          ],
          max_tokens: 512,
          temperature: 0.3,
        }),
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.statusText}`);
      }

      const data = await response.json();
      translatedText = data.choices[0]?.message?.content?.trim() || '';
    }

    if (!translatedText || translatedText.length === 0) {
      console.warn('🔗 [Translation] Empty translation, returning original text');
      return text;
    }

    console.log(`🔗 [Translation] Translated from ${sourceLang}: ${text.substring(0, 50)}... → ${translatedText.substring(0, 50)}...`);
    return translatedText;
  } catch (error) {
    console.error('🔗 [Translation] Translation failed:', error);
    // Return original text on error (graceful degradation)
    return text;
  }
};

export default { callAI, getAIProvider, getProviderInfo, translateMessage };
