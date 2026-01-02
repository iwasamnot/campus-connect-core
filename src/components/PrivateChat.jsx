import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCall } from '../context/CallContext';
// Use window globals to avoid import/export issues
const isAdminRole = typeof window !== 'undefined' && window.__isAdminRole 
  ? window.__isAdminRole 
  : (role) => role === 'admin' || role === 'admin1';
const isUserOnline = typeof window !== 'undefined' && window.__isUserOnline 
  ? window.__isUserOnline 
  : (userData) => userData?.isOnline === true;
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
  getDocs,
  limit
} from 'firebase/firestore';
// Use window.__firebaseDb to avoid import/export issues in production builds
const db = typeof window !== 'undefined' && window.__firebaseDb 
  ? window.__firebaseDb 
  : null;
import { Send, Trash2, Edit2, X, Check, ArrowLeft, MessageCircle, User, Clock, Settings, Search, Plus, Mail, Paperclip, Smile, File, Image as ImageIcon, Phone, Video } from 'lucide-react';
import UserProfilePopup from './UserProfilePopup';
import FileUpload from './FileUpload';
import EmojiPicker from './EmojiPicker';
import ImagePreview from './ImagePreview';
// Use window globals to avoid import/export issues
const checkToxicity = typeof window !== 'undefined' && window.__checkToxicity 
  ? window.__checkToxicity 
  : () => Promise.resolve({ isToxic: false });

