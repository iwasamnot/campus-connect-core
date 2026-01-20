/**
 * Multi-AI Provider System
 * Supports multiple AI providers with automatic fallback
 * 
 * IMPORTANT: Gemini is PRIMARY for stability (1,000,000 TPM limit)
 * Groq is fast but has strict rate limits (6,000 TPM) - use as fallback only
 */

// Provider priorities (order matters - first available is used)
// Gemini FIRST for stability during demos/presentations (huge rate limits)
const PROVIDER_PRIORITY = [
  'gemini',      // PRIMARY: 1,000,000 TPM - most reliable for demos
  'groq',        // FALLBACK: Fast but 6,000 TPM limit - easy to hit
  'openai',      // Good free tier
  'huggingface', // Free inference API
  'anthropic',   // Claude - good limits
];

/**
 * Get AI provider configuration
 * Prioritizes Gemini for stability (1M tokens/min vs Groq's 6K)
 */
export const getAIProvider = () => {
  // PRIMARY: Gemini (1,000,000 TPM - practically unlimited for demos)
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (geminiApiKey && geminiApiKey !== '') {
    return {
      provider: 'gemini',
      apiKey: geminiApiKey,
      model: 'gemini-2.0-flash', // Fast and reliable with huge limits
      baseUrl: null, // Uses GoogleGenerativeAI SDK
      maxTokens: 2048,
      temperature: 0.7
    };
  }

  // FALLBACK 1: Groq (fast but 6,000 TPM - hits limit after ~3 RAG queries)
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

  // FALLBACK 2: OpenAI (good free tier)
  const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY?.trim();
  if (openaiApiKey && openaiApiKey !== '') {
    return {
      provider: 'openai',
      apiKey: openaiApiKey,
      model: 'gpt-3.5-turbo',
      baseUrl: 'https://api.openai.com/v1',
      maxTokens: 2048,
      temperature: 0.7
    };
  }

  // FALLBACK 3: Hugging Face (free tier)
  const hfApiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY?.trim();
  if (hfApiKey && hfApiKey !== '') {
    return {
      provider: 'huggingface',
      apiKey: hfApiKey,
      model: 'meta-llama/Llama-3.1-8B-Instruct',
      baseUrl: 'https://api-inference.huggingface.co',
      maxTokens: 1024,
      temperature: 0.7
    };
  }

  // FALLBACK 4: Anthropic Claude
  const anthropicApiKey = import.meta.env.VITE_ANTHROPIC_API_KEY?.trim();
  if (anthropicApiKey && anthropicApiKey !== '') {
    return {
      provider: 'anthropic',
      apiKey: anthropicApiKey,
      model: 'claude-3-haiku-20240307',
      baseUrl: 'https://api.anthropic.com/v1',
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
    // Graceful no-op when no AI provider is configured.
    // This allows the app to run with ONLY local logic (no external AI),
    // while higher-level features can detect a null/empty response and
    // either skip AI features or fall back to local heuristics.
    console.warn(
      'AIProvider: No AI provider configured. ' +
      'Set at least one of VITE_GEMINI_API_KEY, VITE_GROQ_API_KEY, VITE_OPENAI_API_KEY, ' +
      'VITE_HUGGINGFACE_API_KEY, or VITE_ANTHROPIC_API_KEY to enable cloud AI features.'
    );
    return null;
  }

  try {
    switch (config.provider) {
      case 'groq':
        return await callGroq(prompt, config, options);
      case 'huggingface':
        return await callHuggingFace(prompt, config, options);
      case 'openai':
        return await callOpenAI(prompt, config, options);
      case 'anthropic':
        return await callAnthropic(prompt, config, options);
      case 'gemini':
        return await callGemini(prompt, config, options);
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }
  } catch (error) {
    console.error(`Error with ${config.provider}:`, error);
    // Try fallback providers
    return await tryFallbackProviders(prompt, config.provider, options);
  }
};

/**
 * Call Groq API (Best for students - very generous limits)
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
 * Call Hugging Face Inference API (Free tier)
 */
const callHuggingFace = async (prompt, config, options) => {
  const response = await fetch(`${config.baseUrl}/models/${config.model}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: options.maxTokens || config.maxTokens,
        temperature: options.temperature || config.temperature,
        return_full_text: false,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Hugging Face API error: ${response.statusText}`);
  }

  const data = await response.json();
  // Hugging Face returns array format
  if (Array.isArray(data) && data[0]?.generated_text) {
    return data[0].generated_text;
  }
  if (typeof data === 'string') {
    return data;
  }
  return JSON.stringify(data);
};

