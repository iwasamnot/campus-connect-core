import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isAdminRole } from '../utils/helpers';
import { 
  collection, 
  addDoc, 
  query, 
  where,
  orderBy, 
  onSnapshot,
  serverTimestamp,
  doc,
  deleteDoc,
  updateDoc,
  limit,
  startAfter,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Send, Trash2, Edit2, X, Check, Search, Flag, Smile, MoreVertical } from 'lucide-react';
import Logo from './Logo';

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

const ChatArea = () => {
  const { user, userRole } = useAuth();
  const { success, error: showError } = useToast();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const [reporting, setReporting] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [onlineUsers, setOnlineUsers] = useState({});
  const messagesEndRef = useRef(null);
  const MESSAGE_RATE_LIMIT = 3000; // 3 seconds between messages

  // Fetch online users
  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('isOnline', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = {};
      snapshot.docs.forEach(doc => {
        users[doc.id] = doc.data();
      });
      setOnlineUsers(users);
    });

    return () => unsubscribe();
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch messages from Firestore with pagination
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

    // Rate limiting
    const now = Date.now();
    if (now - lastMessageTime < MESSAGE_RATE_LIMIT) {
      const remaining = Math.ceil((MESSAGE_RATE_LIMIT - (now - lastMessageTime)) / 1000);
      showError(`Please wait ${remaining} second(s) before sending another message.`);
      return;
    }

    setSending(true);
    const originalText = newMessage.trim();
    const isToxic = checkToxicity(originalText);
    const displayText = isToxic ? '[REDACTED BY AI]' : originalText;

    try {
      await addDoc(collection(db, 'messages'), {
        text: originalText,
        displayText: displayText,
        toxic: isToxic,
        isAI: false,
        userId: user.uid,
        userName: user.email || user.uid.substring(0, 8),
        userEmail: user.email || null,
        timestamp: serverTimestamp(),
        reactions: {},
        edited: false,
        editedAt: null
      });

      setNewMessage('');
      setLastMessageTime(now);
      success('Message sent!');
    } catch (error) {
      console.error('Error sending message:', error);
      showError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId, messageUserId) => {
    const isAuthor = messageUserId === user?.uid;
    const isAdmin = isAdminRole(userRole);
    
    if (!isAuthor && !isAdmin) {
      showError('You can only delete your own messages.');
      return;
    }

    if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) return;

    setDeleting(messageId);
    try {
      await deleteDoc(doc(db, 'messages', messageId));
      success('Message deleted successfully.');
    } catch (error) {
      console.error('Error deleting message:', error);
      showError('Failed to delete message. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleEditMessage = async (messageId, currentText) => {
    if (!editText.trim()) {
      setEditing(null);
      return;
    }

    const isToxic = checkToxicity(editText.trim());
    const displayText = isToxic ? '[REDACTED BY AI]' : editText.trim();

    try {
      await updateDoc(doc(db, 'messages', messageId), {
        text: editText.trim(),
        displayText: displayText,
        toxic: isToxic,
        edited: true,
        editedAt: serverTimestamp()
      });
      setEditing(null);
      setEditText('');
      success('Message updated successfully.');
    } catch (error) {
      console.error('Error editing message:', error);
      showError('Failed to edit message. Please try again.');
    }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      const message = messages.find(m => m.id === messageId);
      const currentReactions = message?.reactions || {};
      const userReaction = currentReactions[user.uid];

      if (userReaction === emoji) {
        // Remove reaction
        const updatedReactions = { ...currentReactions };
        delete updatedReactions[user.uid];
        await updateDoc(doc(db, 'messages', messageId), {
          reactions: updatedReactions
        });
      } else {
        // Add or update reaction
        await updateDoc(doc(db, 'messages', messageId), {
          reactions: {
            ...currentReactions,
            [user.uid]: emoji
          }
        });
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
      showError('Failed to add reaction. Please try again.');
    }
  };

  const handleReportMessage = async (messageId) => {
    if (!reportReason.trim()) {
      showError('Please provide a reason for reporting this message.');
      return;
    }

    try {
      await addDoc(collection(db, 'reports'), {
        messageId: messageId,
        reportedBy: user.uid,
        reportedByEmail: user.email,
        reason: reportReason.trim(),
        timestamp: serverTimestamp(),
        status: 'pending'
      });
      
      setReporting(null);
      setReportReason('');
      success('Message reported. Thank you for helping keep the community safe.');
    } catch (error) {
      console.error('Error reporting message:', error);
      showError('Failed to report message. Please try again.');
    }
  };

  const filteredMessages = searchQuery
    ? messages.filter(msg => 
        (msg.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         msg.displayText?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         msg.userName?.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : messages;

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Chat Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="small" showText={false} />
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Global Chat</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Connect with your campus community</p>
            </div>
          </div>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Search messages"
          >
            <Search size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        
        {showSearch && (
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sistc-600"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Found {filteredMessages.length} message(s)
              </p>
            )}
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {filteredMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 dark:text-gray-500">
              {searchQuery ? 'No messages found matching your search.' : 'No messages yet. Start the conversation!'}
            </p>
          </div>
        ) : (
          filteredMessages.map((message) => {
            const isAuthor = message.userId === user?.uid;
            const isAdmin = isAdminRole(userRole);
            const canEdit = isAuthor && !message.edited;
            const canDelete = isAuthor || isAdmin;
            const userReaction = message.reactions?.[user.uid];
            const reactionCounts = message.reactions ? Object.values(message.reactions).reduce((acc, emoji) => {
              acc[emoji] = (acc[emoji] || 0) + 1;
              return acc;
            }, {}) : {};

            return (
              <div
                key={message.id}
                className={`flex items-start gap-2 ${
                  isAuthor ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative group ${
                    isAuthor
                      ? 'bg-sistc-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="text-xs opacity-75">
                        {message.userName}
                      </div>
                      {onlineUsers[message.userId]?.isOnline && (
                        <div className="w-2 h-2 bg-green-500 rounded-full" title="Online" />
                      )}
                    </div>
                    <div className="text-xs opacity-75">
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                  
                  {editing === message.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 px-2 py-1 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleEditMessage(message.id, editText);
                          } else if (e.key === 'Escape') {
                            setEditing(null);
                            setEditText('');
                          }
                        }}
                      />
                      <button
                        onClick={() => handleEditMessage(message.id, editText)}
                        className="p-1 hover:bg-green-600 rounded"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setEditing(null);
                          setEditText('');
                        }}
                        className="p-1 hover:bg-red-600 rounded"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm">
                        {message.displayText || message.text}
                      </div>
                      {message.edited && (
                        <div className="text-xs mt-1 opacity-75 italic">
                          (edited)
                        </div>
                      )}
                      {message.toxic && (
                        <div className="text-xs mt-1 opacity-75 italic">
                          ⚠️ Flagged by AI
                        </div>
                      )}
                    </>
                  )}

                  {/* Reactions */}
                  {Object.keys(reactionCounts).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Object.entries(reactionCounts).map(([emoji, count]) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(message.id, emoji)}
                          className={`px-2 py-1 rounded text-xs ${
                            userReaction === emoji
                              ? 'bg-sistc-400 dark:bg-sistc-500'
                              : 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white border border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          {emoji} {count}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    {canEdit && (
                      <button
                        onClick={() => {
                          setEditing(message.id);
                          setEditText(message.text);
                        }}
                        className="bg-sistc-600 hover:bg-sistc-700 text-white p-1 rounded-full"
                        title="Edit message"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteMessage(message.id, message.userId)}
                        disabled={deleting === message.id}
                        className="bg-red-600 hover:bg-red-700 text-white p-1 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete message"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    {!isAuthor && (
                      <div className="relative">
                        <button
                          onClick={() => setReporting(reporting === message.id ? null : message.id)}
                          className="bg-orange-600 hover:bg-orange-700 text-white p-1 rounded-full"
                          title="Report message"
                        >
                          <Flag size={14} />
                        </button>
                        {reporting === message.id && (
                          <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-10 min-w-[200px]">
                            <textarea
                              value={reportReason}
                              onChange={(e) => setReportReason(e.target.value)}
                              placeholder="Reason for reporting..."
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-2"
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleReportMessage(message.id)}
                                className="flex-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                              >
                                Report
                              </button>
                              <button
                                onClick={() => {
                                  setReporting(null);
                                  setReportReason('');
                                }}
                                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Reaction picker */}
                  {!isAuthor && (
                    <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        {EMOJI_REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(message.id, emoji)}
                            className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                              userReaction === emoji ? 'bg-sistc-200 dark:bg-sistc-800' : ''
                            }`}
                            title="Add reaction"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
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
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sistc-600 focus:border-transparent"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="bg-sistc-600 hover:bg-sistc-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
