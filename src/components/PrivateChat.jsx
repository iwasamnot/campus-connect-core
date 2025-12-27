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
  setDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Send, Trash2, Edit2, X, Check, ArrowLeft, MessageCircle, User, Clock, Settings, Search, Plus, Mail } from 'lucide-react';
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
  const [disappearingMessagesEnabled, setDisappearingMessagesEnabled] = useState(false);
  const [disappearingMessagesDuration, setDisappearingMessagesDuration] = useState(24); // 24 hours or 7 days (168 hours)
  const [showDisappearingSettings, setShowDisappearingSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // Search query for users
  const [showAddUser, setShowAddUser] = useState(false); // Show add user by email form
  const [emailToAdd, setEmailToAdd] = useState(''); // Email to search/add
  const [searchingUser, setSearchingUser] = useState(false); // Loading state for user search
  const messagesEndRef = useRef(null);

  // Generate chat ID from two user IDs (sorted to ensure consistency)
  const getChatId = (userId1, userId2) => {
    return [userId1, userId2].sort().join('_');
  };

  // Fetch available users (admins for students, students for admins)
  useEffect(() => {
    if (!user) {
      console.log('PrivateChat: No user, skipping user fetch');
      return;
    }

    console.log('PrivateChat: Fetching available users, userRole:', userRole);
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

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
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
          // Extract name with fallback priority: name > studentEmail > email > personalEmail > userId
          names[doc.id] = userData.name || 
                          userData.studentEmail?.split('@')[0] || 
                          userData.email?.split('@')[0] || 
                          userData.personalEmail?.split('@')[0] ||
                          doc.id.substring(0, 8);
          profiles[doc.id] = userData;
          online[doc.id] = {
            isOnline: userData.isOnline || false,
            lastSeen: userData.lastSeen || null
          };
        });

        console.log('PrivateChat: Found', users.length, 'available users');
        setAvailableUsers(users);
        setUserNames(names);
        setUserProfiles(profiles);
        setOnlineUsers(online);
      },
      (error) => {
        console.error('PrivateChat: Error fetching available users:', error);
        showError('Failed to load users. Please refresh the page.');
      }
    );

    return () => unsubscribe();
  }, [user, userRole]);

  // Fetch messages for selected chat
  useEffect(() => {
    if (!selectedChatId || !user) return;

    let unsubscribe = null;

    // Verify chat document exists before querying messages
    const verifyAndFetchMessages = async () => {
      try {
        const chatDoc = await getDoc(doc(db, 'privateChats', selectedChatId));
        if (!chatDoc.exists()) {
          console.error('PrivateChat: Chat document does not exist:', selectedChatId);
          showError('Chat not found. Please try selecting the user again.');
          return;
        }
        
        const chatData = chatDoc.data();
        if (!chatData.participants || !chatData.participants.includes(user.uid)) {
          console.error('PrivateChat: User is not a participant in this chat');
          showError('You do not have access to this chat.');
          return;
        }
        
        console.log('PrivateChat: Chat verified, fetching messages');
        
        // Now set up the messages listener
        const messagesRef = collection(db, 'privateChats', selectedChatId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        unsubscribe = onSnapshot(q, 
          (snapshot) => {
            const messagesData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));

            // Deduplicate messages by ID and filter expired messages
            const now = new Date();
            const expiredMessageIds = [];
            const uniqueMessages = messagesData.reduce((acc, message) => {
              if (!acc.find(m => m.id === message.id)) {
                // Check if message has expired
                if (message.expiresAt) {
                  const expiresAt = message.expiresAt.toDate ? message.expiresAt.toDate() : new Date(message.expiresAt);
                  if (expiresAt <= now) {
                    // Message has expired, mark for deletion
                    expiredMessageIds.push(message.id);
                    return acc; // Don't add expired message
                  }
                }
                acc.push(message);
              }
              return acc;
            }, []);

            // Delete expired messages asynchronously
            if (expiredMessageIds.length > 0) {
              Promise.all(
                expiredMessageIds.map(messageId =>
                  deleteDoc(doc(db, 'privateChats', selectedChatId, 'messages', messageId)).catch(err => {
                    console.error('Error deleting expired message:', err);
                  })
                )
              );
            }

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
          },
          (error) => {
            console.error('PrivateChat: Error fetching messages:', error);
            console.error('PrivateChat: Error details:', {
              code: error.code,
              message: error.message
            });
            showError(`Failed to load messages: ${error.message || 'Please refresh the page.'}`);
          }
        );
      } catch (error) {
        console.error('PrivateChat: Error verifying chat:', error);
        showError(`Failed to verify chat access: ${error.message || 'Please try again.'}`);
      }
    };

    verifyAndFetchMessages();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [selectedChatId, user]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup expired messages periodically
  useEffect(() => {
    if (!selectedChatId) return;

    const cleanupInterval = setInterval(async () => {
      try {
        const messagesRef = collection(db, 'privateChats', selectedChatId, 'messages');
        const q = query(messagesRef);
        const snapshot = await getDocs(q);
        const now = new Date();

        const deletePromises = [];
        snapshot.docs.forEach((docSnapshot) => {
          const messageData = docSnapshot.data();
          if (messageData.expiresAt) {
            const expiresAt = messageData.expiresAt.toDate ? messageData.expiresAt.toDate() : new Date(messageData.expiresAt);
            if (expiresAt <= now) {
              deletePromises.push(
                deleteDoc(doc(db, 'privateChats', selectedChatId, 'messages', docSnapshot.id)).catch(err => {
                  console.error('Error deleting expired message:', err);
                })
              );
            }
          }
        });
        await Promise.all(deletePromises);
      } catch (error) {
        console.error('Error cleaning up expired messages:', error);
      }
    }, 60000); // Check every minute

    return () => clearInterval(cleanupInterval);
  }, [selectedChatId]);

  // Close settings dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDisappearingSettings && !event.target.closest('.disappearing-settings-container')) {
        setShowDisappearingSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDisappearingSettings]);

  // Select or create a chat with a user
  const selectChat = async (otherUser) => {
    console.log('PrivateChat: Selecting chat with user:', otherUser.id);
    const chatId = getChatId(user.uid, otherUser.id);
    console.log('PrivateChat: Chat ID:', chatId);
    
    // Create chat document if it doesn't exist
    try {
      const chatDoc = await getDoc(doc(db, 'privateChats', chatId));
      if (!chatDoc.exists()) {
        console.log('PrivateChat: Creating new chat document');
        const participants = [user.uid, otherUser.id].sort();
        await setDoc(doc(db, 'privateChats', chatId), {
          participants: participants,
          createdAt: serverTimestamp(),
          lastMessage: null,
          lastMessageTime: null,
          disappearingMessagesEnabled: false,
          disappearingMessagesDuration: 24 // Default 24 hours
        });
        setDisappearingMessagesEnabled(false);
        setDisappearingMessagesDuration(24);
        console.log('PrivateChat: Chat document created successfully with participants:', participants);
      } else {
        console.log('PrivateChat: Chat document already exists, loading settings');
        // Load existing chat settings
        const chatData = chatDoc.data();
        console.log('PrivateChat: Chat data:', chatData);
        setDisappearingMessagesEnabled(chatData.disappearingMessagesEnabled || false);
        setDisappearingMessagesDuration(chatData.disappearingMessagesDuration || 24);
      }
      
      // Only set selected chat after document is created/verified
      setSelectedChatId(chatId);
      setSelectedUser(otherUser);
    } catch (error) {
      console.error('PrivateChat: Error creating/loading chat:', error);
      console.error('PrivateChat: Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      showError(`Failed to create chat: ${error.message || 'Please try again.'}`);
    }
  };

  // Auto-select user from sessionStorage (when navigating from profile popup)
  useEffect(() => {
    if (!user || !selectChat) return;
    
    const initialUserId = sessionStorage.getItem('initialPrivateChatUserId');
    const initialUserDataStr = sessionStorage.getItem('initialPrivateChatUserData');
    
    if (initialUserId) {
      console.log('PrivateChat: Found initialUserId in sessionStorage:', initialUserId);
      console.log('PrivateChat: Has userData:', !!initialUserDataStr);
      console.log('PrivateChat: Current userRole:', userRole);
      console.log('PrivateChat: AvailableUsers count:', availableUsers.length);
      
      // Try to find user in availableUsers first
      let userToSelect = availableUsers.find(u => u.id === initialUserId);
      console.log('PrivateChat: Found in availableUsers:', !!userToSelect);
      
      // If not found in availableUsers, try to use the stored userData
      if (!userToSelect && initialUserDataStr) {
        try {
          const storedUserData = JSON.parse(initialUserDataStr);
          console.log('PrivateChat: Parsed storedUserData:', {
            id: storedUserData.id,
            role: storedUserData.role,
            name: storedUserData.name
          });
          
          // Check if user can chat (student with admin, admin with student)
          const currentUserIsAdmin = isAdminRole(userRole);
          const storedUserIsAdmin = isAdminRole(storedUserData.role);
          const canChat = (currentUserIsAdmin && !storedUserIsAdmin) || (!currentUserIsAdmin && storedUserIsAdmin);
          
          console.log('PrivateChat: Role check:', {
            currentUserIsAdmin,
            storedUserIsAdmin,
            canChat,
            currentRole: userRole,
            storedRole: storedUserData.role
          });
          
          // Allow chat if we have valid userData (let Firestore rules and selectChat handle permissions)
          // Only block if it's clearly the same user
          if (storedUserData.id === initialUserId && storedUserData.id !== user.uid) {
            // Add user to availableUsers and user caches
            userToSelect = {
              id: storedUserData.id,
              ...storedUserData
            };
            
            console.log('PrivateChat: Adding user to availableUsers:', userToSelect.id);
            
            // Add to availableUsers if not already there
            setAvailableUsers(prev => {
              if (!prev.find(u => u.id === userToSelect.id)) {
                return [...prev, userToSelect];
              }
              return prev;
            });
            
            // Update caches - ensure name is properly set
            const userName = userToSelect.name || 
                            userToSelect.studentEmail?.split('@')[0] || 
                            userToSelect.email?.split('@')[0] || 
                            userToSelect.personalEmail?.split('@')[0] ||
                            `User ${userToSelect.id.substring(0, 8)}`;
            
            setUserNames(prev => ({
              ...prev,
              [userToSelect.id]: userName
            }));
            setUserProfiles(prev => ({
              ...prev,
              [userToSelect.id]: userToSelect
            }));
            setOnlineUsers(prev => ({
              ...prev,
              [userToSelect.id]: {
                isOnline: userToSelect.isOnline || false,
                lastSeen: userToSelect.lastSeen || null
              }
            }));
          } else {
            console.warn('PrivateChat: Cannot add user - role mismatch or invalid data:', {
              canChat,
              hasRole: !!storedUserData.role,
              idMatch: storedUserData.id === initialUserId
            });
          }
        } catch (error) {
          console.error('PrivateChat: Error parsing stored user data:', error);
        }
      }
      
      if (userToSelect) {
        console.log('PrivateChat: Auto-selecting user from sessionStorage:', userToSelect.id);
        // Clear sessionStorage after finding the user
        sessionStorage.removeItem('initialPrivateChatUserId');
        sessionStorage.removeItem('initialPrivateChatUserData');
        
        // Call selectChat directly
        selectChat(userToSelect);
      } else if (availableUsers.length > 0) {
        // Only show error if we've loaded users but still can't find this one
        console.warn('PrivateChat: User not found in availableUsers after all attempts:', {
          initialUserId,
          hasUserData: !!initialUserDataStr,
          availableUsersCount: availableUsers.length
        });
        sessionStorage.removeItem('initialPrivateChatUserId');
        sessionStorage.removeItem('initialPrivateChatUserData');
        showError('User not available for private chat. Please try adding them by email.');
      }
      // If availableUsers.length === 0, we're still loading, so wait
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, availableUsers, userRole]);

  // Search for user by email
  const searchUserByEmail = async (email) => {
    if (!email || !email.trim()) {
      showError('Please enter an email address');
      return;
    }

    setSearchingUser(true);
    try {
      const emailLower = email.trim().toLowerCase();
      const usersRef = collection(db, 'users');
      
      // Search by email, studentEmail, or personalEmail
      const queries = [
        query(usersRef, where('email', '==', emailLower)),
        query(usersRef, where('studentEmail', '==', emailLower)),
        query(usersRef, where('personalEmail', '==', emailLower))
      ];

      const results = await Promise.all(queries.map(q => getDocs(q)));
      const foundUsers = [];
      
      results.forEach(snapshot => {
        snapshot.docs.forEach(doc => {
          const userData = { id: doc.id, ...doc.data() };
          // Check if user is already in availableUsers
          if (!availableUsers.find(u => u.id === doc.id) && doc.id !== user.uid) {
            // Check if user can chat (student with admin, admin with student)
            const userIsAdmin = isAdminRole(userData.role);
            if (isAdminRole(userRole)) {
              // Admin can only chat with students
              if (!userIsAdmin) {
                foundUsers.push(userData);
              }
            } else {
              // Student can only chat with admins
              if (userIsAdmin) {
                foundUsers.push(userData);
              }
            }
          }
        });
      });

      if (foundUsers.length === 0) {
        showError('No user found with this email address or user is not available for private chat');
        setSearchingUser(false);
        return;
      }

      // Add found users to availableUsers
      const newUsers = [...availableUsers];
      foundUsers.forEach(foundUser => {
        if (!newUsers.find(u => u.id === foundUser.id)) {
          newUsers.push(foundUser);
          setUserNames(prev => ({
            ...prev,
            [foundUser.id]: foundUser.name || foundUser.email?.split('@')[0] || foundUser.id.substring(0, 8)
          }));
          setUserProfiles(prev => ({
            ...prev,
            [foundUser.id]: foundUser
          }));
          setOnlineUsers(prev => ({
            ...prev,
            [foundUser.id]: {
              isOnline: foundUser.isOnline || false,
              lastSeen: foundUser.lastSeen || null
            }
          }));
        }
      });

      setAvailableUsers(newUsers);
      setEmailToAdd('');
      setShowAddUser(false);
      success(`Found ${foundUsers.length} user(s) and added to your chat list`);
    } catch (error) {
      console.error('Error searching for user:', error);
      showError('Failed to search for user. Please try again.');
    } finally {
      setSearchingUser(false);
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
      // Calculate expiration time if disappearing messages is enabled
      let expiresAt = null;
      if (disappearingMessagesEnabled) {
        const now = new Date();
        const expirationTime = new Date(now.getTime() + (disappearingMessagesDuration * 60 * 60 * 1000)); // Convert hours to milliseconds
        expiresAt = expirationTime;
      }

      const messageData = {
        userId: user.uid,
        userEmail: user.email,
        text: newMessage.trim(),
        displayText: displayText,
        toxic: isToxic,
        timestamp: serverTimestamp(),
        readBy: {
          [user.uid]: serverTimestamp() // Sender has seen their own message
        }
      };

      if (expiresAt) {
        messageData.expiresAt = expiresAt;
      }

      await addDoc(collection(db, 'privateChats', selectedChatId, 'messages'), messageData);

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

  // Update disappearing messages settings
  const updateDisappearingSettings = async () => {
    if (!selectedChatId) return;

    try {
      await updateDoc(doc(db, 'privateChats', selectedChatId), {
        disappearingMessagesEnabled: disappearingMessagesEnabled,
        disappearingMessagesDuration: disappearingMessagesDuration
      });
      setShowDisappearingSettings(false);
      success('Disappearing messages settings updated.');
    } catch (error) {
      console.error('Error updating disappearing messages settings:', error);
      showError('Failed to update settings. Please try again.');
    }
  };

  // Get time remaining until message expires
  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return null;
    const expiration = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
    const now = new Date();
    const diff = expiration - now;
    
    if (diff <= 0) return null; // Already expired
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
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

  // Filter users based on search query
  const filteredUsers = availableUsers.filter(otherUser => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const name = (userNames[otherUser.id] || '').toLowerCase();
    const email = (otherUser.email || otherUser.studentEmail || otherUser.personalEmail || '').toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  // If no chat selected, show list of available users
  if (!selectedChatId) {
    return (
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Direct Messages
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {isAdminRole(userRole) 
                  ? 'Start a private conversation with a student' 
                  : 'Start a private conversation with an admin'}
              </p>
            </div>
            <button
              onClick={() => setShowAddUser(!showAddUser)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add by Email</span>
            </button>
          </div>

          {/* Add User by Email Form */}
          {showAddUser && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <Mail size={18} className="text-indigo-600 dark:text-indigo-400" />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Search user by email
                </label>
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={emailToAdd}
                  onChange={(e) => setEmailToAdd(e.target.value)}
                  placeholder="Enter email address..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      searchUserByEmail(emailToAdd);
                    }
                  }}
                />
                <button
                  onClick={() => searchUserByEmail(emailToAdd)}
                  disabled={searchingUser || !emailToAdd.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {searchingUser ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Search size={18} />
                  )}
                  <span className="hidden sm:inline">Search</span>
                </button>
                <button
                  onClick={() => {
                    setShowAddUser(false);
                    setEmailToAdd('');
                  }}
                  className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery.trim() 
                  ? 'No users found matching your search'
                  : (isAdminRole(userRole) ? 'No students available' : 'No admins available')}
              </p>
              {!searchQuery.trim() && (
                <button
                  onClick={() => setShowAddUser(true)}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  Add User by Email
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((otherUser) => (
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
                        {userNames[otherUser.id] || 
                         otherUser.name || 
                         otherUser.studentEmail?.split('@')[0] || 
                         otherUser.email?.split('@')[0] || 
                         otherUser.personalEmail?.split('@')[0] ||
                         `User ${otherUser.id.substring(0, 8)}`}
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
                {userNames[selectedUser.id] || 
                 selectedUser.name || 
                 selectedUser.studentEmail?.split('@')[0] || 
                 selectedUser.email?.split('@')[0] || 
                 selectedUser.personalEmail?.split('@')[0] ||
                 `User ${selectedUser.id.substring(0, 8)}`}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {onlineUsers[selectedUser.id]?.isOnline ? 'Online' : 
                 onlineUsers[selectedUser.id]?.lastSeen ? 
                 `Last seen ${formatTime(onlineUsers[selectedUser.id].lastSeen)}` : 
                 'Offline'}
              </p>
            </button>
          </div>
          {/* Disappearing Messages Settings Button */}
          <div className="relative disappearing-settings-container">
            <button
              onClick={() => setShowDisappearingSettings(!showDisappearingSettings)}
              className={`p-2 rounded-lg transition-colors ${
                disappearingMessagesEnabled 
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              title="Disappearing Messages Settings"
            >
              <Clock size={20} />
            </button>
            
            {/* Disappearing Messages Settings Dropdown */}
            {showDisappearingSettings && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Disappearing Messages</h3>
                  <button
                    onClick={() => setShowDisappearingSettings(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X size={18} />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={disappearingMessagesEnabled}
                      onChange={(e) => setDisappearingMessagesEnabled(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Enable disappearing messages</span>
                  </label>
                  
                  {disappearingMessagesEnabled && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Duration:</label>
                      <select
                        value={disappearingMessagesDuration}
                        onChange={(e) => setDisappearingMessagesDuration(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value={24}>24 hours</option>
                        <option value={168}>7 days</option>
                      </select>
                    </div>
                  )}
                  
                  <button
                    onClick={updateDisappearingSettings}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 animate-fade-in">
            <img 
              src="/logo.png" 
              alt="CampusConnect Logo" 
              className="w-24 h-24 mx-auto mb-4 opacity-50 object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                const fallback = e.target.nextElementSibling;
                if (fallback) fallback.style.display = 'block';
              }}
            />
            <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4 hidden" />
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
                            {message.expiresAt && (
                              <div className="flex items-center gap-1 text-xs opacity-70" title={`Expires in ${getTimeRemaining(message.expiresAt)}`}>
                                <Clock size={12} />
                                <span>{getTimeRemaining(message.expiresAt)}</span>
                              </div>
                            )}
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
          onStartPrivateChat={(userId, userData) => {
            // Already in private chat, just select the user
            const userToSelect = availableUsers.find(u => u.id === userId);
            if (userToSelect) {
              selectChat(userToSelect);
            }
          }}
        />
      )}
    </div>
  );
};

export default PrivateChat;

