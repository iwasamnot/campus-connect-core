/**
 * Voice Message Transcription Utility
 * Converts voice messages to text
 * 
 * NOTE: Web Speech API only works with live microphone input, not audio files.
 * This function provides a placeholder that indicates transcription requires
 * a server-side API (e.g., Google Cloud Speech-to-Text, AWS Transcribe, etc.)
 */

/**
 * Transcribe audio blob to text
 * 
 * IMPORTANT: The Web Speech API cannot transcribe audio files/blobs directly.
 * It only works with live microphone input via getUserMedia().
 * 
 * For production use, you should:
 * 1. Send the audio blob to a server-side transcription service
 * 2. Use APIs like Google Cloud Speech-to-Text, AWS Transcribe, or OpenAI Whisper
 * 3. Return the transcribed text
 * 
 * This implementation returns a placeholder indicating transcription is not available.
 */
export const transcribeAudio = async (audioBlob) => {
  // Web Speech API doesn't support audio file transcription
  // It only works with live microphone input
  console.warn('transcribeAudio: Web Speech API cannot transcribe audio files. Live microphone input required.');
  
  // Return a placeholder message indicating transcription is not available
  // In production, replace this with a call to a server-side transcription API
  return new Promise((resolve) => {
    // Simulate async operation
    setTimeout(() => {
      resolve('[Transcription not available: Web Speech API requires live microphone input. Use a server-side transcription service for audio files.]');
    }, 100);
  });
  
  // For future implementation with server-side API:
  // const formData = new FormData();
  // formData.append('audio', audioBlob, 'voice-message.webm');
  // const response = await fetch('/api/transcribe', {
  //   method: 'POST',
  //   body: formData,
  // });
  // const { transcript } = await response.json();
  // return transcript;
};

/**
 * Check if speech recognition is available
 */
export const isSpeechRecognitionAvailable = () => {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
};
