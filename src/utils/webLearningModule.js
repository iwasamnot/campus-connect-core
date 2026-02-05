/**
 * Web Learning Module
 * Scrapes websites, extracts knowledge, and adds to RAG system
 */

import { getAdvancedRAG } from './advancedRAGSystem';

class WebLearningModule {
  constructor() {
    this.learningQueue = [];
    this.isProcessing = false;
    this.sources = new Map(); // Track learned sources
  }

  async learnFromUrl(url, options = {}) {
    const {
      topic = 'general',
      maxDepth = 1,
      followLinks = false,
      extractImages = false
    } = options;

    try {
      console.log(`Learning from: ${url}`);
      
      // Extract content from URL
      const content = await this.extractContent(url);
      
      if (!content) {
        throw new Error('No content extracted from URL');
      }

      // Process and structure the content
      const knowledge = await this.processContent(content, topic, url);
      
      // Add to RAG system
      const rag = getAdvancedRAG();
      await rag.addToKnowledgeBase(knowledge.points, 'web');
      
      // Track source
      this.sources.set(url, {
        topic,
        timestamp: Date.now(),
        pointsCount: knowledge.points.length,
        title: knowledge.title
      });

      // Follow links if enabled
      if (followLinks && knowledge.links.length > 0 && maxDepth > 0) {
        const linksToFollow = knowledge.links.slice(0, 5); // Limit to prevent infinite loops
        for (const link of linksToFollow) {
          await this.learnFromUrl(link, {
            topic,
            maxDepth: maxDepth - 1,
            followLinks: false // Don't follow links from followed links
          });
        }
      }

      return {
        url,
        topic,
        pointsAdded: knowledge.points.length,
        title: knowledge.title,
        summary: knowledge.summary
      };

    } catch (error) {
      console.error(`Error learning from ${url}:`, error);
      return null;
    }
  }

  async extractContent(url) {
    try {
      // Since we can't directly scrape in the browser, use a CORS proxy or API
      // For now, use a textise dot iitty approach or fetch from a CORS-enabled endpoint
      
      // Try to fetch directly first (might work for CORS-enabled sites)
      try {
        const response = await fetch(url);
        if (response.ok) {
          const html = await response.text();
          return this.parseHTML(html);
        }
      } catch (directError) {
        console.log('Direct fetch failed, trying alternative methods');
      }

      // Use textise dot iitty or textise dot iitty alternative
      const textiseUrl = `https://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`;
      const response = await fetch(textiseUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      return this.parseTextContent(text);

    } catch (error) {
      console.error('Content extraction error:', error);
      
      // Fallback: Use AI to generate content about the URL topic
      return await this.generateFallbackContent(url);
    }
  }

  parseHTML(html) {
    // Simple HTML parsing (in production, use a proper parser)
    const content = {
      title: '',
      text: '',
      links: []
    };

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      content.title = titleMatch[1].trim();
    }

    // Extract text content (remove scripts, styles, etc.)
    let text = html
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    content.text = text;

    // Extract links
    const linkMatches = html.match(/<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi);
    if (linkMatches) {
      content.links = linkMatches.map(match => {
        const hrefMatch = match.match(/href=["']([^"']+)["']/i);
        const textMatch = match.match(/>([^<]+)</i);
        return hrefMatch ? hrefMatch[1] : null;
      }).filter(link => link && !link.startsWith('#') && !link.startsWith('javascript:'));
    }

    return content;
  }

  parseTextContent(text) {
    // Parse text content from jina.ai or similar service
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    return {
      title: lines[0] || '',
      text: lines.join('\n'),
      links: []
    };
  }

  async generateFallbackContent(url) {
    // When we can't scrape, use AI to generate content about the URL
    try {
      const { callAI } = await import('./aiProvider');
      
      const prompt = `Generate educational content about this website: ${url}
      
      Provide:
      1. A brief description of what this website is about
      2. Key information or services it provides
      3. Important facts or features
      
      Format as a structured educational text.`;

      const response = await callAI(prompt, {
        provider: 'groq',
        model: 'llama3-70b-8192'
      });

      return {
        title: `Information about ${new URL(url).hostname}`,
        text: response,
        links: []
      };

    } catch (error) {
      console.error('Fallback content generation failed:', error);
      return null;
    }
  }

  async learnFromText(text, topic = 'general', source = 'manual') {
    try {
      console.log(`Learning from text: ${topic}`);
      
      // Process and structure the text content
      const knowledge = await this.processTextContent(text, topic, source);
      
      // Add to RAG system
      const rag = getAdvancedRAG();
      await rag.addToKnowledgeBase(knowledge.points, source);
      
      // Track source
      this.sources.set(`manual_${Date.now()}`, {
        topic,
        timestamp: Date.now(),
        pointsCount: knowledge.points.length,
        title: `Manual: ${topic}`,
        source: 'manual'
      });

      return {
        topic,
        pointsAdded: knowledge.points.length,
        title: `Manual: ${topic}`,
        summary: knowledge.summary,
        source: 'manual'
      };

    } catch (error) {
      console.error('Error learning from text:', error);
      return null;
    }
  }

