/**
 * Real-Time Voice Duplex Mode Hook
 * Uses Deepgram for real-time speech-to-text with interrupt capability
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@deepgram/sdk';

/**
 * Custom hook for real-time voice mode with Deepgram
 * @param {Function} onUserTranscript - Callback when user finishes speaking (final transcript)
 * @returns {Object} - Voice mode state and controls
 */
export const useVoiceMode = (onUserTranscript) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  
  const deepgramClientRef = useRef(null);
  const connectionRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  /**
   * Initialize Deepgram client
   */
  const initializeDeepgram = useCallback(() => {
    try {
      const apiKey = import.meta.env.VITE_DEEPGRAM_KEY?.trim();
      if (!apiKey || apiKey === '') {
        throw new Error('Deepgram API key not configured. Please set VITE_DEEPGRAM_KEY in environment variables.');
      }

      // CRITICAL: dangerouslyAllowBrowser: true is required for client-side usage
      deepgramClientRef.current = createClient(apiKey, {
        dangerouslyAllowBrowser: true
      });

      console.log('🎤 [Deepgram] Client initialized');
      return true;
    } catch (err) {
      console.error('🎤 [Deepgram] Error initializing client:', err);
      setError(err.message);
      return false;
    }
  }, []);

  /**
   * Start voice mode - connect to Deepgram and start streaming
   */
  const startVoiceMode = useCallback(async () => {
    try {
      setError(null);

      // ✅ FIX: Resume audio context to allow TTS autoplay
      // Browsers block autoplay audio - must interact with page first
      if (window.speechSynthesis && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      // Initialize Deepgram if not already done
      if (!deepgramClientRef.current) {
        if (!initializeDeepgram()) {
          return false;
        }
      }

      // Get user media (microphone)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Create audio context for processing
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      // Resume audio context if suspended (required for autoplay)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Create media source from stream
      const source = audioContext.createMediaStreamSource(stream);
      
      // Create media recorder for streaming
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;

      // Connect to Deepgram Live API
      // Note: Deepgram SDK v4 uses listen.live() method
      const connection = deepgramClientRef.current.listen.live({
        model: 'nova-2',
        smart_format: true,
        interim_results: true,
        language: 'en-US',
        endpointing: 300, // Endpointing timeout in ms
        vad_events: true // Voice activity detection events
      });

      connectionRef.current = connection;

      // Handle connection open
      connection.on('open', () => {
        console.log('🎤 [Deepgram] Connection opened');
        setIsListening(true);
        
        // Start recording and streaming
        mediaRecorder.start(100); // Send chunks every 100ms
        
        mediaRecorder.ondataavailable = async (event) => {
          if (event.data.size > 0 && connection.getReadyState() === 1) {
            try {
              // Convert Blob to ArrayBuffer for Deepgram
              const arrayBuffer = await event.data.arrayBuffer();
              connection.send(arrayBuffer);
            } catch (err) {
              console.error('🎤 [Deepgram] Error sending audio:', err);
            }
          }
        };
      });

      // Handle transcript results
      connection.on('results', (data) => {
        try {
          const transcript = data.channel?.alternatives?.[0]?.transcript;
          const isFinal = data.is_final;

          if (transcript && transcript.trim()) {
            // ✅ FIX: Only interrupt if transcript is meaningful (more than 1 character) and final
            // This prevents background noise from killing AI speech before it can start
            if (transcript.trim().length > 1 && isFinal) {
              // DEBUG: Log what triggered the interruption
              console.log('🎤 [Barge-In] Interruption triggered by:', transcript);
              
              // Stop AI speech only if it's a real sentence
              if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
              }
              
              // Final transcript - call callback
              setInterimTranscript('');
              if (onUserTranscript) {
                onUserTranscript(transcript.trim());
              }
            } else if (!isFinal) {
              // Interim result - update UI (but don't interrupt)
              setInterimTranscript(transcript.trim());
            }
          }
        } catch (err) {
          console.error('🎤 [Deepgram] Error processing results:', err);
        }
      });

      // Note: speech_started event is too sensitive (fires on any sound)
      // Interruption logic moved to 'results' handler above for better control

      // Handle connection errors
      connection.on('error', (error) => {
        console.error('🎤 [Deepgram] Connection error:', error);
        setError(error.message || 'Deepgram connection error');
        setIsListening(false);
      });

      // Handle connection close
      connection.on('close', () => {
        console.log('🎤 [Deepgram] Connection closed');
        setIsListening(false);
      });

      return true;
    } catch (err) {
      console.error('🎤 [Voice Mode] Error starting voice mode:', err);
      setError(err.message || 'Failed to start voice mode');
      return false;
    }
  }, [initializeDeepgram, onUserTranscript]);

  /**
   * Stop voice mode - close connection and release resources
   */
  const stopVoiceMode = useCallback(() => {
    try {
      // Close Deepgram connection
      if (connectionRef.current) {
        connectionRef.current.finish();
        connectionRef.current = null;
      }

      // Stop media recorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }

      // Stop audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      // Stop media stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }

      setIsListening(false);
      setInterimTranscript('');
      setError(null);
      
      console.log('🎤 [Voice Mode] Stopped');
    } catch (err) {
      console.error('🎤 [Voice Mode] Error stopping voice mode:', err);
    }
  }, []);

  /**
   * Toggle mute
   */
  const toggleMute = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted; // Enable if muted, disable if not muted
      });
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  /**
   * Speak text using Web Speech API
   */
  const speak = useCallback((text) => {
    if (!window.speechSynthesis) {
      console.warn('🎤 [Voice Mode] Speech synthesis not available');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (error) => {
      console.error('🎤 [Voice Mode] Speech synthesis error:', error);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  /**
   * Stop speaking
   */
  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVoiceMode();
      stopSpeaking();
    };
  }, [stopVoiceMode, stopSpeaking]);

  return {
    isListening,
    isSpeaking,
    isMuted,
    interimTranscript,
    error,
    startVoiceMode,
    stopVoiceMode,
    toggleMute,
    speak,
    stopSpeaking
  };
};
