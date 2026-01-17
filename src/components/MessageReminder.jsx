import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const db = typeof window !== 'undefined' && window.__firebaseDb 
  ? window.__firebaseDb 
  : null;

/**
 * Message Reminder Component
 * Set reminders for important messages
 */
const MessageReminder = ({ message, onClose }) => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [reminderTime, setReminderTime] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [saving, setSaving] = useState(false);

  const setReminder = async () => {
    if (!reminderDate || !reminderTime || !user?.uid || !db || !message?.id) return;

    setSaving(true);
    try {
      const reminderDateTime = new Date(`${reminderDate}T${reminderTime}`);
      const now = new Date();

      if (reminderDateTime <= now) {
        showError('Reminder time must be in the future');
        setSaving(false);
        return;
      }

      await updateDoc(doc(db, 'messages', message.id), {
        reminder: {
          userId: user.uid,
          reminderAt: reminderDateTime,
          setAt: new Date()
        }
      });

      success('Reminder set successfully!');
      onClose();
    } catch (error) {
      console.error('Error setting reminder:', error);
      showError('Failed to set reminder. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const clearReminder = async () => {
    if (!user?.uid || !db || !message?.id) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'messages', message.id), {
        reminder: null
      });

      success('Reminder cleared');
      onClose();
    } catch (error) {
      console.error('Error clearing reminder:', error);
      showError('Failed to clear reminder. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const defaultTime = new Date(Date.now() + 3600000).toTimeString().slice(0, 5); // 1 hour from now

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="glass-panel border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-indigo-400" />
            <h3 className="text-lg font-semibold text-white">Set Reminder</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/60 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {message?.reminder ? (
          <div className="space-y-4">
            <p className="text-sm text-white/70">
              Reminder set for:{' '}
              <span className="font-medium text-white">
                {new Date(message.reminder.reminderAt?.seconds * 1000 || message.reminder.reminderAt).toLocaleString()}
              </span>
            </p>
            <button
              onClick={clearReminder}
              disabled={saving}
              className="w-full px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors disabled:opacity-50"
            >
              Clear Reminder
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Date
              </label>
              <input
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                min={today}
                className="w-full px-3 py-2 glass-panel border border-white/10 rounded-lg bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Time
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full px-3 py-2 glass-panel border border-white/10 rounded-lg bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <button
              onClick={setReminder}
              disabled={!reminderDate || !reminderTime || saving}
              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Clock size={16} />
              Set Reminder
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default MessageReminder;
