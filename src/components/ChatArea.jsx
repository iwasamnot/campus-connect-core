import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { isAdminRole } from '../utils/helpers';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  doc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Send, Trash2 } from 'lucide-react';

const ChatArea = () => {
  const { user, userRole } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch messages from Firestore
  useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, []);

  // AI Moderation Logic
  const checkToxicity = (text) => {
    const toxicWords = ['bad', 'hate', 'stupid'];
    const lowerText = text.toLowerCase();
    
    for (const word of toxicWords) {
      if (lowerText.includes(word)) {
        return true;
      }
    }
    return false;
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const originalText = newMessage.trim();
    const isToxic = checkToxicity(originalText);
    const displayText = isToxic ? '[REDACTED BY AI]' : originalText;

    try {
      await addDoc(collection(db, 'messages'), {
        text: originalText, // Store original text
        displayText: displayText, // Store redacted text for display
        toxic: isToxic,
        isAI: false, // This is user-generated, not AI-generated
        userId: user.uid,
        userName: user.email || user.uid.substring(0, 8), // Use email if available, otherwise UID
        userEmail: user.email || null,
        timestamp: serverTimestamp()
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) return;

    setDeleting(messageId);
    try {
      await deleteDoc(doc(db, 'messages', messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Chat Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Global Chat</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Connect with your campus community</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 dark:text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-2 ${
                message.userId === user?.uid ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative group ${
                  message.userId === user?.uid
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="text-xs opacity-75 mb-1">
                  {message.userName}
                </div>
                <div className="text-sm">
                  {message.displayText || message.text}
                </div>
                {message.toxic && (
                  <div className="text-xs mt-1 opacity-75 italic">
                    ⚠️ Flagged by AI
                  </div>
                )}
                {isAdminRole(userRole) && (
                  <button
                    onClick={() => handleDeleteMessage(message.id)}
                    disabled={deleting === message.id}
                    className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete message"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <form onSubmit={sendMessage} className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={20} />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatArea;

