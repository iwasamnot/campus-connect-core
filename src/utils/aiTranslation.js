/**
 * AI Message Translation Utilities
 * Uses Google Gemini AI for message translation
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim() || '';

/**
 * Translate text to target language using Gemini AI
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code (e.g., 'es', 'fr', 'de')
 * @param {string} sourceLang - Source language code (optional, auto-detects if not provided)
 * @returns {Promise<string>} - Translated text
 */
export const translateText = async (text, targetLang = 'en', sourceLang = null) => {
  if (!text || !text.trim()) {
    return text;
  }

  if (!GEMINI_API_KEY || GEMINI_API_KEY === '') {
    console.warn('Gemini API key not available for translation');
    return text;
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const languageNames = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'ur': 'Urdu',
      'ne': 'Nepali',
      'bn': 'Bengali',
      'pa': 'Punjabi',
      'fa': 'Persian'
    };

    const sourceLangName = sourceLang ? languageNames[sourceLang] || sourceLang : 'auto-detect';
    const targetLangName = languageNames[targetLang] || targetLang;

    const prompt = `Translate the following text from ${sourceLangName} to ${targetLangName}. 
Provide ONLY the translated text without any explanations, quotes, or additional text.

Text to translate: "${text}"

Translation:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translatedText = response.text().trim();

    // Clean up any quotes or extra formatting
    return translatedText.replace(/^["']|["']$/g, '').trim();
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text on error
  }
};

/**
 * Detect language of text using Gemini AI
 * @param {string} text - Text to detect language for
 * @returns {Promise<string>} - Language code (e.g., 'en', 'es', 'fr')
 */
export const detectLanguage = async (text) => {
  if (!text || !text.trim()) {
    return 'en';
  }

  if (!GEMINI_API_KEY || GEMINI_API_KEY === '') {
    return 'en'; // Default to English
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Detect the language of the following text and respond with ONLY the ISO 639-1 language code (e.g., en, es, fr, de, zh, ja, ar, hi, ur, ne, bn, pa, fa).

Text: "${text}"

Language code:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const languageCode = response.text().trim().toLowerCase().substring(0, 2);

    // Validate language code
    const validCodes = ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ar', 'hi', 'ur', 'ne', 'bn', 'pa', 'fa'];
    return validCodes.includes(languageCode) ? languageCode : 'en';
  } catch (error) {
    console.error('Language detection error:', error);
    return 'en'; // Default to English on error
  }
};

/**
 * Translate multiple messages
 * @param {Array} messages - Array of message objects with text property
 * @param {string} targetLang - Target language code
 * @returns {Promise<Array>} - Array of translated messages
 */
export const translateMessages = async (messages, targetLang = 'en') => {
  const translatedMessages = await Promise.all(
    messages.map(async (message) => {
      const translatedText = await translateText(message.text || message.displayText || '', targetLang);
      return {
        ...message,
        translatedText,
        originalText: message.text || message.displayText || ''
      };
    })
  );
  return translatedMessages;
};

export default {
  translateText,
  detectLanguage,
  translateMessages
};

