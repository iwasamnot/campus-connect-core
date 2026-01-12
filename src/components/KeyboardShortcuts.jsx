import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import { FadeIn } from './AnimatedComponents';

const KeyboardShortcuts = () => {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    { key: 'Ctrl/Cmd + K', description: 'Open search' },
    { key: 'Ctrl/Cmd + /', description: 'Show keyboard shortcuts' },
    { key: 'Esc', description: 'Close modals/dialogs' },
    { key: 'Ctrl/Cmd + Enter', description: 'Send message' },
    { key: 'Ctrl/Cmd + B', description: 'Toggle sidebar (mobile)' },
    { key: 'Ctrl/Cmd + D', description: 'Toggle dark mode' },
    { key: '↑', description: 'Edit last message' },
    { key: 'Tab', description: 'Autocomplete mentions' },
  ];

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + / to open shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsOpen(true);
      }
      // Esc to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setIsOpen(false)}>
          <FadeIn delay={0.1}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="glass-panel shadow-2xl border border-white/10 rounded-[2rem] max-w-2xl w-full max-h-[80vh] overflow-y-auto backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 glass-panel border border-white/10 rounded-xl">
                    <Keyboard className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white text-glow">
                    Keyboard Shortcuts
                  </h2>
                </div>
                <motion.button
                  onClick={() => setIsOpen(false)}
                  whileHover={{ scale: 1.05, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2.5 glass-panel border border-white/10 rounded-xl text-white/70 hover:text-white hover:border-white/20 transition-all"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {shortcuts.map((shortcut, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 4, scale: 1.01 }}
                      className="flex items-center justify-between p-4 glass-panel border border-white/10 rounded-xl hover:border-white/20 transition-all"
                    >
                      <span className="text-white/80 font-medium">
                        {shortcut.description}
                      </span>
                      <kbd className="px-3 py-1.5 text-sm font-semibold text-white glass-panel bg-indigo-600/20 border border-indigo-500/30 rounded-lg shadow-sm">
                        {shortcut.key}
                      </kbd>
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: shortcuts.length * 0.05 }}
                  className="mt-6 p-4 glass-panel bg-indigo-600/10 border border-indigo-500/20 rounded-xl"
                >
                  <p className="text-sm text-white/70">
                    <strong className="text-white">Tip:</strong> Press <kbd className="px-2 py-1 text-xs glass-panel border border-white/10 rounded font-semibold text-indigo-300">Ctrl/Cmd + /</kbd> anytime to view these shortcuts.
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </FadeIn>
        </div>
      )}
    </AnimatePresence>
  );
};

export default KeyboardShortcuts;