/**
 * Call OpenAI API
 */
const callOpenAI = async (prompt, config, options) => {
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
    throw new Error(error.error?.message || `OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
};

/**
 * Call Anthropic Claude API
 */
const callAnthropic = async (prompt, config, options) => {
  const response = await fetch(`${config.baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: options.maxTokens || config.maxTokens,
      temperature: options.temperature || config.temperature,
      messages: [
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Anthropic API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.content[0]?.text || '';
};

/**
 * Call Gemini API (existing implementation)
 */
const callGemini = async (prompt, config, options) => {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(config.apiKey);
  const model = genAI.getGenerativeModel({ model: config.model });
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};

/**
 * Try fallback providers if primary fails
 */
const tryFallbackProviders = async (prompt, failedProvider, options) => {
  const fallbackOrder = PROVIDER_PRIORITY.filter(p => p !== failedProvider);
  
  for (const providerName of fallbackOrder) {
    try {
      const config = getProviderConfig(providerName);
      if (!config) continue;

      switch (providerName) {
        case 'groq':
          return await callGroq(prompt, config, options);
        case 'huggingface':
          return await callHuggingFace(prompt, config, options);
        case 'openai':
          return await callOpenAI(prompt, config, options);
        case 'anthropic':
          return await callAnthropic(prompt, config, options);
        case 'gemini':
          return await callGemini(prompt, config, options);
      }
    } catch (error) {
      console.warn(`Fallback provider ${providerName} failed:`, error);
      continue;
    }
  }

  throw new Error('All AI providers failed. Please check your API keys.');
};

/**
 * Get provider config by name
 */
const getProviderConfig = (providerName) => {
  switch (providerName) {
    case 'gemini':
      const geminiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
      if (geminiKey && geminiKey !== '') {
        return {
          provider: 'gemini',
          apiKey: geminiKey,
          model: 'gemini-2.0-flash', // Reliable with 1M TPM limit
          baseUrl: null,
          maxTokens: 2048,
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
    case 'openai':
      const openaiKey = import.meta.env.VITE_OPENAI_API_KEY?.trim();
      if (openaiKey && openaiKey !== '') {
        return {
          provider: 'openai',
          apiKey: openaiKey,
          model: 'gpt-3.5-turbo',
          baseUrl: 'https://api.openai.com/v1',
          maxTokens: 2048,
          temperature: 0.7
        };
      }
      break;
    case 'huggingface':
      const hfKey = import.meta.env.VITE_HUGGINGFACE_API_KEY?.trim();
      if (hfKey && hfKey !== '') {
        return {
          provider: 'huggingface',
          apiKey: hfKey,
          model: 'meta-llama/Llama-3.1-8B-Instruct',
          baseUrl: 'https://api-inference.huggingface.co',
          maxTokens: 1024,
          temperature: 0.7
        };
      }
      break;
    case 'anthropic':
      const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY?.trim();
      if (anthropicKey && anthropicKey !== '') {
        return {
          provider: 'anthropic',
          apiKey: anthropicKey,
          model: 'claude-3-haiku-20240307',
          baseUrl: 'https://api.anthropic.com/v1',
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
    gemini: {
      name: 'Google Gemini (Primary - Most Reliable)',
      status: 'active',
      limits: '1,000,000 tokens/min - Ideal for demos',
      website: 'https://aistudio.google.com',
      signup: 'https://aistudio.google.com'
    },
    groq: {
      name: 'Groq (Fast but Limited)',
      status: 'active',
      limits: '6,000 tokens/min - May hit limits with RAG',
      website: 'https://console.groq.com',
      signup: 'https://console.groq.com/signup'
    },
    openai: {
      name: 'OpenAI GPT',
      status: 'active',
      limits: 'Free tier: $5 credit',
      website: 'https://platform.openai.com',
      signup: 'https://platform.openai.com/signup'
    },
    huggingface: {
      name: 'Hugging Face',
      status: 'active',
      limits: 'Free tier available',
      website: 'https://huggingface.co',
      signup: 'https://huggingface.co/join'
    },
    anthropic: {
      name: 'Anthropic Claude',
      status: 'active',
      limits: 'Pay-as-you-go',
      website: 'https://console.anthropic.com',
      signup: 'https://console.anthropic.com/signup'
    }
  };

  return {
    provider: config.provider,
    ...providerInfo[config.provider] || { name: config.provider, status: 'active' }
  };
};

export default { callAI, getAIProvider, getProviderInfo };
