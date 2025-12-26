// AI Configuration
// To use intelligent AI with web access, add your API keys here
// You can get API keys from:
// - OpenAI: https://platform.openai.com/api-keys
// - Tavily (Web Search): https://tavily.com/

export const AI_CONFIG = {
  // OpenAI API Key (for intelligent responses)
  // Get your key from: https://platform.openai.com/api-keys
  openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  
  // Tavily API Key (for web search)
  // Get your key from: https://tavily.com/
  tavilyApiKey: import.meta.env.VITE_TAVILY_API_KEY || '',
  
  // Use web search for better answers
  enableWebSearch: true,
  
  // Fallback to local knowledge base if API fails
  useFallback: true,
  
  // Model configuration
  model: 'gpt-4o-mini', // or 'gpt-3.5-turbo' for faster/cheaper responses
  temperature: 0.7,
  maxTokens: 1000
};

