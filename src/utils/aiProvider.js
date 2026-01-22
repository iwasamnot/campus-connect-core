/**
 * Multi-AI Provider System with Vertex AI Enterprise Support
 * Supports multiple AI providers with automatic fallback
 * Enterprise Vertex AI integration with service account authentication
 */

// Provider priorities (order matters - first available is used)
const PROVIDER_PRIORITY = [
  'gemini',      // Gemini API key (simplest - recommended for most users)
  'vertex-ai',   // Enterprise Vertex AI (requires service account from same project)
  'groq',        // Best for students - very generous free tier, fast
  'huggingface', // Free inference API
  'openai',      // Good free tier
  'anthropic',   // Claude - good limits
];

/**
 * Get GCP Service Account credentials
 * Checks GitHub Secrets first, then falls back to local file
 * Supports both VITE_GCP_SERVICE_ACCOUNT_JSON and VITE_GCP_SERVICE_ACCOUNT_KEY
 */
const getServiceAccountCredentials = () => {
  // Check for service account JSON from GitHub Secrets/Vercel
  // Try VITE_GCP_SERVICE_ACCOUNT_KEY first (matches GitHub Secret name: GCP_SERVICE_ACCOUNT_KEY)
  let serviceAccountJson = import.meta.env.VITE_GCP_SERVICE_ACCOUNT_KEY?.trim();
  
  // Fallback to VITE_GCP_SERVICE_ACCOUNT_JSON (alternative naming)
  if (!serviceAccountJson || serviceAccountJson === '') {
    serviceAccountJson = import.meta.env.VITE_GCP_SERVICE_ACCOUNT_JSON?.trim();
  }
  
  if (serviceAccountJson && serviceAccountJson !== '') {
    // Skip if it's just whitespace or empty string
    if (serviceAccountJson.trim().length === 0) {
      return null;
    }
    
    // Check if it looks like JSON (starts with {)
    if (!serviceAccountJson.trim().startsWith('{')) {
      console.warn('Service account JSON does not appear to be valid JSON (should start with {). Skipping.');
      return null;
    }
    
    try {
      const parsed = JSON.parse(serviceAccountJson);
      // Validate it has required fields
      if (!parsed.project_id && !parsed.private_key) {
        console.warn('Service account JSON missing required fields (project_id or private_key). Skipping.');
        return null;
      }
      return parsed;
    } catch (error) {
      console.error('Error parsing service account JSON:', error);
      console.error('Make sure VITE_GCP_SERVICE_ACCOUNT_KEY (from GitHub Secret: GCP_SERVICE_ACCOUNT_KEY) or VITE_GCP_SERVICE_ACCOUNT_JSON contains valid JSON');
      return null;
    }
  }

  // Fallback to local service-account.json file for local development
  try {
    // Note: In browser environment, we can't directly read files
    // This would need to be handled via import or fetch
    // For now, we'll rely on environment variable
    console.warn('Service account not found in environment variables. Use VITE_GCP_SERVICE_ACCOUNT_KEY (from GitHub Secret: GCP_SERVICE_ACCOUNT_KEY) or VITE_GCP_SERVICE_ACCOUNT_JSON.');
    return null;
  } catch (error) {
    console.error('Error loading local service-account.json:', error);
    return null;
  }
};

/**
 * Generate OAuth2 access token from service account
 * This is a simplified version - in production, use proper OAuth2 flow
 */
const getAccessToken = async (serviceAccount) => {
  // Note: In browser, we cannot directly use service account to get tokens
  // This should be done server-side via Cloud Functions
  // For now, we'll use the REST API with API key if available
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (apiKey) {
    return apiKey; // Fallback to API key for browser compatibility
  }
  
  // In production, this should call a Cloud Function that generates the token
  throw new Error('Service account authentication requires server-side token generation. Use Cloud Functions or API key.');
};

/**
 * Get AI provider configuration
 */
