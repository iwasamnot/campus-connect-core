import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, X } from 'lucide-react';

const EMOJI_CATEGORIES = {
  'Smileys & People': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓'],
  'Gestures': ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
  'Objects': ['💻', '📱', '⌚', '🖥', '🖨', '⌨️', '🖱', '🖲', '🕹', '🗜', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽', '🎞', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙', '🎚', '🎛', '⏱', '⏲', '⏰', '🕰', '⌛', '⏳', '📡'],
  'Symbols': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️'],
  'Flags': ['🏳️', '🏴', '🏁', '🚩', '🏳️‍🌈', '🏳️‍⚧️', '🇺🇳', '🇦🇫', '🇦🇽', '🇦🇱', '🇩🇿', '🇦🇸', '🇦🇩', '🇦🇴', '🇦🇮', '🇦🇶', '🇦🇬', '🇦🇷', '🇦🇲', '🇦🇼', '🇦🇺', '🇦🇹', '🇦🇿', '🇧🇸', '🇧🇭', '🇧🇩', '🇧🇧', '🇧🇾', '🇧🇪', '🇧🇿', '🇧🇯', '🇧🇲', '🇧🇹', '🇧🇴', '🇧🇦', '🇧🇼', '🇧🇷', '🇮🇴', '🇻🇬', '🇧🇳', '🇧🇬', '🇧🇫', '🇧🇮', '🇰🇭', '🇨🇲', '🇨🇦', '🇮🇶', '🇨🇻'],
};

const EmojiPicker = ({ onEmojiSelect, onClose, position = 'bottom' }) => {
  const [selectedCategory, setSelectedCategory] = useState('Smileys & People');
  const [searchQuery, setSearchQuery] = useState('');
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const filteredEmojis = EMOJI_CATEGORIES[selectedCategory].filter(emoji => 
    !searchQuery || emoji.includes(searchQuery)
  );

  return (
    <motion.div
      ref={pickerRef}
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      className="glass-panel border border-white/10 rounded-xl shadow-xl w-[280px] sm:w-80 max-h-[60vh] sm:max-h-96 flex flex-col overflow-hidden"
      style={{
        maxWidth: 'calc(100vw - 2rem)',
        maxHeight: 'min(60vh, 384px)'
      }}
    >
      {/* Header - Fluid.so aesthetic */}
      <div className="p-2 sm:p-3 border-b border-white/10 flex items-center justify-between flex-shrink-0">
        <h3 className="font-semibold text-sm sm:text-base text-white">Emoji</h3>
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
        >
          <X size={18} />
        </motion.button>
      </div>

      {/* Search - Fluid.so aesthetic */}
      <div className="p-2 border-b border-white/10 flex-shrink-0">
        <label htmlFor="emoji-search" className="sr-only">Search emojis</label>
        <input
          type="text"
          id="emoji-search"
          name="emoji-search"
          placeholder="Search emojis..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/40 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300"
        />
      </div>

      {/* Categories - Fluid.so aesthetic */}
      <div className="flex border-b border-white/10 overflow-x-auto flex-shrink-0">
        {Object.keys(EMOJI_CATEGORIES).map((category) => (
          <motion.button
            key={category}
            onClick={() => {
              setSelectedCategory(category);
              setSearchQuery('');
            }}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-medium whitespace-nowrap transition-all rounded-t-lg ${
              selectedCategory === category
                ? 'bg-indigo-600/30 text-indigo-300 border-b-2 border-indigo-500/50'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            {category.split(' ')[0]}
          </motion.button>
        ))}
      </div>

      {/* Emoji Grid - Fluid.so aesthetic */}
      <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y p-2 sm:p-3 min-h-0">
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 sm:gap-2">
          {filteredEmojis.map((emoji, index) => (
            <motion.button
              key={`${emoji}-${index}`}
              onClick={() => {
                onEmojiSelect(emoji);
                onClose();
              }}
              whileHover={{ scale: 1.2, y: -2 }}
              whileTap={{ scale: 0.9 }}
              className="text-xl sm:text-2xl hover:bg-white/10 rounded-lg p-1.5 sm:p-2 transition-colors"
              aria-label={`Select emoji ${emoji}`}
            >
              {emoji}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default EmojiPicker;

