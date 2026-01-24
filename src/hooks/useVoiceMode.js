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
      console.error('🎤 [Voice Mode] Starting voice mode...');

      // ✅ FIX: Resume audio context to allow TTS autoplay
      // Browsers block autoplay audio - must interact with page first
      if (window.speechSynthesis) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        // Ensure speech synthesis is ready
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }
        console.error('✅ [Voice Mode] Speech synthesis ready');
      } else {
        console.error('⚠️ [Voice Mode] Speech synthesis not available');
      }

      // Check if Deepgram is available
      const deepgramApiKey = import.meta.env.VITE_DEEPGRAM_KEY?.trim();
      if (!deepgramApiKey || deepgramApiKey === '') {
        console.error('⚠️ [Voice Mode] Deepgram API key not found, using Web Speech API fallback');
        // Fallback to Web Speech API
        return await startWebSpeechRecognition();
      }

      // Initialize Deepgram if not already done
      if (!deepgramClientRef.current) {
        if (!initializeDeepgram()) {
          console.error('❌ [Voice Mode] Deepgram initialization failed, trying Web Speech API fallback');
          return await startWebSpeechRecognition();
        }
      }

      // Get user media (microphone) with better error handling
      console.error('🎤 [Voice Mode] Requesting microphone access...');
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        console.error('✅ [Voice Mode] Microphone access granted');
      } catch (mediaError) {
        console.error('❌ [Voice Mode] Microphone access denied:', mediaError);
        if (mediaError.name === 'NotAllowedError' || mediaError.name === 'PermissionDeniedError') {
          setError('Microphone permission denied. Please allow microphone access in your browser settings.');
        } else if (mediaError.name === 'NotFoundError' || mediaError.name === 'DevicesNotFoundError') {
          setError('No microphone found. Please connect a microphone and try again.');
        } else {
          setError(`Microphone error: ${mediaError.message}`);
        }
        // Try Web Speech API as fallback
        console.error('🔄 [Voice Mode] Trying Web Speech API fallback...');
        return await startWebSpeechRecognition();
      }
      
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
      console.error('❌ [Voice Mode] Error starting voice mode:', err);
      setError(err.message || 'Failed to start voice mode');
      // Try Web Speech API as fallback
      console.error('🔄 [Voice Mode] Trying Web Speech API fallback...');
      return await startWebSpeechRecognition();
    }
  }, [initializeDeepgram, onUserTranscript]);

  /**
   * Fallback: Web Speech API recognition (no API key required)
   */
  const webSpeechRecognitionRef = useRef(null);
  
  const startWebSpeechRecognition = useCallback(async () => {
    try {
      console.error('🎤 [Web Speech] Starting Web Speech API recognition...');
      
      // Check if Web Speech API is available
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        const error = 'Speech recognition not available in this browser. Please use Chrome, Edge, or Safari.';
        console.error('❌ [Web Speech]', error);
        setError(error);
        return false;
      }

      // Get microphone access first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        mediaStreamRef.current = stream;
        console.error('✅ [Web Speech] Microphone access granted');
      } catch (mediaError) {
        console.error('❌ [Web Speech] Microphone access denied:', mediaError);
        if (mediaError.name === 'NotAllowedError' || mediaError.name === 'PermissionDeniedError') {
          setError('Microphone permission denied. Please allow microphone access in your browser settings.');
        } else if (mediaError.name === 'NotFoundError' || mediaError.name === 'DevicesNotFoundError') {
          setError('No microphone found. Please connect a microphone and try again.');
        } else {
          setError(`Microphone error: ${mediaError.message}`);
        }
        return false;
      }

      // Create recognition instance
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      webSpeechRecognitionRef.current = recognition;

      recognition.onstart = () => {
        console.error('✅ [Web Speech] Recognition started');
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (interimTranscript) {
          setInterimTranscript(interimTranscript);
        }

        if (finalTranscript.trim()) {
          console.error('🎤 [Web Speech] Final transcript:', finalTranscript.trim());
          setInterimTranscript('');
          if (onUserTranscript) {
            onUserTranscript(finalTranscript.trim());
          }
        }
      };

      recognition.onerror = (event) => {
        console.error('❌ [Web Speech] Recognition error:', event.error);
        if (event.error === 'no-speech') {
          // Ignore - user just hasn't spoken yet
          return;
        } else if (event.error === 'audio-capture') {
          setError('No microphone found. Please connect a microphone.');
        } else if (event.error === 'not-allowed') {
          setError('Microphone permission denied. Please allow microphone access.');
        } else {
          setError(`Speech recognition error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        console.error('🔄 [Web Speech] Recognition ended, restarting...');
        setIsListening(false);
        // Auto-restart if still supposed to be listening
        if (mediaStreamRef.current) {
          try {
            recognition.start();
          } catch (err) {
            // Already started or other error - ignore
            console.error('⚠️ [Web Speech] Could not restart:', err.message);
          }
        }
      };

      // Start recognition
      recognition.start();
      console.error('✅ [Web Speech] Recognition started successfully');
      return true;
    } catch (err) {
      console.error('❌ [Web Speech] Error starting recognition:', err);
      setError(err.message || 'Failed to start speech recognition');
      return false;
    }
  }, [onUserTranscript]);

  /**
   * Stop voice mode - close connection and release resources
   */
  const stopVoiceMode = useCallback(() => {
    try {
      console.error('🛑 [Voice Mode] Stopping voice mode...');
      
      // Stop Web Speech API recognition
      if (webSpeechRecognitionRef.current) {
        try {
          webSpeechRecognitionRef.current.stop();
        } catch (err) {
          // Ignore errors when stopping
        }
        webSpeechRecognitionRef.current = null;
      }

      // Close Deepgram connection
      if (connectionRef.current) {
        try {
          connectionRef.current.finish();
        } catch (err) {
          console.error('⚠️ [Voice Mode] Error closing Deepgram connection:', err);
        }
        connectionRef.current = null;
      }

      // Stop media recorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (err) {
          console.error('⚠️ [Voice Mode] Error stopping media recorder:', err);
        }
        mediaRecorderRef.current = null;
      }

      // Stop audio context
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (err) {
          console.error('⚠️ [Voice Mode] Error closing audio context:', err);
        }
        audioContextRef.current = null;
      }

      // Stop media stream
      if (mediaStreamRef.current) {
        try {
          mediaStreamRef.current.getTracks().forEach(track => {
            track.stop();
            console.error('🛑 [Voice Mode] Stopped track:', track.kind);
          });
        } catch (err) {
          console.error('⚠️ [Voice Mode] Error stopping media stream:', err);
        }
        mediaStreamRef.current = null;
      }

      setIsListening(false);
      setInterimTranscript('');
      setError(null);
      
      console.error('✅ [Voice Mode] Stopped successfully');
    } catch (err) {
      console.error('❌ [Voice Mode] Error stopping voice mode:', err);
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
  const speak = useCallback(async (text) => {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      console.error('⚠️ [Voice Mode] Empty text provided to speak');
      return;
    }

    if (!window.speechSynthesis) {
      const error = 'Speech synthesis not available in this browser.';
      console.error('❌ [Voice Mode]', error);
      setError(error);
      return;
    }

    try {
      console.error('🔊 [Voice Mode] Speaking:', text.substring(0, 50) + '...');
      
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      // Resume audio context if suspended (required for autoplay)
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
        console.error('✅ [Voice Mode] Audio context resumed');
      }

      // Ensure speech synthesis is ready
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      setIsSpeaking(true);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';

      utterance.onstart = () => {
        console.error('✅ [Voice Mode] Speech started');
      };

      utterance.onend = () => {
        console.error('✅ [Voice Mode] Speech ended');
        setIsSpeaking(false);
      };

      utterance.onerror = (error) => {
        console.error('❌ [Voice Mode] Speech synthesis error:', error);
        setError(`Speech error: ${error.error || 'Unknown error'}`);
        setIsSpeaking(false);
      };

      // Wait for voices to be loaded (some browsers need this)
      const speakWithVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          // Prefer a natural-sounding voice
          const preferredVoice = voices.find(v => 
            v.lang.startsWith('en') && 
            (v.name.includes('Natural') || v.name.includes('Premium') || v.name.includes('Enhanced'))
          ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
          
          if (preferredVoice) {
            utterance.voice = preferredVoice;
            console.error('🎤 [Voice Mode] Using voice:', preferredVoice.name);
          }
        }
        window.speechSynthesis.speak(utterance);
      };

      // Some browsers need voices to load first
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = speakWithVoices;
      } else {
        speakWithVoices();
      }
    } catch (err) {
      console.error('❌ [Voice Mode] Error in speak function:', err);
      setError(`Failed to speak: ${err.message}`);
      setIsSpeaking(false);
    }
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
