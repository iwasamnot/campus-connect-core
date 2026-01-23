/**
 * Global Commons - Universal Group Chat
 * Everyone speaks their own language, but reads in English
 * WhatsApp-style group chat with real-time translation
 */

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { Send, Languages, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { translateMessage } from '../utils/aiProvider';

// Use window.__firebaseDb to avoid import/export issues
const db = typeof window !== 'undefined' && window.__firebaseDb 
  ? window.__firebaseDb 
  : null;

const SUPPORTED_LANGUAGES = [
  { code: 'English', name: 'English', flag: '🇬🇧' },
  { code: 'Urdu', name: 'Urdu', flag: '🇵🇰' },
  { code: 'Mandarin', name: 'Mandarin', flag: '🇨🇳' },
  { code: 'Spanish', name: 'Spanish', flag: '🇪🇸' },
  { code: 'Hindi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'Persian', name: 'Persian', flag: '🇮🇷' },
  { code: 'Nepali', name: 'Nepali', flag: '🇳🇵' },
  { code: 'Punjabi', name: 'Punjabi', flag: '🇮🇳' },
];

const GlobalCommons = () => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [translating, setTranslating] = useState(new Set()); // Track messages being translated
  const [userNames, setUserNames] = useState({});
  const messagesEndRef = useRef(null);
  const mountedRef = useRef(true);

  // Load user's preferred language from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem('globalCommonsLanguage');
    if (savedLang && SUPPORTED_LANGUAGES.find(l => l.code === savedLang)) {
      setSelectedLanguage(savedLang);
    }
  }, []);

  // Save language preference
  useEffect(() => {
    if (selectedLanguage) {
      localStorage.setItem('globalCommonsLanguage', selectedLanguage);
    }
  }, [selectedLanguage]);

  // Fetch user names
  useEffect(() => {
    if (!db || !user) return;

    const fetchUserNames = async () => {
      try {
        const { collection: col, getDocs } = await import('firebase/firestore');
        const usersSnapshot = await getDocs(col(db, 'users'));
        const names = {};
        usersSnapshot.forEach(doc => {
          const userData = doc.data();
          names[doc.id] = userData.name || 
                         userData.email?.split('@')[0] || 
                         doc.id.substring(0, 8);
        });
        setUserNames(names);
      } catch (error) {
        console.error('Error fetching user names:', error);
      }
    };

    fetchUserNames();
  }, [user]);

  // Fetch messages from Firestore
  useEffect(() => {
    if (!db) return;

    mountedRef.current = true;

    const messagesQuery = query(
      collection(db, 'globalCommonsMessages'),
      orderBy('timestamp', 'asc'),
      limit(100) // Load last 100 messages
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        if (!mountedRef.current) return;

        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Sort by timestamp
        messagesData.sort((a, b) => {
          const aTime = a.timestamp?.toDate?.() || a.timestamp || 0;
          const bTime = b.timestamp?.toDate?.() || b.timestamp || 0;
          return aTime - bTime;
        });

        setMessages(messagesData);

        // Auto-translate new messages that don't have translations yet
        messagesData.forEach(async (msg) => {
          if (msg.sourceLanguage && msg.sourceLanguage !== 'English' && !msg.translatedText) {
            if (!translating.has(msg.id)) {
              setTranslating(prev => new Set(prev).add(msg.id));
              
              try {
                const translated = await translateMessage(msg.text, msg.sourceLanguage);
                
                // Update message in Firestore with translation
                const { doc: docRef, updateDoc } = await import('firebase/firestore');
                await updateDoc(docRef(db, 'globalCommonsMessages', msg.id), {
                  translatedText: translated
                });
              } catch (error) {
                console.error('Error translating message:', error);
              } finally {
                setTranslating(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(msg.id);
                  return newSet;
                });
              }
            }
          }
        });
      },
      (error) => {
        console.error('Error fetching messages:', error);
        showError('Error loading messages. Please refresh the page.');
      }
    );

    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, [showError, translating]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !user) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      // Translate message to English if not already English
      let translatedText = messageText;
      if (selectedLanguage !== 'English') {
        try {
          translatedText = await translateMessage(messageText, selectedLanguage);
        } catch (error) {
          console.error('Translation error:', error);
          // Continue with original text if translation fails
        }
      }

      // Store message in Firestore
      const messageData = {
        userId: user.uid,
        userName: userNames[user.uid] || user.email?.split('@')[0] || 'Anonymous',
        text: messageText, // Original text
        translatedText: translatedText, // English translation
        sourceLanguage: selectedLanguage,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'globalCommonsMessages'), messageData);
      
      success('Message sent!');
    } catch (error) {
      console.error('Error sending message:', error);
      showError('Failed to send message. Please try again.');
      setNewMessage(messageText); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp?.toDate?.() || new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getLanguageFlag = (langCode) => {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    return lang?.flag || '🌐';
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="glass-panel border-b border-white/10 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/30 border border-indigo-500/50 rounded-xl">
              <Languages className="text-indigo-300" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Global Commons</h2>
              <p className="text-sm text-white/60">Speak your language, read in English</p>
            </div>
          </div>
          
          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <Languages className="text-white/60" size={18} />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="glass-panel border border-white/10 rounded-lg px-3 py-2 text-white bg-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code} className="bg-slate-800">
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <AnimatePresence>
          {messages.map((message) => {
            const isOwnMessage = message.userId === user?.uid;
            const isTranslating = translating.has(message.id);
            const displayText = message.translatedText || message.text;
            const showOriginal = message.sourceLanguage && message.sourceLanguage !== 'English' && message.text !== message.translatedText;

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  {/* User name and time */}
                  {!isOwnMessage && (
                    <div className="flex items-center gap-2 text-xs text-white/60 px-2">
                      <span>{message.userName}</span>
                      <span>•</span>
                      <span>{formatTime(message.timestamp)}</span>
                      {message.sourceLanguage && (
                        <>
                          <span>•</span>
                          <span>{getLanguageFlag(message.sourceLanguage)}</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isOwnMessage
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'glass-panel border border-white/10 text-white rounded-bl-sm'
                    }`}
                  >
                    {/* Original text (small, gray) - only if different from translation */}
                    {showOriginal && (
                      <div className="text-xs text-white/50 mb-1 italic">
                        {message.text}
                      </div>
                    )}

                    {/* Translated text (big, readable) */}
                    <div className="text-base">
                      {isTranslating ? (
                        <div className="flex items-center gap-2">
                          <Loader className="animate-spin" size={14} />
                          <span className="text-white/70">Translating...</span>
                        </div>
                      ) : (
                        displayText
                      )}
                    </div>
                  </div>

                  {/* Own message time */}
                  {isOwnMessage && (
                    <div className="text-xs text-white/60 px-2">
                      {formatTime(message.timestamp)}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="glass-panel border-t border-white/10 px-4 py-3 flex-shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <div className="flex-1 glass-panel border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Type in ${selectedLanguage}...`}
              className="flex-1 bg-transparent text-white placeholder-white/50 focus:outline-none"
              disabled={sending}
            />
            <span className="text-white/60 text-sm">
              {getLanguageFlag(selectedLanguage)}
            </span>
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all flex items-center justify-center"
          >
            {sending ? (
              <Loader className="animate-spin" size={20} />
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GlobalCommons;
