import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Download, Mic } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
// VoiceMessage only displays audio - no upload functionality needed
// All voice messages are now stored in Cloudinary

/**
 * Voice Message Component
 * Display and play voice messages
 */
const VoiceMessage = ({ message, isOwnMessage }) => {
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      
      const updateTime = () => setCurrentTime(audio.currentTime);
      const updateDuration = () => setDuration(audio.duration);
      const handleEnded = () => setIsPlaying(false);

      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', updateDuration);
      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('loadedmetadata', updateDuration);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleDownload = () => {
    if (message.voiceUrl) {
      const link = document.createElement('a');
      link.href = message.voiceUrl;
      link.download = `voice-message-${message.id}.webm`;
      link.click();
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      className={`flex items-center gap-3 p-3 glass-panel bg-indigo-600/10 rounded-xl border border-indigo-500/30 backdrop-blur-sm ${
        isOwnMessage ? 'bg-indigo-600/20 border-indigo-500/50' : ''
      }`}
    >
      <motion.button
        onClick={togglePlay}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="w-12 h-12 rounded-full flex items-center justify-center transition-all bg-indigo-600 hover:bg-indigo-700 text-white flex-shrink-0 shadow-lg hover:shadow-xl"
        aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </motion.button>

      <audio ref={audioRef} src={message.voiceUrl} preload="metadata" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Mic size={16} className="text-indigo-400 flex-shrink-0" />
          <span className="text-xs font-medium text-white/70">Voice Message</span>
        </div>
        
        <div className="w-full bg-white/10 rounded-full h-2 mb-1">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%'
            }}
            className="bg-indigo-500 h-2 rounded-full transition-all"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-white/60">
          <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
          {message.voiceDuration && (
            <span>{formatTime(message.voiceDuration)}</span>
          )}
        </div>
      </div>

      <motion.button
        onClick={handleDownload}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="p-2 text-white/70 hover:text-white glass-panel border border-white/10 hover:border-white/20 rounded-lg transition-all flex-shrink-0"
        aria-label="Download voice message"
      >
        <Download size={18} />
      </motion.button>
    </motion.div>
  );
};

export default VoiceMessage;

