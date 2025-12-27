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
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Send, Trash2, Edit2, X, Check, ArrowLeft, MessageCircle, User } from 'lucide-react';
import UserProfilePopup from './UserProfilePopup';

const PrivateChat = () => {
  const { user, userRole } = useAuth();
  const { success, error: showError } = useToast();
  const [availableUsers, setAvailableUsers] = useState([]); // List of admins (for students) or students (for admins)
  const [selectedChatId, setSelectedChatId] = useState(null); // Current chat ID
  const [selectedUser, setSelectedUser] = useState(null); // The other user in the chat
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState('');
  const [userNames, setUserNames] = useState({});
  const [userProfiles, setUserProfiles] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const messagesEndRef = useRef(null);

  // Generate chat ID from two user IDs (sorted to ensure consistency)
  const getChatId = (userId1, userId2) => {
    return [userId1, userId2].sort().join('_');
  };

  // Fetch available users (admins for students, students for admins)
  useEffect(() => {
    if (!user) return;

    let q;
    if (isAdminRole(userRole)) {
      // Admin viewing: fetch students
      q = query(
        collection(db, 'users'),
        where('role', '==', 'student')
      );
    } else {
      // Student viewing: fetch admins (both 'admin' and 'admin1')
      // Firestore doesn't support OR in where, so we'll fetch and filter client-side
      q = query(collection(db, 'users'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = [];
      const names = {};
      const profiles = {};
      const online = {};

      snapshot.docs.forEach(doc => {
        const userData = doc.data();
        // Exclude current user
        if (doc.id === user.uid) return;
        
        // If student, only show admins (admin or admin1)
        // If admin, only show students
        if (isAdminRole(userRole)) {
          if (userData.role !== 'student') return;
        } else {
          if (userData.role !== 'admin' && userData.role !== 'admin1') return;
        }

        users.push({
          id: doc.id,
          ...userData
        });
        names[doc.id] = userData.name || userData.email?.split('@')[0] || doc.id.substring(0, 8);
        profiles[doc.id] = userData;
        online[doc.id] = {
          isOnline: userData.isOnline || false,
          lastSeen: userData.lastSeen || null
        };
      });

      setAvailableUsers(users);
      setUserNames(names);
      setUserProfiles(profiles);
      setOnlineUsers(online);
    });

    return () => unsubscribe();
  }, [user, userRole]);

  // Fetch messages for selected chat
  useEffect(() => {
    if (!selectedChatId || !user) return;

    const messagesRef = collection(db, 'privateChats', selectedChatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Deduplicate messages by ID
      const uniqueMessages = messagesData.reduce((acc, message) => {
        if (!acc.find(m => m.id === message.id)) {
          acc.push(message);
        }
        return acc;
      }, []);

      // Sort by timestamp
      uniqueMessages.sort((a, b) => {
        const aTime = a.timestamp?.toDate?.() || a.timestamp || 0;
        const bTime = b.timestamp?.toDate?.() || b.timestamp || 0;
        return aTime - bTime;
      });

      setMessages(uniqueMessages);

      // Mark messages as read
      messagesData.forEach(async (message) => {
        if (message.userId !== user.uid) {
          const readBy = message.readBy || {};
          if (!readBy[user.uid]) {
            try {
              await updateDoc(doc(db, 'privateChats', selectedChatId, 'messages', message.id), {
                readBy: {
                  ...readBy,
                  [user.uid]: serverTimestamp()
                }
              });
            } catch (error) {
              console.error('Error marking message as read:', error);
            }
          }
        }
      });
    });

    return () => unsubscribe();
  }, [selectedChatId, user]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Select or create a chat with a user
  const selectChat = async (otherUser) => {
    const chatId = getChatId(user.uid, otherUser.id);
    setSelectedChatId(chatId);
    setSelectedUser(otherUser);

    // Create chat document if it doesn't exist
    try {
      const chatDoc = await getDoc(doc(db, 'privateChats', chatId));
      if (!chatDoc.exists()) {
        await setDoc(doc(db, 'privateChats', chatId), {
          participants: [user.uid, otherUser.id].sort(),
          createdAt: serverTimestamp(),
          lastMessage: null,
          lastMessageTime: null
        });
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      showError('Failed to create chat. Please try again.');
    }
  };

  // Check toxicity (simple word filter)
  const checkToxicity = (text) => {
    const toxicWords = ['bad', 'hate', 'stupid'];
    const lowerText = text.toLowerCase();
    return toxicWords.some(word => lowerText.includes(word));
  };

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !selectedChatId) return;

    const isToxic = checkToxicity(newMessage.trim());
    const displayText = isToxic ? '[REDACTED BY AI]' : newMessage.trim();

    setSending(true);
    try {
      await addDoc(collection(db, 'privateChats', selectedChatId, 'messages'), {
        userId: user.uid,
        userEmail: user.email,
        text: newMessage.trim(),
        displayText: displayText,
        toxic: isToxic,
        timestamp: serverTimestamp(),
        readBy: {
          [user.uid]: serverTimestamp() // Sender has seen their own message
        }
      });

      // Update chat's last message
      await updateDoc(doc(db, 'privateChats', selectedChatId), {
        lastMessage: displayText,
        lastMessageTime: serverTimestamp()
      });

      setNewMessage('');
      success('Message sent!');
    } catch (error) {
      console.error('Error sending message:', error);
      showError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    if (!selectedChatId) return;

    setDeleting(messageId);
    try {
      await deleteDoc(doc(db, 'privateChats', selectedChatId, 'messages', messageId));
      success('Message deleted successfully.');
    } catch (error) {
      console.error('Error deleting message:', error);
      showError('Failed to delete message. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  // Edit message
  const handleEditMessage = async (messageId) => {
    if (!editText.trim()) {
      setEditing(null);
      setEditText('');
      return;
    }
    if (!selectedChatId) return;

    const isToxic = checkToxicity(editText.trim());
    const displayText = isToxic ? '[REDACTED BY AI]' : editText.trim();

    try {
      await updateDoc(doc(db, 'privateChats', selectedChatId, 'messages', messageId), {
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
      console.error('Error updating message:', error);
      showError('Failed to update message. Please try again.');
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
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

  // If no chat selected, show list of available users
  if (!selectedChatId) {
    return (
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {isAdminRole(userRole) ? 'Private Chat with Students' : 'Private Chat with Admins'}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Select a user to start a private conversation
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {availableUsers.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {isAdminRole(userRole) ? 'No students available' : 'No admins available'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableUsers.map((otherUser) => (
                <button
                  key={otherUser.id}
                  onClick={() => selectChat(otherUser)}
                  className="w-full flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="relative">
                    {otherUser.profilePicture ? (
                      <img
                        src={otherUser.profilePicture}
                        alt={userNames[otherUser.id] || 'User'}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                        {(userNames[otherUser.id] || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    {onlineUsers[otherUser.id]?.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {userNames[otherUser.id] || 'Unknown User'}
                      </h3>
                      {isAdminRole(otherUser.role) && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {otherUser.email || otherUser.studentEmail || 'No email'}
                    </p>
                  </div>
                  <User
                    size={20}
                    className="text-gray-400 flex-shrink-0"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show chat interface
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 md:p-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setSelectedChatId(null);
              setSelectedUser(null);
              setMessages([]);
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          <div className="relative">
            {selectedUser?.profilePicture ? (
              <img
                src={selectedUser.profilePicture}
                alt={userNames[selectedUser.id] || 'User'}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                {(userNames[selectedUser.id] || 'U')[0].toUpperCase()}
              </div>
            )}
            {onlineUsers[selectedUser.id]?.isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <button
              onClick={() => setSelectedUserId(selectedUser.id)}
              className="text-left"
            >
              <h2 className="font-semibold text-gray-900 dark:text-white truncate">
                {userNames[selectedUser.id] || 'Unknown User'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {onlineUsers[selectedUser.id]?.isOnline ? 'Online' : 
                 onlineUsers[selectedUser.id]?.lastSeen ? 
                 `Last seen ${formatTime(onlineUsers[selectedUser.id].lastSeen)}` : 
                 'Offline'}
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.userId === user.uid;
            const messageUser = userProfiles[message.userId] || {};
            const messageUserName = userNames[message.userId] || message.userEmail?.split('@')[0] || 'Unknown';

            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[80%] md:max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isOwn && (
                    <button
                      onClick={() => setSelectedUserId(message.userId)}
                      className="flex-shrink-0"
                    >
                      {messageUser.profilePicture ? (
                        <img
                          src={messageUser.profilePicture}
                          alt={messageUserName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                          {messageUserName[0].toUpperCase()}
                        </div>
                      )}
                    </button>
                  )}
                  <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                    {!isOwn && (
                      <span className="text-xs text-gray-600 dark:text-gray-400 mb-1 px-2">
                        {messageUserName}
                      </span>
                    )}
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        isOwn
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {editing === message.id ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleEditMessage(message.id);
                          }}
                          className="flex gap-2"
                        >
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="flex-1 bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm"
                            autoFocus
                          />
                          <button
                            type="submit"
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(null);
                              setEditText('');
                            }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                          >
                            <X size={16} />
                          </button>
                        </form>
                      ) : (
                        <>
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.displayText || message.text}
                          </p>
                          {message.edited && (
                            <span className="text-xs opacity-70 mt-1">(edited)</span>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs opacity-70">
                              {formatTime(message.timestamp)}
                            </span>
                            {isOwn && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditing(message.id);
                                    setEditText(message.text);
                                  }}
                                  className="opacity-70 hover:opacity-100"
                                  title="Edit message"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  onClick={() => handleDeleteMessage(message.id)}
                                  disabled={deleting === message.id}
                                  className="opacity-70 hover:opacity-100 disabled:opacity-50"
                                  title="Delete message"
                                >
                                  {deleting === message.id ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                  ) : (
                                    <Trash2 size={12} />
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={sendMessage} className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 md:p-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send size={20} />
            )}
            <span className="hidden md:inline">Send</span>
          </button>
        </div>
      </form>

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

export default PrivateChat;

