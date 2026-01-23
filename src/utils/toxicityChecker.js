import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Rate limiting and caching for Gemini API
const toxicityCache = new Map(); // Cache results to avoid repeated API calls
const lastGeminiCall = { time: 0, count: 0 }; // Track API calls for rate limiting
const GEMINI_RATE_LIMIT = 15; // Max 15 calls per minute (free tier limit)
const GEMINI_COOLDOWN = 60000; // 1 minute cooldown after quota error
let geminiQuotaExceeded = false;
let quotaExceededUntil = 0;

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
  'fuk', 'shyt', 'dam', 'hel', 'as', 'bich', 'nigr', 'niga',
  
  // Minor insults and derogatory terms
  'jerk', 'fool', 'clown', 'buffoon', 'imbecile', 'dimwit', 'nincompoop', 'dunce',
  'twit', 'dolt', 'blockhead', 'numbskull', 'bonehead', 'airhead', 'dummy',
  'simpleton', 'halfwit', 'nitwit', 'dork', 'nerd', 'geek', 'weirdo', 'freak',
  'creep', 'weird', 'annoying', 'irritating', 'obnoxious', 'rude', 'mean',
  'selfish', 'arrogant', 'pompous', 'conceited', 'narcissist', 'egotistical',
  'lazy', 'slacker', 'slob', 'pig', 'animal', 'beast', 'monster', 'devil',
  'scum', 'trash', 'garbage', 'filth', 'dirt', 'worm', 'snake', 'rat',
  'coward', 'weakling', 'wimp', 'pushover', 'doormat', 'spineless',
  'liar', 'cheat', 'fraud', 'fake', 'phony', 'hypocrite', 'traitor',
  'snob', 'elitist', 'bigot', 'racist', 'sexist', 'homophobe',
  'idiot', 'moron', 'imbecile', 'retard', 'dumb', 'stupid', 'foolish',
  'ugly', 'hideous', 'repulsive', 'disgusting', 'gross', 'nasty',
  'annoying', 'irritating', 'bothersome', 'pesky', 'pest', 'nuisance',
  
  // Hindi toxic words (transliterated)
  'chutiya', 'chut', 'lund', 'gaand', 'gaandu', 'bhosdike', 'bhenchod', 'behenchod',
  'madarchod', 'maa ki chut', 'teri maa', 'randi', 'raand', 'kutiya', 'kutta',
  'harami', 'haramzada', 'sale', 'saale', 'chakke', 'hijra', 'napunsak',
  'bewakoof', 'pagal', 'paagal', 'chaman', 'chutiye', 'gadha', 'gadhe',
  
  // Urdu toxic words (transliterated)
  'harami', 'haramzada', 'kutta', 'kutiya', 'randi', 'raand', 'bhenchod',
  'madarchod', 'chutiya', 'chut', 'lund', 'gaand', 'gaandu',
  
  // Punjabi toxic words (transliterated)
  'chutiya', 'chut', 'lund', 'gaand', 'gaandu', 'bhenchod', 'kutta', 'kutiya',
  'randi', 'raand', 'harami', 'haramzada', 'sale', 'saale',
  
  // Bengali toxic words (transliterated)
  'chutiya', 'chut', 'lund', 'gaand', 'gaandu', 'bhenchod', 'kutta', 'kutiya',
  'randi', 'raand', 'harami', 'haramzada',
  
  // Nepali toxic words (transliterated)
  'chutiya', 'chut', 'lund', 'gaand', 'gaandu', 'bhenchod', 'kutta', 'kutiya',
  'randi', 'raand', 'harami', 'haramzada',
  
  // Persian toxic words (transliterated)
  'khar', 'khar kos', 'kos kesh', 'madar sag', 'pedar sag', 'jende', 'kharab',
];

/**
 * Check if text contains toxic words (fallback method)
 * Uses word boundary matching for accurate detection
 */
