/**
 * AI Conversation Summarization Utilities
 * Uses Google Gemini AI for summarizing conversations
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim() || '';

/**
 * Summarize a conversation using Gemini AI
 * @param {Array} messages - Array of message objects
 * @param {number} maxLength - Maximum length of summary in words (default: 100)
 * @returns {Promise<string>} - Conversation summary
 */
export const summarizeConversation = async (messages, maxLength = 100) => {
  if (!messages || messages.length === 0) {
    throw new Error('No messages to summarize.');
  }

  if (!GEMINI_API_KEY || GEMINI_API_KEY === '') {
    console.warn('Gemini API key not available for summarization');
    throw new Error('Summarization requires API key configuration. Please set VITE_GEMINI_API_KEY in your environment variables.');
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // Use gemini-2.5-flash (latest 2026 model) with fallback to gemini-1.5-flash
    let model;
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    } catch (modelError) {
      console.warn('gemini-2.5-flash not available, trying gemini-1.5-flash:', modelError);
      try {
        model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      } catch (fallbackError) {
        console.warn('gemini-1.5-flash not available, trying gemini-1.5-pro:', fallbackError);
        model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      }
    }

    // Format messages for summarization
    const conversationText = messages
      .filter(msg => !msg.isAI && (msg.text || msg.displayText))
      .slice(0, 50) // Limit to last 50 messages
      .map(msg => {
        const userName = msg.userName || 'User';
        const text = msg.text || msg.displayText || '';
        const timestamp = msg.timestamp?.toDate?.() ? msg.timestamp.toDate().toLocaleTimeString() : '';
        return `[${timestamp}] ${userName}: ${text}`;
      })
      .join('\n');

    if (!conversationText.trim()) {
      return 'No meaningful content found to summarize.';
    }

    const prompt = `Summarize the following conversation in approximately ${maxLength} words or less. 
Focus on key topics, decisions, action items, and important information.
Keep it concise and informative.

Conversation:
${conversationText}

Summary:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text().trim();

    if (!summary || summary.trim() === '') {
      throw new Error('Empty summary received from AI.');
    }

    return summary;
  } catch (error) {
    console.error('Summarization error:', error);
    
    // Check for specific error types
    if (error.message && error.message.includes('API key')) {
      throw new Error('API key is invalid or missing. Please check your VITE_GEMINI_API_KEY configuration.');
    } else if (error.message && error.message.includes('quota') || error.message && error.message.includes('429')) {
      throw new Error('API quota exceeded. Please try again later.');
    } else if (error.message && error.message.includes('blocked') || error.message && error.message.includes('403')) {
      throw new Error('API access is blocked. Please check your API key permissions in Google Cloud Console.');
    }
    
    throw new Error(`Failed to generate summary: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Extract key points from conversation
 * @param {Array} messages - Array of message objects
 * @returns {Promise<Array>} - Array of key points
 */
export const extractKeyPoints = async (messages) => {
  if (!messages || messages.length === 0) {
    return [];
  }

  if (!GEMINI_API_KEY || GEMINI_API_KEY === '') {
    console.warn('Gemini API key not available for key point extraction');
    return [];
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // Use gemini-2.5-flash (latest 2026 model) with fallback to gemini-1.5-flash
    let model;
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    } catch (modelError) {
      console.warn('gemini-2.5-flash not available, trying gemini-1.5-flash:', modelError);
      try {
        model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      } catch (fallbackError) {
        console.warn('gemini-1.5-flash not available, trying gemini-1.5-pro:', fallbackError);
        model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      }
    }

    const conversationText = messages
      .filter(msg => !msg.isAI && (msg.text || msg.displayText))
      .slice(0, 50)
      .map(msg => {
        const userName = msg.userName || 'User';
        const text = msg.text || msg.displayText || '';
        return `${userName}: ${text}`;
      })
      .join('\n');

    if (!conversationText.trim()) {
      return [];
    }

    const prompt = `Extract the key points, action items, and important decisions from the following conversation.
Return them as a numbered list. Maximum 10 points.

Conversation:
${conversationText}

Key Points:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const keyPointsText = response.text().trim();

    // Parse key points from the response
    const keyPoints = keyPointsText
      .split('\n')
      .filter(line => line.trim() && (line.match(/^\d+[\.\)]/) || line.startsWith('-')))
      .map(line => line.replace(/^\d+[\.\)]\s*|^-\s*/, '').trim())
      .filter(point => point.length > 0)
      .slice(0, 10);

    return keyPoints.length > 0 ? keyPoints : ['No key points found.'];
  } catch (error) {
    console.error('Key point extraction error:', error);
    return [];
  }
};

/**
 * Generate meeting notes from conversation
 * @param {Array} messages - Array of message objects
 * @param {string} title - Meeting/conversation title (optional)
 * @returns {Promise<Object>} - Meeting notes object
 */
export const generateMeetingNotes = async (messages, title = null) => {
  if (!messages || messages.length === 0) {
    return {
      title: title || 'Meeting Notes',
      summary: 'No messages to summarize.',
      keyPoints: [],
      actionItems: [],
      participants: []
    };
  }

  if (!GEMINI_API_KEY || GEMINI_API_KEY === '') {
    return {
      title: title || 'Meeting Notes',
      summary: 'Summarization requires API key configuration.',
      keyPoints: [],
      actionItems: [],
      participants: []
    };
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // Use gemini-2.5-flash (latest 2026 model) with fallback to gemini-1.5-flash
    let model;
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    } catch (modelError) {
      console.warn('gemini-2.5-flash not available, trying gemini-1.5-flash:', modelError);
      try {
        model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      } catch (fallbackError) {
        console.warn('gemini-1.5-flash not available, trying gemini-1.5-pro:', fallbackError);
        model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      }
    }

    const conversationText = messages
      .filter(msg => !msg.isAI && (msg.text || msg.displayText))
      .slice(0, 50)
      .map(msg => {
        const userName = msg.userName || 'User';
        const text = msg.text || msg.displayText || '';
        return `${userName}: ${text}`;
      })
      .join('\n');

    const participants = [...new Set(messages.map(msg => msg.userName || 'User').filter(Boolean))];

    const prompt = `Analyze the following conversation and extract:
1. A brief summary (2-3 sentences)
2. Key discussion points (bulleted list, max 5)
3. Action items or tasks mentioned (bulleted list)

Conversation:
${conversationText}

Provide the response in this JSON format:
{
  "summary": "brief summary here",
  "keyPoints": ["point 1", "point 2"],
  "actionItems": ["item 1", "item 2"]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text().trim();

    // Try to parse JSON from response
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          title: title || 'Meeting Notes',
          summary: parsed.summary || 'No summary available.',
          keyPoints: parsed.keyPoints || [],
          actionItems: parsed.actionItems || [],
          participants: participants,
          date: new Date().toISOString()
        };
      }
    } catch (parseError) {
      console.warn('Failed to parse JSON from AI response:', parseError);
    }

    // Fallback: return structured response
    return {
      title: title || 'Meeting Notes',
      summary: responseText.substring(0, 200),
      keyPoints: [],
      actionItems: [],
      participants: participants,
      date: new Date().toISOString()
    };
  } catch (error) {
    console.error('Meeting notes generation error:', error);
    return {
      title: title || 'Meeting Notes',
      summary: 'Failed to generate meeting notes. Please try again later.',
      keyPoints: [],
      actionItems: [],
      participants: [],
      date: new Date().toISOString()
    };
  }
};

export default {
  summarizeConversation,
  extractKeyPoints,
  generateMeetingNotes
};

