import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Reply, Send, X, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const db = typeof window !== 'undefined' && window.__firebaseDb 
  ? window.__firebaseDb 
  : null;

/**
 * Message Thread Component
 * Displays threaded replies to a message
 */
const MessageThread = ({ parentMessageId, onClose, isOpen }) => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [threadMessages, setThreadMessages] = useState([]);
  const [newReply, setNewReply] = useState('');
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState(true);

  // Load thread messages
  useEffect(() => {
    if (!parentMessageId || !db) return;

    const threadQuery = query(
      collection(db, 'messages'),
      where('threadParentId', '==', parentMessageId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(
      threadQuery,
      (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setThreadMessages(messages);
      },
      (error) => {
        console.error('Error loading thread messages:', error);
      }
    );

    return () => unsubscribe();
  }, [parentMessageId]);

  const sendReply = async (e) => {
    e.preventDefault();
    if (!newReply.trim() || sending || !user?.uid || !db) return;

    setSending(true);
    try {
      await addDoc(collection(db, 'messages'), {
        text: newReply.trim(),
        displayText: newReply.trim(),
        threadParentId: parentMessageId,
        isThreadReply: true,
        userId: user.uid,
        userEmail: user.email || null,
        timestamp: serverTimestamp(),
        toxic: false,
        isAI: false,
        reactions: {},
        readBy: {
          [user.uid]: serverTimestamp()
        }
      });

      setNewReply('');
      success('Reply sent!');
    } catch (error) {
      console.error('Error sending reply:', error);
      showError('Failed to send reply. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-2 ml-8 border-l-2 border-indigo-500/30 pl-4 space-y-2"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm text-white/60 hover:text-white/80 transition-colors"
      >
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        <MessageSquare size={14} />
        <span>{threadMessages.length} {threadMessages.length === 1 ? 'reply' : 'replies'}</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {threadMessages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-2 glass-panel bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex items-start gap-2">
                  <Reply size={12} className="text-indigo-300 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-white/80">
                        {message.userName || 'User'}
                      </span>
                      <span className="text-xs text-white/40">
                        {message.timestamp?.toDate?.().toLocaleTimeString() || ''}
                      </span>
                    </div>
                    <p className="text-sm text-white/90 break-words">
                      {message.displayText || message.text}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

            <form onSubmit={sendReply} className="mt-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  placeholder="Reply in thread..."
                  className="flex-1 px-3 py-2 text-sm glass-panel border border-white/10 rounded-lg bg-white/5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!newReply.trim() || sending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MessageThread;
