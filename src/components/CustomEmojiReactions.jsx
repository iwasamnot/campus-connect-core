import { useState } from 'react';
import { Smile, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Custom Emoji Reactions Component
 * Extended emoji picker with more reactions
 */
const EMOJI_CATEGORIES = {
  'Reactions': ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👏', '🙌', '💯', '✨', '🎊'],
  'Faces': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😊', '😇', '🙂', '🙃', '😉'],
  'Gestures': ['👋', '🤝', '✌️', '🤞', '🤟', '🤘', '👌', '👍', '👎', '✊', '👊', '🤛'],
  'Objects': ['🎈', '🎁', '🎂', '🍰', '🍕', '🍔', '☕', '🍻', '🎮', '📱', '💻', '⌚'],
  'Symbols': ['❤️', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '❣️', '💕', '💞', '💓']
};

const CustomEmojiReactions = ({ onSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('Reactions');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-panel border border-white/20 rounded-2xl p-4 max-w-sm w-full"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Smile size={20} className="text-indigo-400" />
          <h3 className="text-lg font-semibold text-white">Add Reaction</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-white/60 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {Object.keys(EMOJI_CATEGORIES).map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeCategory === category
                ? 'bg-indigo-600 text-white'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Emojis */}
      <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto">
        {EMOJI_CATEGORIES[activeCategory].map((emoji, index) => (
          <motion.button
            key={`${activeCategory}-${index}`}
            whileHover={{ scale: 1.2, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            className="p-3 text-2xl hover:bg-white/10 rounded-lg transition-colors"
          >
            {emoji}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default CustomEmojiReactions;
