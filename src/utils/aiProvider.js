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
  
  // System prompt: Virtual Senior persona (if provided)
  // Enhanced system prompt for better context handling
  if (options.systemPrompt) {
    const enhancedSystemPrompt = `${options.systemPrompt}

**Important Instructions:**
- If the provided context has low relevance, prioritize answering the user's question directly
- Use your general knowledge when context is insufficient
- Be helpful, accurate, and professional`;
    
    messages.push({ 
      role: 'system', 
      content: enhancedSystemPrompt 
    });
  }
  
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
