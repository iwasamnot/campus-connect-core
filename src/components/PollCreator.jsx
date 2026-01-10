import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { FadeIn } from './AnimatedComponents';

/**
 * Poll Creator Component
 * Create polls with multiple options for groups and chats
 */
const PollCreator = ({ onClose, onPollCreate, chatType, chatId }) => {
  const { success, error: showError } = useToast();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [duration, setDuration] = useState('1'); // days

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreate = () => {
    // Validation
    if (!question.trim()) {
      showError('Please enter a question');
      return;
    }

    const validOptions = options.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) {
      showError('Please provide at least 2 options');
      return;
    }

    const pollData = {
      question: question.trim(),
      options: validOptions.map(opt => ({
        text: opt.trim(),
        votes: 0,
        voters: []
      })),
      allowMultiple,
      anonymous,
      duration: parseInt(duration),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000),
      chatType,
      chatId,
      totalVotes: 0,
      voters: []
    };

    onPollCreate(pollData);
    success('Poll created successfully!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <FadeIn delay={0.1}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="glass-panel shadow-2xl border border-white/10 rounded-[2rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto backdrop-blur-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white text-glow">Create Poll</h2>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.05, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                className="p-2.5 glass-panel border border-white/10 rounded-xl text-white/70 hover:text-white hover:border-white/20 transition-all"
                aria-label="Close"
              >
                <X size={24} />
              </motion.button>
            </div>

            {/* Question */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-white/90 mb-2.5">
                Question *
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question..."
                className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300 hover:border-white/20"
                maxLength={200}
              />
            </div>

            {/* Options */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-white/90 mb-2.5">
                Options * (at least 2)
              </label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300 hover:border-white/20"
                      maxLength={100}
                    />
                    {options.length > 2 && (
                      <motion.button
                        onClick={() => removeOption(index)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 text-red-400 hover:bg-red-600/20 rounded-lg transition-all"
                        aria-label={`Remove option ${index + 1}`}
                      >
                        <Trash2 size={18} />
                      </motion.button>
                    )}
                  </motion.div>
                ))}
                {options.length < 10 && (
                  <motion.button
                    onClick={addOption}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-4 py-2.5 text-indigo-400 hover:text-indigo-300 glass-panel border border-indigo-500/30 hover:border-indigo-500/50 rounded-xl transition-all font-medium"
                  >
                    <Plus size={18} />
                    <span>Add Option</span>
                  </motion.button>
                )}
              </div>
            </div>

            {/* Settings */}
            <div className="mb-6 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer p-3 glass-panel border border-white/10 rounded-xl hover:border-white/20 transition-all">
                <input
                  type="checkbox"
                  checked={allowMultiple}
                  onChange={(e) => setAllowMultiple(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-white/20 bg-white/5"
                />
                <span className="text-sm text-white/80 font-medium">Allow multiple votes</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 glass-panel border border-white/10 rounded-xl hover:border-white/20 transition-all">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-white/20 bg-white/5"
                />
                <span className="text-sm text-white/80 font-medium">Anonymous voting</span>
              </label>

              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2.5">
                  Duration (days)
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300 hover:border-white/20 [color-scheme:dark]"
                >
                  <option value="1" className="bg-[#1a1a1a] text-white">1 day</option>
                  <option value="3" className="bg-[#1a1a1a] text-white">3 days</option>
                  <option value="7" className="bg-[#1a1a1a] text-white">7 days</option>
                  <option value="30" className="bg-[#1a1a1a] text-white">30 days</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2.5 glass-panel border border-white/10 text-white/80 hover:text-white hover:border-white/20 rounded-xl transition-all duration-300 font-medium"
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={handleCreate}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
              >
                Create Poll
              </motion.button>
            </div>
          </div>
        </motion.div>
      </FadeIn>
    </div>
  );
};

export default PollCreator;
