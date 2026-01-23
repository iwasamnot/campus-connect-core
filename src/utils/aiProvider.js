// ... existing code ...

/**
 * Translate message to English (slang-aware, casual translation)
 * Used for Universal Group Chat where everyone speaks their own language but reads in English
 * @param {string} text - Text to translate
 * @param {string} sourceLang - Source language (e.g., 'Urdu', 'Mandarin', 'Spanish')
 * @returns {Promise<string>} - Translated text in English
 */
export const translateMessage = async (text, sourceLang = 'auto') => {
  if (!text || text.trim().length === 0) {
    return text;
  }

  // If already English, return as-is
  if (sourceLang === 'English' || sourceLang === 'english') {
    return text;
  }

  try {
    const translatePrompt = `Translate the following text from ${sourceLang} to English. 
    
Rules:
- Preserve emojis exactly as they are
- Keep the casual, conversational tone (do NOT make it formal)
- Preserve slang and informal expressions
- Keep the same energy and emotion
- Output ONLY the translated text, no explanations

Text to translate:
"${text}"`;

    const config = getAIProvider();
    if (!config) {
      console.warn('🔗 [Translation] No AI provider available, returning original text');
      return text;
    }

    // Use direct API call to avoid triggering connection matcher
    let translatedText = null;
    
    if (config.provider === 'ollama') {
      const baseUrl = config.baseUrl || import.meta.env.VITE_OLLAMA_URL?.trim() || 'http://localhost:11434';
      const model = 'deepseek-r1:8b';
      
      // Check if we need proxy (HTTPS page calling HTTP API)
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const isHttpUrl = baseUrl.startsWith('http://');
      const useProxy = isHttps && isHttpUrl;
      
      const url = useProxy
        ? `https://us-central1-campus-connect-sistc.cloudfunctions.net/ollamaProxy/api/chat`
        : `${baseUrl}/api/chat`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { 
              role: 'system', 
              content: 'You are a slang-aware translator. Translate the input text to English. Preserve emojis, tone, and casual speech. Do NOT be formal. Output ONLY the translated text.' 
            },
            { role: 'user', content: translatePrompt }
          ],
          stream: false,
          options: {
            num_ctx: 2048,
            num_predict: 512
          }
        }),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      translatedText = data.message?.content?.trim() || data.response?.trim() || '';
      
      // Remove thinking tags if present
      translatedText = translatedText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    } else if (config.provider === 'groq') {
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { 
              role: 'system', 
              content: 'You are a slang-aware translator. Translate the input text to English. Preserve emojis, tone, and casual speech. Do NOT be formal. Output ONLY the translated text.' 
            },
            { role: 'user', content: translatePrompt }
          ],
          max_tokens: 512,
          temperature: 0.3,
        }),
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.statusText}`);
      }

      const data = await response.json();
      translatedText = data.choices[0]?.message?.content?.trim() || '';
    }

    if (!translatedText || translatedText.length === 0) {
      console.warn('🔗 [Translation] Empty translation, returning original text');
      return text;
    }

    console.log(`🔗 [Translation] Translated from ${sourceLang}: ${text.substring(0, 50)}... → ${translatedText.substring(0, 50)}...`);
    return translatedText;
  } catch (error) {
    console.error('🔗 [Translation] Translation failed:', error);
    // Return original text on error (graceful degradation)
    return text;
  }
};

// ... existing code ...
