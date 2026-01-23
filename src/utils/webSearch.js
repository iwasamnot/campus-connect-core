/**
 * Web Search Module
 * Provides web search functionality using Tavily API or DuckDuckGo
 * Placeholder implementation - replace with actual API integration
 */

/**
 * Search the web for information
 * @param {string} query - Search query
 * @param {number} maxResults - Maximum number of results (default: 5)
 * @returns {Promise<Array>} - Array of search results with title, url, content
 */
export const searchWeb = async (query, maxResults = 5) => {
  try {
    // TODO: Replace with actual Tavily API integration
    // For now, return mock data structure
    console.log('🔍 [Web Search] Searching web for:', query);
    
    // Example Tavily API call (uncomment when API key is available):
    /*
    const apiKey = import.meta.env.VITE_TAVILY_API_KEY;
    if (!apiKey) {
      throw new Error('Tavily API key not configured');
    }
    
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: 'basic',
        max_results: maxResults,
        include_domains: ['sistc.edu.au', 'sydney.edu.au'], // SISTC-related domains
      }),
    });
    
    const data = await response.json();
    return data.results || [];
    */
    
    // Mock response for development
    return [
      {
        title: `Search results for: ${query}`,
        url: 'https://example.com',
        content: `Information about ${query} from web search. This is a placeholder - integrate Tavily API for real results.`,
        score: 0.9
      }
    ];
  } catch (error) {
    console.error('🔍 [Web Search] Error searching web:', error);
    return [];
  }
};

/**
 * Format web search results for AI consumption
 * @param {Array} results - Raw search results
 * @returns {string} - Formatted text for AI prompt
 */
export const formatWebResults = (results) => {
  if (!results || results.length === 0) {
    return 'No web results found.';
  }
  
  return results.map((result, index) => {
    return `[Result ${index + 1}]
Title: ${result.title || 'Untitled'}
URL: ${result.url || 'N/A'}
Content: ${result.content || result.snippet || 'No content available'}
---`;
  }).join('\n\n');
};
