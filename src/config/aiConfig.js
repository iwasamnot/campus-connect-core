// AI Configuration
// To use intelligent AI, add your OpenAI API key
// Get your key from: https://platform.openai.com/api-keys

export const AI_CONFIG = {
  // OpenAI API Key (for intelligent responses)
  // Get your key from: https://platform.openai.com/api-keys
  openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  
  // Fallback to local knowledge base if API fails
  useFallback: true,
  
  // Model configuration
  model: 'gpt-4o-mini', // or 'gpt-3.5-turbo' for faster/cheaper responses
  temperature: 0.7,
  maxTokens: 1000
};