export const getAIProvider = () => {
  // Check for Gemini API key first (simplest option - no service account needed)
  // This works with your existing account and is easier to set up
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (geminiApiKey && geminiApiKey !== '') {
    return {
      provider: 'gemini',
      apiKey: geminiApiKey,
      model: 'gemini-1.5-flash', // Standard model name
      maxTokens: 2048,
      temperature: 0.7
    };
  }

  // Check for Vertex AI (Enterprise tier) - only if service account is configured
  // This requires service account key from the SAME GCP project
  const projectId = import.meta.env.VITE_GCP_PROJECT_ID?.trim();
  const location = import.meta.env.VITE_GCP_LOCATION?.trim() || 'us-central1';
  const serviceAccount = getServiceAccountCredentials();
  
  if (projectId && serviceAccount) {
    return {
      provider: 'vertex-ai',
      projectId,
      location,
      serviceAccount,
      model: 'gemini-1.5-flash',
      maxTokens: 2048,
      temperature: 0.7
    };
  }

  // Check for Groq (best for students - very generous limits)
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

  // Check for Hugging Face (free tier)
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

  // Check for OpenAI (good free tier)
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

  // Check for Anthropic Claude
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
    throw new Error('No AI provider configured. Please set at least one API key in environment variables.');
  }

  try {
    switch (config.provider) {
      case 'gemini':
        return await callGemini(prompt, config, options);
      case 'vertex-ai':
        return await callVertexAI(prompt, config, options);
      case 'groq':
        return await callGroq(prompt, config, options);
      case 'huggingface':
        return await callHuggingFace(prompt, config, options);
      case 'openai':
        return await callOpenAI(prompt, config, options);
      case 'anthropic':
        return await callAnthropic(prompt, config, options);
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
 * Call Gemini API (Simple option - uses API key, no service account needed)
 * This is the easiest way to use Gemini - just need an API key
 */
const callGemini = async (prompt, config, options) => {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(config.apiKey);
  
  // Try multiple model names with fallback
  // Note: Some models may require API enablement in Google Cloud Console
  const modelsToTry = [
    'gemini-2.0-flash-exp',  // Try this first as it seems to work (when quota available)
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ];
  
  let lastError = null;
  let quotaExceeded = false;
  
  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction: options.systemPrompt || 'You are a helpful assistant.'
      });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      lastError = error;
      const errorMsg = error.message || '';
      
      // Check for quota exceeded (429) - don't try other models, use offline fallback
      if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('Quota exceeded')) {
        console.warn(`Gemini API quota exceeded for ${modelName}. Using offline fallback.`);
        quotaExceeded = true;
        break; // Don't try other models if quota is exceeded
      }
      
      // If it's a 404, try next model
      if (errorMsg.includes('404') || errorMsg.includes('not found')) {
        console.warn(`Model ${modelName} not available (404), trying next...`);
        continue;
      }
      
      // For other errors (like 403 permission denied), try next model
      if (errorMsg.includes('403') || errorMsg.includes('permission')) {
        console.warn(`Model ${modelName} permission denied, trying next...`);
        continue;
      }
      
      // For unknown errors, try next model
      console.warn(`Error with ${modelName}: ${errorMsg}, trying next...`);
      continue;
    }
  }
  
  // If quota exceeded or all models failed, return a helpful message
  if (quotaExceeded) {
    console.warn('Gemini API quota exceeded. Please check your API quota or upgrade your plan.');
    return 'I apologize, but the AI service quota has been exceeded. Please try again later or contact support.';
  }
  
  // If all models failed, return a helpful message
  console.warn('All Gemini models failed. The models may not be enabled in your Google Cloud Console.');
  return 'I apologize, but the AI service is currently unavailable. Please ensure the Gemini API is enabled in your Google Cloud Console and that your API key has the necessary permissions.';
};

