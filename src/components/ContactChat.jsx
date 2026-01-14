import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Send, X, Bot, User } from 'lucide-react';
import { sanitizeText } from '../utils/sanitize';
import Logo from './Logo';
import { FadeIn } from './AnimatedComponents';

const ContactChat = ({ onClose, userEmail, userName }) => {
  const { user } = useAuth() || {};
  const { success, error: showError } = useToast();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Determine user identifier
  const userId = user?.uid || `guest-${userEmail || 'anonymous'}`;
  const displayName = user?.displayName || userName || userEmail?.split('@')[0] || 'Guest';
  const userEmailValue = user?.email || userEmail;

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen to messages in realtime
  useEffect(() => {
    if (!userEmailValue) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Create a chat thread ID based on user email (consistent for same user)
    const chatThreadId = userEmailValue.replace(/[^a-zA-Z0-9]/g, '_');

    // Query messages for this user's chat thread
    const q = query(
      collection(db, 'adminSupportChat'),
      where('userEmail', '==', userEmailValue),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMessages(messagesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching messages:', error);
        // Try fallback query without orderBy
        const fallbackQ = query(
          collection(db, 'adminSupportChat'),
          where('userEmail', '==', userEmailValue),
          limit(100)
        );
        const fallbackUnsubscribe = onSnapshot(fallbackQ, (snapshot) => {
          const messagesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })).sort((a, b) => {
            const aTime = a.timestamp?.toDate?.() || new Date(a.timestamp || 0);
            const bTime = b.timestamp?.toDate?.() || new Date(b.timestamp || 0);
            return aTime - bTime;
          });
          setMessages(messagesData);
          setLoading(false);
        });
        return () => fallbackUnsubscribe();
      }
    );

    return () => unsubscribe();
  }, [userEmailValue]);

  // Send message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !userEmailValue) {
      return;
    }

    setSending(true);
    try {
      const sanitizedMessage = sanitizeText(newMessage.trim());

      const messageData = {
        userId: userId,
        userEmail: userEmailValue,
        userName: displayName,
        text: sanitizedMessage,
        isFromUser: true,
        isFromAdmin: false,
        timestamp: serverTimestamp(),
        read: false
      };

      await addDoc(collection(db, 'adminSupportChat'), messageData);

      setNewMessage('');
      success('Message sent! An admin will respond shortly.');
    } catch (error) {
      console.error('Error sending message:', error);
      showError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <FadeIn delay={0.1}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="glass-panel shadow-2xl border border-white/10 rounded-[2rem] w-full max-w-2xl max-h-[90vh] flex flex-col backdrop-blur-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 glass-panel border-b border-white/10 px-6 py-4 flex items-center justify-between backdrop-blur-xl z-10 rounded-t-[2rem]">
            <div className="flex items-center gap-3">
              <Logo size="small" showText={false} />
              <div>
                <h2 className="text-xl font-bold text-white text-glow">Support Chat</h2>
                <p className="text-sm text-white/60 mt-0.5">Chat with our admin team</p>
              </div>
            </div>
            {onClose && (
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.05, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                className="p-2.5 glass-panel border border-white/10 rounded-xl text-white/70 hover:text-white hover:border-white/20 transition-all"
                aria-label="Close"
              >
                <X size={24} />
              </motion.button>
            )}
          </div>

          {/* Messages Area */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto overscroll-contain touch-pan-y px-4 md:px-6 py-4 space-y-4 min-h-0"
          >
            {loading && messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full mx-auto mb-4"
                  />
                  <p className="text-white/60 text-sm">Loading messages...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Bot className="w-12 h-12 text-indigo-400/50 mx-auto mb-4" />
                  <p className="text-white/60 text-lg mb-2">Start a conversation</p>
                  <p className="text-white/40 text-sm">Send a message and our admin team will respond soon.</p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => {
                const isUser = message.isFromUser;
                return (
                  <motion.div
                    key={message.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start gap-2 max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        isUser 
                          ? 'bg-indigo-600' 
                          : 'bg-white/10 border border-white/20'
                      }`}>
                        {isUser ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Bot className="w-4 h-4 text-indigo-300" />
                        )}
                      </div>

                      {/* Message Bubble */}
                      <div className={`rounded-2xl px-4 py-2.5 ${
                        isUser
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white/10 border border-white/20 text-white/90'
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {message.text || message.message}
                        </p>
                        {message.timestamp && (
                          <p className={`text-xs mt-1.5 ${
                            isUser ? 'text-indigo-200' : 'text-white/50'
                          }`}>
                            {formatTime(message.timestamp)}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="sticky bottom-0 border-t border-white/10 px-4 md:px-6 py-4 bg-transparent backdrop-blur-xl rounded-b-[2rem]">
            <form onSubmit={handleSend} className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={1}
                  className="w-full px-4 py-3 pr-12 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300 resize-none"
                  disabled={sending || !userEmailValue}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  style={{
                    minHeight: '48px',
                    maxHeight: '120px'
                  }}
                />
              </div>
              <motion.button
                type="submit"
                disabled={!newMessage.trim() || sending || !userEmailValue}
                whileHover={{ scale: sending ? 1 : 1.05 }}
                whileTap={{ scale: sending ? 1 : 0.95 }}
                className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all disabled:transform-none flex-shrink-0"
              >
                {sending ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <Send size={20} />
                )}
              </motion.button>
            </form>
            {!userEmailValue && (
              <p className="text-xs text-red-400 mt-2 text-center">
                Please enter your email to start chatting
              </p>
            )}
          </div>
        </motion.div>
      </FadeIn>
    </div>
  );
};

export default ContactChat;
