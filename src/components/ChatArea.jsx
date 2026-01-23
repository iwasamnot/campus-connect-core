import { useState, useEffect, useRef, useMemo, useCallback, memo, startTransition } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
// Use window globals to avoid import/export issues in production builds
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
  setDoc,
  limit,
  startAfter,
  getDocs,
  getDoc
} from 'firebase/firestore';
// Firebase Storage removed - using Cloudinary for all file uploads
// Use window.__firebaseDb to avoid import/export issues in production builds
const db = typeof window !== 'undefined' && window.__firebaseDb 
  ? window.__firebaseDb 
  : null;
import { Send, Trash2, Edit2, X, Check, Search, Flag, Smile, MoreVertical, User, Bot, Paperclip, Pin, Reply, Image as ImageIcon, File, Forward, Download, Keyboard, Bookmark, Share2, BarChart3, Mic, MessageSquare, Languages, FileText, Copy, Clock, Sparkles, FileCheck, Loader, Settings, CheckCircle2, XCircle, Phone, Camera, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { shareMessage } from '../utils/webShare';
import ImagePreview from './ImagePreview';
// Use window.__LogoComponent directly to avoid import/export issues
// This is set in main.jsx and App.jsx before any lazy components load
const Logo = typeof window !== 'undefined' && window.__LogoComponent 
  ? window.__LogoComponent 
  : () => <div>Logo</div>; // Fallback placeholder
import UserProfilePopup from './UserProfilePopup';
import TypingIndicator, { useTypingIndicator } from './TypingIndicator';
import EmojiPicker from './EmojiPicker';
import FileUpload from './FileUpload';
import MentionAutocomplete from './MentionAutocomplete';
import AdvancedSearch from './AdvancedSearch';
import PollCreator from './PollCreator';
import PollDisplay from './PollDisplay';
import VoiceRecorder from './VoiceRecorder';
import VoiceMessage from './VoiceMessage';
import VoiceInterface from './VoiceInterface';
import QuickReplies from './QuickReplies';
import MessageThread from './MessageThread';
import MessageReminder from './MessageReminder';
import GifPicker from './GifPicker';
import MessageEffects from './MessageEffects';
import RichTextEditor from './RichTextEditor';
import CustomEmojiReactions from './CustomEmojiReactions';
import MessageAnalytics from './MessageAnalytics';
import AISmartReplies from './AISmartReplies';
import AIPredictiveTyping from './AIPredictiveTyping';
import ContextualActions from './ContextualActions';
import SmartCategorization from './SmartCategorization';
import CollaborativeEditor from './CollaborativeEditor';
import PredictiveScheduler from './PredictiveScheduler';
import VoiceEmotionDetector from './VoiceEmotionDetector';
import { generateFilledForm, downloadPDF } from '../utils/formFiller';
import { runAgent, approveAndExecuteTool, continueAgentAfterApproval, processQuery } from '../utils/agentEngine';
import { manageMemory, summarizeForArchival } from '../utils/memoryManager';
import { convertImageToBase64, createImagePreview, revokeImagePreview } from '../utils/imageUtils';
import { checkSafety, getCrisisResponse } from '../utils/safetyCheck';
// AI Features - lazy loaded based on toggle (no top-level await)
import SmartTaskExtractor from './SmartTaskExtractor';
import RelationshipGraph from './RelationshipGraph';
import FuturisticFeaturesMenu from './FuturisticFeaturesMenu';
// AI Features Disabled - Only Virtual Senior and RAG Engine are enabled
// import { translateText } from '../utils/aiTranslation';
// import { summarizeConversation } from '../utils/aiSummarization';
import { checkReminders, formatReminderTime } from '../utils/messageReminders';
import { transcribeAudio, isSpeechRecognitionAvailable } from '../utils/voiceTranscription';
// Use window globals to avoid import/export issues
const saveDraft = typeof window !== 'undefined' && window.__saveDraft ? window.__saveDraft : () => {};
const getDraft = typeof window !== 'undefined' && window.__getDraft ? window.__getDraft : () => null;
const clearDraft = typeof window !== 'undefined' && window.__clearDraft ? window.__clearDraft : () => {};
const exportMessagesToJSON = typeof window !== 'undefined' && window.__exportMessagesToJSON ? window.__exportMessagesToJSON : () => {};
const exportMessagesToCSV = typeof window !== 'undefined' && window.__exportMessagesToCSV ? window.__exportMessagesToCSV : () => {};
const exportMessagesToTXT = typeof window !== 'undefined' && window.__exportMessagesToTXT ? window.__exportMessagesToTXT : () => {};
const saveMessage = typeof window !== 'undefined' && window.__saveMessage ? window.__saveMessage : () => {};
const parseMarkdown = typeof window !== 'undefined' && window.__parseMarkdown ? window.__parseMarkdown : (text) => text;
const hasMarkdown = typeof window !== 'undefined' && window.__hasMarkdown ? window.__hasMarkdown : () => false;
const notificationService = typeof window !== 'undefined' && window.__notificationService ? window.__notificationService : { show: () => {} };
const checkToxicity = typeof window !== 'undefined' && window.__checkToxicity ? window.__checkToxicity : () => Promise.resolve({ isToxic: false });
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
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
  const [agentThinking, setAgentThinking] = useState([]); // ReAct agent thinking log
  const [awaitingApproval, setAwaitingApproval] = useState(null); // Tool call awaiting approval
  const [ragStatus, setRagStatus] = useState(null); // Self-learning RAG status
  const [onlineUsers, setOnlineUsers] = useState({});
  const [userNames, setUserNames] = useState({}); // Cache user names
  const [userProfiles, setUserProfiles] = useState({}); // Cache user profile data
  const [selectedUserId, setSelectedUserId] = useState(null); // For profile popup
  const [reacting, setReacting] = useState(new Set()); // Track reactions in progress to prevent duplicates
  const [aiHelpMode, setAiHelpMode] = useState(false); // Toggle for AI Help mode
  const [waitingForAI, setWaitingForAI] = useState(false); // Track if waiting for AI response
  const [selectedGeminiModel, setSelectedGeminiModel] = useState('gemini-2.5-flash'); // Default model (latest 2026 version)
  const [showModelSelector, setShowModelSelector] = useState(false); // Show model selector dropdown
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // Show emoji picker
  const [showFileUpload, setShowFileUpload] = useState(false); // Show file upload
  const [attachedFile, setAttachedFile] = useState(null); // Attached file
  const [selectedImage, setSelectedImage] = useState(null); // Selected image for AI vision analysis
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null); // Preview URL for selected image
  const [replyingTo, setReplyingTo] = useState(null); // Message being replied to
  const [pinnedMessages, setPinnedMessages] = useState([]); // Pinned messages
  const [cursorPosition, setCursorPosition] = useState(0); // Cursor position for mentions
  const [showMentions, setShowMentions] = useState(false); // Show mention autocomplete
  const [forwardingMessage, setForwardingMessage] = useState(null); // Message to forward
  const [showForwardModal, setShowForwardModal] = useState(false); // Show forward modal
  const [previewImage, setPreviewImage] = useState(null); // Image preview state { url, name }
  const [showPollCreator, setShowPollCreator] = useState(false); // Show poll creator
  const [polls, setPolls] = useState([]); // List of polls in chat
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false); // Show voice recorder
  const [showVoiceInterface, setShowVoiceInterface] = useState(false); // Show voice duplex interface
  const [showQuickReplies, setShowQuickReplies] = useState(false); // Show quick replies
  const [translating, setTranslating] = useState(new Set()); // Messages being translated
  const [translations, setTranslations] = useState({}); // Translated messages cache
  const [showSummarization, setShowSummarization] = useState(false); // Show summarization
  const [conversationSummary, setConversationSummary] = useState(null); // Conversation summary
  const [openMenuId, setOpenMenuId] = useState(null); // Track which message's menu is open
  const [openThreadId, setOpenThreadId] = useState(null); // Track which message's thread is open
  const [showReminderModal, setShowReminderModal] = useState(null); // Message ID for reminder modal
  const [showGifPicker, setShowGifPicker] = useState(false); // Show GIF picker
  const [messageEffect, setMessageEffect] = useState(null); // Current message effect
  const [showRichTextEditor, setShowRichTextEditor] = useState(false); // Show rich text editor
  const [showCustomEmojiPicker, setShowCustomEmojiPicker] = useState(null); // Message ID for custom emoji picker
  const [showAnalytics, setShowAnalytics] = useState(false); // Show analytics dashboard
  const [voiceTranscription, setVoiceTranscription] = useState({}); // Voice message transcriptions
  const [showSmartReplies, setShowSmartReplies] = useState(true); // AI Smart Replies (enabled by default)
  const [selectedMessageForReply, setSelectedMessageForReply] = useState(null); // Message clicked for smart replies
  const [showPredictiveTyping, setShowPredictiveTyping] = useState(true); // AI Predictive Typing (enabled by default)
  const [selectedMessageForActions, setSelectedMessageForActions] = useState(null); // Message for contextual actions
  const [showCollaborativeEditor, setShowCollaborativeEditor] = useState(false); // Collaborative Editor
  const [showPredictiveScheduler, setShowPredictiveScheduler] = useState(false); // Predictive Scheduler
  const [showVoiceEmotion, setShowVoiceEmotion] = useState(false); // Voice Emotion Detection
  const [showConversationInsights, setShowConversationInsights] = useState(false); // Conversation Insights
  const [AIConversationInsightsComponent, setAIConversationInsightsComponent] = useState(null);
  
  // Lazy load AIConversationInsights component when needed
  useEffect(() => {
    if (showConversationInsights && localStorage.getItem('aiInsightsEnabled') !== 'false' && !AIConversationInsightsComponent) {
      import('./AIConversationInsights').then(module => {
        setAIConversationInsightsComponent(() => module.default);
      }).catch(error => {
        console.error('Error loading AIConversationInsights:', error);
      });
    }
  }, [showConversationInsights, AIConversationInsightsComponent]);
  const [showTaskExtractor, setShowTaskExtractor] = useState(false); // Task Extractor
  const [showRelationshipGraph, setShowRelationshipGraph] = useState(false); // Relationship Graph
  const [scheduledMessage, setScheduledMessage] = useState(null); // Scheduled message time
  const [showFuturisticMenu, setShowFuturisticMenu] = useState(false); // Futuristic features menu
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const mountedRef = useRef(true);
  const menuRefs = useRef({}); // Refs for each menu
  const messagesContainerRef = useRef(null);
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
  
  // Keyboard shortcuts - optimized with startTransition for better INP
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K for advanced search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        startTransition(() => {
          setShowAdvancedSearch(true);
        });
        return;
      }
      
      // Ctrl/Cmd + Shift + A for analytics
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && e.shiftKey) {
        e.preventDefault();
        setShowAnalytics(true);
        return;
      }
      
      // Ctrl/Cmd + Enter to send
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !sending) {
        e.preventDefault();
        if (newMessage.trim() || attachedFile) {
          sendMessage(e);
        }
      }
      
      // Up arrow to edit last message - optimize with memoized filter
      if (e.key === 'ArrowUp' && !newMessage.trim() && messageInputRef.current === document.activeElement) {
        // Use startTransition to prevent blocking
        startTransition(() => {
          const userMessages = messages.filter(m => m.userId === user?.uid && !m.isAI);
          if (userMessages.length > 0) {
            const lastMessage = userMessages[userMessages.length - 1];
            if (!lastMessage.edited) {
              e.preventDefault();
              setEditing(lastMessage.id);
              setEditText(lastMessage.text);
            }
          }
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown, { passive: true });
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
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: 'Latest 2026 Model - Fast & Efficient (Recommended)', free: true },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', description: 'Free - Fast & Efficient', free: true },
    { value: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash 8B', description: 'Free - Lightweight & Fast', free: true },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', description: 'Paid - Most Capable', free: false },
    { value: 'gemini-pro', label: 'Gemini Pro', description: 'Deprecated - Use 2.5 Flash instead', free: false },
  ];

  // Initialize Gemini AI with selected model
  const getGeminiModel = (modelName = selectedGeminiModel) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
    if (!apiKey || apiKey === '') {
      return null;
    }
    
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      // Use the selected model, fallback to gemini-2.5-flash if model not found
      const modelToUse = modelName || 'gemini-2.5-flash';
      const model = genAI.getGenerativeModel({ 
        model: modelToUse,
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
      console.error('Error initializing Gemini model:', error);
      // Fallback to gemini-2.5-flash, then gemini-1.5-flash if the selected model fails
      if (modelName !== 'gemini-2.5-flash') {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        } catch (fallbackError) {
          console.warn('gemini-2.5-flash not available, trying gemini-1.5-flash:', fallbackError);
          try {
            const genAI = new GoogleGenerativeAI(apiKey);
            return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          } catch (secondFallbackError) {
            console.error('Fallback models also failed:', secondFallbackError);
            return null;
          }
        }
      }
      return null;
    }
  };

  // Initialize RAG system on mount
  useEffect(() => {
    const initRAG = async () => {
      try {
        const { initializeRAG } = await import('../utils/ragSystem');
        await initializeRAG();
      } catch (error) {
        console.warn('RAG initialization error (will use fallback):', error);
      }
    };
    initRAG();
  }, []);

  // Fetch all users to get names and profile data (limited to prevent quota exhaustion)
  // Using one-time read instead of real-time listener to reduce reads
  // OPTIMIZED: Added ref to prevent multiple simultaneous fetches
  const fetchingUsersRef = useRef(false);
  
  // Load users list on mount (optimized: only once, with interval refresh)
  useEffect(() => {
    // Prevent multiple simultaneous fetches (fixes duplicate loading issue)
    if (fetchingUsersRef.current || !mountedRef.current) {
      return;
    }
    
    fetchingUsersRef.current = true;
    
    const fetchUsers = async () => {
      try {
        if (!db) {
          console.warn('ChatArea: Firestore db not available');
          fetchingUsersRef.current = false;
          return;
        }
        
        const q = query(
          collection(db, 'users'),
          limit(50) // Further reduced to 50 users to save reads
        );
        
        const snapshot = await getDocs(q);
        if (!mountedRef.current) {
          fetchingUsersRef.current = false;
          return;
        }
        
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
        
        // Only log in development to improve performance
        if (import.meta.env.DEV) {
        console.log('ChatArea - Loaded users:', { 
          count: snapshot.docs.length, 
          names: names,
          userIds: Object.keys(names)
        });
        }
        
        fetchingUsersRef.current = false;
      } catch (error) {
        console.error('ChatArea - Error fetching users:', error);
        fetchingUsersRef.current = false;
      }
    };
    
    fetchUsers();
    
    // Refresh users every 5 minutes instead of real-time
    const intervalId = setInterval(() => {
      if (!fetchingUsersRef.current && mountedRef.current) {
        fetchUsers();
      }
    }, 5 * 60 * 1000);
    
    return () => {
      fetchingUsersRef.current = false;
      clearInterval(intervalId);
    };
  }, []); // Empty deps - only run once on mount

  // Optimized scroll to bottom - use requestAnimationFrame for smooth performance
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      requestAnimationFrame(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'instant', block: 'end' });
          // Smooth scroll with RAF for better performance
          const target = messagesEndRef.current;
          const start = target.parentElement?.scrollTop || 0;
          const end = target.parentElement?.scrollHeight || 0;
          const distance = end - start;
          const duration = Math.min(300, Math.abs(distance) * 0.5);
          let startTime = null;
          
          const animateScroll = (currentTime) => {
            if (startTime === null) startTime = currentTime;
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = progress * (2 - progress); // ease-out
            
            if (target.parentElement) {
              target.parentElement.scrollTop = start + (distance * ease);
            }
            
            if (progress < 1) {
              requestAnimationFrame(animateScroll);
            }
          };
          
          if (distance > 50) { // Only animate if significant scroll needed
            requestAnimationFrame(animateScroll);
          }
        }
      });
    }
  }, []);

  useEffect(() => {
    // Use startTransition for non-urgent scroll updates
    startTransition(() => {
      scrollToBottom();
    });
  }, [messages.length, scrollToBottom]); // Only depend on length, not full array


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
        
        // Use startTransition to prevent blocking main thread
        startTransition(() => {
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
        });
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

  // Call Gemini AI with RAG enhancement
  // PRESERVED: Virtual Senior system prompt - "You are an empathetic, knowledgeable Senior Student at the university. Keep answers under 3 sentences."
  const callGemini = async (userMessage) => {
    // Virtual Senior system prompt - PRESERVED as per requirements
    const virtualSeniorSystemPrompt = 'You are an empathetic, knowledgeable Senior Student at the university. Keep answers under 3 sentences.';

    try {
      // Try RAG-enhanced response first (now uses Vertex AI if configured)
      try {
        const { generateRAGResponse } = await import('../utils/ragSystem');
        const ragResponse = await generateRAGResponse(userMessage, [], selectedGeminiModel, '', user?.uid || null);
        if (ragResponse && ragResponse.trim() !== '') {
          return ragResponse.trim();
        }
      } catch (ragError) {
        console.warn('RAG system error, falling back to standard AI provider:', ragError);
      }

      // Fallback to unified AI provider system (supports Vertex AI, Gemini, and other providers)
      try {
        const { callAI } = await import('../utils/aiProvider');
        const response = await callAI(userMessage, {
          systemPrompt: virtualSeniorSystemPrompt, // PRESERVED Virtual Senior prompt
          maxTokens: 2048,
          temperature: 0.7,
          userId: user?.uid || null // Pass userId for memory context injection
        });
        return response ? response.trim() : null;
      } catch (aiError) {
        console.warn('AI provider error, trying legacy Gemini:', aiError);
        
        // Final fallback to legacy Gemini (if still using @google/generative-ai)
        const model = getGeminiModel(selectedGeminiModel);
        if (!model) {
          return null;
        }

        const result = await model.generateContent(userMessage);
        const response = await result.response;
        const text = response.text();
        return text.trim();
      }
    } catch (error) {
      console.error('Error calling AI:', error);
      
      // Check if it's an API blocked error (403 with API_KEY_SERVICE_BLOCKED)
      if (error.message && (
        error.message.includes('403') || 
        error.message.includes('API_KEY_SERVICE_BLOCKED') ||
        error.message.includes('SERVICE_DISABLED') ||
        error.message.includes('blocked')
      )) {
        console.warn('⚠️ AI API is blocked or disabled. AI Help feature will be unavailable.');
        console.warn('💡 To fix: Check API key restrictions in Google Cloud Console');
      }
      
      return null;
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    // Allow sending if there's either text or an attached file
    if ((!newMessage.trim() && !attachedFile && !selectedImage) || sending) return;

    // Rate limiting
    const now = Date.now();
    if (now - lastMessageTime < MESSAGE_RATE_LIMIT) {
      const remaining = Math.ceil((MESSAGE_RATE_LIMIT - (now - lastMessageTime)) / 1000);
      showError(`Please wait ${remaining} second(s) before sending another message.`);
      return;
    }

    setSending(true);
    const originalText = newMessage.trim();
    
    // SAFETY OVERRIDE: Check for crisis/distress signals FIRST (before toxicity check)
    const safetyCheck = checkSafety(originalText);
    if (safetyCheck.requiresIntervention) {
      console.warn('🚨 [Safety] Crisis intervention triggered:', safetyCheck.matchedKeyword);
      const crisisResponse = getCrisisResponse();
      
      // Save crisis intervention message to chat
      await addDoc(collection(db, 'messages'), {
        text: crisisResponse.message,
        displayText: crisisResponse.message,
        toxic: false,
        isAI: true,
        isCrisisIntervention: true, // Flag for special handling
        crisisResources: crisisResponse.resources,
        userId: 'safety-system',
        userName: 'Safety System',
        timestamp: serverTimestamp(),
        reactions: {},
        readBy: {
          [user.uid]: serverTimestamp()
        }
      });
      
      setNewMessage('');
      setSending(false);
      success('Support resources have been shared. Please reach out if you need help.');
      return; // STOP - do not process the user's message further
    }
    
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

      // Add reply reference if replying (for inline replies)
      if (replyingTo) {
        messageData.replyTo = replyingTo.id;
        messageData.replyToText = replyingTo.text || replyingTo.displayText;
        messageData.replyToUserName = replyingTo.userName;
        // Check if replying to a thread parent or creating new thread
        if (replyingTo.threadParentId) {
          messageData.threadParentId = replyingTo.threadParentId;
          messageData.isThreadReply = true;
        }
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

      // Add image for AI vision analysis if present
      if (selectedImage) {
        // Store image preview URL for display in chat history
        messageData.imageForAI = {
          previewUrl: imagePreviewUrl,
          name: selectedImage.name,
          size: selectedImage.size,
          type: selectedImage.type
        };
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
      
      // Clear image selection and revoke preview URL
      if (imagePreviewUrl) {
        revokeImagePreview(imagePreviewUrl);
      }
      setSelectedImage(null);
      setImagePreviewUrl(null);
      
      setReplyingTo(null);
      setLastMessageTime(now);
      success('Message sent!');

      // If message is NOT toxic AND AI Help mode is enabled AND Virtual Senior is enabled, get AI response
      const virtualSeniorEnabled = localStorage.getItem('virtualSeniorEnabled') !== 'false'; // Enabled by default
      const reactAgentEnabled = localStorage.getItem('reactAgentEnabled') !== 'false'; // Enabled by default
      const selfLearningRAGEnabled = localStorage.getItem('selfLearningRAGEnabled') !== 'false'; // Enabled by default
      
      if (!isToxic && aiHelpMode && virtualSeniorEnabled) {
        setWaitingForAI(true);
        setAgentThinking([]); // Clear previous thinking log
        setRagStatus(null); // Clear previous RAG status
        
        try {
          let aiResponse = null;
          
          // Convert image to base64 if present
          let imageBase64 = null;
          if (selectedImage) {
            try {
              imageBase64 = await convertImageToBase64(selectedImage);
              console.log('🖼️ [ChatArea] Image converted to base64 for AI vision');
            } catch (imageError) {
              console.error('🖼️ [ChatArea] Failed to convert image:', imageError);
              showError('Failed to process image. Sending text-only message.');
            }
          }

          // Use Self-Learning RAG if enabled, otherwise use ReAct Agent or standard AI
          // Note: RAG and ReAct Agent don't support images yet, so use standard AI for images
          if (imageBase64) {
            // Image mode: Use standard AI with image support
            const { callAI } = await import('../utils/aiProvider');
            aiResponse = await callAI(originalText || 'What do you see in this image?', {
              image: imageBase64,
              userId: user?.uid || null,
              systemPrompt: 'You are a helpful assistant with vision capabilities. Analyze the image and answer the user\'s question about it. Be descriptive and helpful.'
            });
          } else if (selfLearningRAGEnabled) {
            // Self-Learning RAG mode (text-only)
            const ragResult = await processQuery(originalText, (statusUpdate) => {
              setRagStatus(statusUpdate);
            }, user?.uid || null);
            
            if (ragResult.success && ragResult.answer) {
              aiResponse = ragResult.answer;
            } else {
              // RAG failed, fallback to standard AI
              console.warn('Self-Learning RAG failed, using standard AI:', ragResult.error);
              const { callAI } = await import('../utils/aiProvider');
              aiResponse = await callAI(originalText, { userId: user?.uid || null });
            }
          } else if (reactAgentEnabled) {
            // ReAct Agent mode (text-only)
            const agentResult = await runAgent(originalText, (stepUpdate) => {
              // Update thinking log for UI
              setAgentThinking(prev => {
                const newLog = [...prev];
                const existingIndex = newLog.findIndex(log => log.step === stepUpdate.step);
                
                if (existingIndex >= 0) {
                  newLog[existingIndex] = stepUpdate;
                } else {
                  newLog.push(stepUpdate);
                }
                
                return newLog;
              });
            });
            
            if (agentResult.requiresApproval) {
              // Tool requires human approval
              setAwaitingApproval(agentResult.toolCall);
              setWaitingForAI(false);
              return; // Exit early - wait for user approval
            }
            
            if (agentResult.success && agentResult.answer) {
              aiResponse = agentResult.answer;
            } else {
              // Agent failed or hit max steps, fallback to standard AI
              console.warn('ReAct Agent failed, using standard AI:', agentResult.error);
              const { callAI } = await import('../utils/aiProvider');
              aiResponse = await callAI(originalText, { userId: user?.uid || null });
            }
          } else {
            // Standard AI mode (text-only)
            const { callAI } = await import('../utils/aiProvider');
            aiResponse = await callAI(originalText, { userId: user?.uid || null });
          }
          
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
              },
              agentThinking: reactAgentEnabled ? agentThinking : null // Store thinking log if agent was used
            });
            
            // Memory Management: Update core memory based on interaction
            try {
              await manageMemory(originalText, aiResponse, user.uid);
            } catch (memoryError) {
              console.warn('💾 [Memory] Memory update failed (non-critical):', memoryError);
            }
            
            // Periodically summarize conversations for archival memory (every 5 messages)
            const recentMessages = messages.filter(m => !m.isAI).slice(-5);
            if (recentMessages.length >= 5) {
              try {
                const conversationHistory = recentMessages.map(m => ({
                  role: 'user',
                  content: m.text || m.displayText
                })).concat([{
                  role: 'assistant',
                  content: aiResponse
                }]);
                
                await summarizeForArchival(conversationHistory, user.uid);
              } catch (summaryError) {
                console.warn('💾 [Memory] Summary failed (non-critical):', summaryError);
              }
            }
          }
        } catch (aiError) {
          console.error('Error getting AI response:', aiError);
          // Don't show error to user, just log it
        } finally {
          setWaitingForAI(false);
          setAgentThinking([]); // Clear thinking log after response
          setRagStatus(null); // Clear RAG status after response
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

  // Handle poll creation
  const handleCreatePoll = async (pollData) => {
    if (!user?.uid || !db) return;
    
    try {
      await addDoc(collection(db, 'polls'), {
        ...pollData,
        userId: user.uid,
        userName: userNames[user.uid] || user.email?.split('@')[0] || 'User',
        chatType: 'campus',
        chatId: 'global',
        createdAt: serverTimestamp(),
        expiresAt: pollData.expiresAt || serverTimestamp()
      });
      success('Poll created successfully!');
      setShowPollCreator(false);
    } catch (error) {
      console.error('Error creating poll:', error);
      showError('Failed to create poll. Please try again.');
    }
  };

  // Handle voice message sending
  const handleSendVoiceMessage = async (audioBlob, duration) => {
    if (!user?.uid || !db) return;
    
    try {
      setSending(true);
      
      // Upload audio to Cloudinary
      const { uploadFile } = await import('../utils/storageService');
      const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
      const uploadResult = await uploadFile(audioFile, 'voice-messages');
      const downloadURL = uploadResult.url;
      
      // Get user name
      let userName = userNames[user.uid] || user.email?.split('@')[0] || 'User';
      
      // Save voice message to Firestore
      await addDoc(collection(db, 'messages'), {
        text: 'Voice message',
        displayText: '🎤 Voice message',
        isVoice: true,
        voiceUrl: downloadURL,
        voiceDuration: duration,
        attachment: {
          url: downloadURL,
          name: audioFile.name,
          type: 'audio/webm',
          size: audioBlob.size
        },
        toxic: false,
        isAI: false,
        userId: user.uid,
        userName: userName,
        userEmail: user.email || null,
        timestamp: serverTimestamp(),
        reactions: {},
        edited: false,
        readBy: {
          [user.uid]: serverTimestamp()
        }
      });
      
      success('Voice message sent!');
      setLastMessageTime(Date.now());
    } catch (error) {
      console.error('Error sending voice message:', error);
      showError('Failed to send voice message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Handle quick reply selection
  const handleQuickReplySelect = (templateText) => {
    setNewMessage(templateText);
    setShowQuickReplies(false);
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
  };

  // Handle message translation
  const handleTranslateMessage = async (messageId, messageText, targetLang = 'en') => {
    if (translating.has(messageId)) return;
    
    setTranslating(prev => new Set(prev).add(messageId));
    
    try {
      // Check if AI translation is enabled
      const aiTranslationEnabled = localStorage.getItem('aiTranslationEnabled') !== 'false';
      let translatedText = messageText; // Default to original text
      
      if (aiTranslationEnabled) {
        try {
          const { translateText } = await import('../utils/aiTranslation');
          translatedText = await translateText(messageText, targetLang);
        } catch (error) {
          console.error('Translation error:', error);
          translatedText = messageText; // Fallback to original
        }
      }
      setTranslations(prev => ({
        ...prev,
        [messageId]: translatedText
      }));
      success('Message translated!');
    } catch (error) {
      console.error('Error translating message:', error);
      showError('Failed to translate message. Please try again.');
    } finally {
      setTranslating(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    }
  };

  // Handle conversation summarization
  const handleSummarizeConversation = async () => {
    if (messages.length === 0) {
      showError('No messages to summarize.');
      return;
    }
    
    try {
      setShowSummarization(true);
      setConversationSummary(null); // Reset previous summary
      // Check if AI summarization is enabled
      const aiSummarizationEnabled = localStorage.getItem('aiSummarizationEnabled') !== 'false';
      let summary = null;
      
      if (aiSummarizationEnabled) {
        try {
          const { summarizeConversation } = await import('../utils/aiSummarization');
          summary = await summarizeConversation(messages, 150);
        } catch (error) {
          console.error('Summarization error:', error);
          showError('Failed to summarize conversation. Please try again.');
          setShowSummarization(false);
          return;
        }
      } else {
        showError('AI summarization is disabled. Enable it in Settings → Chat & Messaging → AI Features.');
        setShowSummarization(false);
        return;
      }
      
      // If we get here, summary was successful
      if (summary && summary.trim() !== '') {
        setConversationSummary(summary);
        success('Conversation summarized successfully!');
      } else {
        throw new Error('Empty summary received');
      }
    } catch (error) {
      console.error('Error summarizing conversation:', error);
      showError(error.message || 'Failed to summarize conversation. Please ensure the Gemini API key is configured and try again.');
      setShowSummarization(false);
      setConversationSummary(null);
    }
  };

  // Fetch polls for campus chat
  useEffect(() => {
    if (!db) return;
    
    const q = query(
      collection(db, 'polls'),
      where('chatType', '==', 'campus'),
      where('chatId', '==', 'global'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const pollsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPolls(pollsData);
      },
      (error) => {
        if (error.code !== 'failed-precondition') {
          console.error('Error fetching polls:', error);
        }
      }
    );
    
    return () => unsubscribe();
  }, []);

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

  // Memoize filtered messages to prevent unnecessary re-renders
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const queryLower = searchQuery.toLowerCase();
    return messages.filter(msg => {
      const text = (msg.text || msg.displayText || '').toLowerCase();
      const userName = (msg.userName || '').toLowerCase();
      return text.includes(queryLower) || userName.includes(queryLower);
    });
  }, [messages, searchQuery]);

  // Memoize expensive formatting functions
  const formatTimestamp = useCallback((timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  }, []);

  const formatLastSeen = useCallback((lastSeen) => {
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
  }, []);

  const getReadReceiptInfo = useCallback((message) => {
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
  }, [userNames, userProfiles]);

  // Handle tool approval for ReAct Agent
  const handleApproveTool = async () => {
    if (!awaitingApproval) return;
    
    const originalQuery = messages[messages.length - 1]?.text || newMessage || '';
    if (!originalQuery) {
      showError('Cannot find original query. Please try again.');
      setAwaitingApproval(null);
      return;
    }
    
    try {
      setWaitingForAI(true);
      const toolResult = await approveAndExecuteTool(awaitingApproval);
      
      if (toolResult.success) {
        // Continue agent execution with the approved tool result
        const agentResult = await continueAgentAfterApproval(originalQuery, toolResult, (stepUpdate) => {
          setAgentThinking(prev => {
            const newLog = [...prev];
            const existingIndex = newLog.findIndex(log => log.step === stepUpdate.step);
            
            if (existingIndex >= 0) {
              newLog[existingIndex] = stepUpdate;
            } else {
              newLog.push(stepUpdate);
            }
            
            return newLog;
          });
        });
        
        if (agentResult.success && agentResult.answer) {
          // Save AI response
          await addDoc(collection(db, 'messages'), {
            text: agentResult.answer,
            displayText: agentResult.answer,
            toxic: false,
            isAI: true,
            userId: 'virtual-senior',
            userName: 'Virtual Senior',
            userEmail: null,
            sender: 'Virtual Senior',
            timestamp: serverTimestamp(),
            reactions: {},
            edited: false,
            readBy: {
              [user.uid]: serverTimestamp()
            }
          });
          success('Action approved and completed!');
        } else {
          showError(agentResult.error || 'Failed to generate response after approval.');
        }
      } else {
        showError(toolResult.error || 'Failed to execute approved action.');
      }
    } catch (error) {
      console.error('Error approving tool:', error);
      showError('Failed to execute approved action. Please try again.');
    } finally {
      setAwaitingApproval(null);
      setWaitingForAI(false);
      setAgentThinking([]);
    }
  };

  const handleRejectTool = () => {
    setAwaitingApproval(null);
    setAgentThinking([]);
    showError('Action cancelled by user.');
  };

  // Form Filler Card Component
  const FormFillerCard = ({ formName, data, messageId }) => {
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);

    const handleDownload = async () => {
      try {
        setGenerating(true);
        setError(null);
        
        const pdfBytes = await generateFilledForm(formName, data);
        const filename = `${formName}_${data.studentId || 'form'}_${new Date().toISOString().split('T')[0]}.pdf`;
        downloadPDF(pdfBytes, filename);
        
        success('Form generated and downloaded successfully!');
      } catch (err) {
        console.error('Error generating form:', err);
        setError(err.message || 'Failed to generate form');
        showError(err.message || 'Failed to generate form. Please try again.');
      } finally {
        setGenerating(false);
      }
    };

    const formDisplayName = formName === 'special_consideration' 
      ? 'Special Consideration Form' 
      : formName === 'extension'
      ? 'Extension Request Form'
      : formName;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel border-2 border-indigo-500/50 rounded-2xl p-4 md:p-6 my-2 bg-gradient-to-br from-indigo-600/20 to-purple-600/20"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-600/30 border border-indigo-500/50 rounded-xl flex-shrink-0">
            <FileCheck className="text-indigo-300" size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
              {formDisplayName}
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                Ready
              </span>
            </h3>
            <p className="text-sm text-white/70 mb-4">
              Your form has been pre-filled with your details. Review and download when ready.
            </p>
            
            {/* Form Data Preview */}
            <div className="bg-white/5 rounded-xl p-3 mb-4 space-y-2 text-sm">
              {data.name && (
                <div className="flex items-center gap-2">
                  <span className="text-white/60 font-medium w-24">Name:</span>
                  <span className="text-white">{data.name}</span>
                </div>
              )}
              {data.studentId && (
                <div className="flex items-center gap-2">
                  <span className="text-white/60 font-medium w-24">Student ID:</span>
                  <span className="text-white">{data.studentId}</span>
                </div>
              )}
              {data.course && (
                <div className="flex items-center gap-2">
                  <span className="text-white/60 font-medium w-24">Course:</span>
                  <span className="text-white">{data.course}</span>
                </div>
              )}
              {data.assignment && (
                <div className="flex items-center gap-2">
                  <span className="text-white/60 font-medium w-24">Assignment:</span>
                  <span className="text-white">{data.assignment}</span>
                </div>
              )}
              {data.reason && (
                <div className="flex items-start gap-2">
                  <span className="text-white/60 font-medium w-24">Reason:</span>
                  <span className="text-white flex-1">{data.reason}</span>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              onClick={handleDownload}
              disabled={generating}
              className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-95"
            >
              {generating ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full relative bg-transparent" style={{ height: '100%', minHeight: 0, maxHeight: '100%', overflow: 'hidden' }}>
      {/* Chat Header - Fluid.so aesthetic */}
      <div 
        className="glass-panel border-b border-white/10 px-4 md:px-6 py-3 md:py-4 relative z-10 rounded-t-[2rem] flex-shrink-0"
        style={{
          paddingTop: `max(0.75rem, env(safe-area-inset-top, 0px) + 0.5rem)`,
          paddingBottom: `0.75rem`,
          paddingLeft: `calc(1rem + env(safe-area-inset-left, 0px))`,
          paddingRight: `calc(1rem + env(safe-area-inset-right, 0px))`,
          flexShrink: 0
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <Logo size="small" showText={false} />
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg md:text-2xl font-semibold text-white truncate text-glow">Campus Chat</h2>
              <p className="text-xs md:text-sm text-white/60 hidden sm:block font-medium">Connect with your campus community</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* AI Help Mode Toggle with Model Selector - Fluid.so aesthetic */}
            <div className="relative">
              <button
                onClick={() => setAiHelpMode(!aiHelpMode)}
                className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 gpu-accelerated ${
                  aiHelpMode
                    ? 'bg-gradient-to-r from-indigo-600/80 to-purple-600/80 text-white shadow-lg'
                    : 'hover:bg-white/10 text-white/70 hover:text-white'
                }`}
                title={aiHelpMode ? 'AI Help Mode: ON - Virtual Senior will respond' : 'AI Help Mode: OFF - Click to enable'}
                style={{ transform: 'translateZ(0)' }}
              >
                <Bot size={20} />
              </button>
              {aiHelpMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowModelSelector(!showModelSelector);
                  }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-white/80 rounded-full border-2 border-white/90 hover:bg-white hover:scale-125 active:scale-100 transition-all shadow-lg gpu-accelerated"
                  title="Select Gemini Model"
                  style={{ transform: 'translateZ(0)' }}
                />
              )}
              {/* Model Selector Dropdown - Fluid.so aesthetic */}
              {aiHelpMode && showModelSelector && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full right-0 mt-2 glass-panel border border-white/10 rounded-xl shadow-xl z-50 min-w-[250px] overflow-hidden"
                >
                  <div className="p-3 border-b border-white/10">
                    <p className="text-xs font-semibold text-white">Select Gemini Model</p>
                  </div>
                  <div className="p-2 max-h-64 overflow-y-auto">
                    {geminiModels.map((model) => (
                      <button
                        key={model.value}
                        onClick={() => {
                          setSelectedGeminiModel(model.value);
                          setShowModelSelector(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg mb-1 hover:translate-x-1 active:scale-[0.98] transition-all duration-200 gpu-accelerated ${
                          selectedGeminiModel === model.value
                            ? 'bg-white/20 text-white font-semibold'
                            : 'hover:bg-white/10 text-white/70 hover:text-white'
                        }`}
                        style={{ transform: 'translateZ(0)' }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-white">{model.label}</span>
                              {model.free && (
                                <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded border border-green-500/30">
                                  FREE
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-white/60 mt-0.5">{model.description}</p>
                          </div>
                          {selectedGeminiModel === model.value && (
                            <div className="w-2 h-2 bg-white/80 rounded-full"></div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
            {aiHelpMode && (
              <span className="text-xs text-white/70 font-medium hidden sm:inline text-glow-subtle">
                AI Help ON
              </span>
            )}
            <div className="relative flex items-center gap-2">
              <button
                onClick={() => setShowAdvancedSearch(true)}
                className="p-2 hover:bg-white/10 hover:scale-110 active:scale-95 rounded-xl transition-all duration-200 gpu-accelerated"
                title="Advanced Search (Ctrl/Cmd + K)"
                style={{ transform: 'translateZ(0)' }}
              >
                <Search size={20} className="text-white/70 hover:text-white transition-colors" />
              </button>
              <button
                onClick={handleSummarizeConversation}
                disabled={messages.length === 0 || showSummarization}
                className="p-2 hover:bg-white/10 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-transparent rounded-xl transition-all duration-200 gpu-accelerated"
                title="Summarize conversation"
                aria-label="Summarize conversation"
                style={{ transform: 'translateZ(0)' }}
              >
                <FileText size={20} className="text-white/70 hover:text-white transition-colors" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="p-2 hover:bg-white/10 hover:scale-110 active:scale-95 rounded-xl transition-all duration-200 gpu-accelerated"
                  title="Export chat history"
                  style={{ transform: 'translateZ(0)' }}
                >
                  <Download size={20} className="text-white/70 hover:text-white transition-colors" />
                </button>
                {showExportMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 glass-panel border border-white/10 rounded-xl shadow-xl z-50 min-w-[180px] overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        exportMessagesToJSON(messages, 'campus-chat-history');
                        setShowExportMenu(false);
                        success('Chat history exported as JSON');
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-white/10 hover:translate-x-1 active:scale-[0.98] text-sm text-white/70 hover:text-white transition-all duration-200 gpu-accelerated"
                      style={{ transform: 'translateZ(0)' }}
                    >
                      Export as JSON
                    </button>
                    <button
                      onClick={() => {
                        exportMessagesToCSV(messages, 'campus-chat-history');
                        setShowExportMenu(false);
                        success('Chat history exported as CSV');
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-white/10 hover:translate-x-1 active:scale-[0.98] text-sm text-white/70 hover:text-white transition-all duration-200 border-t border-white/10 gpu-accelerated"
                      style={{ transform: 'translateZ(0)' }}
                    >
                      Export as CSV
                    </button>
                    <button
                      onClick={() => {
                        exportMessagesToTXT(messages, 'campus-chat-history');
                        setShowExportMenu(false);
                        success('Chat history exported as TXT');
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-white/10 hover:translate-x-1 active:scale-[0.98] text-sm text-white/70 hover:text-white transition-all duration-200 border-t border-white/10 gpu-accelerated"
                      style={{ transform: 'translateZ(0)' }}
                    >
                      Export as TXT
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
        
      </div>

          {/* Pinned Messages Section - Fluid.so aesthetic */}
          {pinnedMessages.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel border-b border-yellow-500/30 bg-yellow-500/10 px-4 md:px-6 py-3 rounded-t-[2rem]"
            >
              <div className="flex items-center gap-2 mb-2">
                <Pin size={16} className="text-yellow-400" />
                <h3 className="text-sm font-semibold text-yellow-300 text-glow-subtle">Pinned Messages</h3>
              </div>
              <div className="space-y-2">
                {messages
                  .filter(m => pinnedMessages.includes(m.id))
                  .slice(0, 3)
                  .map((message) => (
                    <motion.div 
                      key={message.id} 
                      whileHover={{ y: -2 }}
                      className="text-xs p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-yellow-500/20 transition-all"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">{message.userName || 'User'}</span>
                        <Pin size={12} className="text-yellow-400" />
                      </div>
                      <p className="text-white/70 truncate">
                        {message.displayText || message.text}
                      </p>
                    </motion.div>
                  ))}
              </div>
            </motion.div>
          )}

          {/* Self-Learning RAG Status */}
          {ragStatus && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel border-b border-purple-500/30 bg-purple-600/10 px-4 md:px-6 py-3"
            >
              <div className="flex items-center gap-2">
                {ragStatus.status === 'searching_internal' && (
                  <>
                    <Loader size={16} className="text-purple-300 animate-spin" />
                    <span className="text-sm text-purple-300">{ragStatus.message}</span>
                  </>
                )}
                {ragStatus.status === 'searching_web' && (
                  <>
                    <Search size={16} className="text-yellow-300 animate-pulse" />
                    <span className="text-sm text-yellow-300">{ragStatus.message}</span>
                  </>
                )}
                {ragStatus.status === 'learning' && (
                  <>
                    <Sparkles size={16} className="text-green-300 animate-pulse" />
                    <span className="text-sm text-green-300">{ragStatus.message}</span>
                  </>
                )}
                {ragStatus.status === 'generating' && (
                  <>
                    <Loader size={16} className="text-blue-300 animate-spin" />
                    <span className="text-sm text-blue-300">{ragStatus.message}</span>
                  </>
                )}
                {ragStatus.status === 'ready' && (
                  <>
                    <CheckCircle2 size={16} className="text-green-400" />
                    <span className="text-sm text-green-400">{ragStatus.message}</span>
                  </>
                )}
                {ragStatus.status === 'error' && (
                  <>
                    <XCircle size={16} className="text-red-300" />
                    <span className="text-sm text-red-300">{ragStatus.message}</span>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* ReAct Agent Thinking Log */}
          {agentThinking.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel border-b border-indigo-500/30 bg-indigo-600/10 px-4 md:px-6 py-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <Bot size={16} className="text-indigo-300" />
                <h3 className="text-sm font-semibold text-indigo-300">ReAct Agent Thinking...</h3>
              </div>
              <div className="space-y-1">
                {agentThinking.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs text-white/70 flex items-center gap-2"
                  >
                    <span className={`w-2 h-2 rounded-full ${
                      step.status === 'thinking' ? 'bg-yellow-400 animate-pulse' :
                      step.status === 'executing' ? 'bg-blue-400 animate-pulse' :
                      step.status === 'completed' ? 'bg-green-400' :
                      step.status === 'final_answer' ? 'bg-green-500' :
                      'bg-gray-400'
                    }`} />
                    <span>{step.message}</span>
                    {step.toolCall && (
                      <span className="text-white/50 ml-2">
                        ({step.toolCall.action})
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Tool Approval Prompt */}
          {awaitingApproval && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel border-2 border-yellow-500/50 bg-yellow-500/10 px-4 md:px-6 py-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-yellow-500/30 border border-yellow-500/50 rounded-xl flex-shrink-0">
                  <Flag className="text-yellow-300" size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-yellow-300 mb-2">
                    Action Requires Approval
                  </h3>
                  <p className="text-sm text-white/80 mb-3">
                    The AI wants to execute: <strong>{awaitingApproval.action}</strong>
                  </p>
                  {awaitingApproval.params && (
                    <div className="bg-white/5 rounded-xl p-3 mb-3 text-sm">
                      <div className="text-white/60 mb-1">Parameters:</div>
                      <pre className="text-white text-xs overflow-x-auto">
                        {JSON.stringify(awaitingApproval.params, null, 2)}
                      </pre>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleApproveTool}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all font-semibold"
                    >
                      Approve & Continue
                    </button>
                    <button
                      onClick={handleRejectTool}
                      className="px-4 py-2 glass-panel border border-white/10 hover:bg-white/10 text-white rounded-xl transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Messages Area - Fluid.so aesthetic */}
          <div 
            ref={messagesContainerRef}
            className={`flex-1 overflow-y-auto overscroll-contain touch-pan-y px-4 md:px-6 pt-4 md:pt-6 pb-4 md:pb-6 space-y-3 md:space-y-4 bg-transparent scroll-container transition-all duration-200 ${openMenuId ? 'pb-32 md:pb-40' : ''}`} 
            style={{ 
              minHeight: 0,
              flex: '1 1 auto',
              overflowY: 'auto',
              overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'auto', // Use auto for better performance, we handle smooth scroll with RAF
              position: 'relative',
              zIndex: 1,
              contain: 'layout style',
              willChange: 'scroll-position'
            }}
          >
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
                <p className="text-white/60 text-center">
              {searchQuery ? 'No messages found matching your search.' : 'No messages yet. Start the conversation!'}
            </p>
          </div>
        ) : (
              <>
                {/* Display Polls */}
                {polls.length > 0 && polls.slice(0, 5).map((poll) => (
                  <div key={poll.id} className="mb-4 px-2">
                    <PollDisplay poll={poll} pollId={poll.id} collectionName="polls" />
                  </div>
                ))}
                
                {/* Display Messages */}
                {filteredMessages.map((message) => {
            const isAuthor = message.userId === user?.uid;
            const isAdmin = isAdminRole(userRole);
            const isAIMessage = message.isAI || message.sender === 'Virtual Senior' || message.userId === 'virtual-senior' || message.userId === 'safety-system';
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
                      className={`flex items-start gap-2 group/message relative gpu-accelerated ${
                  isAuthor ? 'justify-end' : 'justify-start'
                }`}
                      style={{ 
                        contain: 'layout style',
                        isolation: 'isolate'
                      }}
                      onMouseEnter={(e) => {
                        // Show menu button on hover
                        const menuButton = e.currentTarget.querySelector('.message-menu-button');
                        if (menuButton && openMenuId !== message.id) {
                          menuButton.classList.remove('opacity-0', 'invisible');
                          menuButton.classList.add('opacity-100', 'visible');
                        }
                      }}
                      onMouseLeave={(e) => {
                        // Hide menu button when not hovering (unless menu is open)
                        if (openMenuId !== message.id) {
                          const menuButton = e.currentTarget.querySelector('.message-menu-button');
                          if (menuButton) {
                            menuButton.classList.remove('opacity-100', 'visible');
                            menuButton.classList.add('opacity-0', 'invisible');
                          }
                        }
                      }}
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
                        className="w-10 h-10 rounded-full object-cover border-2 border-indigo-400/50 cursor-pointer hover:border-indigo-500 transition-colors"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center border-2 border-indigo-400/50 cursor-pointer hover:border-indigo-500 transition-colors ${profilePicture ? 'hidden' : ''}`}
                    >
                      <User size={20} className="text-indigo-400" />
                    </div>
                  </button>
                )}

                <div className="relative" style={{ overflow: 'visible' }}>
                  {/* Contextual Actions */}
                  {selectedMessageForActions?.id === message.id && (
                    <ContextualActions
                      message={message}
                      onAction={(action, msg) => {
                        console.log('Contextual action:', action, msg);
                        setSelectedMessageForActions(null);
                        // Handle action based on type
                      }}
                      user={user}
                    />
                  )}
                <div
                        onClick={(e) => {
                          // Click on message to generate smart replies and contextual actions
                          // Don't trigger if clicking on buttons/links inside
                          if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('button') || e.target.closest('a')) {
                            return;
                          }
                          setSelectedMessageForReply(message);
                          setSelectedMessageForActions(message);
                          setShowSmartReplies(true);
                        }}
                        className={`message-item max-w-[85%] sm:max-w-xs lg:max-w-md px-3 md:px-4 py-2 rounded-xl relative cursor-pointer gpu-accelerated transition-transform duration-200 ease-out hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] ${
                    isAuthor
                      ? 'bg-indigo-600 text-white'
                              : 'bg-white/10 backdrop-blur-sm text-white border border-white/20'
                          } ${selectedMessageForReply?.id === message.id ? 'ring-2 ring-indigo-400' : ''}`}
                  style={{ 
                    transform: 'translateZ(0)', // Force GPU acceleration
                    backfaceVisibility: 'hidden',
                    contain: 'layout style'
                  }}
                  title={selectedMessageForReply?.id === message.id ? 'Generating smart replies for this message...' : 'Click to generate smart replies'}
                >
                    <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedUserId(message.userId)}
                        className="text-sm font-semibold opacity-90 hover:underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded"
                        title={
                          isUserOnline(onlineUsers[message.userId])
                            ? 'Online'
                            : onlineUsers[message.userId]?.lastSeen
                            ? `Last seen: ${formatLastSeen(onlineUsers[message.userId].lastSeen)}`
                            : 'Offline'
                        }
                        aria-label={`View profile of ${(() => {
                          const cachedName = userNames[message.userId];
                          const messageName = message.userName;
                          const profileName = userProfiles[message.userId]?.name;
                          const emailName = message.userEmail?.split('@')[0];
                          return cachedName || messageName || profileName || emailName || 'Unknown';
                        })()}`}
                      >
                        {(() => {
                          // Check if this is a crisis intervention message
                          if (message.isCrisisIntervention || message.userId === 'safety-system') {
                            return 'Safety System';
                          }
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
                    <div className="flex items-center gap-1.5">
                      <div className="text-xs opacity-75">
                        {formatTimestamp(message.timestamp)}
                        {message.edited && <span className="ml-1 italic">(edited)</span>}
                      </div>
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
                        className="flex-1 px-2 py-1 rounded bg-white/10 backdrop-blur-sm text-white border border-white/10 text-sm"
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
                        className="p-1 hover:bg-indigo-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label="Save edit"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setEditing(null);
                          setEditText('');
                        }}
                        className="p-1 hover:bg-red-600 rounded focus:outline-none focus:ring-2 focus:ring-red-500/50 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label="Cancel edit"
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
                                <div className="absolute bottom-full right-0 mb-2 hidden group-hover/read:block glass-panel border border-white/10 text-white text-xs rounded-xl p-2 shadow-xl z-10 min-w-[150px]">
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
                                ? 'bg-indigo-500'
                                : 'bg-indigo-600/30 text-white border border-indigo-500/50'
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
                    <div className="mb-2 p-3 bg-indigo-600/20 backdrop-blur-sm border-l-2 border-indigo-500 rounded-xl text-xs">
                      <div className="flex items-center gap-1 mb-1">
                        <Reply size={12} className="text-indigo-300" />
                        <span className="font-medium text-indigo-200">
                          {message.replyToUserName || 'User'}
                        </span>
                      </div>
                      <p className="text-white/70 truncate">
                        {message.replyToText || 'Message'}
                      </p>
                    </div>
                  )}

                  {/* Voice Message Display */}
                  {message.isVoice && message.voiceUrl && (
                    <div className="mb-2">
                      <VoiceMessage message={message} isOwnMessage={isAuthor} />
                    </div>
                  )}

                  {/* Image for AI Vision Display */}
                  {message.imageForAI && message.imageForAI.previewUrl && (
                    <div className="mb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Camera size={14} className="text-purple-400" />
                        <span className="text-xs text-purple-300">AI Vision Analysis</span>
                      </div>
                      <img
                        src={message.imageForAI.previewUrl}
                        alt={message.imageForAI.name || 'Image for AI analysis'}
                        className="max-w-full max-h-64 object-contain rounded-xl border border-purple-500/30"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Attachment Display */}
                  {message.attachment && !message.isVoice && (
                    <div className="mb-2">
                      {message.attachment.type?.startsWith('image/') ? (
                        <button
                          type="button"
                          onClick={() => setPreviewImage({ url: message.attachment.url, name: message.attachment.name })}
                          className="block rounded-xl overflow-hidden border border-white/20 hover:opacity-90 active:opacity-75 transition-opacity cursor-pointer touch-action-manipulation w-full text-left p-0"
                          aria-label="View image"
                        >
                          <img
                            src={message.attachment.url}
                            alt={message.attachment.name}
                            className="max-w-full max-h-64 object-contain pointer-events-none"
                            loading="lazy"
                          />
                        </button>
                      ) : message.attachment.type?.startsWith('audio/') ? (
                        <div className="p-3 bg-indigo-600/20 backdrop-blur-sm rounded-xl border border-indigo-500/30">
                          <audio controls className="w-full">
                            <source src={message.attachment.url} type={message.attachment.type} />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      ) : (
                        <a
                          href={message.attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 p-2 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-colors border border-white/10"
                          >
                            <File size={20} className="text-white/70" />
                            <span className="text-sm font-medium text-white">{message.attachment.name}</span>
                            <span className="text-xs text-white/60">
                            ({(message.attachment.size / 1024).toFixed(1)} KB)
                          </span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Form Auto-Filler Detection */}
                  {(() => {
                    const messageText = message.displayText || message.text || '';
                    // Check if message contains FILL_FORM JSON
                    const formMatch = messageText.match(/```json\s*([\s\S]*?)\s*```/) || 
                                     messageText.match(/\{[\s\S]*?"type"\s*:\s*"FILL_FORM"[\s\S]*?\}/);
                    
                    if (formMatch) {
                      try {
                        const jsonStr = formMatch[1] || formMatch[0];
                        const formData = JSON.parse(jsonStr);
                        
                        if (formData.type === 'FILL_FORM' && formData.formName && formData.data) {
                          return (
                            <FormFillerCard 
                              formName={formData.formName} 
                              data={formData.data}
                              messageId={message.id}
                            />
                          );
                        }
                      } catch (error) {
                        console.warn('Failed to parse form data:', error);
                      }
                    }
                    
                    // Regular message text rendering
                    return null;
                  })()}

                  {/* Crisis Intervention Message */}
                  {message.isCrisisIntervention && message.crisisResources && (
                    <div className="mb-4 p-4 bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-sm rounded-xl border-2 border-red-500/50">
                      <div className="flex items-start gap-3 mb-3">
                        <AlertCircle className="text-red-400 flex-shrink-0 mt-1" size={24} />
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-white mb-2">Support Resources</h4>
                          <p className="text-white/90 mb-4">{message.displayText || message.text}</p>
                          
                          <div className="space-y-2">
                            {message.crisisResources.map((resource, index) => (
                              <div key={index} className="p-3 bg-white/10 rounded-lg border border-white/20">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-semibold text-white">{resource.name}</span>
                                  {resource.available && (
                                    <span className="text-xs text-green-300 bg-green-500/20 px-2 py-0.5 rounded">
                                      {resource.available}
                                    </span>
                                  )}
                                </div>
                                {resource.phone && (
                                  <a 
                                    href={`tel:${resource.phone}`}
                                    className="text-indigo-300 hover:text-indigo-200 text-sm font-medium"
                                  >
                                    📞 {resource.phone}
                                  </a>
                                )}
                                {resource.email && (
                                  <a 
                                    href={`mailto:${resource.email}`}
                                    className="text-indigo-300 hover:text-indigo-200 text-sm font-medium block"
                                  >
                                    ✉️ {resource.email}
                                  </a>
                                )}
                                {resource.description && (
                                  <p className="text-xs text-white/70 mt-1">{resource.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Message Text with Markdown */}
                  {message.displayText && message.displayText.trim() && !message.isVoice && !message.isCrisisIntervention && (() => {
                    const messageText = message.displayText || message.text || '';
                    // Skip rendering if it's a form fill message
                    if (messageText.includes('"type": "FILL_FORM"') || messageText.includes('FILL_FORM')) {
                      return null;
                    }
                    
                    return (
                      <div>
                        {translations[message.id] ? (
                          <div>
                            <p 
                              className="text-sm whitespace-pre-wrap break-words mb-1"
                              dangerouslySetInnerHTML={{
                                __html: hasMarkdown(message.displayText) 
                                  ? parseMarkdown(message.displayText)
                                  : message.displayText.replace(/\n/g, '<br />')
                              }}
                            />
                            <div className="mt-2 pt-2 border-t border-white/20">
                              <p className="text-xs text-white/60 mb-1">Translated:</p>
                              <p className="text-sm whitespace-pre-wrap break-words italic">
                                {translations[message.id]}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p 
                            className="text-sm whitespace-pre-wrap break-words"
                            dangerouslySetInnerHTML={{
                              __html: hasMarkdown(message.displayText) 
                                ? parseMarkdown(message.displayText)
                                : message.displayText.replace(/\n/g, '<br />')
                            }}
                          />
                        )}
                      </div>
                    );
                  })()}
                </div>
                
                {/* Message Thread */}
                {openThreadId === message.id && (
                  <MessageThread
                    parentMessageId={message.id}
                    onClose={() => setOpenThreadId(null)}
                    isOpen={true}
                  />
                )}
                
                    {/* 3-dots menu button - appears on hover, positioned outside bubble near timestamp */}
                    <div 
                      ref={(el) => {
                        if (el) menuRefs.current[message.id] = el;
                      }}
                      className={`message-menu-button absolute top-0 left-full ml-1.5 opacity-0 invisible transition-all duration-200 z-30 flex items-center ${
                        openMenuId === message.id ? 'opacity-100 visible pointer-events-auto' : 'pointer-events-none'
                      }`}
                      style={{ 
                        pointerEvents: openMenuId === message.id ? 'auto' : 'none',
                        transform: 'translateZ(0)',
                        willChange: 'opacity, visibility',
                        overflow: 'visible'
                      }}
                      onMouseEnter={(e) => {
                        // Keep visible when hovering over button
                        if (openMenuId !== message.id) {
                          e.currentTarget.style.pointerEvents = 'auto';
                          e.currentTarget.classList.remove('opacity-0', 'invisible', 'pointer-events-none');
                          e.currentTarget.classList.add('opacity-100', 'visible');
                        }
                      }}
                      onMouseLeave={(e) => {
                        // Hide when leaving button (unless menu is open)
                        if (openMenuId !== message.id) {
                          e.currentTarget.style.pointerEvents = 'none';
                          e.currentTarget.classList.remove('opacity-100', 'visible');
                          e.currentTarget.classList.add('opacity-0', 'invisible', 'pointer-events-none');
                        }
                      }}
                    >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === message.id ? null : message.id);
                      }}
                      className="p-1 relative active:scale-95 transition-all duration-200 touch-action-manipulation gpu-accelerated group/menubtn"
                      title="More options"
                      aria-label="More options"
                      style={{ transform: 'translateZ(0)' }}
                    >
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-4 bg-indigo-400 group-hover/menubtn:w-0.5 transition-all duration-200 rounded-full"></div>
                      <MoreVertical size={14} className="text-white/50 group-hover/menubtn:text-white/70 transition-colors" />
                    </button>
                    
                    {/* Dropdown menu - Fluid.so aesthetic */}
                    {openMenuId === message.id && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`absolute ${isAuthor ? 'right-0' : 'left-0'} top-full mt-1 glass-panel border border-white/10 rounded-xl shadow-xl py-1 min-w-[180px] z-[100] max-h-[70vh] overflow-y-auto`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Menu items */}
                        {!isAuthor && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setReplyingTo(message);
                        setOpenMenuId(null);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-white/70 hover:text-white hover:bg-white/10 hover:translate-x-1 active:scale-[0.98] flex items-center gap-2 transition-all duration-200 gpu-accelerated focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[44px]"
                      style={{ transform: 'translateZ(0)' }}
                      aria-label="Reply to message"
                    >
                      <Reply size={16} />
                      Reply
                    </button>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenThreadId(openThreadId === message.id ? null : message.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-white/70 hover:text-white hover:bg-white/10 hover:translate-x-1 active:scale-[0.98] flex items-center gap-2 transition-all duration-200 border-t border-white/10 gpu-accelerated focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[44px]"
                          style={{ transform: 'translateZ(0)' }}
                          aria-label={openThreadId === message.id ? 'Close thread' : 'Open thread'}
                        >
                          <MessageSquare size={16} />
                          {openThreadId === message.id ? 'Close Thread' : 'Open Thread'}
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowReminderModal(message);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-white/70 hover:text-white hover:bg-white/10 hover:translate-x-1 active:scale-[0.98] flex items-center gap-2 transition-all duration-200 border-t border-white/10 gpu-accelerated focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[44px]"
                          style={{ transform: 'translateZ(0)' }}
                          aria-label="Set reminder for this message"
                        >
                          <Clock size={16} />
                          Set Reminder
                        </button>
                        
                    <button
                          onClick={async (e) => {
                            e.stopPropagation();
                        try {
                          await saveMessage(user.uid, { ...message, chatType: 'global' });
                          success('Message saved!');
                              setOpenMenuId(null);
                        } catch (error) {
                          if (error.message === 'Message already saved') {
                            showError('Message already saved');
                          } else {
                            showError('Failed to save message');
                          }
                        }
                      }}
                          className="w-full px-4 py-2.5 text-left text-sm text-white/70 hover:text-white hover:bg-white/10 hover:translate-x-1 active:scale-[0.98] flex items-center gap-2 transition-all duration-200 border-t border-white/10 gpu-accelerated focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[44px]"
                          style={{ transform: 'translateZ(0)' }}
                          aria-label="Save message"
                    >
                          <Bookmark size={16} />
                          Save
                    </button>
                        
                    {preferences.allowMessageForwarding && (
                      <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleForwardMessage(message.id);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-white/70 hover:text-white hover:bg-white/10 hover:translate-x-1 active:scale-[0.98] flex items-center gap-2 transition-all duration-200 border-t border-white/10 gpu-accelerated focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[44px]"
                            style={{ transform: 'translateZ(0)' }}
                            aria-label="Forward message"
                          >
                            <Forward size={16} />
                            Forward
                      </button>
                    )}
                        
                      <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            const messageText = message.displayText || message.text || '';
                            await shareMessage(messageText, message.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-white/70 hover:text-white hover:bg-white/10 hover:translate-x-1 active:scale-[0.98] flex items-center gap-2 transition-all duration-200 border-t border-white/10 gpu-accelerated focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[44px]"
                          style={{ transform: 'translateZ(0)' }}
                          aria-label="Share message"
                        >
                          <Share2 size={16} />
                          Share
                      </button>
                        
                        {!message.isVoice && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTranslateMessage(message.id, message.displayText || message.text || '');
                              setOpenMenuId(null);
                            }}
                            disabled={translating.has(message.id)}
                            className="w-full px-4 py-2.5 text-left text-sm text-white/70 hover:text-white hover:bg-white/10 hover:translate-x-1 active:scale-[0.98] flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:bg-transparent border-t border-white/10 gpu-accelerated focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[44px]"
                            style={{ transform: 'translateZ(0)' }}
                            aria-label="Translate message"
                          >
                            {translating.has(message.id) ? (
                              <>
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="rounded-full h-4 w-4 border-b-2 border-white/70"
                                />
                                Translating...
                              </>
                            ) : (
                              <>
                                <Languages size={16} />
                                Translate
                              </>
                            )}
                          </button>
                        )}
                        
                    {isAdminRole(userRole) && (
                      <button
                            onClick={async (e) => {
                              e.stopPropagation();
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
                                setOpenMenuId(null);
                          } catch (error) {
                            console.error('Error pinning message:', error);
                            showError('Failed to pin message');
                          }
                        }}
                            className="w-full px-4 py-2.5 text-left text-sm text-white/70 hover:text-white hover:bg-white/10 hover:translate-x-1 active:scale-[0.98] flex items-center gap-2 transition-all duration-200 border-t border-white/10 gpu-accelerated"
                            style={{ transform: 'translateZ(0)' }}
                          >
                            <Pin size={16} />
                            {pinnedMessages.includes(message.id) ? 'Unpin' : 'Pin'}
                      </button>
                    )}
                        
                    {canEdit && (
                      <button
                            onClick={(e) => {
                              e.stopPropagation();
                          setEditing(message.id);
                          setEditText(message.text);
                              setOpenMenuId(null);
                        }}
                            className="w-full px-4 py-2.5 text-left text-sm text-white/70 hover:text-white hover:bg-white/10 hover:translate-x-1 active:scale-[0.98] flex items-center gap-2 transition-all duration-200 border-t border-white/10 gpu-accelerated"
                            style={{ transform: 'translateZ(0)' }}
                      >
                            <Edit2 size={16} />
                            Edit
                      </button>
                    )}
                        
                    {canDelete && (
                      <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMessage(message.id, message.userId, isAIMessage);
                              setOpenMenuId(null);
                            }}
                        disabled={deleting === message.id}
                            className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:text-red-300 hover:bg-red-500/20 hover:translate-x-1 active:scale-[0.98] flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:bg-transparent border-t border-white/10 gpu-accelerated"
                            style={{ transform: 'translateZ(0)' }}
                      >
                            <Trash2 size={16} />
                            {isAIMessage ? "Delete (Admin)" : "Delete"}
                      </button>
                    )}
                        
                    {!isAuthor && (
                        <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setReporting(reporting === message.id ? null : message.id);
                              if (reporting === message.id) {
                                setOpenMenuId(null);
                              }
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-orange-400 hover:text-orange-300 hover:bg-orange-500/20 hover:translate-x-1 active:scale-[0.98] flex items-center gap-2 transition-all duration-200 border-t border-white/10 gpu-accelerated"
                            style={{ transform: 'translateZ(0)' }}
                          >
                            <Flag size={16} />
                            {reporting === message.id ? 'Cancel Report' : 'Report'}
                        </button>
                        )}
                      </motion.div>
                    )}
                    
                    {/* Report form - Fluid.so aesthetic */}
                        {reporting === message.id && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`absolute ${isAuthor ? 'right-0' : 'left-0'} top-8 glass-panel border border-white/10 rounded-xl shadow-xl p-4 z-40 min-w-[250px]`}
                      >
                            <textarea
                              value={reportReason}
                              onChange={(e) => setReportReason(e.target.value)}
                              placeholder="Reason for reporting..."
                          className="w-full px-3 py-2 text-sm border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/40 mb-3 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 focus:bg-white/10 transition-all duration-300"
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <button
                            onClick={() => {
                              handleReportMessage(message.id);
                              setOpenMenuId(null);
                            }}
                            className="flex-1 px-4 py-2 bg-red-600/80 hover:bg-red-600 hover:scale-[1.02] active:scale-[0.98] text-white text-sm rounded-xl transition-all duration-200 touch-action-manipulation font-medium gpu-accelerated"
                            style={{ transform: 'translateZ(0)' }}
                              >
                                Report
                              </button>
                              <button
                                onClick={() => {
                                  setReporting(null);
                                  setReportReason('');
                              setOpenMenuId(null);
                                }}
                            className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 hover:scale-[1.02] active:scale-[0.98] text-white/70 hover:text-white text-sm rounded-xl transition-all duration-200 touch-action-manipulation font-medium border border-white/10 gpu-accelerated"
                            style={{ transform: 'translateZ(0)' }}
                              >
                                Cancel
                              </button>
                            </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Reaction picker - always visible on touch, hover on desktop */}
                  {!isAuthor && (
                    <div className="mt-2 opacity-100 md:opacity-0 md:group-hover/message:opacity-100 transition-opacity">
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
                                isReacting ? 'opacity-50 cursor-wait' : 'hover:bg-indigo-600/30 active:bg-indigo-600/40'
                              } ${
                                userReaction === emoji ? 'bg-indigo-600/30 border border-indigo-500/50' : ''
                              }`}
                              title="Add reaction"
                              aria-label={`Add ${emoji} reaction`}
                            >
                              {emoji}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => {
                            setShowCustomEmojiPicker(message.id);
                          }}
                          className="p-2 rounded transition-colors touch-action-manipulation hover:bg-indigo-600/30 active:bg-indigo-600/40"
                          title="More reactions"
                        >
                          <Smile size={16} className="text-white/70" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
                })}
              </>
        )}
        <div ref={messagesEndRef} />
      </div>

          {/* Typing Indicator */}
          {Object.keys(typingUsers).length > 0 && (
            <TypingIndicator typingUsers={typingUsers} userNames={userNames} />
          )}

          {/* Message Input - Fluid.so aesthetic */}
          <div 
            className="glass-panel border-t border-white/10 px-3 md:px-6 py-3 md:py-4 relative z-10 rounded-b-[2rem] flex-shrink-0"
            style={{
              paddingBottom: `max(0.25rem, calc(env(safe-area-inset-bottom, 0px) * 0.3))`,
              paddingLeft: `calc(0.75rem + env(safe-area-inset-left, 0px))`,
              paddingRight: `calc(0.75rem + env(safe-area-inset-right, 0px))`,
              flexShrink: 0
            }}
          >
            {/* Reply Preview - Fluid.so aesthetic */}
            {replyingTo && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 p-3 bg-indigo-600/20 backdrop-blur-sm border border-indigo-500/30 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Reply size={16} className="text-indigo-300 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-indigo-200">
                      Replying to {replyingTo.userName}
                    </p>
                    <p className="text-xs text-white/60 truncate">
                      {replyingTo.text || replyingTo.displayText}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="p-1.5 hover:bg-white/10 hover:scale-110 active:scale-95 rounded-lg transition-all duration-200 flex-shrink-0 gpu-accelerated"
                  style={{ transform: 'translateZ(0)' }}
                >
                  <X size={16} className="text-white/70 hover:text-white transition-colors" />
                </button>
              </motion.div>
            )}

            {/* File Preview - Fluid.so aesthetic */}
            {attachedFile && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {attachedFile.type?.startsWith('image/') ? (
                    <ImageIcon size={20} className="text-white/70 flex-shrink-0" />
                  ) : (
                    <File size={20} className="text-white/70 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {attachedFile.name}
                    </p>
                    <p className="text-xs text-white/60">
                      {(attachedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAttachedFile(null)}
                  className="p-1.5 hover:bg-white/10 hover:scale-110 active:scale-95 rounded-lg transition-all duration-200 flex-shrink-0 gpu-accelerated"
                  style={{ transform: 'translateZ(0)' }}
                >
                  <X size={16} className="text-white/70 hover:text-white transition-colors" />
                </button>
              </motion.div>
            )}

            {/* AI Smart Replies - Outside form to not affect input layout */}
            {showSmartReplies && messages.length > 0 && (
              <div className="mb-2">
                <AISmartReplies
                  conversationHistory={messages.slice(-10)}
                  selectedMessage={selectedMessageForReply}
                  onSelect={(reply) => {
                    setNewMessage(reply);
                    setSelectedMessageForReply(null); // Clear selection after selecting a reply
                    if (messageInputRef.current) {
                      messageInputRef.current.focus();
                    }
                  }}
                  userContext={user}
                />
              </div>
            )}

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (newMessage.trim() || attachedFile || selectedImage) {
                  sendMessage(e);
                }
              }} 
              className="flex gap-2 md:gap-3 relative"
            >
              <div className="flex-1 relative">
                {/* Image Preview */}
                {selectedImage && imagePreviewUrl && (
                  <div className="absolute bottom-full left-0 mb-2 p-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                    <div className="flex items-center gap-2">
                      <img
                        src={imagePreviewUrl}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/80 truncate">{selectedImage.name}</p>
                        <p className="text-xs text-white/60">
                          {(selectedImage.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          revokeImagePreview(imagePreviewUrl);
                          setSelectedImage(null);
                          setImagePreviewUrl(null);
                        }}
                        className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        aria-label="Remove image"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}
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
                    
                    // Handle Enter key - send message, don't apply suggestions
                    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                      e.preventDefault();
                      if (newMessage.trim() || attachedFile) {
                        sendMessage(e);
                      }
                    }
                  }}
                  onSelect={(e) => {
                    if (messageInputRef.current) {
                      setCursorPosition(messageInputRef.current.selectionStart || 0);
                    }
                  }}
                  placeholder={aiHelpMode ? "Type your message... (AI Help enabled)" : "Type your message... (Use @ to mention)"}
                  className="w-full px-4 md:px-5 py-3 text-sm md:text-base border border-white/10 rounded-full bg-white/5 backdrop-blur-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300"
                  disabled={sending || waitingForAI}
                />
                {/* AI Predictive Typing */}
                {showPredictiveTyping && (
                  <AIPredictiveTyping
                    inputRef={messageInputRef}
                    value={newMessage}
                    onChange={(value) => {
                      setNewMessage(value);
                      // Trigger typing indicator
                      if (value && value.length > 0) {
                        try {
                          const typingRef = doc(db, 'typing', user.uid);
                          updateDoc(typingRef, {
                            typing: true,
                            timestamp: serverTimestamp()
                          }).catch(() => {
                            setDoc(doc(db, 'typing', user.uid), {
                              typing: true,
                              timestamp: serverTimestamp()
                            }).catch(() => {});
                          });
                        } catch (err) {}
                      }
                      if (messageInputRef.current) {
                        setCursorPosition(messageInputRef.current.selectionStart || 0);
                      }
                      if (value && value.includes('@')) {
                        setShowMentions(true);
                      } else {
                        setShowMentions(false);
                      }
                    }}
                    conversationHistory={messages.slice(-10)}
                    disabled={sending || waitingForAI}
                  />
                )}
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
              
              {/* Action Buttons - Fluid.so aesthetic */}
              <div className="flex items-center gap-2">
                {/* GIF Picker */}
                <button
                  type="button"
                  onClick={() => setShowGifPicker(!showGifPicker)}
                  className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 hover:scale-110 active:scale-95 rounded-xl transition-all duration-200 gpu-accelerated"
                  title="Add GIF"
                  aria-label="Add GIF"
                  style={{ transform: 'translateZ(0)' }}
                >
                  <Sparkles size={20} />
                </button>

                {/* Rich Text Editor Toggle */}
                <button
                  type="button"
                  onClick={() => setShowRichTextEditor(!showRichTextEditor)}
                  className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 hover:scale-110 active:scale-95 rounded-xl transition-all duration-200 gpu-accelerated"
                  title="Rich text formatting"
                  aria-label="Rich text formatting"
                  style={{ transform: 'translateZ(0)' }}
                >
                  <FileText size={20} />
                </button>

                {/* Image Upload for AI Vision */}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    id="image-upload-input"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          // Create preview
                          const previewUrl = createImagePreview(file);
                          setImagePreviewUrl(previewUrl);
                          setSelectedImage(file);
                          // Reset input to allow selecting same file again
                          e.target.value = '';
                        } catch (error) {
                          console.error('Error selecting image:', error);
                          showError('Failed to load image. Please try again.');
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('image-upload-input')?.click()}
                    className="p-2.5 text-white/70 hover:text-white hover:bg-purple-500/20 hover:scale-110 active:scale-95 rounded-xl transition-all duration-200 gpu-accelerated border border-purple-500/30"
                    title="Upload image for AI vision analysis"
                    aria-label="Upload image for AI analysis"
                    style={{ transform: 'translateZ(0)' }}
                  >
                    <Camera size={20} />
                  </button>
                </div>

                {/* File Upload */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowFileUpload(!showFileUpload)}
                    className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 hover:scale-110 active:scale-95 rounded-xl transition-all duration-200 gpu-accelerated"
                    title="Upload file"
                    aria-label="Upload file or image"
                    style={{ transform: 'translateZ(0)' }}
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

                {/* Poll Creator */}
                <button
                  type="button"
                  onClick={() => setShowPollCreator(true)}
                  className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 hover:scale-110 active:scale-95 rounded-xl transition-all duration-200 gpu-accelerated"
                  title="Create poll"
                  aria-label="Create a poll"
                  style={{ transform: 'translateZ(0)' }}
                >
                  <BarChart3 size={20} />
                </button>

                {/* Voice Duplex Mode */}
                <button
                  type="button"
                  onClick={() => setShowVoiceInterface(true)}
                  className="p-2.5 text-white/70 hover:text-white hover:bg-indigo-500/20 hover:scale-110 active:scale-95 rounded-xl transition-all duration-200 gpu-accelerated border border-indigo-500/30"
                  title="Real-Time Voice Duplex Mode"
                  aria-label="Start voice duplex conversation"
                  style={{ transform: 'translateZ(0)' }}
                >
                  <Phone size={20} />
                </button>

                {/* Voice Recorder */}
                <button
                  type="button"
                  onClick={() => setShowVoiceRecorder(true)}
                  className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 hover:scale-110 active:scale-95 rounded-xl transition-all duration-200 gpu-accelerated"
                  title="Record voice message"
                  aria-label="Record a voice message"
                  style={{ transform: 'translateZ(0)' }}
                >
                  <Mic size={20} />
                </button>

                {/* Quick Replies */}
                <button
                  type="button"
                  onClick={() => setShowQuickReplies(true)}
                  className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 hover:scale-110 active:scale-95 rounded-xl transition-all duration-200 gpu-accelerated"
                  title="Quick replies"
                  aria-label="Open quick replies templates"
                  style={{ transform: 'translateZ(0)' }}
                >
                  <MessageSquare size={20} />
                </button>

                {/* Emoji Picker */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 hover:scale-110 active:scale-95 rounded-xl transition-all duration-200 gpu-accelerated"
                    title="Add emoji"
                    aria-label="Open emoji picker"
                    aria-expanded={showEmojiPicker}
                    aria-haspopup="listbox"
                    style={{ transform: 'translateZ(0)' }}
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

                {/* Send Button - Fluid.so shimmer effect */}
                <button
                  type="submit"
                  disabled={sending || waitingForAI || (!newMessage.trim() && !attachedFile)}
                  className={`send-button-shimmer text-white px-5 md:px-6 py-2.5 rounded-full transition-all duration-200 flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed gpu-accelerated ${
                    !sending && !waitingForAI && (newMessage.trim() || attachedFile) 
                      ? 'hover:scale-105 active:scale-95' 
                      : 'opacity-50'
                  }`}
                  style={{ transform: 'translateZ(0)' }}
                >
                  {waitingForAI ? (
                    <>
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="rounded-full h-4 w-4 border-b-2 border-white"
                      />
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
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-white/60 mt-2 text-center font-medium"
              >
                💡 AI Help Mode: Virtual Senior ({geminiModels.find(m => m.value === selectedGeminiModel)?.label}) will respond to your non-toxic messages
              </motion.p>
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
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-panel border border-white/10 rounded-[2rem] shadow-2xl max-w-md w-full backdrop-blur-xl" onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white text-glow">Forward Message</h3>
              <motion.button
                onClick={() => {
                  setShowForwardModal(false);
                  setForwardingMessage(null);
                }}
                whileHover={{ scale: 1.05, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-white/70 hover:text-white glass-panel border border-white/10 rounded-xl transition-all"
              >
                <X size={24} />
              </motion.button>
            </div>
            <div className="p-6 space-y-4">
              <div className="glass-panel bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-sm text-white/60 mb-1 font-medium">
                  From: {forwardingMessage.userName || 'Unknown'}
                </p>
                <p className="text-white font-medium">
                  {forwardingMessage.displayText || forwardingMessage.text}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">
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
          </motion.div>
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

      {/* Poll Creator Modal */}
      {showPollCreator && (
        <PollCreator
          onClose={() => setShowPollCreator(false)}
          onPollCreate={handleCreatePoll}
          chatType="campus"
          chatId="global"
        />
      )}

      {/* Voice Recorder Modal */}
      {showVoiceRecorder && (
        <VoiceRecorder
          onSend={handleSendVoiceMessage}
          onClose={() => setShowVoiceRecorder(false)}
        />
      )}

      {/* Real-Time Voice Duplex Interface */}
      {showVoiceInterface && (
        <VoiceInterface
          onClose={() => setShowVoiceInterface(false)}
        />
      )}

      {/* Quick Replies Modal */}
      {showQuickReplies && (
        <QuickReplies
          onSelect={handleQuickReplySelect}
          onClose={() => setShowQuickReplies(false)}
        />
      )}

      {/* Message Reminder Modal */}
      {showReminderModal && (
        <MessageReminder
          message={showReminderModal}
          onClose={() => setShowReminderModal(null)}
        />
      )}

      {/* GIF Picker Modal */}
      {showGifPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowGifPicker(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <GifPicker
              onSelect={(gif) => {
                setAttachedFile(gif);
                setShowGifPicker(false);
              }}
              onClose={() => setShowGifPicker(false)}
            />
          </div>
        </div>
      )}

      {/* Custom Emoji Reactions Modal */}
      {showCustomEmojiPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowCustomEmojiPicker(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <CustomEmojiReactions
              onSelect={(emoji) => {
                if (showCustomEmojiPicker) {
                  handleReaction(showCustomEmojiPicker, emoji);
                }
                setShowCustomEmojiPicker(null);
              }}
              onClose={() => setShowCustomEmojiPicker(null)}
            />
          </div>
        </div>
      )}

      {/* Message Effects */}
      {messageEffect && (
        <MessageEffects
          effect={messageEffect}
          onComplete={() => setMessageEffect(null)}
        />
      )}

      {/* Message Analytics */}
      {showAnalytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowAnalytics(false)}>
          <div onClick={(e) => e.stopPropagation()} className="max-w-2xl w-full">
            <MessageAnalytics
              userId={user?.uid}
              onClose={() => setShowAnalytics(false)}
            />
          </div>
        </div>
      )}

      {/* Conversation Summarization Modal */}
      {showSummarization && conversationSummary && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setShowSummarization(false); setConversationSummary(null); }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-panel border border-white/10 rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto backdrop-blur-xl" onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white text-glow flex items-center gap-2">
                  <FileText size={24} />
                  Conversation Summary
                </h2>
                <motion.button
                  onClick={() => {
                    setShowSummarization(false);
                    setConversationSummary(null);
                  }}
                  whileHover={{ scale: 1.05, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2.5 glass-panel border border-white/10 rounded-xl text-white/70 hover:text-white hover:border-white/20 transition-all"
                  aria-label="Close"
                >
                  <X size={24} />
                </motion.button>
              </div>
              <div className="prose prose-invert max-w-none">
                <p className="text-white/80 whitespace-pre-wrap leading-relaxed">
                  {conversationSummary}
                </p>
              </div>
              <div className="mt-6 flex gap-3 justify-end">
                <motion.button
                  onClick={() => {
                    navigator.clipboard.writeText(conversationSummary);
                    success('Summary copied to clipboard!');
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all duration-300 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl"
                >
                  <Copy size={18} />
                  Copy Summary
                </motion.button>
                <motion.button
                  onClick={() => {
                    setShowSummarization(false);
                    setConversationSummary(null);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 glass-panel border border-white/10 text-white/80 hover:text-white hover:border-white/20 rounded-xl transition-all duration-300 font-medium"
                >
                  Close
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Collaborative Editor */}
      {showCollaborativeEditor && (
        <CollaborativeEditor
          documentId={`chat-${selectedChatId || 'global'}`}
          currentUserId={user.uid}
          currentUserName={userNames[user.uid] || user.email?.split('@')[0] || 'User'}
          onClose={() => setShowCollaborativeEditor(false)}
        />
      )}

      {/* Predictive Scheduler */}
      {showPredictiveScheduler && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowPredictiveScheduler(false)}>
          <div onClick={(e) => e.stopPropagation()} className="max-w-md w-full">
            <PredictiveScheduler
              recipientId={selectedChatId}
              recipientName="Recipient"
              messageText={newMessage}
              onSchedule={(time) => {
                setScheduledMessage(time);
                setShowPredictiveScheduler(false);
                success(`Message scheduled for ${time.toLocaleString()}`);
              }}
            />
          </div>
        </div>
      )}

      {/* Voice Emotion Detector */}
      {showVoiceEmotion && (
        <div className="mb-4">
          <VoiceEmotionDetector
            onEmotionDetected={(emotionData) => {
              console.log('Emotion detected:', emotionData);
            }}
            onTranscription={(text) => {
              setNewMessage(text);
            }}
          />
        </div>
      )}

      {/* Conversation Insights */}
      {showConversationInsights && (
        <div className="mb-4">
          <AIConversationInsights
            messages={messages}
            participants={Object.values(userProfiles)}
          />
        </div>
      )}

      {/* Smart Task Extractor */}
      {showTaskExtractor && (
        <div className="mb-4">
          <SmartTaskExtractor
            messages={messages}
            onTaskCreated={(task) => {
              success(`Task created: ${task.task}`);
            }}
          />
        </div>
      )}

      {/* Relationship Graph */}
      {showRelationshipGraph && (
        <div className="mb-4">
          <RelationshipGraph
            messages={messages}
            users={Object.values(userProfiles)}
          />
        </div>
      )}

      {/* Futuristic Features Menu */}
      <FuturisticFeaturesMenu
        isOpen={showFuturisticMenu}
        onClose={() => setShowFuturisticMenu(false)}
        onFeatureSelect={(featureId) => {
          switch (featureId) {
            case 'smart-replies':
              setShowSmartReplies(!showSmartReplies);
              break;
            case 'collaborative':
              setShowCollaborativeEditor(true);
              break;
            case 'scheduler':
              setShowPredictiveScheduler(true);
              break;
            case 'emotion':
              setShowVoiceEmotion(!showVoiceEmotion);
              break;
            case 'insights':
              const aiInsightsEnabled = localStorage.getItem('aiInsightsEnabled') !== 'false';
              if (aiInsightsEnabled) {
                setShowConversationInsights(!showConversationInsights);
              } else {
                showError('AI Conversation Insights is disabled. Enable it in Settings → Chat & Messaging → AI Features.');
              }
              break;
            case 'tasks':
              setShowTaskExtractor(!showTaskExtractor);
              break;
            case 'graph':
              setShowRelationshipGraph(!showRelationshipGraph);
              break;
            default:
              break;
          }
        }}
      />
    </div>
  );
};

export default ChatArea;
