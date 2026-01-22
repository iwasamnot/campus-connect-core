/**
 * Multi-AI Provider System - Ollama & Groq Only
 * Ollama: Self-hosted GPU droplet (RTX 6000) - Primary
 * Groq: Cloud API - Fallback
 */

// Provider priorities (order matters - first available is used)
const PROVIDER_PRIORITY = [
  'ollama',  // Self-hosted Ollama (RTX 6000 GPU droplet) - highest priority
  'groq',    // Groq API - fallback with generous free tier
];

/**
 * Get AI provider configuration
 */
export const getAIProvider = () => {
  // Check for Ollama first (self-hosted GPU droplet - best performance)
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

  // Check for Groq (fallback - very generous free tier)
  const groqApiKey = import.meta.env.VITE_GROQ_API_KEY?.trim();
  if (groqApiKey && groqApiKey !== '') {
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
        console.warn('Ollama failed, trying Groq fallback:', error.message);
        return await callGroq(prompt, groqConfig, options);
      }
    }
    throw error;
  }
};

/**
 * Call Ollama API (Self-hosted GPU droplet - best performance)
 * Uses your RTX 6000 GPU droplet for high-performance inference
 */
const callOllama = async (prompt, config, options) => {
  const baseUrl = config.baseUrl || import.meta.env.VITE_OLLAMA_URL?.trim() || 'http://localhost:11434';
  const model = config.model || import.meta.env.VITE_OLLAMA_MODEL?.trim() || 'deepseek-r1:32b';
  
  // Build messages array with system prompt if provided
  const messages = [];
  if (options.systemPrompt) {
    messages.push({ role: 'system', content: options.systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      stream: false,
      options: {
        temperature: options.temperature || config.temperature || 0.7,
        num_predict: options.maxTokens || config.maxTokens || 4096,
      }
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Ollama API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Ollama returns response in message.content
  if (data.message?.content) {
    console.log(`✅ Ollama response generated successfully using model: ${model}`);
    return data.message.content;
  }
  
  // Fallback: try response field
  if (data.response) {
    return data.response;
  }
  
  throw new Error('Ollama API returned unexpected response format');
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