  async processTextContent(content, topic, source) {
    // Process text content into knowledge points
    const { callAI } = await import('./aiProvider');
    
    const prompt = `Extract key knowledge points from this text about ${topic}:

Content: ${content}

Extract and format as:
1. Clear, factual statements
2. Important definitions
3. Key concepts
4. Notable features or facts
5. Action items or steps (if applicable)

Each point should be a complete sentence that can stand alone.
Format as a numbered list.`;

    try {
      const response = await callAI(prompt, {
        provider: 'groq',
        model: 'llama3-70b-8192'
      });

      const points = response
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 20); // Filter out very short lines

      // Generate summary
      const summaryPrompt = `Summarize this content in 2-3 sentences:
${content.substring(0, 1000)}...`;

      const summary = await callAI(summaryPrompt, {
        provider: 'groq',
        model: 'llama3-70b-8192'
      });

      return {
        title: `${topic} - Manual Entry`,
        points,
        summary,
        links: []
      };

    } catch (error) {
      console.error('Content processing error:', error);
      
      // Fallback: simple text splitting
      const sentences = content.split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 20);

      return {
        title: `${topic} - Manual Entry`,
        points: sentences.slice(0, 10),
        summary: content.substring(0, 200) + '...',
        links: []
      };
    }
  }

  async processContent(content, topic, url) {
    // Process extracted content into knowledge points
    const { callAI } = await import('./aiProvider');
    
    const prompt = `Extract key knowledge points from this content about ${topic}:

Title: ${content.title}
Content: ${content.text}

Extract and format as:
1. Clear, factual statements
2. Important definitions
3. Key concepts
4. Notable features or facts

Each point should be a complete sentence that can stand alone.
Format as a numbered list.`;

    try {
      const response = await callAI(prompt, {
        provider: 'groq',
        model: 'llama3-70b-8192'
      });

      const points = response
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 20); // Filter out very short lines

      // Generate summary
      const summaryPrompt = `Summarize this content in 2-3 sentences:
${content.text.substring(0, 1000)}...`;

      const summary = await callAI(summaryPrompt, {
        provider: 'groq',
        model: 'llama3-70b-8192'
      });

      return {
        title: content.title,
        points,
        summary,
        links: content.links
      };

    } catch (error) {
      console.error('Content processing error:', error);
      
      // Fallback: simple text splitting
      const sentences = content.text.split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 20);

      return {
        title: content.title,
        points: sentences.slice(0, 10),
        summary: content.text.substring(0, 200) + '...',
        links: content.links
      };
    }
  }

  async learnFromMultipleUrls(urls, topic) {
    const results = [];
    
    for (const url of urls) {
      const result = await this.learnFromUrl(url, { topic });
      if (result) {
        results.push(result);
      }
      
      // Small delay between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }

  async learnFromSearch(query, topic = 'general', maxResults = 5) {
    // In a real implementation, you'd use a search API
    // For now, return some common educational sites
    const educationalSites = [
      'https://en.wikipedia.org/wiki/' + query.replace(/\s+/g, '_'),
      'https://www.britannica.com/topic/' + query.replace(/\s+/g, '-'),
      'https://www.khanacademy.org/search?page_search_query=' + encodeURIComponent(query)
    ];

    return await this.learnFromMultipleUrls(educationalSites.slice(0, maxResults), topic);
  }

  // Get learning statistics
  getStats() {
    return {
      sourcesLearned: this.sources.size,
      queueLength: this.learningQueue.length,
      isProcessing: this.isProcessing,
      recentSources: Array.from(this.sources.entries())
        .sort((a, b) => b[1].timestamp - a[1].timestamp)
        .slice(0, 5)
        .map(([url, data]) => ({
          url,
          title: data.title,
          topic: data.topic,
          pointsCount: data.pointsCount,
          timestamp: data.timestamp
        }))
    };
  }

  // Get all learned sources
  getAllSources() {
    return Array.from(this.sources.entries()).map(([url, data]) => ({
      url,
      ...data
    }));
  }

  // Clear learning history
  clearHistory() {
    this.sources.clear();
    this.learningQueue = [];
  }
}

// Singleton instance
let webLearningInstance = null;

export const getWebLearning = () => {
  if (!webLearningInstance) {
    webLearningInstance = new WebLearningModule();
  }
  return webLearningInstance;
};

// Convenience functions
export const learnFromUrl = (url, options) => {
  const learner = getWebLearning();
  return learner.learnFromUrl(url, options);
};

export const learnFromText = (text, topic, source) => {
  const learner = getWebLearning();
  return learner.learnFromText(text, topic, source);
};

export const learnFromSearch = (query, topic, maxResults) => {
  const learner = getWebLearning();
  return learner.learnFromSearch(query, topic, maxResults);
};
