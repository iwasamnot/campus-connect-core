/**
 * Voice Message Transcription Utility
 * Converts voice messages to text using Web Speech API
 */

/**
 * Transcribe audio blob to text
 */
export const transcribeAudio = async (audioBlob) => {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    throw new Error('Speech recognition not supported in this browser');
  }

  return new Promise((resolve, reject) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      resolve(transcript);
    };

    recognition.onerror = (event) => {
      reject(new Error(`Speech recognition error: ${event.error}`));
    };

    recognition.onend = () => {
      // Recognition ended
    };

    // Convert blob to audio source
    const audio = new Audio();
    const url = URL.createObjectURL(audioBlob);
    audio.src = url;
    audio.play();

    // Start recognition when audio starts playing
    audio.onplay = () => {
      recognition.start();
    };

    audio.onended = () => {
      recognition.stop();
      URL.revokeObjectURL(url);
    };
  });
};

/**
 * Check if speech recognition is available
 */
export const isSpeechRecognitionAvailable = () => {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
};
