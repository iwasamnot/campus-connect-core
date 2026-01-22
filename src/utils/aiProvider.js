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
    return {
      provider: 'ollama',
      baseUrl: ollamaUrl,
      model: import.meta.env.VITE_OLLAMA_MODEL?.trim() || 'deepseek-r1:32b',
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
 */
const callOllama = async (prompt, config, options = {}) => {
  const baseUrl = config.baseUrl || import.meta.env.VITE_OLLAMA_URL?.trim() || 'http://localhost:11434';
  const model = config.model || import.meta.env.VITE_OLLAMA_MODEL?.trim() || 'deepseek-r1:32b';
  
  // Build messages array with proper role structure
  // System role: Virtual Senior persona
  // User role: Full prompt (includes RAG context + user question)
  const messages = [];
  
  // System prompt: Virtual Senior persona (if provided)
  if (options.systemPrompt) {
    messages.push({ 
      role: 'system', 
      content: options.systemPrompt 
    });
  }
  
  // User message: Contains the full prompt (RAG context + question)
  messages.push({ 
    role: 'user', 
    content: prompt 
  });

  console.log(`🚀 [OLLAMA] Sending request to ${baseUrl}/api/chat`);
  console.log(`📦 [OLLAMA] Model: ${model}`);
  console.log(`💬 [OLLAMA] Messages: ${messages.length} (System: ${options.systemPrompt ? 'Yes' : 'No'}, User: Yes)`);
  console.log(`📏 [OLLAMA] Prompt length: ${prompt.length} characters`);

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
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
          num_predict: options.maxTokens || config.maxTokens || 4096,
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
    if (data.message?.content) {
      const responseText = data.message.content.trim();
      console.log(`✅ [OLLAMA] Response received: ${responseText.length} characters`);
      return responseText;
    }
    
    // Fallback: try response field (legacy format)
    if (data.response && typeof data.response === 'string') {
      console.log(`⚠️ [OLLAMA] Using legacy response format: ${data.response.length} characters`);
      return data.response.trim();
    }
    
    // Debug: log full response if parsing fails
    console.error('❌ [OLLAMA] Unexpected response format:', JSON.stringify(data, null, 2));
    throw new Error('Ollama API returned unexpected response format. Expected data.message.content');
  } catch (error) {
    clearTimeout(timeoutId);
    
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
          model: import.meta.env.VITE_OLLAMA_MODEL?.trim() || 'deepseek-r1:32b',
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