const PrivateChat = () => {
  const { user, userRole } = useAuth();
  const { success, error: showError } = useToast();
  const { startCall, isCallingAvailable } = useCall();
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
  const [chatSummaries, setChatSummaries] = useState({}); // Store last message for each chat
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const messagesEndRef = useRef(null);

  // Generate chat ID from two user IDs (sorted to ensure consistency)
  const getChatId = (userId1, userId2) => {
    return [userId1, userId2].sort().join('_');
  };

  // Fetch users that the current user has chatted with
  useEffect(() => {
    if (!user) {
      console.log('PrivateChat: No user, skipping user fetch');
      return;
    }

    console.log('PrivateChat: Fetching users from chat history');
    
    // Fetch all private chats where current user is a participant
    const chatsQuery = query(
      collection(db, 'privateChats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribeChats = onSnapshot(chatsQuery,
      async (chatsSnapshot) => {
        const userIds = new Set();
        const chatDataMap = {};

        // Extract all participant IDs from chats (excluding current user)
        chatsSnapshot.docs.forEach(chatDoc => {
          const chatData = chatDoc.data();
          const participants = chatData.participants || [];
          participants.forEach(participantId => {
            if (participantId !== user.uid) {
              userIds.add(participantId);
              // Store chat data for summary
              chatDataMap[participantId] = {
                chatId: chatDoc.id,
                lastMessage: chatData.lastMessage,
                lastMessageTime: chatData.lastMessageTime
              };
            }
          });
        });

        console.log('PrivateChat: Found', userIds.size, 'users from chat history');

        if (userIds.size === 0) {
          setAvailableUsers([]);
          setUserNames({});
          setUserProfiles({});
          setOnlineUsers({});
          // Update chat summaries
          setChatSummaries({});
          return;
        }

        // Fetch user data for all participants using batch queries (more efficient than individual getDoc calls)
        // Firestore 'in' queries are limited to 10 items, so we need to batch them
        const users = [];
        const names = {};
        const profiles = {};
        const online = {};
        const summaries = {};

        const userIdsArray = Array.from(userIds);
        
        // Batch fetch users in groups of 10 (Firestore 'in' query limit)
        const batchSize = 10;
        for (let i = 0; i < userIdsArray.length; i += batchSize) {
          const batch = userIdsArray.slice(i, i + batchSize);
          
          try {
            // Use 'in' query to fetch multiple users at once (1 read per batch instead of N reads)
            const usersQuery = query(
              collection(db, 'users'),
              where('__name__', 'in', batch)
            );
            
            const usersSnapshot = await getDocs(usersQuery);
            usersSnapshot.docs.forEach(userDoc => {
              const userData = userDoc.data();
              users.push({
                id: userDoc.id,
                ...userData
              });
              
              // Extract name with fallback priority
              names[userDoc.id] = userData.name || 
                                  userData.studentEmail?.split('@')[0] || 
                                  userData.email?.split('@')[0] || 
                                  userData.personalEmail?.split('@')[0] ||
                                  userDoc.id.substring(0, 8);
              profiles[userDoc.id] = userData;
              online[userDoc.id] = {
                isOnline: userData.isOnline || false,
                lastSeen: userData.lastSeen || null
              };
              
              // Store chat summary
              if (chatDataMap[userDoc.id]) {
                summaries[userDoc.id] = {
                  lastMessage: chatDataMap[userDoc.id].lastMessage,
                  lastMessageTime: chatDataMap[userDoc.id].lastMessageTime,
                  hasUnread: false
                };
              }
            });
          } catch (error) {
            console.error(`Error fetching user batch ${i}-${i + batchSize}:`, error);
            // Fallback to individual fetches only if batch query fails
            for (const userId of batch) {
              try {
                const userDoc = await getDoc(doc(db, 'users', userId));
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  users.push({
                    id: userDoc.id,
                    ...userData
                  });
                  names[userDoc.id] = userData.name || 
                                      userData.studentEmail?.split('@')[0] || 
                                      userData.email?.split('@')[0] || 
                                      userData.personalEmail?.split('@')[0] ||
                                      userDoc.id.substring(0, 8);
                  profiles[userDoc.id] = userData;
                  online[userDoc.id] = {
                    isOnline: userData.isOnline || false,
                    lastSeen: userData.lastSeen || null
                  };
                  if (chatDataMap[userDoc.id]) {
                    summaries[userDoc.id] = {
                      lastMessage: chatDataMap[userDoc.id].lastMessage,
                      lastMessageTime: chatDataMap[userDoc.id].lastMessageTime,
                      hasUnread: false
                    };
                  }
                }
              } catch (individualError) {
                console.error(`Error fetching user ${userId}:`, individualError);
              }
            }
          }
        }

        // Sort users by last message time (most recent first)
        users.sort((a, b) => {
          const aTime = summaries[a.id]?.lastMessageTime;
          const bTime = summaries[b.id]?.lastMessageTime;
          if (!aTime && !bTime) return 0;
          if (!aTime) return 1;
          if (!bTime) return -1;
          const aDate = aTime.toDate ? aTime.toDate() : new Date(aTime);
          const bDate = bTime.toDate ? bTime.toDate() : new Date(bTime);
          return bDate - aDate; // Most recent first
        });

        console.log('PrivateChat: Loaded', users.length, 'users from chat history');
        setAvailableUsers(users);
        setUserNames(names);
        setUserProfiles(profiles);
        setOnlineUsers(online);
        setChatSummaries(summaries);
      },
      (error) => {
        console.error('PrivateChat: Error fetching chat history:', error);
        showError('Failed to load chat history. Please refresh the page.');
      }
    );

    return () => unsubscribeChats();
  }, [user]);

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
        // Always use orderBy for timestamp - Firestore will handle missing timestamps
        const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(50)); // Reduced to 50 messages for Spark free plan (was 100)

        unsubscribe = onSnapshot(q, 
          (snapshot) => {
            console.log('PrivateChat: Received messages snapshot, count:', snapshot.docs.length);
            
            const messagesData = snapshot.docs.map(doc => {
              const data = doc.data();
              console.log('PrivateChat: Message data:', {
                id: doc.id,
                userId: data.userId,
                text: data.text,
                displayText: data.displayText,
                timestamp: data.timestamp,
                hasTimestamp: !!data.timestamp
              });
              return {
                id: doc.id,
                ...data
              };
            });

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

            console.log('PrivateChat: Unique messages after deduplication:', uniqueMessages.length);
            console.log('PrivateChat: Expired messages to delete:', expiredMessageIds.length);

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

            // Sort by timestamp - handle both Firestore Timestamp and regular Date
            uniqueMessages.sort((a, b) => {
              let aTime = 0;
              let bTime = 0;
              
              if (a.timestamp) {
                aTime = a.timestamp.toDate ? a.timestamp.toDate().getTime() : (a.timestamp.getTime ? a.timestamp.getTime() : new Date(a.timestamp).getTime());
              }
              
              if (b.timestamp) {
                bTime = b.timestamp.toDate ? b.timestamp.toDate().getTime() : (b.timestamp.getTime ? b.timestamp.getTime() : new Date(b.timestamp).getTime());
              }
              
              return aTime - bTime;
            });

            console.log('PrivateChat: Setting messages, final count:', uniqueMessages.length);
            setMessages(uniqueMessages);
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

  // Mark messages as read (separate effect to prevent infinite loops)
  // DISABLED by default for Spark free plan - read receipts are expensive
  const processedReadMessagesRef = useRef(new Set());
  const lastReadUpdateRef = useRef(0);
  useEffect(() => {
    if (!user?.uid || !selectedChatId || messages.length === 0) return;
    
    // Cooldown: only update every 10 seconds
    const now = Date.now();
    if (now - lastReadUpdateRef.current < 10000) return;

    // Debounce read updates to prevent quota exhaustion
    const timeoutId = setTimeout(() => {
      const unreadMessages = messages.filter(message => {
        const readBy = message.readBy || {};
        const isUnread = !readBy[user.uid] && message.userId !== user.uid;
        const notProcessed = !processedReadMessagesRef.current.has(message.id);
        return isUnread && notProcessed;
      });

      // Process only first 3 unread messages at a time (reduced from 5)
      unreadMessages.slice(0, 3).forEach(async (message) => {
        try {
          // Mark as processed immediately to prevent duplicate updates
          processedReadMessagesRef.current.add(message.id);
          
          const readBy = message.readBy || {};
          await updateDoc(doc(db, 'privateChats', selectedChatId, 'messages', message.id), {
            readBy: {
              ...readBy,
              [user.uid]: serverTimestamp()
            }
          });
        } catch (error) {
          // Remove from processed set on error so it can be retried
          processedReadMessagesRef.current.delete(message.id);
          console.error('Error marking message as read:', error);
        }
      });
      
      // Update last update time
      lastReadUpdateRef.current = Date.now();
    }, 5000); // 5 second delay (increased from 2) to prevent immediate re-triggering

    return () => clearTimeout(timeoutId);
  }, [messages, user?.uid, selectedChatId]); // Only depend on messages, not on readBy updates

  // Cleanup expired messages periodically
  useEffect(() => {
    if (!selectedChatId) return;

    // Cleanup expired messages less frequently to save quota (every 5 minutes instead of 1 minute)
    const cleanupInterval = setInterval(async () => {
      try {
        const messagesRef = collection(db, 'privateChats', selectedChatId, 'messages');
        const q = query(messagesRef, limit(50)); // Limit query to 50 messages max
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
    }, 300000); // Check every 5 minutes (increased from 1 minute) to save quota

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
      
      // Ensure user name is in cache
      const userName = otherUser.name || 
                      otherUser.studentEmail?.split('@')[0] || 
                      otherUser.email?.split('@')[0] || 
                      otherUser.personalEmail?.split('@')[0] ||
                      `User ${otherUser.id.substring(0, 8)}`;
      
      setUserNames(prev => ({
        ...prev,
        [otherUser.id]: userName
      }));
      
      setUserProfiles(prev => ({
        ...prev,
        [otherUser.id]: otherUser
      }));
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
          // No role checking - allow all users to chat
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
              // Allow all users to chat with each other
              foundUsers.push(userData);
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

  // Toxicity checking is now handled by the toxicityChecker utility

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !attachedFile) || sending || !selectedChatId) {
      if (!selectedChatId) {
        showError('Please select a chat first.');
      }
      return;
    }

    setSending(true);
    try {
      // Check toxicity using Gemini AI (with fallback) - only if there's text
      const textToCheck = newMessage.trim() || '';
      const toxicityResult = textToCheck ? await checkToxicity(textToCheck, true) : { isToxic: false, confidence: 0, reason: '', method: 'none' };
      const isToxic = toxicityResult.isToxic;
      const displayText = isToxic ? '[REDACTED BY AI]' : textToCheck;
      
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
        text: textToCheck,
        displayText: displayText,
        toxic: isToxic,
        toxicityConfidence: toxicityResult.confidence,
        toxicityReason: toxicityResult.reason,
        timestamp: serverTimestamp(),
        readBy: {
          [user.uid]: serverTimestamp() // Sender has seen their own message
        }
      };

      // Add file attachment if present
      if (attachedFile) {
        messageData.attachment = {
          url: attachedFile.url,
          name: attachedFile.name,
          type: attachedFile.type,
          size: attachedFile.size
        };
        // Also add legacy fields for compatibility
        messageData.fileUrl = attachedFile.url;
        messageData.fileName = attachedFile.name;
      }

      if (expiresAt) {
        messageData.expiresAt = expiresAt;
      }

      // Add optimistic update - show message immediately
      const optimisticMessage = {
        id: 'temp-' + Date.now(),
        ...messageData,
        timestamp: new Date(), // Use current date for optimistic update
        isOptimistic: true
      };
      setMessages(prev => [...prev, optimisticMessage]);

      const messageRef = await addDoc(collection(db, 'privateChats', selectedChatId, 'messages'), messageData);
      console.log('PrivateChat: Message sent successfully, ID:', messageRef.id);
      console.log('PrivateChat: Message data:', messageData);

      // Update chat's last message
      const lastMessageTime = serverTimestamp();
      await updateDoc(doc(db, 'privateChats', selectedChatId), {
        lastMessage: displayText,
        lastMessageTime: lastMessageTime
      });

      // Update local chat summary for immediate UI update
      if (selectedUser) {
        setChatSummaries(prev => ({
          ...prev,
          [selectedUser.id]: {
            lastMessage: displayText,
            lastMessageTime: new Date(),
            hasUnread: false
          }
        }));
      }

      // Remove optimistic message - the real one will come from the listener
      setMessages(prev => prev.filter(m => !m.isOptimistic));
      
      setNewMessage('');
      success('Message sent!');
    } catch (error) {
      console.error('PrivateChat: Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => !m.isOptimistic));
      
      const errorMessage = error.code === 'permission-denied'
        ? 'Permission denied. You may not have permission to send messages in this chat.'
        : error.code === 'not-found'
        ? 'Chat not found. Please try selecting the user again.'
        : error.message || 'Failed to send message. Please try again.';
      showError(errorMessage);
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

    // Check toxicity using Gemini AI (with fallback)
    const toxicityResult = await checkToxicity(editText.trim(), true);
    const isToxic = toxicityResult.isToxic;
    const displayText = isToxic ? '[REDACTED BY AI]' : editText.trim();

    try {
      await updateDoc(doc(db, 'privateChats', selectedChatId, 'messages', messageId), {
        text: editText.trim(),
        displayText: displayText,
        toxic: isToxic,
        toxicityConfidence: toxicityResult.confidence,
        toxicityReason: toxicityResult.reason,
        toxicityMethod: toxicityResult.method,
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
      <div className="h-screen h-[100dvh] flex flex-col bg-gray-50 dark:bg-gray-900">
        <div 
          className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4 md:py-6"
          style={{
            paddingTop: `max(1rem, env(safe-area-inset-top, 0px) + 0.75rem)`,
            paddingBottom: `1rem`,
            paddingLeft: `calc(1rem + env(safe-area-inset-left, 0px))`,
            paddingRight: `calc(1rem + env(safe-area-inset-right, 0px))`,
            marginTop: '0',
            position: 'relative',
            zIndex: 10
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Direct Messages
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                Start a private conversation with any user
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
                <label htmlFor="private-chat-email-search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Search user by email
                </label>
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  id="private-chat-email-search"
                  name="email-search"
                  autoComplete="email"
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
            <label htmlFor="private-chat-user-search" className="sr-only">Search users by name or email</label>
            <input
              type="text"
              id="private-chat-user-search"
              name="user-search"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y p-4 md:p-6">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery.trim() 
                  ? 'No users found matching your search'
                  : 'No users available'}
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
              {filteredUsers.map((otherUser) => {
                const userProfile = userProfiles[otherUser.id] || otherUser;
                const profilePicture = userProfile.profilePicture || otherUser.profilePicture;
                const displayName = userNames[otherUser.id] || 
                                   userProfile.name || 
                                   otherUser.name || 
                                   userProfile.studentEmail?.split('@')[0] || 
                                   otherUser.studentEmail?.split('@')[0] || 
                                   userProfile.email?.split('@')[0] || 
                                   otherUser.email?.split('@')[0] || 
                                   userProfile.personalEmail?.split('@')[0] ||
                                   otherUser.personalEmail?.split('@')[0] ||
                                   `User ${otherUser.id.substring(0, 8)}`;
                
                return (
                  <div
                    key={otherUser.id}
                    className="w-full flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUserId(otherUser.id);
                      }}
                      className="relative flex-shrink-0"
                    >
                      {profilePicture ? (
                        <img
                          src={profilePicture}
                          alt={displayName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-700"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold border-2 border-indigo-200 dark:border-indigo-700 ${profilePicture ? 'hidden' : ''}`}
                      >
                        {displayName[0].toUpperCase()}
                      </div>
                      {isUserOnline(onlineUsers[otherUser.id]) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                      )}
                    </button>
                    <button
                      onClick={() => selectChat(otherUser)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {displayName}
                        </h3>
                        {isAdminRole(otherUser.role) && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded">
                            Admin
                          </span>
                        )}
                      </div>
                      {chatSummaries[otherUser.id]?.lastMessage ? (
                        <>
                          <p className="text-sm text-gray-900 dark:text-white truncate font-medium">
                            {chatSummaries[otherUser.id].lastMessage}
                          </p>
                          {chatSummaries[otherUser.id].lastMessageTime && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {(() => {
                                const time = chatSummaries[otherUser.id].lastMessageTime;
                                const date = time.toDate ? time.toDate() : new Date(time);
                                const now = new Date();
                                const diff = now - date;
                                const minutes = Math.floor(diff / 60000);
                                const hours = Math.floor(diff / 3600000);
                                const days = Math.floor(diff / 86400000);
                                
                                if (minutes < 1) return 'Just now';
                                if (minutes < 60) return `${minutes}m ago`;
                                if (hours < 24) return `${hours}h ago`;
                                if (days < 7) return `${days}d ago`;
                                return date.toLocaleDateString();
                              })()}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {otherUser.email || otherUser.studentEmail || 'No email'}
                        </p>
                      )}
                    </button>
                    <button
                      onClick={() => selectChat(otherUser)}
                      className="flex-shrink-0"
                    >
                      <User
                        size={20}
                        className="text-gray-400"
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show chat interface
  return (
    <div className="h-screen h-[100dvh] flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div 
        className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-3 md:py-4"
        style={{
          paddingTop: `max(1rem, env(safe-area-inset-top, 0px) + 0.75rem)`,
          paddingBottom: `0.75rem`,
          paddingLeft: `calc(1rem + env(safe-area-inset-left, 0px))`,
          paddingRight: `calc(1rem + env(safe-area-inset-right, 0px))`,
          marginTop: '0',
          position: 'relative',
          zIndex: 10
        }}
      >
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => {
              setSelectedChatId(null);
              setSelectedUser(null);
              setMessages([]);
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
            aria-label="Back"
          >
            <ArrowLeft size={18} className="md:w-5 md:h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => setSelectedUserId(selectedUser.id)}
            className="relative flex-shrink-0"
          >
            {(() => {
              const userProfile = userProfiles[selectedUser.id] || selectedUser;
              const profilePicture = userProfile.profilePicture || selectedUser.profilePicture;
              const displayName = userNames[selectedUser.id] || 
                                 userProfile.name || 
                                 selectedUser.name || 
                                 userProfile.studentEmail?.split('@')[0] || 
                                 selectedUser.studentEmail?.split('@')[0] || 
                                 userProfile.email?.split('@')[0] || 
                                 selectedUser.email?.split('@')[0] || 
                                 userProfile.personalEmail?.split('@')[0] ||
                                 selectedUser.personalEmail?.split('@')[0] ||
                                 `User ${selectedUser.id.substring(0, 8)}`;
              
              return (
                <>
                  {profilePicture ? (
                    <img
                      src={profilePicture}
                      alt={displayName}
                      className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-700"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm md:text-base font-semibold border-2 border-indigo-200 dark:border-indigo-700 ${profilePicture ? 'hidden' : ''}`}
                  >
                    {displayName[0].toUpperCase()}
                  </div>
                  {isUserOnline(onlineUsers[selectedUser.id]) && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                  )}
                </>
              );
            })()}
          </button>
          <div className="flex-1 min-w-0">
            <button
              onClick={() => setSelectedUserId(selectedUser.id)}
              className="text-left w-full"
            >
              <h2 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white truncate">
                {(() => {
                  const userProfile = userProfiles[selectedUser.id] || selectedUser;
                  return userNames[selectedUser.id] || 
                         userProfile.name || 
                         selectedUser.name || 
                         userProfile.studentEmail?.split('@')[0] || 
                         selectedUser.studentEmail?.split('@')[0] || 
                         userProfile.email?.split('@')[0] || 
                         selectedUser.email?.split('@')[0] || 
                         userProfile.personalEmail?.split('@')[0] ||
                         selectedUser.personalEmail?.split('@')[0] ||
                         `User ${selectedUser.id.substring(0, 8)}`;
                })()}
              </h2>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">
                {isUserOnline(onlineUsers[selectedUser.id]) ? 'Online' : 
                 onlineUsers[selectedUser.id]?.lastSeen ? 
                 `Last seen ${formatTime(onlineUsers[selectedUser.id].lastSeen)}` : 
                 'Offline'}
              </p>
            </button>
          </div>
          {/* Call Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => {
                if (!isCallingAvailable) {
                  showError('Calling is not configured. Please add VITE_ZEGOCLOUD_APP_ID to your .env file. See ZEGOCLOUD_SETUP.md for instructions.');
                  return;
                }
                const userProfile = userProfiles[selectedUser.id] || selectedUser;
                const displayName = userNames[selectedUser.id] || 
                                 selectedUser.name || 
                                 userProfile.studentEmail?.split('@')[0] || 
                                 selectedUser.email?.split('@')[0] ||
                                 `User ${selectedUser.id.substring(0, 8)}`;
                startCall({ 
                  id: selectedUser.id, 
                  name: displayName, 
                  email: selectedUser.email || selectedUser.studentEmail 
                }, 'voice');
              }}
              className={`p-2 rounded-lg transition-colors ${
                isCallingAvailable 
                  ? 'hover:bg-gray-100 dark:hover:bg-gray-700' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
              title={isCallingAvailable ? "Voice call" : "Calling unavailable - Check configuration"}
              aria-label={isCallingAvailable ? "Voice call" : "Calling unavailable"}
              disabled={!isCallingAvailable}
            >
              <Phone size={18} className={`${isCallingAvailable ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`} />
            </button>
            <button
              onClick={() => {
                if (!isCallingAvailable) {
                  showError('Calling is not configured. Please add VITE_ZEGOCLOUD_APP_ID to your .env file. See ZEGOCLOUD_SETUP.md for instructions.');
                  return;
                }
                const userProfile = userProfiles[selectedUser.id] || selectedUser;
                const displayName = userNames[selectedUser.id] || 
                                 selectedUser.name || 
                                 userProfile.studentEmail?.split('@')[0] || 
                                 selectedUser.email?.split('@')[0] ||
                                 `User ${selectedUser.id.substring(0, 8)}`;
                startCall({ 
                  id: selectedUser.id, 
                  name: displayName, 
                  email: selectedUser.email || selectedUser.studentEmail 
                }, 'video');
              }}
              className={`p-2 rounded-lg transition-colors ${
                isCallingAvailable 
                  ? 'hover:bg-gray-100 dark:hover:bg-gray-700' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
              title={isCallingAvailable ? "Video call" : "Calling unavailable - Check configuration"}
              aria-label={isCallingAvailable ? "Video call" : "Calling unavailable"}
              disabled={!isCallingAvailable}
            >
              <Video size={18} className={`${isCallingAvailable ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`} />
            </button>
          </div>
          {/* Disappearing Messages Settings Button */}
          <div className="relative disappearing-settings-container flex-shrink-0">
            <button
              onClick={() => setShowDisappearingSettings(!showDisappearingSettings)}
              className={`p-2 rounded-lg transition-colors ${
                disappearingMessagesEnabled 
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              title="Disappearing Messages Settings"
              aria-label="Disappearing Messages Settings"
            >
              <Clock size={18} className="md:w-5 md:h-5" />
            </button>
            
            {/* Disappearing Messages Settings Dropdown */}
            {showDisappearingSettings && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4 transform transition-all duration-200">
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
                  <label htmlFor="disappearing-messages-enabled" className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      id="disappearing-messages-enabled"
                      name="disappearing-messages-enabled"
                      checked={disappearingMessagesEnabled}
                      onChange={(e) => setDisappearingMessagesEnabled(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Enable disappearing messages</span>
                  </label>
                  
                  {disappearingMessagesEnabled && (
                    <div className="space-y-2">
                      <label htmlFor="disappearing-messages-duration" className="text-sm font-medium text-gray-700 dark:text-gray-300">Duration:</label>
                      <select
                        id="disappearing-messages-duration"
                        name="disappearing-messages-duration"
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
                          <label htmlFor={`private-edit-message-${message.id}`} className="sr-only">Edit message</label>
                          <input
                            type="text"
                            id={`private-edit-message-${message.id}`}
                            name={`private-edit-message-${message.id}`}
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
                          {/* Attachment Display */}
                          {message.attachment && (
                            <div className="mb-2">
                              {message.attachment.type?.startsWith('image/') ? (
                                <div
                                  onClick={() => setPreviewImage({ url: message.attachment.url, name: message.attachment.name })}
                                  className="block rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:opacity-90 transition-opacity cursor-pointer"
                                >
                                  <img
                                    src={message.attachment.url}
                                    alt={message.attachment.name}
                                    className="max-w-full max-h-64 object-contain"
                                  />
                                </div>
                              ) : (
                                <a
                                  href={message.attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                  <File size={20} className="text-indigo-600 dark:text-indigo-400" />
                                  <span className="text-sm font-medium">{message.attachment.name}</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    ({(message.attachment.size / 1024).toFixed(1)} KB)
                                  </span>
                                </a>
                              )}
                            </div>
                          )}
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
      <div 
        className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 md:p-6"
        style={{
          paddingBottom: `max(0.25rem, calc(env(safe-area-inset-bottom, 0px) * 0.3))`,
          paddingTop: `1rem`,
          paddingLeft: `calc(1rem + env(safe-area-inset-left, 0px))`,
          paddingRight: `calc(1rem + env(safe-area-inset-right, 0px))`
        }}
      >
        {/* File Preview */}
        {attachedFile && (
          <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-between animate-slide-in-down">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {attachedFile.type?.startsWith('image/') ? (
                <ImageIcon size={20} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              ) : (
                <File size={20} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {attachedFile.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(attachedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={() => setAttachedFile(null)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors flex-shrink-0"
            >
              <X size={16} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        )}

        <form 
          onSubmit={sendMessage} 
          className="flex gap-2 relative"
        >
          <div className="flex-1 relative">
            <label htmlFor="private-chat-message-input" className="sr-only">Type a message</label>
            <input
              type="text"
              id="private-chat-message-input"
              name="message"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              disabled={sending}
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {/* File Upload */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFileUpload(!showFileUpload)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Upload file"
              >
                <Paperclip size={20} />
              </button>
              {showFileUpload && (
                <div className="absolute bottom-full right-0 mb-2 z-50">
                  <FileUpload
                    onFileUpload={(file) => {
                      setAttachedFile(file);
                      setShowFileUpload(false);
                    }}
                  />
                </div>
              )}
            </div>

            {/* Emoji Picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Add emoji"
              >
                <Smile size={20} />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-full right-0 mb-2 z-50">
                  <EmojiPicker
                    onEmojiSelect={(emoji) => {
                      setNewMessage(prev => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={(!newMessage.trim() && !attachedFile) || sending}
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
      </div>

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

