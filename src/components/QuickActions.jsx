import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, MessageSquare, Users, Sparkles, Calendar, Bookmark, Image as ImageIcon, Plus, X } from 'lucide-react';

/**
 * Quick Actions Panel
 * Floating action buttons for common tasks
 */
const QuickActions = ({ onAction, isOpen, onToggle }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const actualOpen = isOpen !== undefined ? isOpen : internalOpen;
  const handleToggle = useCallback(() => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalOpen(prev => !prev);
    }
  }, [onToggle]);

  const actions = [
    { id: 'new-message', label: 'New Message', icon: MessageSquare, color: 'indigo' },
    { id: 'new-group', label: 'New Group', icon: Users, color: 'purple' },
    { id: 'add-gif', label: 'Add GIF', icon: Sparkles, color: 'pink' },
    { id: 'schedule', label: 'Schedule', icon: Calendar, color: 'blue' },
    { id: 'save', label: 'Save', icon: Bookmark, color: 'yellow' },
    { id: 'gallery', label: 'Gallery', icon: ImageIcon, color: 'green' },
  ];

  const colorClasses = {
    indigo: 'bg-indigo-600 hover:bg-indigo-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    pink: 'bg-pink-600 hover:bg-pink-700',
    blue: 'bg-blue-600 hover:bg-blue-700',
    yellow: 'bg-yellow-600 hover:bg-yellow-700',
    green: 'bg-green-600 hover:bg-green-700',
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={handleToggle}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-2xl flex items-center justify-center text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-black"
        aria-label="Quick Actions"
        aria-expanded={actualOpen}
      >
        <AnimatePresence mode="wait">
          {actualOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <Zap size={24} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Actions Menu */}
      <AnimatePresence>
        {actualOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              onClick={handleToggle}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="fixed bottom-24 right-6 z-50 glass-panel border border-white/20 rounded-2xl p-4 shadow-2xl"
            >
              <div className="grid grid-cols-3 gap-3">
                {actions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <motion.button
                      key={action.id}
                      onClick={() => {
                        onAction(action.id);
                        handleToggle();
                      }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.1, y: -4 }}
                      whileTap={{ scale: 0.95 }}
                      className={`${colorClasses[action.color]} w-16 h-16 rounded-xl flex flex-col items-center justify-center text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50 min-w-[64px] min-h-[64px]`}
                      title={action.label}
                      aria-label={action.label}
                    >
                      <Icon size={20} />
                      <span className="text-xs mt-1 font-medium">{action.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default QuickActions;
