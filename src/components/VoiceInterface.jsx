/**
 * Real-Time Voice Duplex Interface
 * Full-screen call mode overlay with Deepgram integration
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from 'lucide-react';
import { useVoiceMode } from '../hooks/useVoiceMode';
import { callAI } from '../utils/aiProvider';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const VoiceInterface = ({ onClose }) => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [isActive, setIsActive] = useState(false);

  // Handle user transcript - send to AI and speak response
  const handleUserTranscript = async (transcript) => {
    if (!transcript || transcript.trim().length === 0) return;

    console.log('🎤 [Voice Interface] User said:', transcript);

    try {
      // Call AI with the transcript
      const aiResponse = await callAI(transcript, {
        systemPrompt: 'You are a helpful assistant. Answer concisely (2-3 sentences max) for voice responses.',
        maxTokens: 150,
        temperature: 0.7,
        userId: user?.uid || null
      });

      if (aiResponse && aiResponse.trim()) {
        // Speak the AI response
        speakText(aiResponse.trim());
      }
    } catch (error) {
      console.error('🎤 [Voice Interface] Error getting AI response:', error);
      showError('Failed to get AI response. Please try again.');
    }
  };

  const {
    isListening,
    isSpeaking,
    isMuted,
    interimTranscript,
    error,
    startVoiceMode,
    stopVoiceMode,
    toggleMute,
    speak: speakText,
    stopSpeaking
  } = useVoiceMode(handleUserTranscript);

  // Start voice mode when component mounts
  useEffect(() => {
    const start = async () => {
      const started = await startVoiceMode();
      if (started) {
        setIsActive(true);
        success('Voice mode started');
      } else {
        showError('Failed to start voice mode. Please check your microphone permissions.');
        onClose();
      }
    };
    start();
  }, [startVoiceMode, success, showError, onClose]);

  // Handle end call
  const handleEndCall = () => {
    stopVoiceMode();
    stopSpeaking();
    onClose();
  };

  // Determine orb color based on state
  const orbColor = isSpeaking 
    ? 'bg-pink-500' 
    : isListening 
      ? 'bg-blue-500' 
      : 'bg-gray-500';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center"
      >
        {/* Main Content */}
        <div className="flex flex-col items-center justify-center gap-8 p-8">
          {/* Pulsing Orb */}
          <motion.div
            animate={{
              scale: isListening || isSpeaking ? [1, 1.2, 1] : 1,
              opacity: isListening || isSpeaking ? [0.8, 1, 0.8] : 0.6
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className={`w-32 h-32 md:w-40 md:h-40 rounded-full ${orbColor} shadow-2xl flex items-center justify-center`}
          >
            {isListening && (
              <Mic className="text-white" size={48} />
            )}
            {isSpeaking && (
              <Volume2 className="text-white" size={48} />
            )}
            {!isListening && !isSpeaking && (
              <MicOff className="text-white" size={48} />
            )}
          </motion.div>

          {/* Status Text */}
          <div className="text-center">
            <motion.h2
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-2xl md:text-3xl font-semibold text-white mb-2"
            >
              {isSpeaking 
                ? 'AI Speaking...' 
                : isListening 
                  ? 'Listening...' 
                  : 'Voice Mode'}
            </motion.h2>
            
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
          </div>

          {/* Live Captions */}
          {interimTranscript && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl w-full px-6 py-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
            >
              <p className="text-white/80 text-lg text-center">
                {interimTranscript}
              </p>
            </motion.div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-4">
            {/* Mute Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleMute}
              className={`p-4 rounded-full ${
                isMuted 
                  ? 'bg-red-500/20 border-2 border-red-500' 
                  : 'bg-white/10 border-2 border-white/20'
              } text-white transition-all`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </motion.button>

            {/* End Call Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleEndCall}
              className="p-4 rounded-full bg-red-500/20 border-2 border-red-500 text-white transition-all"
              title="End Call"
            >
              <PhoneOff size={24} />
            </motion.button>
          </div>

          {/* Instructions */}
          <div className="text-center text-white/60 text-sm max-w-md">
            <p>
              {isListening 
                ? 'Speak naturally. The AI will respond when you finish.' 
                : isSpeaking 
                  ? 'AI is speaking. You can interrupt by speaking.' 
                  : 'Click to start voice mode'}
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VoiceInterface;
