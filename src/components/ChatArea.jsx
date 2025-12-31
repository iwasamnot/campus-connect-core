import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isAdminRole, isUserOnline } from '../utils/helpers';
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
  setDoc,
  limit,
  startAfter,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Send, Trash2, Edit2, X, Check, Search, Flag, Smile, MoreVertical, User, Bot, Paperclip, Pin, Reply, Image as ImageIcon, File, Forward, Download, Keyboard, Bookmark } from 'lucide-react';
import ImagePreview from './ImagePreview';
import Logo from './Logo';
import UserProfilePopup from './UserProfilePopup';
import TypingIndicator, { useTypingIndicator } from './TypingIndicator';
import EmojiPicker from './EmojiPicker';
import FileUpload from './FileUpload';
import MentionAutocomplete from './MentionAutocomplete';
import AdvancedSearch from './AdvancedSearch';
import { saveDraft, getDraft, clearDraft } from '../utils/drafts';
import { exportMessagesToJSON, exportMessagesToCSV, exportMessagesToTXT } from '../utils/export';
import { saveMessage } from '../utils/saveMessage';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { parseMarkdown, hasMarkdown } from '../utils/markdown';
import notificationService from '../utils/notifications';
import { checkToxicity } from '../utils/toxicityChecker';
import { usePreferences } from '../context/PreferencesContext';

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

