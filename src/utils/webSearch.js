/**
 * Web Search Module
 * Provides web search functionality using Tavily API
 * Uses VITE_TAVILY_KEY from environment variables
 */

/**
 * Search the web for information using Tavily API
 * @param {string} query - Search query
 * @param {number} maxResults - Maximum number of results (default: 3)
 * @returns {Promise<Array>} - Array of search results with title, url, content
 */
export const searchWeb = async (query, maxResults = 3) => {
  try {
    console.log('🔍 [Web Search] Searching web for:', query);
    
    const apiKey = import.meta.env.VITE_TAVILY_KEY?.trim();
    if (!apiKey || apiKey === '') {
      console.warn('🔍 [Web Search] Tavily API key not configured (VITE_TAVILY_KEY)');
      return [];
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
        include_answer: true,
        max_results: maxResults
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Tavily returns results in a specific format
    const results = [];
    
    // Include the answer if available
    if (data.answer) {
      results.push({
        title: 'Answer',
        url: '',
        content: data.answer,
        score: 1.0,
        isAnswer: true
      });
    }
    
    // Include individual results
    if (data.results && Array.isArray(data.results)) {
      data.results.forEach((result) => {
        results.push({
          title: result.title || 'Untitled',
          url: result.url || '',
          content: result.content || result.snippet || '',
          score: result.score || 0.8
        });
      });
    }
    
    console.log(`🔍 [Web Search] Found ${results.length} results from Tavily`);
    return results;
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
