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
    return 'No messages to summarize.';
  }

  if (!GEMINI_API_KEY || GEMINI_API_KEY === '') {
    console.warn('Gemini API key not available for summarization');
    return 'Summarization requires API key configuration.';
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

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

    return summary || 'Unable to generate summary.';
  } catch (error) {
    console.error('Summarization error:', error);
    return 'Failed to generate summary. Please try again later.';
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

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

