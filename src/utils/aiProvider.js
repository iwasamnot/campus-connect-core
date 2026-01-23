/**
 * Multi-AI Provider System - Ollama & Groq Only
 * Ollama: Self-hosted GPU droplet (RTX 6000) - Primary
 * Groq: Cloud API - Fallback
 * 
 * CRITICAL: Ollama is checked FIRST and bypasses all other logic
 */

/**
 * Helper: Convert any image URL (blob:, data:, or file) to Base64
 * This handles the silent failure issue where blob URLs are sent to Ollama
 * @param {string} url - Image URL (blob:, data:, or file URL)
 * @returns {Promise<string>} - Base64 string without data URI prefix
 */
const urlToBase64 = async (url) => {
  try {
    // If it's already a data URI, just return the base64 part
    if (url.startsWith('data:')) {
      const base64 = url.includes(',') ? url.split(',')[1] : url;
      console.log('✅ [Image] Already base64 data URI, extracted base64');
      return base64;
    }

    // If it's a blob URL, fetch and convert
    if (url.startsWith('blob:')) {
      console.log('🔄 [Image] Converting blob URL to base64...');
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch blob: ${response.statusText}`);
      }
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result;
          // Extract base64 part (remove data:image/...;base64, prefix)
          const base64 = result.includes(',') ? result.split(',')[1] : result;
          console.log(`✅ [Image] Blob converted to base64 (${base64.length} chars)`);
          resolve(base64);
        };
        reader.onerror = (error) => {
          console.error('❌ [Image] FileReader error:', error);
          reject(new Error('Failed to convert blob to base64'));
        };
        reader.readAsDataURL(blob);
      });
    }

    // If it's a regular HTTP/HTTPS URL, fetch and convert
    if (url.startsWith('http://') || url.startsWith('https://')) {
      console.log('🔄 [Image] Converting HTTP URL to base64...');
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result;
          const base64 = result.includes(',') ? result.split(',')[1] : result;
          console.log(`✅ [Image] HTTP URL converted to base64 (${base64.length} chars)`);
          resolve(base64);
        };
        reader.onerror = (error) => {
          console.error('❌ [Image] FileReader error:', error);
          reject(new Error('Failed to convert image URL to base64'));
        };
        reader.readAsDataURL(blob);
      });
    }

    // If it's already base64 (no prefix), return as-is
    console.log('⚠️ [Image] Unknown URL format, assuming base64 string');
    return url;
  } catch (error) {
    console.error('❌ [Image] Error converting URL to base64:', error);
    throw new Error(`Failed to convert image to base64: ${error.message}`);
  }
};

// Provider priorities (order matters - first available is used)
const PROVIDER_PRIORITY = [
  'ollama',  // Self-hosted Ollama (RTX 6000 GPU droplet) - highest priority
  'groq',    // Groq API - fallback with generous free tier
];

/**
 * Get Ollama URL with dynamic override support (Hybrid Configuration)
 * Priority: localStorage custom URL > .env variable > default localhost
 * This allows dynamic Ngrok URLs via localStorage while keeping static keys in .env
 * @returns {string} - The active Ollama URL
 */
export const getOllamaURL = () => {
  // Check localStorage first (for dynamic URL changes - handles Ngrok URL updates)
  const customUrl = typeof window !== 'undefined' 
    ? localStorage.getItem('custom_ollama_url')?.trim() 
    : null;
  
  if (customUrl && customUrl !== '') {
    console.log('🔧 [OLLAMA] Using custom URL from localStorage:', customUrl);
    return customUrl;
  }
  
  // Fallback to .env variable (static configuration)
  const envUrl = import.meta.env.VITE_OLLAMA_URL?.trim();
  if (envUrl && envUrl !== '') {
    console.log('📦 [OLLAMA] Using URL from environment variable:', envUrl);
    return envUrl;
  }
  
  // Default fallback
  const defaultUrl = 'http://localhost:11434';
  console.log('🏠 [OLLAMA] Using default localhost URL:', defaultUrl);
  return defaultUrl;
};

/**
 * Get AI provider configuration
 * PRIORITY: Ollama is checked FIRST - if VITE_OLLAMA_URL exists, use it immediately
 */
export const getAIProvider = () => {
  // CRITICAL: Check Ollama FIRST - bypass all other logic if configured
  const ollamaUrl = getOllamaURL();
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
  // SAFETY OVERRIDE: Check for crisis/distress signals BEFORE processing
  if (typeof window !== 'undefined') {
    try {
      const { checkSafety, getCrisisResponse } = await import('./safetyCheck');
      const safetyCheck = checkSafety(prompt);
      
      if (safetyCheck.requiresIntervention) {
        console.warn('🚨 [Safety] Crisis intervention triggered in AI call:', safetyCheck.matchedKeyword);
        const crisisResponse = getCrisisResponse();
        // Return crisis message instead of processing with AI
        return crisisResponse.message;
      }
    } catch (safetyError) {
      console.warn('⚠️ [Safety] Safety check failed, continuing with AI call:', safetyError);
      // Continue with normal AI processing if safety check fails
    }
  }

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
  
  // ✅ FIX: Quick connectivity check - if baseUrl is invalid, throw early
  if (!baseUrl || baseUrl.trim() === '') {
    throw new Error('Ollama URL is not configured. Please set VITE_OLLAMA_URL or configure a custom URL.');
  }
  
  // ✅ FIX: Detect Image (from options.image or message attachments)
  const hasImage = options.image || 
                   (options.messages && options.messages.length > 0 && 
                    options.messages[options.messages.length - 1]?.attachments?.some(a => a.type === 'image'));
  
  // ✅ FIX: Select Model - Use llava for vision, deepseek-r1:8b for text
  const model = hasImage ? 'llava:v1.6' : 'deepseek-r1:8b';
  console.error(`🚀 [AI] Requesting Model: ${model}${hasImage ? ' (with image)' : ''}`);
  
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
  
  // ✅ FIX: Format messages correctly for Ollama
  // Ollama expects: { role: "user", content: "...", images: ["base64..."] }
  const formattedMessages = [];
  
  // Add system message
  formattedMessages.push({ 
    role: 'system', 
    content: systemPrompt 
  });
  
  // ✅ FIX: Format user message with image if present (async conversion for blob URLs)
  const userMessage = { 
    role: 'user', 
    content: prompt 
  };
  
  // If image is provided in options, convert and add it to the user message
  if (options.image) {
    try {
      console.error('📸 [AI] Converting image from options.image to base64...');
      const base64 = await urlToBase64(options.image);
      userMessage.images = [base64];
      console.error(`✅ [AI] Image attached to user message (${base64.length} chars base64)`);
    } catch (error) {
      console.error('❌ [AI] Failed to convert image from options.image:', error);
      // Continue without image rather than failing completely
    }
  }
  // If messages array is provided with attachments, extract image from last message
  else if (options.messages && options.messages.length > 0) {
    const lastMessage = options.messages[options.messages.length - 1];
    if (lastMessage.attachments && lastMessage.attachments.length > 0) {
      const imgAttachment = lastMessage.attachments.find(a => a.type === 'image');
      if (imgAttachment && imgAttachment.url) {
        try {
          console.error('📸 [AI] Converting image from message attachments to base64...');
          const base64 = await urlToBase64(imgAttachment.url);
          userMessage.images = [base64];
          console.error(`✅ [AI] Image extracted from message attachments (${base64.length} chars base64)`);
        } catch (error) {
          console.error('❌ [AI] Failed to convert image from attachments:', error);
          // Continue without image rather than failing completely
        }
      }
    }
  }
  
  formattedMessages.push(userMessage);
  
  // Log memory context if injected
  if (coreMemoryContext) {
    console.log('💾 [Memory] Core memory context injected into system prompt');
  }

  // MIXED CONTENT FIX: Detect if we're on HTTPS and Ollama is HTTP
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const isHttpOllama = baseUrl.startsWith('http://');
  const useProxy = isHttps && isHttpOllama;

  // ✅ FIX: Always use /api/chat endpoint (Ollama supports images in messages)
  const endpoint = '/api/chat';
  const targetUrl = useProxy 
    ? `https://us-central1-campus-connect-sistc.cloudfunctions.net/ollamaProxy${endpoint}`
    : `${baseUrl}${endpoint}`;

  console.log(`🚀 [OLLAMA] Sending request to ${targetUrl}${useProxy ? ' (via HTTPS proxy)' : ''}`);
  console.log(`🤖 [OLLAMA] Model: ${model}`);
  console.log(`📝 [OLLAMA] Messages: ${formattedMessages.length} (System: Yes, User: Yes${hasImage ? ', Image: Yes' : ''})`);
  console.log(`📏 [OLLAMA] Prompt length: ${prompt.length} characters`);

  // Create AbortController for timeout
  // Increased to 120 seconds (2 minutes) to handle reasoning model "thinking" phase
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout (2 minutes)

  try {
    // ✅ FIX: Use standard chat format for both text and multimodal
    // Ollama's /api/chat endpoint supports images in message objects
    const requestBody = {
      model: model,
      messages: formattedMessages, // Use formatted messages with images array
      stream: false, // Non-streaming for simplicity
      options: {
        temperature: options.temperature || config.temperature || 0.7,
        num_ctx: 4096,      // Larger context window for reasoning models
        num_predict: 2048,  // Allow 2048 tokens to generate (prevents cutoff during thinking)
      }
    };

    // Log request details for debugging
    console.log('📤 [OLLAMA] Sending request:', {
      url: targetUrl,
      model: model,
      hasImage: !!userMessage.images,
      imageSize: userMessage.images?.[0]?.length || 0,
      messageCount: formattedMessages.length
    });

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal, // Timeout support
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [OLLAMA] API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 500) // First 500 chars
      });
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText } };
      }
      
      const errorMessage = errorData.error?.message || errorText || `Ollama API error: ${response.statusText} (${response.status})`;
      console.error('❌ [OLLAMA] Request failed:', errorMessage);
      
      // ✅ FIX: Throw error that will trigger Groq fallback
      throw new Error(`Ollama API error: ${errorMessage}`);
    }

    const data = await response.json();
    console.error('✅ [AI] Success:', { 
      hasMessage: !!data.message,
      hasContent: !!data.message?.content,
      contentLength: data.message?.content?.length || 0
    });
    
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
    // SELF-LEARNING AGENT: Check if response indicates "unknown" or low confidence
    const selfLearningEnabled = options.selfLearning !== false;
    const isInSelfLearningLoop = options._selfLearningActive === true;
    
    if (selfLearningEnabled && !isInSelfLearningLoop) {
      const unknownIndicators = ["i don't know", "i'm not sure", "i don't have", "i cannot", "i'm unable", "no information", "not available", "unclear", "uncertain"];
      const responseLower = finalResponse.toLowerCase();
      const isUnknown = unknownIndicators.some(indicator => responseLower.includes(indicator));
      const isShortResponse = finalResponse.length < 100;
      
      if (isUnknown || isShortResponse) {
        console.log('🧠 [Self-Learning] Detected uncertain response, triggering web search...');
        try {
          const userQuery = prompt.split('Question:')[1]?.split('\n')[0]?.trim() || prompt.split('question:')[1]?.split('\n')[0]?.trim() || prompt.split('User Query:')[1]?.split('\n')[0]?.trim() || prompt.substring(0, 200);
          const { searchWeb, formatWebResults } = await import('./webSearch');
          const webResults = await searchWeb(userQuery, 3);
          
          if (webResults && webResults.length > 0) {
            console.log(`🧠 [Self-Learning] Found ${webResults.length} web results, generating enhanced answer...`);
            const webContext = formatWebResults(webResults);
            const enhancedPrompt = `Based on the following web search results, provide a comprehensive answer to the user's question.\n\nWeb Search Results:\n${webContext}\n\nOriginal Question: ${userQuery}\n\nProvide a clear, accurate answer based on the web search results.`;
            const enhancedResponse = await callOllama(enhancedPrompt, config, { ...options, systemPrompt: 'You are a helpful assistant. Answer questions accurately based on web search results.', _selfLearningActive: true, selfLearning: false });
            
            if (enhancedResponse && enhancedResponse.trim().length > 50) {
              Promise.resolve().then(async () => {
                try {
                  const { learnFromWeb } = await import('./knowledgeBase');
                  await learnFromWeb(userQuery, webResults);
                  console.log('💾 Saved to Knowledge Base');
                } catch (learnError) {
                  console.warn('🧠 [Self-Learning] Error saving to knowledge base (non-critical):', learnError);
                }
              }).catch(() => {});
              return enhancedResponse;
            }
          }
        } catch (webSearchError) {
          console.warn('🧠 [Self-Learning] Web search failed (non-critical):', webSearchError);
        }
      }
    }
    
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

export default { callAI, getAIProvider, getProviderInfo, translateMessage, getOllamaURL };
