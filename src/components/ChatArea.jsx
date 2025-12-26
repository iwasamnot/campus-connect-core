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
  getDocs,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Send, Trash2, Edit2, X, Check, Search, Flag, Smile, MoreVertical, User } from 'lucide-react';
import Logo from './Logo';
import UserProfilePopup from './UserProfilePopup';

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
  const [userNames, setUserNames] = useState({}); // Cache user names
  const [userProfiles, setUserProfiles] = useState({}); // Cache user profile data
  const [selectedUserId, setSelectedUserId] = useState(null); // For profile popup
  const [reacting, setReacting] = useState(new Set()); // Track reactions in progress to prevent duplicates
  const messagesEndRef = useRef(null);
  const MESSAGE_RATE_LIMIT = 3000; // 3 seconds between messages

  // Fetch all users to get names and profile data
  useEffect(() => {
    const q = query(collection(db, 'users'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = {};
      const names = {};
      const profiles = {};
      
      snapshot.docs.forEach(doc => {
        const userData = doc.data();
        
        // Determine the display name with proper fallback
        let displayName = 'Unknown';
        if (userData.name && userData.name.trim()) {
          displayName = userData.name.trim();
        } else if (userData.email) {
          displayName = userData.email.split('@')[0];
        } else {
          displayName = `User ${doc.id.substring(0, 8)}`;
        }
        
        // Store user data with online status
        users[doc.id] = {
          isOnline: userData.isOnline === true || userData.isOnline === 'true',
          lastSeen: userData.lastSeen || null,
          ...userData
        };
        
        // Store display name
        names[doc.id] = displayName;
        
        // Store full profile data
        profiles[doc.id] = {
          ...userData,
          name: displayName // Ensure name is always set
        };
      });
      
      setOnlineUsers(users);
      setUserNames(names);
      setUserProfiles(profiles);
      
      console.log('ChatArea - Loaded users:', { 
        count: snapshot.docs.length, 
        names: names,
        userIds: Object.keys(names)
      });
    }, (error) => {
      console.error('ChatArea - Error fetching users:', error);
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
      
      // Deduplicate messages by ID to prevent duplicates
      const uniqueMessages = messagesData.reduce((acc, message) => {
        if (!acc.find(m => m.id === message.id)) {
          acc.push(message);
        }
        return acc;
      }, []);
      
      // Sort by timestamp to ensure correct order
      uniqueMessages.sort((a, b) => {
        const aTime = a.timestamp?.toDate?.() || a.timestamp || 0;
        const bTime = b.timestamp?.toDate?.() || b.timestamp || 0;
        return aTime - bTime;
      });
      
      setMessages(uniqueMessages);
      
      // Mark all messages as read by current user
      if (user) {
        messagesData.forEach(async (message) => {
          const readBy = message.readBy || {};
          if (!readBy[user.uid]) {
            try {
              await updateDoc(doc(db, 'messages', message.id), {
                readBy: {
                  ...readBy,
                  [user.uid]: serverTimestamp()
                }
              });
            } catch (error) {
              console.error('Error marking message as read:', error);
            }
          }
        });
      }
    });

    return () => unsubscribe();
  }, [user]);

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

    // Get user name from cache or fetch it
    let userName = userNames[user.uid];
    if (!userName) {
      // Try to get from userProfiles cache first
      const cachedProfile = userProfiles[user.uid];
      if (cachedProfile?.name) {
        userName = cachedProfile.name;
      } else {
        // Try to get from user document
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            userName = (userData.name && userData.name.trim()) 
              ? userData.name.trim() 
              : (userData.email ? userData.email.split('@')[0] : `User ${user.uid.substring(0, 8)}`);
          } else {
            userName = user.email?.split('@')[0] || `User ${user.uid.substring(0, 8)}`;
          }
        } catch (err) {
          userName = user.email?.split('@')[0] || `User ${user.uid.substring(0, 8)}`;
        }
      }
    }

    try {
      await addDoc(collection(db, 'messages'), {
        text: originalText,
        displayText: displayText,
        toxic: isToxic,
        isAI: false,
        userId: user.uid,
        userName: userName,
        userEmail: user.email || null,
        timestamp: serverTimestamp(),
        reactions: {},
        edited: false,
        editedAt: null,
        readBy: {
          [user.uid]: serverTimestamp() // Sender has seen their own message
        }
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

  const handleEditMessage = async (messageId) => {
    if (!editText.trim()) {
      setEditing(null);
      setEditText('');
      return;
    }

    const isToxic = checkToxicity(editText.trim());
    const displayText = isToxic ? '[REDACTED BY AI]' : editText.trim();

    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, {
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
      showError(`Failed to edit message: ${error.message || 'Please try again.'}`);
    }
  };

  const handleReaction = async (messageId, emoji) => {
    // Prevent duplicate reactions
    const reactionKey = `${messageId}-${emoji}`;
    if (reacting.has(reactionKey)) {
      return; // Already processing this reaction
    }

    try {
      setReacting(prev => new Set(prev).add(reactionKey));
      
      const message = messages.find(m => m.id === messageId);
      if (!message) {
        setReacting(prev => {
          const next = new Set(prev);
          next.delete(reactionKey);
          return next;
        });
        return;
      }

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
    } finally {
      setReacting(prev => {
        const next = new Set(prev);
        next.delete(reactionKey);
        return next;
      });
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

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Never';
    const date = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getReadReceiptInfo = (message) => {
    if (!message.readBy) return { count: 0, users: [] };
    const readBy = message.readBy;
    const readUserIds = Object.keys(readBy).filter(uid => uid !== message.userId); // Exclude sender
    return {
      count: readUserIds.length,
      users: readUserIds.map(uid => ({
        uid,
        name: userNames[uid] || userProfiles[uid]?.name || 'Unknown',
        timestamp: readBy[uid]
      }))
    };
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Chat Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <Logo size="small" showText={false} />
            <div className="min-w-0 flex-1">
              <h2 className="text-lg md:text-2xl font-bold text-gray-800 dark:text-white truncate">Campus Chat</h2>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Connect with your campus community</p>
            </div>
          </div>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-700 rounded-lg transition-colors"
            title="Search messages"
          >
            <Search size={20} className="text-indigo-600 dark:text-indigo-400" />
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-600"
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
          <div className="flex-1 overflow-y-auto px-3 md:px-6 py-3 md:py-4 space-y-3 md:space-y-4">
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
            const userProfile = userProfiles[message.userId] || {};
            const profilePicture = userProfile.profilePicture;

            return (
              <div
                key={message.id}
                className={`flex items-start gap-2 ${
                  isAuthor ? 'justify-end' : 'justify-start'
                }`}
              >
                {/* Profile Picture - Only show for other users */}
                {!isAuthor && (
                  <button
                    onClick={() => setSelectedUserId(message.userId)}
                    className="flex-shrink-0 mt-1"
                  >
                    {profilePicture ? (
                      <img 
                        src={profilePicture} 
                        alt={userNames[message.userId] || 'User'} 
                        className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-700 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center border-2 border-indigo-200 dark:border-indigo-700 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors ${profilePicture ? 'hidden' : ''}`}
                    >
                      <User size={20} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </button>
                )}

                <div
                    className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 md:px-4 py-2 rounded-lg relative group ${
                    isAuthor
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700'
                  }`}
                >
                    <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedUserId(message.userId)}
                        className="text-sm font-semibold opacity-90 hover:underline cursor-pointer"
                        title={
                          onlineUsers[message.userId]?.isOnline
                            ? 'Online'
                            : onlineUsers[message.userId]?.lastSeen
                            ? `Last seen: ${formatLastSeen(onlineUsers[message.userId].lastSeen)}`
                            : 'Offline'
                        }
                      >
                        {(() => {
                          // Priority: cached name > message userName > userProfile name > email > fallback
                          const cachedName = userNames[message.userId];
                          const messageName = message.userName;
                          const profileName = userProfiles[message.userId]?.name;
                          const emailName = message.userEmail?.split('@')[0];
                          
                          return cachedName || messageName || profileName || emailName || 'Unknown';
                        })()}
                      </button>
                      {onlineUsers[message.userId]?.isOnline ? (
                        <div className="w-2 h-2 bg-green-500 rounded-full" title="Online" />
                      ) : onlineUsers[message.userId]?.lastSeen ? (
                        <div className="w-2 h-2 bg-gray-400 rounded-full" title={`Last seen: ${formatLastSeen(onlineUsers[message.userId].lastSeen)}`} />
                      ) : null}
                    </div>
                    <div className="text-xs opacity-75 ml-2">
                      {formatTimestamp(message.timestamp)}
                      {message.edited && <span className="ml-1 italic">(edited)</span>}
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
                            handleEditMessage(message.id);
                          } else if (e.key === 'Escape') {
                            setEditing(null);
                            setEditText('');
                          }
                        }}
                      />
                      <button
                        onClick={() => handleEditMessage(message.id)}
                        className="p-1 hover:bg-indigo-600 rounded"
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
                      
                      {/* Read Receipts */}
                      {isAuthor && message.readBy && (() => {
                        const readInfo = getReadReceiptInfo(message);
                        if (readInfo.count > 0) {
                          return (
                            <div className="text-xs mt-1 opacity-60 flex items-center gap-1">
                              <span>Seen by {readInfo.count}</span>
                              <div className="relative group/read">
                                <span className="cursor-help">👁️</span>
                                <div className="absolute bottom-full right-0 mb-2 hidden group-hover/read:block bg-gray-800 dark:bg-gray-900 text-white text-xs rounded-lg p-2 shadow-lg z-10 min-w-[150px]">
                                  <div className="font-semibold mb-1">Seen by:</div>
                                  {readInfo.users.map((readUser, idx) => (
                                    <div key={readUser.uid} className="py-1">
                                      {readUser.name} - {formatTimestamp(readUser.timestamp)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </>
                  )}

                  {/* Reactions */}
                  {Object.keys(reactionCounts).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Object.entries(reactionCounts).map(([emoji, count]) => {
                        const reactionKey = `${message.id}-${emoji}`;
                        const isReacting = reacting.has(reactionKey);
                        return (
                          <button
                            key={emoji}
                            onClick={() => !isReacting && handleReaction(message.id, emoji)}
                            disabled={isReacting}
                            className={`px-2 py-1 rounded text-xs transition-opacity ${
                              isReacting ? 'opacity-50 cursor-wait' : ''
                            } ${
                              userReaction === emoji
                                ? 'bg-indigo-400 dark:bg-indigo-500'
                                : 'bg-indigo-100 dark:bg-indigo-700 text-black dark:text-white border border-indigo-300 dark:border-indigo-600'
                            }`}
                          >
                            {emoji} {count}
                          </button>
                        );
                      })}
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
                        className="bg-indigo-600 hover:bg-indigo-700 text-white p-1 rounded-full"
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
                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded"
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
                        {EMOJI_REACTIONS.map((emoji) => {
                          const reactionKey = `${message.id}-${emoji}`;
                          const isReacting = reacting.has(reactionKey);
                          return (
                            <button
                              key={emoji}
                              onClick={() => !isReacting && handleReaction(message.id, emoji)}
                              disabled={isReacting}
                              className={`p-1 rounded transition-all ${
                                isReacting ? 'opacity-50 cursor-wait' : 'hover:bg-indigo-200 dark:hover:bg-indigo-700'
                              } ${
                                userReaction === emoji ? 'bg-indigo-200 dark:bg-indigo-800' : ''
                              }`}
                              title="Add reaction"
                            >
                              {emoji}
                            </button>
                          );
                        })}
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
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-3 md:px-6 py-3 md:py-4">
            <form onSubmit={sendMessage} className="flex gap-2 md:gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 md:px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 md:gap-2"
              >
                <Send size={18} className="md:w-5 md:h-5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>

      {/* User Profile Popup */}
      {selectedUserId && (
        <UserProfilePopup 
          userId={selectedUserId} 
          onClose={() => setSelectedUserId(null)} 
        />
      )}
    </div>
  );
};

export default ChatArea;