const ChatArea = ({ setActiveView }) => {
  const { user, userRole } = useAuth();
  const { success, error: showError } = useToast();
  const { preferences } = usePreferences();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const [reporting, setReporting] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [onlineUsers, setOnlineUsers] = useState({});
  const [userNames, setUserNames] = useState({}); // Cache user names
  const [userProfiles, setUserProfiles] = useState({}); // Cache user profile data
  const [selectedUserId, setSelectedUserId] = useState(null); // For profile popup
  const [reacting, setReacting] = useState(new Set()); // Track reactions in progress to prevent duplicates
  const [aiHelpMode, setAiHelpMode] = useState(false); // Toggle for AI Help mode
  const [waitingForAI, setWaitingForAI] = useState(false); // Track if waiting for AI response
  const [selectedGeminiModel, setSelectedGeminiModel] = useState('gemini-pro'); // Default model
  const [showModelSelector, setShowModelSelector] = useState(false); // Show model selector dropdown
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // Show emoji picker
  const [showFileUpload, setShowFileUpload] = useState(false); // Show file upload
  const [attachedFile, setAttachedFile] = useState(null); // Attached file
  const [replyingTo, setReplyingTo] = useState(null); // Message being replied to
  const [pinnedMessages, setPinnedMessages] = useState([]); // Pinned messages
  const [cursorPosition, setCursorPosition] = useState(0); // Cursor position for mentions
  const [showMentions, setShowMentions] = useState(false); // Show mention autocomplete
  const [forwardingMessage, setForwardingMessage] = useState(null); // Message to forward
  const [showForwardModal, setShowForwardModal] = useState(false); // Show forward modal
  const [previewImage, setPreviewImage] = useState(null); // Image preview state { url, name }
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const mountedRef = useRef(true);
  const MESSAGE_RATE_LIMIT = 3000; // 3 seconds between messages
  const CHAT_ID = 'global'; // For drafts
  
  // Typing indicator (for global chat, chatId can be 'global')
  const typingUsers = useTypingIndicator('global', 'global');
  
  // Load draft on mount
  useEffect(() => {
    const draft = getDraft(CHAT_ID);
    if (draft) {
      setNewMessage(draft);
    }
  }, []);
  
  // Save draft on message change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveDraft(CHAT_ID, newMessage);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [newMessage]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K for advanced search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowAdvancedSearch(true);
      }
      // Ctrl/Cmd + Enter to send
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !sending) {
        e.preventDefault();
        if (newMessage.trim()) {
          handleSendMessage(e);
        }
      }
      // Up arrow to edit last message
      if (e.key === 'ArrowUp' && !newMessage.trim() && messageInputRef.current === document.activeElement) {
        const userMessages = messages.filter(m => m.userId === user?.uid && !m.isAI);
        if (userMessages.length > 0) {
          const lastMessage = userMessages[userMessages.length - 1];
          if (!lastMessage.edited) {
            e.preventDefault();
            setEditing(lastMessage.id);
            setEditText(lastMessage.text);
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [newMessage, sending, messages, user]);
  
  // Fetch pinned messages (with proper index: pinned ASC, pinnedAt DESC)
  useEffect(() => {
    if (!user?.uid) return;
    
    const q = query(
      collection(db, 'messages'), 
      where('pinned', '==', true), 
      orderBy('pinnedAt', 'desc'), 
      limit(10)
    );
    
    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const pinned = snapshot.docs.map(doc => doc.id);
        setPinnedMessages(pinned);
      },
      (error) => {
        // Handle missing index error gracefully
        if (error.code === 'failed-precondition') {
          console.warn('ChatArea: Pinned messages index not found. Please create the index in Firestore Console.');
          // Fallback: fetch without orderBy
          const fallbackQuery = query(
            collection(db, 'messages'),
            where('pinned', '==', true),
            limit(10)
          );
          onSnapshot(fallbackQuery, (snapshot) => {
            const pinned = snapshot.docs.map(doc => doc.id);
            setPinnedMessages(pinned);
          });
        } else {
          console.error('ChatArea: Error fetching pinned messages:', error);
        }
      }
    );
    
    return () => unsubscribe();
  }, [user?.uid]); // Only depend on user.uid to prevent re-renders

  // Available Gemini models
  const geminiModels = [
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', description: 'Free - Fast & Efficient (Recommended)', free: true },
    { value: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash 8B', description: 'Free - Lightweight & Fast', free: true },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', description: 'Paid - Most Capable', free: false },
    { value: 'gemini-pro', label: 'Gemini Pro', description: 'Paid - Standard Model', free: false },
  ];

  // Initialize Gemini AI with selected model
  const getGeminiModel = (modelName = selectedGeminiModel) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
    if (!apiKey || apiKey === '') {
      return null;
    }
    
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
        systemInstruction: 'You are an empathetic, knowledgeable Senior Student at the university. Keep answers under 3 sentences.',
      });
      return model;
    } catch (error) {
      console.error('Error initializing Gemini:', error);
      return null;
    }
  };

  // Fetch all users to get names and profile data (limited to prevent quota exhaustion)
  // Using one-time read instead of real-time listener to reduce reads
  useEffect(() => {
    let mounted = true;
    
    const fetchUsers = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          limit(50) // Further reduced to 50 users to save reads
        );
        
        const snapshot = await getDocs(q);
        if (!mounted) return;
        
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
          // Use helper function to check if user is actually online (validates both flag and recent lastSeen)
          users[doc.id] = {
            isOnline: isUserOnline(userData),
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
      } catch (error) {
        console.error('ChatArea - Error fetching users:', error);
      }
    };
    
    fetchUsers();
    
    // Refresh users every 5 minutes instead of real-time
    const intervalId = setInterval(fetchUsers, 5 * 60 * 1000);
    
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch messages from Firestore (limited to prevent quota exhaustion)
  // Optimized: Memoize query to prevent recreation
  const messagesQuery = useMemo(() => {
    return query(
      collection(db, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(30) // Reduced to 30 messages for better performance
    );
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    
    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        if (!mountedRef.current) return;
        
        try {
          const messagesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Deduplicate messages by ID to prevent duplicates (use Map for O(1) lookup)
          const messageMap = new Map();
          messagesData.forEach(message => {
            if (!messageMap.has(message.id)) {
              messageMap.set(message.id, message);
            }
          });
          
          // Convert to array and sort by timestamp
          const uniqueMessages = Array.from(messageMap.values()).sort((a, b) => {
            const aTime = a.timestamp?.toDate?.() || a.timestamp || 0;
            const bTime = b.timestamp?.toDate?.() || b.timestamp || 0;
            return aTime - bTime;
          });
          
          setMessages(uniqueMessages);
        } catch (error) {
          console.error('Error processing messages:', error);
          showError('Error loading messages. Please refresh the page.');
        }
      },
      (error) => {
        if (!mountedRef.current) return;
        console.error('Error fetching messages:', error);
        if (error.code === 'resource-exhausted') {
          showError('Firestore quota exceeded. Please try again later.');
        } else if (error.code === 'failed-precondition') {
          showError('Firestore index missing. Please create the required index.');
        } else {
          showError('Failed to load messages. Please check your connection and refresh.');
        }
      }
    );

    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, [messagesQuery, showError]); // Use memoized query

  // Mark messages as read and send notifications (separate effect to prevent infinite loops)
  // OPTIMIZED: Read receipts are expensive - only update if explicitly enabled AND with longer delays
  const processedReadMessagesRef = useRef(new Set());
  const lastReadUpdateRef = useRef(0);
  useEffect(() => {
    if (!user?.uid || messages.length === 0) return;
    
    // DISABLED by default - read receipts cause too many writes/reads
    // Only enable if user explicitly enables it in settings
    if (!preferences?.readReceipts) return;
    
    const now = Date.now();
    // Increased cooldown to 30 seconds to drastically reduce writes
    if (now - lastReadUpdateRef.current < 30000) return;

    // Debounce read updates to prevent quota exhaustion
    const timeoutId = setTimeout(() => {
      const unreadMessages = messages.filter(message => {
        const readBy = message.readBy || {};
        const isUnread = !readBy[user.uid] && message.userId !== user.uid;
        const notProcessed = !processedReadMessagesRef.current.has(message.id);
        return isUnread && notProcessed;
      });

      // Process only 1 message at a time (reduced from 3) to minimize writes
      unreadMessages.slice(0, 1).forEach(async (message) => {
        try {
          // Mark as processed immediately to prevent duplicate updates
          processedReadMessagesRef.current.add(message.id);
          
          const readBy = message.readBy || {};
          await updateDoc(doc(db, 'messages', message.id), {
            readBy: {
              ...readBy,
              [user.uid]: serverTimestamp()
            }
          });
          
          // Send notification for new messages (not from current user and not AI)
          if (!message.isAI && !document.hasFocus()) {
            const messageUser = userProfiles[message.userId] || {};
            await notificationService.showMessage(
              message,
              messageUser.name || message.userName || 'Someone'
            );
          }
          
          // Check if user was mentioned
          if (message.mentions && message.mentions.includes(user.uid)) {
            const messageUser = userProfiles[message.userId] || {};
            await notificationService.showMention(
              message,
              messageUser.name || message.userName || 'Someone'
            );
          }
        } catch (error) {
          // Remove from processed set on error so it can be retried
          processedReadMessagesRef.current.delete(message.id);
          console.error('Error marking message as read:', error);
        }
      });
      
      // Update last update time
      lastReadUpdateRef.current = Date.now();
    }, 10000); // 10 second delay (increased from 5) to prevent immediate re-triggering

    return () => clearTimeout(timeoutId);
  }, [messages, user?.uid, userProfiles, preferences?.readReceipts]); // Only depend on messages, not on readBy updates

  // Toxicity checking is now handled by the toxicityChecker utility

  // Call Gemini AI with selected model
  const callGemini = async (userMessage) => {
    const model = getGeminiModel(selectedGeminiModel);
    if (!model) {
      console.warn('Gemini API key not configured');
      return null;
    }

    try {
      const result = await model.generateContent(userMessage);
      const response = await result.response;
      const text = response.text();
      return text.trim();
    } catch (error) {
      console.error('Error calling Gemini:', error);
      return null;
    }
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
    
    // Check toxicity using Gemini AI (with fallback)
    const toxicityResult = await checkToxicity(originalText, true);
    const isToxic = toxicityResult.isToxic;
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

    // Extract mentions from text
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(originalText)) !== null) {
      // Find user by name
      const mentionedName = match[1];
      const mentionedUser = Object.values(userProfiles).find(u => 
        u.name?.toLowerCase() === mentionedName.toLowerCase()
      );
      if (mentionedUser) {
        mentions.push(mentionedUser.id);
      }
    }

    try {
      // Save user message
      const messageData = {
        text: originalText,
        displayText: displayText,
        toxic: isToxic,
        toxicityConfidence: toxicityResult.confidence,
        toxicityReason: toxicityResult.reason,
        toxicityMethod: toxicityResult.method,
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
      };

      // Add reply reference if replying
      if (replyingTo) {
        messageData.replyTo = replyingTo.id;
        messageData.replyToText = replyingTo.text || replyingTo.displayText;
        messageData.replyToUserName = replyingTo.userName;
      }

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

      // Add mentions
      if (mentions.length > 0) {
        messageData.mentions = mentions;
      }

      const messageRef = await addDoc(collection(db, 'messages'), messageData);

      // Send notifications to mentioned users
      if (mentions.length > 0) {
        mentions.forEach(async (mentionedUserId) => {
          if (mentionedUserId !== user.uid) {
            const mentionedUser = userProfiles[mentionedUserId];
            await notificationService.showMention(
              { text: originalText, userProfilePicture: userProfiles[user.uid]?.profilePicture },
              userName
            );
          }
        });
      }

      setNewMessage('');
      clearDraft(CHAT_ID);
      setAttachedFile(null);
      setReplyingTo(null);
      setLastMessageTime(now);
      success('Message sent!');

      // If message is NOT toxic AND AI Help mode is enabled, get Gemini response
      if (!isToxic && aiHelpMode) {
        setWaitingForAI(true);
        try {
          const aiResponse = await callGemini(originalText);
          if (aiResponse) {
            // Save AI response to Firestore
            await addDoc(collection(db, 'messages'), {
              text: aiResponse,
              displayText: aiResponse,
              toxic: false,
              isAI: true,
              userId: 'virtual-senior', // Special ID for AI
              userName: 'Virtual Senior',
              userEmail: null,
              sender: 'Virtual Senior', // As per requirement
              timestamp: serverTimestamp(),
              reactions: {},
              edited: false,
              editedAt: null,
              readBy: {
                [user.uid]: serverTimestamp() // User has seen the AI response
              }
            });
          }
        } catch (aiError) {
          console.error('Error getting AI response:', aiError);
          // Don't show error to user, just log it
        } finally {
          setWaitingForAI(false);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error.code === 'permission-denied'
        ? 'Permission denied. You may not have permission to send messages.'
        : error.code === 'unavailable'
        ? 'Service temporarily unavailable. Please check your connection and try again.'
        : error.message || 'Failed to send message. Please try again.';
      showError(errorMessage);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId, messageUserId, isAIMessage = false) => {
    const isAuthor = messageUserId === user?.uid;
    const isAdmin = isAdminRole(userRole);
    
    // Allow admins to delete AI messages, or users to delete their own messages
    if (isAIMessage && !isAdmin) {
      showError('Only administrators can delete AI messages.');
      return;
    }
    
    if (!isAuthor && !isAdmin) {
      showError('You can only delete your own messages.');
      return;
    }

    if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) return;

    setDeleting(messageId);
    try {
      const messageRef = doc(db, 'messages', messageId);
      
      // Verify message exists before deleting
      const messageSnap = await getDoc(messageRef);
      if (!messageSnap.exists()) {
        showError('Message not found. It may have already been deleted.');
        setDeleting(null);
        return;
      }

      console.log('ChatArea: Deleting message:', {
        messageId,
        messageUserId,
        isAIMessage,
        currentUser: user.uid,
        isAuthor,
        isAdmin
      });

      // Delete the message
      await deleteDoc(messageRef);
      console.log('ChatArea: Message deleted successfully');
      
      success('Message deleted successfully.');
    } catch (error) {
      console.error('Error deleting message:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      const errorMessage = error.code === 'permission-denied' 
        ? 'Permission denied. You may not have permission to delete this message. Please check your permissions.'
        : error.message || 'Failed to delete message. Please try again.';
      showError(errorMessage);
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

    // Check toxicity using Gemini AI (with fallback)
    const toxicityResult = await checkToxicity(editText.trim(), true);
    const isToxic = toxicityResult.isToxic;
    const displayText = isToxic ? '[REDACTED BY AI]' : editText.trim();

    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, {
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
      console.error('Error editing message:', error);
      showError(`Failed to edit message: ${error.message || 'Please try again.'}`);
    }
  };

  const handleForwardMessage = (messageId) => {
    if (!preferences.allowMessageForwarding) {
      showError('Message forwarding is disabled in your settings');
      return;
    }

    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    setForwardingMessage(message);
    setShowForwardModal(true);
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

  const filteredMessages = messages; // Advanced search handles filtering

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
    <div className="flex flex-col h-screen h-[100dvh] w-full bg-gray-50 dark:bg-gray-900">
      {/* Chat Header */}
      <div 
        className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-3 md:py-4"
        style={{
          paddingTop: `max(0.75rem, env(safe-area-inset-top, 0px) + 0.5rem)`,
          paddingBottom: `0.75rem`,
          paddingLeft: `calc(1rem + env(safe-area-inset-left, 0px))`,
          paddingRight: `calc(1rem + env(safe-area-inset-right, 0px))`,
          marginTop: '0',
          position: 'relative',
          zIndex: 10
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <Logo size="small" showText={false} />
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg md:text-2xl font-bold text-gray-800 dark:text-white truncate">Campus Chat</h2>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Connect with your campus community</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* AI Help Mode Toggle with Model Selector */}
            <div className="relative">
              <button
                onClick={() => setAiHelpMode(!aiHelpMode)}
                className={`p-2 rounded-lg transition-colors ${
                  aiHelpMode
                    ? 'bg-indigo-600 text-white'
                    : 'hover:bg-indigo-100 dark:hover:bg-indigo-700 text-indigo-600 dark:text-indigo-400'
                }`}
                title={aiHelpMode ? 'AI Help Mode: ON - Virtual Senior will respond' : 'AI Help Mode: OFF - Click to enable'}
              >
                <Bot size={20} />
              </button>
              {aiHelpMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowModelSelector(!showModelSelector);
                  }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-400 rounded-full border-2 border-white dark:border-gray-800 hover:bg-indigo-500 transition-colors"
                  title="Select Gemini Model"
                />
              )}
              {/* Model Selector Dropdown */}
              {aiHelpMode && showModelSelector && (
                <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[250px]">
                  <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Select Gemini Model</p>
                  </div>
                  <div className="p-2 max-h-64 overflow-y-auto">
                    {geminiModels.map((model) => (
                      <button
                        key={model.value}
                        onClick={() => {
                          setSelectedGeminiModel(model.value);
                          setShowModelSelector(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors ${
                          selectedGeminiModel === model.value
                            ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{model.label}</span>
                              {model.free && (
                                <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs rounded">
                                  FREE
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{model.description}</p>
                          </div>
                          {selectedGeminiModel === model.value && (
                            <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full"></div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {aiHelpMode && (
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hidden sm:inline">
                AI Help ON
              </span>
            )}
            <div className="relative flex items-center gap-2">
              <button
                onClick={() => setShowAdvancedSearch(true)}
                className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-700 rounded-lg transition-colors"
                title="Advanced Search (Ctrl/Cmd + K)"
              >
                <Search size={20} className="text-indigo-600 dark:text-indigo-400" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-700 rounded-lg transition-colors"
                  title="Export chat history"
                >
                  <Download size={20} className="text-indigo-600 dark:text-indigo-400" />
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[180px]">
                    <button
                      onClick={() => {
                        exportMessagesToJSON(messages, 'campus-chat-history');
                        setShowExportMenu(false);
                        success('Chat history exported as JSON');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300"
                    >
                      Export as JSON
                    </button>
                    <button
                      onClick={() => {
                        exportMessagesToCSV(messages, 'campus-chat-history');
                        setShowExportMenu(false);
                        success('Chat history exported as CSV');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300"
                    >
                      Export as CSV
                    </button>
                    <button
                      onClick={() => {
                        exportMessagesToTXT(messages, 'campus-chat-history');
                        setShowExportMenu(false);
                        success('Chat history exported as TXT');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300"
                    >
                      Export as TXT
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
      </div>

          {/* Pinned Messages Section */}
          {pinnedMessages.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-3 md:px-6 py-2 animate-slide-in-down">
              <div className="flex items-center gap-2 mb-2">
                <Pin size={16} className="text-yellow-600 dark:text-yellow-400" />
                <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">Pinned Messages</h3>
              </div>
              <div className="space-y-2">
                {messages
                  .filter(m => pinnedMessages.includes(m.id))
                  .slice(0, 3)
                  .map((message) => (
                    <div key={message.id} className="text-xs p-2 bg-white dark:bg-gray-800 rounded border border-yellow-200 dark:border-yellow-700 card-hover">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{message.userName || 'User'}</span>
                        <Pin size={12} className="text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 truncate">
                        {message.displayText || message.text}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y px-3 md:px-6 py-3 md:py-4 space-y-3 md:space-y-4">
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in">
            <img 
              src="/logo.png" 
              alt="CampusConnect Logo" 
              className="w-24 h-24 mb-4 opacity-50 object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <p className="text-gray-400 dark:text-gray-500 text-center">
              {searchQuery ? 'No messages found matching your search.' : 'No messages yet. Start the conversation!'}
            </p>
          </div>
        ) : (
          filteredMessages.map((message) => {
            const isAuthor = message.userId === user?.uid;
            const isAdmin = isAdminRole(userRole);
            const isAIMessage = message.isAI || message.sender === 'Virtual Senior' || message.userId === 'virtual-senior';
            const canEdit = isAuthor && !message.edited;
            // Allow admins to delete AI messages, or users to delete their own messages
            const canDelete = isAIMessage ? isAdmin : (isAuthor || isAdmin);
            const userReaction = message.reactions?.[user.uid];
            const reactionCounts = message.reactions ? Object.values(message.reactions).reduce((acc, emoji) => {
              acc[emoji] = (acc[emoji] || 0) + 1;
              return acc;
            }, {}) : {};
            const userProfile = userProfiles[message.userId] || {};
            const profilePicture = userProfile.profilePicture;

            return (
              <div
                id={`message-${message.id}`}
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
                        loading="lazy"
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
                          isUserOnline(onlineUsers[message.userId])
                            ? 'Online'
                            : onlineUsers[message.userId]?.lastSeen
                            ? `Last seen: ${formatLastSeen(onlineUsers[message.userId].lastSeen)}`
                            : 'Offline'
                        }
                      >
                        {(() => {
                          // Check if this is an AI message
                          if (message.isAI || message.sender === 'Virtual Senior') {
                            return 'Virtual Senior';
                          }
                          // Priority: cached name > message userName > userProfile name > email > fallback
                          const cachedName = userNames[message.userId];
                          const messageName = message.userName;
                          const profileName = userProfiles[message.userId]?.name;
                          const emailName = message.userEmail?.split('@')[0];
                          
                          return cachedName || messageName || profileName || emailName || 'Unknown';
                        })()}
                      </button>
                      {isUserOnline(onlineUsers[message.userId]) ? (
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
                      <label htmlFor={`edit-message-${message.id}`} className="sr-only">Edit message</label>
                      <input
                        type="text"
                        id={`edit-message-${message.id}`}
                        name={`edit-message-${message.id}`}
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

                  {/* Reply Preview in Message */}
                  {message.replyTo && (
                    <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 border-l-2 border-indigo-500 rounded text-xs">
                      <div className="flex items-center gap-1 mb-1">
                        <Reply size={12} className="text-indigo-600 dark:text-indigo-400" />
                        <span className="font-medium text-indigo-600 dark:text-indigo-400">
                          {message.replyToUserName || 'User'}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 truncate">
                        {message.replyToText || 'Message'}
                      </p>
                    </div>
                  )}

                  {/* Attachment Display */}
                  {message.attachment && (
                    <div className="mb-2">
                      {message.attachment.type?.startsWith('image/') ? (
                        <button
                          type="button"
                          onClick={() => setPreviewImage({ url: message.attachment.url, name: message.attachment.name })}
                          className="block rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:opacity-90 active:opacity-75 transition-opacity cursor-pointer touch-action-manipulation w-full text-left p-0"
                          aria-label="View image"
                        >
                          <img
                            src={message.attachment.url}
                            alt={message.attachment.name}
                            className="max-w-full max-h-64 object-contain pointer-events-none"
                            loading="lazy"
                          />
                        </button>
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

                  {/* Message Text with Markdown */}
                  {message.displayText && (
                    <p 
                      className="text-sm whitespace-pre-wrap break-words"
                      dangerouslySetInnerHTML={{
                        __html: hasMarkdown(message.displayText) 
                          ? parseMarkdown(message.displayText)
                          : message.displayText.replace(/\n/g, '<br />')
                      }}
                    />
                  )}

                  {/* Action buttons - always visible on touch, hover on desktop */}
                  <div className="absolute -top-2 -right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex gap-1 touch-action-none">
                    <button
                      onClick={async () => {
                        try {
                          await saveMessage(user.uid, { ...message, chatType: 'global' });
                          success('Message saved!');
                        } catch (error) {
                          if (error.message === 'Message already saved') {
                            showError('Message already saved');
                          } else {
                            showError('Failed to save message');
                          }
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white p-1 rounded-full transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-95"
                      title="Save message"
                    >
                      <Bookmark size={14} />
                    </button>
                    {preferences.allowMessageForwarding && (
                      <button
                        onClick={() => handleForwardMessage(message.id)}
                        className="bg-purple-600 hover:bg-purple-700 text-white p-1 rounded-full transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-95"
                        title="Forward message"
                      >
                        <Forward size={14} />
                      </button>
                    )}
                    {!isAuthor && (
                      <button
                        onClick={() => setReplyingTo(message)}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded-full transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-95"
                        title="Reply to message"
                      >
                        <Reply size={14} />
                      </button>
                    )}
                    {isAdminRole(userRole) && (
                      <button
                        onClick={async () => {
                          try {
                            const isPinned = pinnedMessages.includes(message.id);
                            if (isPinned) {
                              await updateDoc(doc(db, 'messages', message.id), {
                                pinned: false
                              });
                              setPinnedMessages(prev => prev.filter(id => id !== message.id));
                              success('Message unpinned');
                            } else {
                              await updateDoc(doc(db, 'messages', message.id), {
                                pinned: true,
                                pinnedAt: serverTimestamp()
                              });
                              setPinnedMessages(prev => [...prev, message.id]);
                              success('Message pinned');
                            }
                          } catch (error) {
                            console.error('Error pinning message:', error);
                            showError('Failed to pin message');
                          }
                        }}
                        className={`p-1 rounded-full transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-95 ${
                          pinnedMessages.includes(message.id)
                            ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                            : 'bg-gray-600 hover:bg-gray-700 text-white'
                        }`}
                        title={pinnedMessages.includes(message.id) ? 'Unpin message' : 'Pin message'}
                      >
                        <Pin size={14} />
                      </button>
                    )}
                    {canEdit && (
                      <button
                        onClick={() => {
                          setEditing(message.id);
                          setEditText(message.text);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white p-1 rounded-full transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-95"
                        title="Edit message"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteMessage(message.id, message.userId, isAIMessage)}
                        disabled={deleting === message.id}
                        className="bg-red-600 hover:bg-red-700 text-white p-1 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-95 disabled:transform-none"
                        title={isAIMessage ? "Delete AI message (Admin only)" : "Delete message"}
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
                          <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-10 min-w-[200px] touch-action-none">
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
                                className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs rounded transition-colors touch-action-manipulation"
                              >
                                Report
                              </button>
                              <button
                                onClick={() => {
                                  setReporting(null);
                                  setReportReason('');
                                }}
                                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs rounded transition-colors touch-action-manipulation"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Reaction picker - always visible on touch, hover on desktop */}
                  {!isAuthor && (
                    <div className="mt-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1 touch-action-none">
                        {EMOJI_REACTIONS.map((emoji) => {
                          const reactionKey = `${message.id}-${emoji}`;
                          const isReacting = reacting.has(reactionKey);
                          return (
                            <button
                              key={emoji}
                              onClick={() => !isReacting && handleReaction(message.id, emoji)}
                              disabled={isReacting}
                              className={`p-2 rounded transition-colors touch-action-manipulation ${
                                isReacting ? 'opacity-50 cursor-wait' : 'hover:bg-indigo-200 dark:hover:bg-indigo-700 active:bg-indigo-300 dark:active:bg-indigo-600'
                              } ${
                                userReaction === emoji ? 'bg-indigo-200 dark:bg-indigo-800' : ''
                              }`}
                              title="Add reaction"
                              aria-label={`Add ${emoji} reaction`}
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

          {/* Typing Indicator */}
          {Object.keys(typingUsers).length > 0 && (
            <TypingIndicator typingUsers={typingUsers} userNames={userNames} />
          )}

          {/* Message Input */}
          <div 
            className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-3 md:px-6 py-3 md:py-4"
            style={{
              paddingBottom: `max(0.25rem, calc(env(safe-area-inset-bottom, 0px) * 0.3))`,
              paddingLeft: `calc(0.75rem + env(safe-area-inset-left, 0px))`,
              paddingRight: `calc(0.75rem + env(safe-area-inset-right, 0px))`
            }}
          >
            {/* Reply Preview */}
            {replyingTo && (
              <div className="mb-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg flex items-center justify-between animate-slide-in-down">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Reply size={16} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                      Replying to {replyingTo.userName}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {replyingTo.text || replyingTo.displayText}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-800 rounded transition-colors flex-shrink-0"
                >
                  <X size={16} className="text-indigo-600 dark:text-indigo-400" />
                </button>
              </div>
            )}

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

            <form onSubmit={sendMessage} className="flex gap-2 md:gap-3 relative">
              <div className="flex-1 relative">
                <label htmlFor="chat-message-input" className="sr-only">Type a message</label>
                <input
                  ref={messageInputRef}
                  type="text"
                  id="chat-message-input"
                  name="chat-message"
                  value={newMessage}
                  onChange={async (e) => {
                    setNewMessage(e.target.value);
                    // Trigger typing indicator
                    if (e.target.value.length > 0) {
                      try {
                        const typingRef = doc(db, 'typing', user.uid);
                        await updateDoc(typingRef, {
                          typing: true,
                          timestamp: serverTimestamp()
                        });
                      } catch (error) {
                        // Create if doesn't exist
                        try {
                          await setDoc(doc(db, 'typing', user.uid), {
                            typing: true,
                            timestamp: serverTimestamp()
                          });
                        } catch (err) {
                          // Ignore errors
                        }
                      }
                    }
                    if (messageInputRef.current) {
                      setCursorPosition(messageInputRef.current.selectionStart || 0);
                    }
                    // Show mention autocomplete if @ is typed
                    if (e.target.value.includes('@')) {
                      setShowMentions(true);
                    } else {
                      setShowMentions(false);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (messageInputRef.current) {
                      setCursorPosition(messageInputRef.current.selectionStart || 0);
                    }
                  }}
                  onSelect={(e) => {
                    if (messageInputRef.current) {
                      setCursorPosition(messageInputRef.current.selectionStart || 0);
                    }
                  }}
                  placeholder={aiHelpMode ? "Type your message... (AI Help enabled)" : "Type your message... (Use @ to mention)"}
                  className="w-full px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  disabled={sending || waitingForAI}
                />
                {/* Mention Autocomplete */}
                {showMentions && (
                  <MentionAutocomplete
                    text={newMessage}
                    cursorPosition={cursorPosition}
                    users={Object.values(userProfiles)}
                    onSelect={(newText, newPosition) => {
                      setNewMessage(newText);
                      setShowMentions(false);
                      setTimeout(() => {
                        if (messageInputRef.current) {
                          messageInputRef.current.focus();
                          messageInputRef.current.setSelectionRange(newPosition, newPosition);
                        }
                      }, 0);
                    }}
                  />
                )}
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
                    <div className="absolute bottom-full right-0 mb-2">
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
                    <div className="absolute bottom-full right-0 mb-2 z-[100]">
                      <EmojiPicker
                        onEmojiSelect={(emoji) => {
                          const cursorPos = messageInputRef.current?.selectionStart || newMessage.length;
                          const textBefore = newMessage.substring(0, cursorPos);
                          const textAfter = newMessage.substring(cursorPos);
                          setNewMessage(textBefore + emoji + textAfter);
                          setShowEmojiPicker(false);
                          setTimeout(() => {
                            if (messageInputRef.current) {
                              messageInputRef.current.focus();
                              const newPos = cursorPos + emoji.length;
                              messageInputRef.current.setSelectionRange(newPos, newPos);
                            }
                          }, 0);
                        }}
                        onClose={() => setShowEmojiPicker(false)}
                        position="top"
                      />
                    </div>
                  )}
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={sending || waitingForAI || (!newMessage.trim() && !attachedFile)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 md:px-6 py-2 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-1 md:gap-2"
                >
                  {waitingForAI ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span className="hidden sm:inline">AI thinking...</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} className="md:w-5 md:h-5" />
                      <span className="hidden sm:inline">Send</span>
                    </>
                  )}
                </button>
              </div>
            </form>
            {aiHelpMode && (
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 text-center">
                💡 AI Help Mode: Virtual Senior ({geminiModels.find(m => m.value === selectedGeminiModel)?.label}) will respond to your non-toxic messages
              </p>
            )}
          </div>

      {/* User Profile Popup */}
      {selectedUserId && (
        <UserProfilePopup 
          userId={selectedUserId} 
          onClose={() => setSelectedUserId(null)}
          onStartPrivateChat={(userId, userData) => {
            if (setActiveView) {
              // Store both userId and userData for PrivateChat to use
              sessionStorage.setItem('initialPrivateChatUserId', userId);
              sessionStorage.setItem('initialPrivateChatUserData', JSON.stringify(userData));
              setActiveView('private-chat');
            }
          }}
        />
      )}

      {/* Forward Message Modal */}
      {showForwardModal && forwardingMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => {
          setShowForwardModal(false);
          setForwardingMessage(null);
        }}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Forward Message</h3>
              <button
                onClick={() => {
                  setShowForwardModal(false);
                  setForwardingMessage(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  From: {forwardingMessage.userName || 'Unknown'}
                </p>
                <p className="text-gray-900 dark:text-white">
                  {forwardingMessage.displayText || forwardingMessage.text}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Forward to
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      // Forward to Campus Chat (current chat)
                      success('Message forwarded to Campus Chat');
                      setShowForwardModal(false);
                      setForwardingMessage(null);
                    }}
                    className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-left"
                  >
                    <div className="font-medium">Campus Chat</div>
                    <div className="text-sm opacity-90">Forward to global chat</div>
                  </button>
                  <button
                    onClick={() => {
                      setActiveView('private-chat');
                      sessionStorage.setItem('forwardMessage', JSON.stringify(forwardingMessage));
                      setShowForwardModal(false);
                      setForwardingMessage(null);
                      success('Navigate to Direct Messages to forward');
                    }}
                    className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-left"
                  >
                    <div className="font-medium">Direct Messages</div>
                    <div className="text-sm opacity-90">Forward to a private chat</div>
                  </button>
                  <button
                    onClick={() => {
                      setActiveView('groups');
                      sessionStorage.setItem('forwardMessage', JSON.stringify(forwardingMessage));
                      setShowForwardModal(false);
                      setForwardingMessage(null);
                      success('Navigate to Groups to forward');
                    }}
                    className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-left"
                  >
                    <div className="font-medium">Group Chat</div>
                    <div className="text-sm opacity-90">Forward to a group</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Search Modal */}
      {showAdvancedSearch && (
        <AdvancedSearch
          messages={messages}
          users={Object.values(userProfiles).map(profile => ({
            id: profile.id || Object.keys(userProfiles).find(key => userProfiles[key] === profile),
            name: profile.name || profile.email?.split('@')[0] || 'Unknown',
            email: profile.email
          }))}
          onSelectMessage={(message) => {
            // Scroll to message
            const messageElement = document.getElementById(`message-${message.id}`);
            if (messageElement) {
              messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              messageElement.classList.add('ring-2', 'ring-indigo-500', 'ring-opacity-75');
              setTimeout(() => {
                messageElement.classList.remove('ring-2', 'ring-indigo-500', 'ring-opacity-75');
              }, 2000);
            }
          }}
          onClose={() => setShowAdvancedSearch(false)}
        />
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <ImagePreview
          imageUrl={previewImage.url}
          imageName={previewImage.name}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
};

export default ChatArea;