export const checkToxicityFallback = (text) => {
  if (!text || typeof text !== 'string') {
    return false;
  }

  const textLower = text.toLowerCase();
  
  // Check for toxic words with word boundaries
  for (const word of TOXIC_WORDS) {
    // Use word boundary regex for accurate matching
    const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(textLower)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Check toxicity using Gemini AI with rate limiting and caching
 * Now supports toggle - enabled by default
 */
export const checkToxicityWithGemini = async (text) => {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return { isToxic: false, confidence: 0, reason: null };
  }

  // Check cache first
  const cacheKey = text.toLowerCase().trim();
  if (toxicityCache.has(cacheKey)) {
    return toxicityCache.get(cacheKey);
  }

  // AI toxicity checking is admin-controlled (not user-controlled)
  // Check admin setting from Firestore config or default to enabled
  // This is a core safety feature - admins can disable via Firestore 'appConfig/aiSettings' document
  // For now, always enabled - admin control will be added via Firestore listener in future
  // The admin toggle in AdminDashboard controls this via Firestore
  
  // AI-powered toxicity checking (enabled by default)
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === '') {
    console.warn('Gemini API key not configured, using fallback toxicity check');
    const result = { 
      isToxic: checkToxicityFallback(text), 
      confidence: 0.5, 
      reason: 'Fallback word filter',
      method: 'fallback'
    };
    toxicityCache.set(cacheKey, result);
    return result;
  }

  // Check if quota was exceeded recently
  const now = Date.now();
  if (geminiQuotaExceeded && now < quotaExceededUntil) {
    console.warn('Gemini quota exceeded, using fallback. Will retry after cooldown.');
    const result = {
      isToxic: checkToxicityFallback(text),
      confidence: 0.5,
      reason: 'Gemini quota exceeded, using fallback',
      method: 'fallback'
    };
    toxicityCache.set(cacheKey, result);
    return result;
  }

  // Rate limiting: Check if we've exceeded the limit
  if (now - lastGeminiCall.time < 60000) { // Within 1 minute
    if (lastGeminiCall.count >= GEMINI_RATE_LIMIT) {
      console.warn('Gemini rate limit reached, using fallback');
      const result = {
        isToxic: checkToxicityFallback(text),
        confidence: 0.5,
        reason: 'Rate limit reached, using fallback',
        method: 'fallback'
      };
      toxicityCache.set(cacheKey, result);
      return result;
    }
  } else {
    // Reset counter after 1 minute
    lastGeminiCall.time = now;
    lastGeminiCall.count = 0;
  }

  try {
    lastGeminiCall.count++;
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
    
    const errorMessage = error?.message || '';
    const errorCode = error?.code || '';
    const errorString = JSON.stringify(error) || '';
    const now = Date.now();
    
    // Check for API not enabled error (403 Forbidden with SERVICE_DISABLED)
    if (errorCode === 403 || errorCode === '403' || 
        errorMessage.includes('SERVICE_DISABLED') || 
        errorMessage.includes('has not been used') ||
        errorMessage.includes('is disabled') ||
        errorMessage.includes('Enable it by visiting') ||
        errorString.includes('SERVICE_DISABLED')) {
      console.warn('⚠️ Generative Language API is not enabled in your Google Cloud project.');
      console.warn('💡 Enable it at: https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview');
      console.warn('📝 Using fallback word filter for toxicity checking.');
      // Set quota exceeded flag to prevent repeated API calls (60 minutes cooldown)
      geminiQuotaExceeded = true;
      quotaExceededUntil = now + (GEMINI_COOLDOWN * 60); // 60 minutes cooldown for API not enabled
    }
    // Check if it's a quota/rate limit error (429)
    else if (error.message && (error.message.includes('429') || error.message.includes('quota') || error.message.includes('rate limit'))) {
      geminiQuotaExceeded = true;
      quotaExceededUntil = now + GEMINI_COOLDOWN;
      console.warn('Gemini quota exceeded, will use fallback for next', GEMINI_COOLDOWN / 1000, 'seconds');
    }
    
    // Fallback to word filter
    const result = {
      isToxic: checkToxicityFallback(text),
      confidence: 0.5,
      reason: 'Error checking with AI, using fallback',
      method: 'fallback'
    };
    toxicityCache.set(cacheKey, result);
    return result;
  }
};

/**
 * Main toxicity check function - tries Gemini first, falls back to word filter
 * Now with automatic fallback when quota is exceeded
 */
