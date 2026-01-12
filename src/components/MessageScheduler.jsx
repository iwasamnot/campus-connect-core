import { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
// Use window.__firebaseDb to avoid import/export issues in production builds
const db = typeof window !== 'undefined' && window.__firebaseDb 
  ? window.__firebaseDb 
  : null;
import { Calendar, Clock, Send, Trash2, X, Plus } from 'lucide-react';
import { SkeletonLoader } from './SkeletonLoader';
import { FadeIn, StaggerContainer, StaggerItem } from './AnimatedComponents';

const MessageScheduler = memo(() => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    text: '',
    scheduledTime: '',
    chatType: 'global' // global, private, group
  });
  const [loading, setLoading] = useState(true);

  // Fetch scheduled messages
  useMemo(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'scheduledMessages'),
      where('userId', '==', user.uid),
      where('sent', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setScheduledMessages(messages.sort((a, b) => {
        const aTime = a.scheduledTime?.toDate?.() || new Date(a.scheduledTime);
        const bTime = b.scheduledTime?.toDate?.() || new Date(b.scheduledTime);
        return aTime - bTime;
      }));
      setLoading(false);
    }, (error) => {
      console.error('Error fetching scheduled messages:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.text.trim() || !formData.scheduledTime) {
      showError('Please fill in all fields');
      return;
    }

    try {
      const scheduledDate = new Date(formData.scheduledTime);
      if (scheduledDate <= new Date()) {
        showError('Scheduled time must be in the future');
        return;
      }

      await addDoc(collection(db, 'scheduledMessages'), {
        userId: user.uid,
        text: formData.text,
        scheduledTime: scheduledDate,
        chatType: formData.chatType,
        sent: false,
        createdAt: serverTimestamp()
      });

      success('Message scheduled successfully!');
      setFormData({ text: '', scheduledTime: '', chatType: 'global' });
      setShowForm(false);
    } catch (error) {
      console.error('Error scheduling message:', error);
      showError('Failed to schedule message');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'scheduledMessages', id));
      success('Scheduled message deleted');
    } catch (error) {
      console.error('Error deleting scheduled message:', error);
      showError('Failed to delete scheduled message');
    }
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return date.toLocaleString();
  };

  const isUpcoming = (timestamp) => {
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return date > new Date();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <FadeIn delay={0.1}>
        <div 
          className="flex items-center justify-between mb-4"
          style={{
            paddingTop: `max(1rem, env(safe-area-inset-top, 0px) + 0.5rem)`,
            position: 'relative',
            zIndex: 10
          }}
        >
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white text-glow flex items-center gap-2">
              <div className="p-2 glass-panel border border-white/10 rounded-xl">
                <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400" />
              </div>
              <span>Message Scheduler</span>
            </h1>
            <p className="text-xs sm:text-sm text-white/60 mt-1">
              Schedule messages to be sent at a specific time
            </p>
          </div>
          <motion.button
            onClick={() => setShowForm(!showForm)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
          >
            <Plus className="w-4 h-4" />
            Schedule Message
          </motion.button>
        </div>
      </FadeIn>

      {/* Schedule Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <StaggerContainer staggerDelay={0.05} initialDelay={0.1}>
              <StaggerItem>
                <div className="glass-panel border border-white/10 rounded-[2rem] shadow-xl p-6 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white text-glow">
                      New Scheduled Message
                    </h2>
                    <motion.button
                      onClick={() => setShowForm(false)}
                      whileHover={{ scale: 1.05, rotate: 90 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2.5 glass-panel border border-white/10 rounded-xl text-white/70 hover:text-white hover:border-white/20 transition-all"
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <StaggerItem>
                      <div>
                        <label htmlFor="scheduler-message-text" className="block text-sm font-semibold text-white/90 mb-2.5">
                          Message Text
                        </label>
                        <textarea
                          id="scheduler-message-text"
                          name="text"
                          value={formData.text}
                          onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                          className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300 hover:border-white/20 resize-none"
                          rows={4}
                          placeholder="Enter your message..."
                          required
                        />
                      </div>
                    </StaggerItem>
                    <StaggerItem>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="scheduler-datetime" className="block text-sm font-semibold text-white/90 mb-2.5">
                            Scheduled Date & Time
                          </label>
                          <input
                            type="datetime-local"
                            id="scheduler-datetime"
                            name="scheduledTime"
                            value={formData.scheduledTime}
                            onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                            className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300 hover:border-white/20 [color-scheme:dark]"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="scheduler-chat-type" className="block text-sm font-semibold text-white/90 mb-2.5">
                            Chat Type
                          </label>
                          <select
                            id="scheduler-chat-type"
                            name="chatType"
                            value={formData.chatType}
                            onChange={(e) => setFormData({ ...formData, chatType: e.target.value })}
                            className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300 hover:border-white/20 [color-scheme:dark]"
                          >
                            <option value="global" className="bg-[#1a1a1a] text-white">Campus Chat</option>
                            <option value="private" className="bg-[#1a1a1a] text-white">Private Chat</option>
                            <option value="group" className="bg-[#1a1a1a] text-white">Group Chat</option>
                          </select>
                        </div>
                      </div>
                    </StaggerItem>
                    <StaggerItem>
                      <div className="flex gap-3">
                        <motion.button
                          type="submit"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
                        >
                          <Send className="w-4 h-4" />
                          Schedule Message
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={() => {
                            setShowForm(false);
                            setFormData({ text: '', scheduledTime: '', chatType: 'global' });
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-4 py-2.5 glass-panel border border-white/10 text-white/80 hover:text-white hover:border-white/20 rounded-xl transition-all duration-300 font-medium"
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </StaggerItem>
                  </form>
                </div>
              </StaggerItem>
            </StaggerContainer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scheduled Messages List */}
      <FadeIn delay={0.2}>
        <div className="glass-panel border border-white/10 rounded-[2rem] shadow-xl p-6 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-white text-glow mb-4 flex items-center gap-2">
            <div className="p-1.5 glass-panel border border-white/10 rounded-lg">
              <Clock className="w-5 h-5 text-indigo-400" />
            </div>
            Scheduled Messages ({scheduledMessages.length})
          </h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonLoader key={i} height="80px" />
              ))}
            </div>
          ) : scheduledMessages.length === 0 ? (
            <div className="text-center py-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-block p-4 glass-panel border border-white/10 rounded-2xl mb-4"
              >
                <Clock className="w-16 h-16 text-white/40 mx-auto" />
              </motion.div>
              <p className="text-white/60 font-medium">
                No scheduled messages. Schedule your first message above!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledMessages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -2, scale: 1.01 }}
                  className={`p-4 rounded-xl border transition-all ${
                    isUpcoming(msg.scheduledTime)
                      ? 'glass-panel bg-indigo-600/10 border-indigo-500/30 hover:border-indigo-500/50'
                      : 'glass-panel border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-white mb-2 font-medium">{msg.text}</p>
                      <div className="flex items-center gap-4 text-sm text-white/60">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-indigo-400" />
                          {formatDateTime(msg.scheduledTime)}
                        </span>
                        <span className="px-2 py-1 glass-panel bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-white/80">
                          {msg.chatType}
                        </span>
                      </div>
                    </div>
                    <motion.button
                      onClick={() => handleDelete(msg.id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 text-red-400 hover:bg-red-600/20 rounded-lg transition-all ml-4"
                      title="Delete scheduled message"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </FadeIn>
    </div>
  );
});

MessageScheduler.displayName = 'MessageScheduler';

export default MessageScheduler;
