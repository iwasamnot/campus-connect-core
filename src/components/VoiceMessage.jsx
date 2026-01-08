import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Mic } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
// Use window.__firebaseStorage to avoid import/export issues
const storage = typeof window !== 'undefined' && window.__firebaseStorage 
  ? window.__firebaseStorage 
  : null;
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
    <div className={`flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 ${
      isOwnMessage ? 'bg-indigo-100 dark:bg-indigo-900/30' : ''
    }`}>
      <button
        onClick={togglePlay}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
          isOwnMessage
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        } flex-shrink-0`}
        aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>

      <audio ref={audioRef} src={message.voiceUrl} preload="metadata" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Mic size={16} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Voice Message</span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all"
            style={{
              width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%'
            }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
          {message.voiceDuration && (
            <span>{formatTime(message.voiceDuration)}</span>
          )}
        </div>
      </div>

      <button
        onClick={handleDownload}
        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
        aria-label="Download voice message"
      >
        <Download size={18} />
      </button>
    </div>
  );
};

export default VoiceMessage;