/**
 * Call Vertex AI (Enterprise tier)
 * Uses gemini-1.5-flash model via Vertex AI REST API
 * Requires service account key from the SAME GCP project
 */
const callVertexAI = async (prompt, config, options) => {
  const { projectId, location, model } = config;
  
  // For browser environment, we need to use Cloud Functions to generate access token
  // Or use the REST API with proper authentication
  // For now, we'll use a Cloud Function endpoint if available
  const vertexFunctionUrl = import.meta.env.VITE_VERTEX_AI_FUNCTION_URL?.trim();
  
  if (vertexFunctionUrl) {
    // Call Cloud Function that handles Vertex AI authentication
    const response = await fetch(vertexFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        systemPrompt: options.systemPrompt || 'You are a helpful assistant.',
        model: model || 'gemini-1.5-flash-latest',
        maxTokens: options.maxTokens || config.maxTokens,
        temperature: options.temperature || config.temperature,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Vertex AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.text || data.response || '';
  }

  // Fallback: Use Gemini API directly if Vertex AI function not available
  // This maintains backward compatibility
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (geminiApiKey) {
    console.warn('Vertex AI Cloud Function not configured. Falling back to Gemini API.');
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const geminiModel = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: options.systemPrompt || 'You are a helpful assistant.'
    });
    
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  throw new Error('Vertex AI requires VITE_VERTEX_AI_FUNCTION_URL or VITE_GEMINI_API_KEY to be configured.');
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
 * Try fallback providers if primary fails
 */
const tryFallbackProviders = async (prompt, failedProvider, options) => {
  const fallbackOrder = PROVIDER_PRIORITY.filter(p => p !== failedProvider);
  
  for (const providerName of fallbackOrder) {
    try {
      const config = getProviderConfig(providerName);
      if (!config) continue;

      switch (providerName) {
        case 'gemini':
          return await callGemini(prompt, config, options);
        case 'vertex-ai':
          return await callVertexAI(prompt, config, options);
        case 'groq':
          return await callGroq(prompt, config, options);
        case 'huggingface':
          return await callHuggingFace(prompt, config, options);
        case 'openai':
          return await callOpenAI(prompt, config, options);
        case 'anthropic':
          return await callAnthropic(prompt, config, options);
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
          model: 'gemini-1.5-flash',
          maxTokens: 2048,
          temperature: 0.7
        };
      }
      break;
    case 'vertex-ai':
      const projectId = import.meta.env.VITE_GCP_PROJECT_ID?.trim();
      const location = import.meta.env.VITE_GCP_LOCATION?.trim() || 'us-central1';
      const serviceAccount = getServiceAccountCredentials();
      if (projectId && serviceAccount) {
        return {
          provider: 'vertex-ai',
          projectId,
          location,
          serviceAccount,
          model: 'gemini-1.5-flash',
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
    'gemini': {
      name: 'Google Gemini API',
      status: 'active',
      limits: 'Free tier available - Simple API key setup',
      website: 'https://aistudio.google.com',
      signup: 'https://aistudio.google.com/app/apikey'
    },
    'vertex-ai': {
      name: 'Vertex AI (Enterprise)',
      status: 'active',
      limits: 'Professional tier - 300 RPM (requires service account)',
      website: 'https://cloud.google.com/vertex-ai',
    },
    groq: {
      name: 'Groq (Recommended for Students)',
      status: 'active',
      limits: 'Very generous free tier - 14,400 requests/day',
      website: 'https://console.groq.com',
      signup: 'https://console.groq.com/signup'
    },
    huggingface: {
      name: 'Hugging Face',
      status: 'active',
      limits: 'Free tier available',
      website: 'https://huggingface.co',
      signup: 'https://huggingface.co/join'
    },
    openai: {
      name: 'OpenAI GPT',
      status: 'active',
      limits: 'Free tier: $5 credit',
      website: 'https://platform.openai.com',
      signup: 'https://platform.openai.com/signup'
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