export const checkToxicity = async (text, useGemini = true) => {
  if (!text || typeof text !== 'string') {
    return { isToxic: false, confidence: 0, reason: null, method: 'none' };
  }

  // Check cache first (works for both Gemini and fallback results)
  const cacheKey = text.toLowerCase().trim();
  if (toxicityCache.has(cacheKey)) {
    return toxicityCache.get(cacheKey);
  }

  // AI toxicity checking is always enabled (admin-controlled, not user-controlled)
  // If Gemini is enabled and quota hasn't been exceeded, try it
  if (useGemini && !geminiQuotaExceeded) {
    try {
      const result = await checkToxicityWithGemini(text);
      // Cache the result (already cached in checkToxicityWithGemini, but ensure it's here too)
      if (!toxicityCache.has(cacheKey)) {
        toxicityCache.set(cacheKey, result);
      }
      return result;
    } catch (error) {
      console.error('Error in Gemini toxicity check:', error);
      
      // ✅ FIX: Fallback to Vertex/Groq ONLY for toxicity checks
      console.warn('⚠️ [TOXICITY] Gemini failed, trying Vertex/Groq fallback:', error.message);
      
      // Try Groq fallback for toxicity check
      const groqApiKey = import.meta.env.VITE_GROQ_API_KEY?.trim();
      if (groqApiKey && groqApiKey !== '') {
        try {
          // Import callGroq function directly
          const { callGroq } = await import('./aiProvider');
          const groqConfig = {
            provider: 'groq',
            apiKey: groqApiKey,
            model: 'llama-3.1-8b-instant',
            baseUrl: 'https://api.groq.com/openai/v1',
            maxTokens: 512,
            temperature: 0.3
          };
          
          const toxicityPrompt = `Analyze the following message for toxicity, hate speech, harassment, bullying, threats, or inappropriate content. 

Message: "${text}"

Respond ONLY with a JSON object in this exact format:
{
  "isToxic": true/false,
  "confidence": 0.0-1.0,
  "reason": "brief explanation",
  "categories": ["hate_speech", "harassment", "threats", "profanity", "bullying", etc.]
}

Be strict but fair. Consider context. False positives are better than false negatives for safety.`;

          console.error('🔄 [TOXICITY FALLBACK] Using Groq API for toxicity check...');
          const groqResponse = await callGroq(toxicityPrompt, groqConfig, {
            systemPrompt: 'You are a content moderation AI. Analyze messages for toxicity and respond with JSON only.',
            maxTokens: 512,
            temperature: 0.3
          });
          
          // Try to parse JSON response
          try {
            const jsonMatch = groqResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              const result = {
                isToxic: parsed.isToxic === true,
                confidence: parsed.confidence || 0.5,
                reason: parsed.reason || null,
                categories: parsed.categories || [],
                method: 'groq-fallback'
              };
              toxicityCache.set(cacheKey, result);
              return result;
            }
          } catch (parseError) {
            console.warn('Failed to parse Groq toxicity response:', parseError);
          }
          
          // If parsing fails, check if response indicates toxicity
          const lowerResponse = groqResponse.toLowerCase();
          if (lowerResponse.includes('toxic') || lowerResponse.includes('true') || lowerResponse.includes('yes')) {
            const result = {
              isToxic: true,
              confidence: 0.7,
              reason: 'Groq AI detected toxicity',
              method: 'groq-fallback'
            };
            toxicityCache.set(cacheKey, result);
            return result;
          }
        } catch (groqError) {
          console.error('❌ [TOXICITY] Groq fallback also failed:', groqError);
          // Continue to word filter fallback below
        }
      }
      
      // Continue to fallback below
    }
  }

  // Fallback to word filter (always reliable, no API calls)
  const result = {
    isToxic: checkToxicityFallback(text),
    confidence: 0.5,
    reason: 'Word filter',
    method: 'fallback'
  };
  toxicityCache.set(cacheKey, result);
  return result;
};

// Clear cache periodically to prevent memory issues (keep last 1000 entries)
setInterval(() => {
  if (toxicityCache.size > 1000) {
    const entries = Array.from(toxicityCache.entries());
    toxicityCache.clear();
    // Keep most recent 500 entries
    entries.slice(-500).forEach(([key, value]) => {
      toxicityCache.set(key, value);
    });
  }
}, 5 * 60 * 1000); // Every 5 minutes
