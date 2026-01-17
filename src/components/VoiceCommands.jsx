/**
 * Voice Commands Component
 * Allows navigation and actions through voice commands
 * 5-10 years ahead: Natural language understanding, context-aware
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, Command } from 'lucide-react';

const VoiceCommands = ({ onCommand, disabled = false }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [command, setCommand] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check if Speech Recognition is available
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not available in this browser');
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event) => {
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

      setTranscript(finalTranscript || interimTranscript);
      
      if (finalTranscript) {
        processCommand(finalTranscript.trim());
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech' || event.error === 'aborted') {
        // Ignore these errors
        return;
      }
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      if (isListening) {
        // Restart if still supposed to be listening
        try {
          recognitionRef.current.start();
        } catch (e) {
          setIsListening(false);
        }
      }
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  const processCommand = useCallback((text) => {
    const lowerText = text.toLowerCase();
    let detectedCommand = null;

    // Navigation commands
    if (lowerText.includes('go to') || lowerText.includes('open') || lowerText.includes('show')) {
      if (lowerText.includes('chat') || lowerText.includes('messages')) {
        detectedCommand = { type: 'navigate', target: 'chat' };
      } else if (lowerText.includes('ai help') || lowerText.includes('ai')) {
        detectedCommand = { type: 'navigate', target: 'ai-help' };
      } else if (lowerText.includes('groups')) {
        detectedCommand = { type: 'navigate', target: 'groups' };
      } else if (lowerText.includes('private chat')) {
        detectedCommand = { type: 'navigate', target: 'private-chat' };
      } else if (lowerText.includes('settings')) {
        detectedCommand = { type: 'navigate', target: 'settings' };
      } else if (lowerText.includes('nearby')) {
        detectedCommand = { type: 'navigate', target: 'nearby' };
      }
    }

    // Action commands
    if (lowerText.includes('send') || lowerText.includes('post')) {
      detectedCommand = { type: 'action', action: 'send' };
    } else if (lowerText.includes('delete') || lowerText.includes('remove')) {
      detectedCommand = { type: 'action', action: 'delete' };
    } else if (lowerText.includes('search')) {
      detectedCommand = { type: 'action', action: 'search', query: text.replace(/search/i, '').trim() };
    }

    // Control commands
    if (lowerText.includes('stop listening') || lowerText.includes('stop voice')) {
      setIsListening(false);
      return;
    }

    if (detectedCommand) {
      setCommand(detectedCommand);
      onCommand?.(detectedCommand);
      // Clear command after a moment
      setTimeout(() => setCommand(null), 2000);
    }
  }, [onCommand]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setTranscript('');
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  };

  return (
    <div className="relative">
      <motion.button
        onClick={toggleListening}
        disabled={disabled}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`p-2 rounded-xl transition-all ${
          isListening
            ? 'bg-red-600/80 text-white animate-pulse'
            : 'bg-white/10 text-white/70 hover:bg-white/20'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-label={isListening ? 'Stop voice commands' : 'Start voice commands'}
      >
        {isListening ? <MicOff size={20} /> : <Mic size={20} />}
      </motion.button>

      {/* Status indicator */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-full right-0 mb-2 glass-panel border border-white/10 rounded-xl p-3 min-w-[200px] z-50"
          >
            <div className="flex items-center gap-2 mb-2">
              <Volume2 size={16} className="text-red-400 animate-pulse" />
              <span className="text-xs font-medium text-white">Listening...</span>
            </div>
            {transcript && (
              <p className="text-xs text-white/70 mb-2">{transcript}</p>
            )}
            {command && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-xs text-green-400"
              >
                <Command size={12} />
                <span>Command: {command.type} - {command.target || command.action}</span>
              </motion.div>
            )}
            <p className="text-xs text-white/50 mt-2">Say "stop listening" to end</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceCommands;
