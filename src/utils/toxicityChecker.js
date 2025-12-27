import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Comprehensive hate words list (fallback if Gemini is unavailable)
const TOXIC_WORDS = [
  // Profanity
  'fuck', 'fucking', 'fucked', 'shit', 'damn', 'hell', 'ass', 'asshole', 'bastard', 'bitch',
  // Hate speech
  'hate', 'hated', 'hating', 'stupid', 'idiot', 'moron', 'retard', 'dumb', 'dumbass',
  // Discriminatory terms
  'nigger', 'nigga', 'chink', 'kike', 'spic', 'wetback', 'gook', 'raghead', 'towelhead',
  // Violence
  'kill', 'killing', 'murder', 'die', 'death', 'violence', 'attack', 'hurt', 'harm',
  // Harassment
  'harass', 'bully', 'threaten', 'abuse', 'insult', 'offend',
  // Negative intent
  'bad', 'worst', 'terrible', 'awful', 'horrible', 'disgusting', 'vile', 'nasty',
  // Slurs and derogatory terms
  'slut', 'whore', 'hoe', 'cunt', 'pussy', 'dick', 'cock', 'penis', 'vagina',
  // Additional offensive terms
  'faggot', 'fag', 'dyke', 'tranny', 'shemale', 'hermaphrodite',
  // Cyberbullying terms
  'loser', 'pathetic', 'worthless', 'useless', 'failure', 'reject',
  // Threatening language
  'threat', 'threaten', 'harm', 'hurt', 'destroy', 'ruin', 'wreck',
  // Body shaming
  'fat', 'ugly', 'disgusting', 'gross', 'hideous',
  // Mental health slurs
  'crazy', 'insane', 'psycho', 'lunatic', 'mental', 'retarded',
  // Additional profanity variations
  'fck', 'sh1t', 'd4mn', 'h3ll', '4ss', 'b1tch', 'n1gg3r',
  // Common misspellings/alternatives
  'fuk', 'shyt', 'dam', 'hel', 'as', 'bich', 'nigr', 'niga'
];

/**
 * Check if text contains toxic words (fallback method)
 */
export const checkToxicityFallback = (text) => {
  if (!text || typeof text !== 'string') return false;
  
  const lowerText = text.toLowerCase();
  const normalizedText = lowerText.replace(/[^a-z0-9\s]/g, ' '); // Remove special chars for better matching
  
  // Check for exact word matches and partial matches
  for (const word of TOXIC_WORDS) {
    // Check for word boundaries or as part of a word
    const wordRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b|${word}`, 'i');
    if (wordRegex.test(normalizedText) || normalizedText.includes(word)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Check toxicity using Gemini AI
 */
export const checkToxicityWithGemini = async (text) => {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return { isToxic: false, confidence: 0, reason: null };
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === '') {
    console.warn('Gemini API key not configured, using fallback toxicity check');
    return { 
      isToxic: checkToxicityFallback(text), 
      confidence: 0.5, 
      reason: 'Fallback word filter',
      method: 'fallback'
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });

    const prompt = `Analyze the following message for toxicity, hate speech, harassment, bullying, threats, or inappropriate content. 

Message: "${text}"

Respond ONLY with a JSON object in this exact format:
{
  "isToxic": true/false,
  "confidence": 0.0-1.0,
  "reason": "brief explanation",
  "categories": ["hate_speech", "harassment", "threats", "profanity", "bullying", etc.]
}

Be strict but fair. Consider context. False positives are better than false negatives for safety.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text().trim();

    // Try to parse JSON response
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          isToxic: parsed.isToxic === true,
          confidence: parsed.confidence || 0.5,
          reason: parsed.reason || null,
          categories: parsed.categories || [],
          method: 'gemini'
        };
      }
    } catch (parseError) {
      console.warn('Failed to parse Gemini toxicity response, using fallback:', parseError);
    }

    // Fallback: check if response indicates toxicity
    const lowerResponse = responseText.toLowerCase();
    if (lowerResponse.includes('toxic') || lowerResponse.includes('true') || lowerResponse.includes('yes')) {
      return {
        isToxic: true,
        confidence: 0.7,
        reason: 'AI detected toxicity',
        method: 'gemini-fallback'
      };
    }

    // If response doesn't indicate toxicity, use fallback word filter
    return {
      isToxic: checkToxicityFallback(text),
      confidence: 0.5,
      reason: 'Fallback word filter',
      method: 'fallback'
    };
  } catch (error) {
    console.error('Error checking toxicity with Gemini:', error);
    // Fallback to word filter
    return {
      isToxic: checkToxicityFallback(text),
      confidence: 0.5,
      reason: 'Error checking with AI, using fallback',
      method: 'fallback'
    };
  }
};

/**
 * Main toxicity check function - tries Gemini first, falls back to word filter
 */
export const checkToxicity = async (text, useGemini = true) => {
  if (!text || typeof text !== 'string') {
    return { isToxic: false, confidence: 0, reason: null, method: 'none' };
  }

  // If Gemini is enabled and API key is available, use it
  if (useGemini) {
    try {
      const result = await checkToxicityWithGemini(text);
      return result;
    } catch (error) {
      console.error('Error in Gemini toxicity check:', error);
    }
  }

  // Fallback to word filter
  return {
    isToxic: checkToxicityFallback(text),
    confidence: 0.5,
    reason: 'Word filter',
    method: 'fallback'
  };
};

