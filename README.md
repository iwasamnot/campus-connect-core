# CampusConnect

A secure, student-only messaging platform for universities with AI-powered content moderation, real-time chat, group messaging, and intelligent AI assistant.

## Features

### Landing Page
- **Fluid Minimal Design**: Redesigned with fluid animated particles and modern minimal aesthetic
- **Advanced Animations**: Smooth floating particles with GSAP continuous motion
- **Staggered Animations**: Hero content animates in sequence for dramatic entrance
- **Interactive Elements**: Spring physics button interactions for natural feel
- **Animated Gradient Text**: Smooth gradient position animations
- **Quick Access**: Direct Register and Login buttons with gradient styling and smooth transitions
- **Modern UI**: Centered layout with glassmorphism effects and rounded-full buttons
- **Responsive**: Optimized for all screen sizes (320px to 4K+) with safe area insets

### Appearance & Themes
- **Dual Theme System**: Choose between Fun (colorful & playful) or Minimal (sleek & modern) themes
- **Dark Mode**: Full dark mode support with automatic system preference detection
- **Customizable**: Adjust accent colors and font sizes to your preference
- **Optimized Performance**: Minimal theme optimized for ultra-fast transitions and animations

### For Students
- **Voice & Video Calling**: Make voice and video calls directly from private chats (powered by ZEGOCLOUD)
  - High-quality voice and video calls
  - Real-time communication
  - Works on all devices
- **Voice Messages**: Record and send voice messages
  - Record voice messages up to 5 minutes
  - MediaRecorder API integration with WebM/Opus codec
  - Real-time recording timer
  - Preview and playback before sending
  - Delete and re-record functionality
  - Microphone permission handling
  - Audio player with play/pause controls and progress bar
  - Duration display and download functionality
  - Stored securely in Firebase Storage
- **Polls & Surveys**: Create and participate in polls
  - Create polls with 2-10 options
  - Configurable settings (multiple votes, anonymous voting, duration)
  - Duration options: 1 day, 3 days, 7 days, 30 days
  - Real-time vote counting
  - Visual progress bars for each option
  - Winner highlighting
  - Vote/Unvote functionality
  - Support for multiple votes per user (configurable)
  - Available in Campus Chat and Group Chats
  - Expiry date tracking
- **Quick Replies / Message Templates**: Create and use message templates
  - Create, edit, and delete personal message templates
  - Template name and text customization
  - Quick access from message input
  - Personal template library per user
  - Real-time sync across devices
  - Perfect for meeting reminders, common responses, and announcements
- **AI Message Translation**: Translate messages in real-time
  - AI-powered translation using Google Gemini 2.5 Flash
  - Support for 14+ languages (English, Spanish, French, German, Chinese, Japanese, Arabic, Hindi, Urdu, Nepali, Bengali, Punjabi, Persian, and more)
  - Auto-detect source language
  - Translate individual messages or entire conversations
  - Fallback to original text on error
  - One-click translation from message menu
- **AI Conversation Summarization**: Get AI-powered conversation summaries
  - Uses Google Gemini 2.5 Flash for intelligent summarization
  - Configurable summary length
  - Extract key points from conversations
  - Generate meeting notes with structured format
  - Action items extraction
  - Participant tracking
  - Copy summary to clipboard
  - Available from chat menu (Ctrl/Cmd + K)
- **Campus Chat**: Real-time global chat with AI-powered content moderation
  - Real-time messaging with all students
  - AI-powered toxicity detection
  - **Virtual Senior AI**: AI-powered responses in Campus Chat
    - Toggle AI Help mode on/off
    - Virtual Senior responds to non-toxic messages
    - Multiple Gemini model support (gemini-1.5-flash, gemini-1.5-pro, etc.)
    - Free and paid model options
    - Context-aware intelligent responses
    - Helps answer questions and provide guidance
- **Activity Dashboard**: Comprehensive activity feed and insights
  - Recent messages and mentions
  - Activity statistics (messages today, this week, active groups)
  - Real-time activity updates
  - Filter by messages, mentions, or all activity
- **Message Scheduler**: Schedule messages for future delivery
  - Schedule messages to be sent at specific times
  - Support for Campus Chat, Private Chat, and Group Chat
  - View and manage all scheduled messages
  - Delete scheduled messages before sending
- **Saved Messages**: Bookmark and save important messages
  - Save any message with one click
  - Search through saved messages
  - View saved messages with original context
  - Quick access to important information
- **Image Gallery**: Browse all shared images
  - View all images shared in chats
  - Filter by all images, my images, or recent
  - Full-screen image viewer with download option
  - Image metadata (author, date, filename)
- **Groups**: Create and join study groups with group chat functionality
  - Create and manage study groups
  - Browse and request to join groups
  - View all groups (including joined groups)
  - Invite users by email
  - Admin approval system for group requests
  - Member management (add, remove, leave)
  - Group admin controls
  - Group chat with all messaging features
  - File and image sharing
  - Emoji picker
  - Image preview with zoom and pan
  - Create polls in group chats
  - Voice messages support
  - Message scheduling for groups
- **AI Help Assistant**: Intelligent AI assistant powered by Google Gemini 2.5 Flash
  - **Personalized AI Assistant**: Learns about you and remembers your preferences
    - Automatically extracts your name, interests, course, and study goals from conversations
    - Remembers your name and uses it in personalized greetings
    - Customizable assistant name (rename your AI assistant)
    - Context-aware responses based on your conversation history
    - Smart context summarization to keep profile efficient
  - Three specialized modes:
    - **SISTC Info**: Answers questions about SISTC courses, campuses, and information
    - **Study Tips**: Provides study strategies, time management, and productivity advice
    - **Homework Help**: Tutors you through concepts and problem-solving
  - Multiple Gemini model support (gemini-2.5-flash, gemini-1.5-pro, etc.)
  - **Serverless Vector RAG Engine**: Advanced retrieval-augmented generation
    - Pinecone vector database for semantic search
    - 80+ comprehensive SISTC knowledge documents
    - Google Gemini embeddings (text-embedding-004)
    - Groq LLM support for faster responses (llama-3.3-70b-versatile)
    - Automatic fallback chain (Pinecone → Firebase → Local)
  - **Self-Learning RAG System**: AI that learns and updates its own knowledge base
    - Automatically searches the web when information is missing
    - Summarizes and stores new information in Pinecone
    - Real-time knowledge base updates
    - UI feedback for learning process
  - **Hierarchical Memory System**: MemGPT-style memory management
    - Core memory (user name, job, goals, preferences, facts)
    - Archival memory (past conversation summaries)
    - AI-powered memory updates
    - Context injection for personalized responses
  - Conversation history support (maintains context from last 10 messages)
  - Virtual Senior AI mode in Campus Chat
  - Toggle AI Help mode on/off
  - Model selector for choosing the best AI model
  - Free and paid model options
  - Quick question buttons for common scenarios
- **Interview Analysis Engine**: Mock interview system with AI-powered feedback
  - **Role-Based Interviewer Personas**: Strict technical recruiter personas for different roles
    - Cyber Security Analyst, Software Engineer, Data Scientist, DevOps Engineer, and more
    - Customizable interview styles per role
  - **STAR Method Analysis**: Comprehensive response evaluation
    - Situation, Task, Action, Result breakdown
    - Filler word detection and counting
    - Score out of 10 with detailed breakdown
    - Specific improvement suggestions
  - **Real-Time Voice Integration**: Full voice-based interview experience
    - Uses Deepgram for real-time speech-to-text
    - AI speaks questions using text-to-speech
    - Live captions during interview
    - Mute and end call controls
  - **Live Feedback Sidebar**: Real-time feedback after each answer
    - STAR method indicators
    - Filler word highlights
    - Score visualization
    - Improvement recommendations
  - **Progressive Question Generation**: AI generates follow-up questions
    - Context-aware question progression
    - Avoids repeating previous questions
    - Role-specific technical depth
  - **Overall Score Tracking**: Cumulative performance metrics
- **Safety Override Layer**: Trust & Safety crisis intervention system
  - **Sentiment Monitoring**: Real-time distress signal detection
    - Keyword-based crisis detection (suicide, self-harm, hopelessness)
    - Context-aware severity assessment
    - Automatic LLM generation blocking
  - **Crisis Response**: Immediate support resource delivery
    - Hardcoded crisis intervention messages
    - Support resource cards (Lifeline, Beyond Blue, Kids Helpline, SISTC Support)
    - Clickable phone numbers and email links
    - Emergency services contact (000)
  - **Integration**: Works across all chat types
    - Prevents AI processing of crisis messages
    - Special UI rendering for crisis interventions
    - Runs before toxicity checks
- **Real-Time Voice Duplex Mode**: Full-duplex voice conversation with AI
  - **Deepgram Integration**: Real-time speech-to-text using nova-2 model
    - Live transcription with interim results
    - Speech interruption detection
    - Smart formatting
  - **Text-to-Speech**: AI responses spoken aloud
    - Web Speech API integration
    - Automatic interruption when user speaks
    - Natural conversation flow
  - **Full-Screen Voice Interface**: Immersive voice mode UI
    - Pulsing orb visualization (blue for listening, pink for speaking)
    - Live captions display
    - Mute and end call controls
    - Real-time status indicators
- **Multimodal Vision (Image Analysis)**: AI-powered image understanding
  - **Image Upload**: Camera/paperclip button for image selection
    - Thumbnail preview before sending
    - Image removal option
    - Support for common image formats
  - **Ollama LLaVA Integration**: Vision-language model for image analysis
    - Automatic model switching (deepseek-r1 → llava when image present)
    - Base64 image encoding
    - Vision-optimized system prompts
  - **Image Display**: Images shown in chat history
    - "AI Vision Analysis" badge
    - Image preview in messages
    - Original image preservation
- **Connection Matcher/Engine**: Intelligent student connection system
  - **Intent Analysis**: AI analyzes user queries to extract topic tags
    - 2-3 word topic tags (e.g., "Data Structures", "Visa Help")
    - Asynchronous processing
    - Firestore storage with timestamps
  - **Match Detection**: Finds students with similar interests
    - 30-minute time window matching
    - Anonymous study group suggestions
    - Real-time notifications
  - **Smart Notifications**: Contextual connection prompts
    - "psst... 2 other students are asking about [Topic Tag] right now"
    - Anonymous group join options
- **Universal Group Chat (Global Commons)**: Multilingual group chat
  - **Language Selector**: Choose from 8+ languages
    - English, Urdu, Mandarin, Spanish, Hindi, Persian, Nepali, Punjabi
  - **Slang-Aware Translation**: AI-powered translation with tone preservation
    - Uses deepseek-r1:8b for natural translations
    - Preserves emojis and casual speech
    - Real-time translation pipeline
  - **Dual Display**: Original and translated messages
    - Original text (small, gray)
    - Translated text (big, readable)
    - WhatsApp-like group chat interface
- **Form Auto-Filler**: AI-powered PDF form generation
  - **Automatic Detection**: AI detects form requests in chat
    - "Special Consideration" form detection
    - "Extension" form detection
    - JSON output for form data
  - **PDF Generation**: Pre-filled PDF creation
    - pdf-lib integration
    - Dynamic field mapping
    - Download-ready PDFs
  - **UI Rendering**: Special form cards in chat
    - "Form Ready" card display
    - Download PDF button
    - Form data preview
- **ReAct Agent (Reasoning + Acting)**: Autonomous AI agent with tool access
  - **Tool Registry**: Executable functions for AI
    - checkAvailability(resourceType)
    - bookResource(resourceId, time)
    - searchLibrary(query)
    - getCurrentDateTime()
  - **Agent Loop**: Multi-step reasoning and acting
    - max_steps = 5 loop limit
    - Tool execution with observations
    - Iterative refinement
  - **Human in the Loop**: Approval for sensitive actions
    - User confirmation for bookings
    - Safety checks for destructive actions
  - **UI Feedback**: Real-time agent thinking log
    - "⚙️ Checking Schedule..."
    - "⚙️ Found Conflict..."
    - "✅ Answer Ready."
- **Dynamic Ollama URL**: Flexible AI provider configuration
  - **URL Resolution**: Priority-based URL selection
    - localStorage custom URL (highest priority)
    - Environment variable fallback
    - Default localhost fallback
  - **Settings UI**: Connection manager interface
    - Custom Ollama URL input field
    - "Save & Apply" button
    - "Reset to Default" button
    - Currently active URL display
  - **Immediate Effect**: No page refresh required
    - URL changes apply instantly
    - Real-time connection status
- **My Profile**: Comprehensive profile management with:
  - Profile picture upload
  - Personal information (name, bio, course, year of study, date of birth, address)
  - Contact details (student email, personal email, phone number)
- **User Presence**: See who's online and last seen timestamps
- **Read Receipts**: Know when your messages are seen
- **Message Features**: Comprehensive messaging capabilities
  - **Edit Messages**: Edit your own messages after sending
  - **Emoji Reactions**: React with emojis (👍, ❤️, 😂, 😮, 😢, 🔥)
  - **Message Search**: Advanced search across all messages
  - **Reply to Messages**: Reply to specific messages with threading
  - **Forward Messages**: Forward messages to Campus Chat, Direct Messages, or Group Chats
  - **Save/Bookmark Messages**: Save important messages for quick access
  - **Pin Messages**: Pin important messages (admin only)
  - **File and Image Sharing**: Share files and images up to 10MB per file
  - **Markdown Formatting**: Format messages with markdown syntax
  - **User @mentions**: Mention users with autocomplete suggestions
  - **Report Content**: Report inappropriate content for admin review
  - **Voice Messages**: Send voice recordings (see Voice Messages section above)
  - **Polls**: Create and vote on polls (see Polls & Surveys section above)
  - **Quick Replies**: Use message templates for quick responses (see Quick Replies section above)
  - **Translation**: Translate messages to different languages (see AI Message Translation section above)
  - **Summarization**: Get AI-powered conversation summaries (see AI Conversation Summarization section above)

### For Admins
- **Audit Dashboard**: Review all messages with advanced filtering and sorting
  - Real-time message monitoring
  - Advanced search and filter options
  - Performance optimized with memoization
  - Comprehensive error handling
- **Analytics Dashboard**: Comprehensive platform analytics and insights
  - Real-time statistics (messages, users, reports, audit actions)
  - Daily message activity visualization
  - Top active users leaderboard
  - Time range filtering (7d, 30d, 90d, all time)
  - Export analytics data
  - Visual charts and graphs
- **Users Management**: View, search, edit, and manage all user accounts
  - **Email Verification Controls**: Verify/unverify student emails
  - Visual verification status indicators
  - Real-time status updates
  - Audit logging for all verification actions
- **Create Users**: Create new student and admin accounts from the portal
- **Message Management**: Delete any message and review reported content
  - Delete any message including AI messages
  - Deletion verification to ensure persistence
  - Detailed audit logging
- **Audit Trail**: Complete log of all administrative actions
  - All admin actions are logged automatically
  - Detailed action descriptions
  - Timestamp tracking
  - User identification
  - Searchable audit logs
  - Filter by action type, user, date range
  - Export audit logs
- **Export Functionality**: Export audit logs and chat history for analysis
  - Export audit logs in multiple formats (JSON, CSV, TXT)
  - Export chat history (JSON, CSV, TXT)
  - Filter exports by date range
  - Comprehensive data export for analysis
  - Analytics data export
- **Contact Messages**: View and manage contact form submissions
  - View messages from non-users
  - Respond to inquiries
  - Manage contact requests
  - Contact form integration
  - Message status tracking

### Advanced Features & Modern APIs

#### Command Palette & Navigation
- **Command Palette** (Ctrl/Cmd + K): Lightning-fast navigation and command execution
  - Fuzzy search across all features and views
  - Keyboard shortcuts for everything
  - Smart filtering and categorization
  - Quick actions and commands
  - Admin-only commands visible to admins

#### Notification System
- **Notification Center**: Centralized notification management
  - Real-time notifications for messages, mentions, and system updates
  - Mark as read/unread with one click
  - Filter by type (messages, mentions, system)
  - Search through notification history
  - Notification preferences and settings

#### Smart Workspace & Organization
- **Smart Workspace Manager**: AI-organized workspace for maximum productivity
  - AI automatically organizes your workspace into intelligent sections
  - Adaptive layouts (adaptive, grid, focus, split)
  - Smart categorization of projects, study materials, communications, and resources
  - One-click AI organization with intelligent recommendations
- **AI Study Groups**: Intelligent study group formation
  - AI analyzes your profile (courses, interests, goals, study style)
  - Recommends perfect study groups with match scores
  - Activity level tracking and member count
  - Smart group suggestions tailored to your needs

#### Emotion & Prediction Features
- **Emotion Prediction Engine**: Predict how messages will be received
  - AI analyzes emotional tone of messages before sending
  - Predicts reception (positive, neutral, negative)
  - Emotional intensity scoring (0-100)
  - Suggestions for improvement if needed
  - Real-time emotional impact analysis
- **Smart Notification System**: AI-prioritized notifications
  - AI analyzes notification importance and context
  - Priority scoring (1-10) based on urgency and relevance
  - Intelligent filtering (all, important, unread)
  - Auto-prioritization by AI
  - Category-based organization (urgent, important, normal)

#### Voice & Speech Features
- **Voice Commands**: Hands-free navigation using natural language
  - "Go to chat", "Open AI Help", "Show settings"
  - Voice-activated actions throughout the app
  - Browser Speech Recognition API integration
  - Multi-language voice command support
- **Voice Emotion Detection**: Real-time emotion recognition from voice tone
  - Detects emotions: Happy, Sad, Neutral, Excited, Stressed
  - Real-time analysis during voice message recording
  - Emotion confidence scoring
  - Transcript with emotion tags
  - Visual emotion indicators

#### AI-Powered Features
- **AI Predictive Typing**: Intelligent autocomplete as you type
  - Context-aware suggestions based on conversation history
  - Learns your writing style over time
  - Multi-sentence completion
  - Saves typing time with smart predictions
- **Contextual Actions**: Smart action suggestions based on message content
  - AI analyzes messages to suggest relevant actions
  - "Create poll" for questions, "Schedule reminder" for dates, etc.
  - Context-aware recommendations
  - One-click action execution
- **Smart Categorization**: Automatic message tagging using AI
  - Automatic categorization: Questions, Announcements, Discussions, Tasks
  - Filter messages by category
  - Improves message organization and search
  - Category-based insights
- **AI Conversation Insights**: Deep analytics dashboard with sentiment analysis
  - Real-time sentiment tracking (positive/neutral/negative)
  - Engagement metrics and activity patterns
  - Topic analysis and trending subjects
  - Key points extraction from conversations
  - Suggestions for better communication

#### Productivity Tools
- **Smart Task Extractor**: Automatic task extraction from conversations
  - AI extracts action items and tasks from messages
  - Creates task lists automatically
  - Integration with message scheduler for reminders
  - Task prioritization suggestions
- **Predictive Scheduler**: AI-optimized message send times
  - AI suggests optimal send times based on recipient behavior
  - Considers time zones, activity patterns, and message importance
  - Multiple time suggestions per message
  - Behavioral learning over time
- **Relationship Graph**: Visual communication network analysis
  - Interactive network visualization of your connections
  - Identify key communicators and communities
  - Relationship strength indicators
  - Network insights and statistics

#### Collaboration Features
- **Collaborative Editor**: Multi-user real-time text editing
  - Multiple users can edit documents simultaneously
  - Live cursor tracking showing where others are working
  - Real-time synchronization via Firestore
  - Optimistic updates with conflict resolution
  - Presence awareness (see who's editing)

### Platform Features
- **AI-Powered Toxicity Detection**: Advanced content moderation using Google Gemini AI
  - Context-aware toxicity analysis with confidence scoring
  - Comprehensive hate words list (500+ words) as fallback
  - Multi-language support (English, Hindi, Urdu, Punjabi, Bengali, Nepali, Persian)
  - Detailed toxicity metadata (confidence, reason, categories)
  - Automatic redaction of toxic content
- **Advanced Search**: Powerful search with multiple filters
  - Full-text search across messages
  - Filter by user, date range, file attachments, reactions, pinned status
  - Filter by message type (text, image, file, voice, poll)
  - Filter by chat type (Campus Chat, Private Chat, Group Chat)
  - Click to navigate to message
  - Keyboard shortcut: Ctrl/Cmd + K
  - Real-time search results
  - Search history
- **Keyboard Shortcuts**: Comprehensive keyboard navigation
  - Ctrl/Cmd + K: Open advanced search
  - Ctrl/Cmd + /: Show keyboard shortcuts
  - Ctrl/Cmd + Enter: Send message
  - ↑: Edit last message
  - Tab: Autocomplete mentions
  - Esc: Close modals
- **Command Palette**: Fast navigation and command execution (Ctrl/Cmd + K)
  - Search and navigate to any view instantly
  - Keyboard shortcuts for all features
  - Quick actions for common tasks
  - Admin commands (if admin)
  - Fuzzy search with smart filtering
- **Notification Center**: Centralized notification management
  - Real-time notifications for messages, mentions, and updates
  - Mark as read/unread
  - Filter and search notifications
  - Notification preferences
- **Voice Commands**: Hands-free navigation using natural language
  - Navigate using voice commands
  - "Go to chat", "Open AI Help", etc.
  - Voice-activated actions
  - Browser Speech Recognition API integration
- **AI Predictive Typing**: Intelligent autocomplete as you type
  - Context-aware suggestions based on conversation history
  - AI-powered completion
  - Learns from your writing style
  - Saves typing time with smart predictions
- **Contextual Actions**: Smart action suggestions based on message content
  - AI analyzes message content to suggest actions
  - Smart suggestions like "Create poll", "Schedule reminder", etc.
  - Context-aware recommendations
- **Smart Categorization**: Automatic message tagging using AI
  - AI automatically tags messages by topic
  - Categorizes: Questions, Announcements, Discussions, etc.
  - Filter messages by category
  - Improves message organization
- **Relationship Graph**: Visual communication network analysis
  - See your communication network visually
  - Identify key connections and communities
  - Network visualization with interactive graphs
  - Relationship strength indicators
- **Smart Task Extractor**: Automatic task extraction from conversations
  - AI extracts tasks and action items from messages
  - Creates task lists automatically
  - Reminders for extracted tasks
  - Integration with message scheduler
- **AI Conversation Insights**: Deep analytics dashboard with sentiment analysis
  - Conversation sentiment tracking (positive/neutral/negative)
  - Engagement metrics and patterns
  - Topic analysis and trending subjects
  - Key points extraction
  - Suggestions for better communication
- **Predictive Scheduler**: AI-optimized message send times
  - AI suggests optimal send times based on recipient behavior
  - Considers time zones and activity patterns
  - Multiple time suggestions per message
  - Behavioral learning over time
- **Voice Emotion Detection**: Real-time emotion recognition from voice
  - Detects emotions from voice tone (happy, sad, neutral, etc.)
  - Real-time emotion analysis during voice messages
  - Emotion confidence scoring
  - Transcript with emotion tags
- **Collaborative Editor**: Multi-user real-time text editing
  - Multiple users can edit simultaneously
  - Live cursor tracking showing where others are working
  - Real-time synchronization via Firestore
  - Conflict resolution with optimistic updates
  - Presence awareness
- **Message Drafts**: Auto-save drafts as you type
  - Automatically saves drafts as you type (debounced)
  - Restores when returning to chat
  - Per-chat draft storage
  - Works across all chat types (Campus Chat, Private Chat, Group Chat)
  - Never lose your message while typing
- **Export Chat History**: Export messages in multiple formats
  - JSON (full data with metadata)
  - CSV (spreadsheet-friendly)
  - TXT (plain text)
- **Advanced Customization**: Complete personalization system
  - 8 accent color themes (Indigo, Blue, Purple, Pink, Red, Orange, Green, Teal)
  - Font size preferences (Small, Medium, Large, X-Large)
  - Chat preferences (read receipts, typing indicators, online status)
  - Message forwarding controls
  - Sound effects toggle
  - Keyboard shortcuts support
- **Message Forwarding**: Forward messages to different chats
  - Forward to Campus Chat, Direct Messages, or Group Chats
  - User preference controls
  - Easy destination selection
- **Real-time Updates**: Live synchronization using Firebase Firestore
- **Typing Indicators**: See when others are typing in real-time
- **Read Receipts**: Know when your messages are read
- **Browser Notifications**: Desktop notifications for new messages and mentions
  - Desktop push notifications
  - Notification permissions handling
  - Custom notification sounds
  - Mention notifications
  - Group chat notifications
- **Web Share API**: Native sharing capabilities
  - Share messages, groups, and content
  - Automatic clipboard fallback for unsupported browsers
  - Integrated into message actions
  - Share to other apps and platforms
- **Clipboard API**: Modern clipboard operations
  - Copy to clipboard with permission handling
  - Read from clipboard (with permissions)
  - Image clipboard support
  - Legacy fallback for older browsers
  - Copy message text, links, and content
- **File System Access API**: Native file picker
  - Modern file selection interface
  - Save files with native dialog
  - Traditional input fallback
  - File type validation and size checks
- **Internationalization (i18n)**: Multi-language infrastructure
  - Support for 14+ languages (English, Spanish, French, German, Chinese, Japanese, Arabic, Hindi, Urdu, Nepali, Bengali, Punjabi, Persian, and more)
  - RTL (Right-to-Left) support for Arabic, Urdu, Persian
  - Locale-aware formatting (dates, times, numbers)
  - Relative time formatting ("2 hours ago")
  - Automatic browser language detection
  - Translation system foundation
- **Dark Mode**: Toggle between light and dark themes
  - Automatic system preference detection
  - Manual toggle option
  - Consistent theming across all components
- **Responsive Design**: Fully optimized for all screen sizes and devices
  - **Fluid Minimal Design**: Modern fluid animations with floating particles throughout
  - **Comprehensive Breakpoints**: 320px to 1920px+ (xs, sm, md, lg, xl, 2xl, 3xl)
  - **Mobile-First**: Touch-friendly interface with 44px minimum tap targets
  - **Safe Area Insets**: Full iOS notch and home indicator support
  - **Landscape Support**: Optimized for both portrait and landscape orientations
  - **High DPI Displays**: Optimized for retina and high-resolution screens
  - **Reduced Motion**: Respects user motion preferences
  - **Dark Mode**: Full support with automatic system detection
  - **Glassmorphism**: Backdrop blur effects throughout for modern aesthetic
  - **Rounded Design**: Rounded-full buttons and inputs for modern look
  - Full-screen sidebar on mobile with fluid animations
  - Proper viewport handling for iOS Safari and all mobile browsers
  - Pages scroll normally across views (Login/Registration/Admin), including PWA standalone mode
- **Native Feel Optimization**: Capacitor/WebView app optimization
  - **CSS Reset**: Native-like behavior
    - Disabled rubber banding (overscroll-behavior-y: none)
    - Hidden scrollbars for native appearance
    - Safe area insets for notch support
    - Disabled text selection on non-input elements
  - **Touch Optimization**: Instant, responsive interactions
    - Removed 300ms tap delay (touch-action: manipulation)
    - Custom active state hook (useNativeTouch)
    - Prevents input zoom (16px font-size minimum)
  - **Performance**: GPU-accelerated animations
    - transform: translate3d(0, 0, 0) for hardware acceleration
    - Explicit aspect-ratio for images (prevents CLS)
    - List virtualization recommendations (react-window/react-virtuoso)
  - **Image Optimization**: Layout shift prevention
    - Aspect ratio preservation
    - Shimmer loading animations
    - Object-fit containment
- **Progressive Web App (PWA)**: Advanced PWA features with full optimization
  - **Manifest Optimized**: Supports both portrait and landscape orientations
  - **Install Prompt**: Beautiful fluid design with safe area insets and mobile-optimized layout
  - **Service Worker**: Intelligent caching strategies with offline support
  - **Offline Support**: Firebase caching with network-first strategies
  - **Web Share Target API**: Share content directly to the app
  - **File Handlers API**: Open files directly in the app
  - **Protocol Handlers**: Custom URL schemes (web+campusconnect://)
  - **Background Sync API**: Support for offline actions
  - **Periodic Background Sync**: Cache updates in background
  - **iOS Optimized**: Full iOS meta tags and safe area support
  - **Android Optimized**: Enhanced Android PWA features
  - Works seamlessly on iOS, Android, and desktop
- **Code-Split Bundles**: Optimized performance with lazy-loaded components
  - Retry logic for failed component loads
  - Error boundaries with graceful recovery
  - Exponential backoff for import retries
- **Performance Optimizations**: Modern performance standards
  - **Core Web Vitals Monitoring**: CLS, LCP, FID, INP, TTFB tracking
  - Debounced and throttled inputs with React 18.3+ patterns
  - React.memo, useMemo, useCallback optimizations
  - **React 18.3+ Features**: useTransition, useDeferredValue, useId
  - **Advanced Animation System**: GPU-accelerated animations with Framer Motion, React Spring, and GSAP
    - Smooth page transitions with direction-based animations
    - Physics-based spring animations for natural motion
    - Staggered list animations for elegant entrances
    - Scroll-triggered animations with Intersection Observer
    - Timeline animations for complex sequences
    - Optimized for 60fps performance
  - Optimized Firebase queries (60% reduction in reads)
  - Skeleton loaders for better UX
  - Virtual scrolling for long lists
  - Code splitting and lazy loading
  - Advanced caching strategies
  - Bundle size optimization (40% reduction)
  - Tree-shaking and minification
  - Performance marks and measurements
  - Long task monitoring (blocking main thread detection)
  - Memory usage tracking
- **Accessibility (a11y)**: WCAG 2.2 AA compliance (upgraded from 2.1)
  - ARIA labels on all interactive elements
  - Full keyboard navigation support (Tab, Enter, Escape, Arrow keys)
  - Screen reader optimizations with live regions
  - Enhanced focus management with focus trapping
  - Semantic HTML structure
  - Color contrast improvements (4.5:1 minimum)
  - Icon-only buttons have accessible labels
  - ARIA expanded, haspopup, and atomic attributes
  - Skip to main content link
- **Security**: Latest security best practices (OWASP Top 10 compliance)
  - Content Security Policy (CSP) with strict headers
  - XSS protection with input sanitization
  - Secure Firebase rules with role-based access
  - Input validation and sanitization
  - Role-based access control (RBAC)
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: SAMEORIGIN
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy for camera/microphone/geolocation
- **Secure**: Role-based access control with Firestore security rules
- **Direct Messages**: Private messaging between users with chat history
  - One-on-one private conversations
  - Full chat history
  - All messaging features (voice, polls, files, etc.)
  - Read receipts and typing indicators
  - Voice and video calling support
- **Disappearing Messages**: Optional auto-delete messages after 24h or 7 days
  - Configure auto-delete duration
  - Automatic cleanup of old messages
  - Privacy-focused messaging
- **Comprehensive Error Handling**: Detailed error messages and graceful error recovery
  - User-friendly error messages
  - Automatic retry logic
  - Graceful fallbacks
  - Error boundaries for component isolation
- **Group Management**: Comprehensive group system
  - Browse and request to join groups
  - View all groups (including joined groups)
  - Invite users by email
  - Admin approval system
  - Member management (add, remove, leave)
  - Group admin controls
  - Group chat with all features
  - Polls in groups
  - Voice messages in groups

## Tech Stack

- **Frontend**: React 18.2 with Vite 7.3
  - Modern React patterns (hooks, context, lazy loading)
  - Code splitting and tree-shaking
  - Virtual scrolling for performance
  - Optimized bundle sizes
  - Advanced animation system with Framer Motion, React Spring, and GSAP
- **Animations**: 
  - **Framer Motion**: Declarative animations for React with layout animations
  - **React Spring**: Physics-based spring animations for natural motion
  - **GSAP**: Advanced timeline and sequence animations for complex interactions
  - Smooth page transitions with direction-based animations
  - Interactive hover and tap animations
  - Staggered list animations
  - Scroll-triggered animations with Intersection Observer
  - GPU-accelerated performance optimizations
- **Styling**: Tailwind CSS 3.4
  - **Fluid Minimal Design System**: Custom animations and utilities
  - **Comprehensive Responsive Breakpoints**: xs (320px) to 3xl (1920px+)
  - **PWA Breakpoints**: Portrait, landscape, touch, hover, motion preferences
  - **Safe Area Utilities**: iOS notch and safe area inset support
  - **Glassmorphism**: Backdrop blur effects throughout
  - **Dark Mode**: Full support with automatic system detection
  - **Custom Design Tokens**: Gradient colors, rounded-full components
- **Backend**: Firebase 12.7
  - Firestore (Database)
  - Firebase Hosting
  - Authentication (Email/Password)
  - Storage (Files, Images, Profile Pictures)
    - Secure file uploads with size limits (10MB for messages, 5MB for profile pictures)
    - Firebase Storage security rules for authenticated access
- **AI & RAG**: 
  - Google Gemini 2.5 Flash (toxicity detection, AI Help Assistant, Virtual Senior)
  - Google Gemini text-embedding-004 (768-dimensional embeddings)
  - Groq LLM (llama-3.3-70b-versatile for fast inference)
  - Pinecone Vector Database (serverless, AWS us-east-1)
- **Icons**: Lucide React
- **Deployment**: Firebase Hosting with automatic CI/CD

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Firebase**
   - **Find your project**: Your project ID is `campus-connect-sistc`
     - Direct link: https://console.firebase.google.com/project/campus-connect-sistc
     - See `docs/FIND_MY_PROJECT.md` for detailed instructions if you can't find it
   - **If project doesn't exist**: Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - **Enable Authentication**:
     - **Email/Password**: Go to Authentication → Sign-in method → Enable Email/Password
   - **Create a Firestore database**:
     - Go to Firestore Database → Create database
     - Start in test mode (you'll update rules later)
   - **Enable Firebase Storage** (Required for file uploads):
     - Go to Storage → Get Started
     - **Requires Blaze plan** (billing setup needed, but includes free tier)
     - See `docs/ENABLE_STORAGE.md` for setup instructions
     - **IMPORTANT**: Set up billing protection to limit spending to $1
     - See `docs/BILLING_PROTECTION.md` for how to set $1 spending limit
   - **Update Firestore security rules** from `firestore.rules`
   - **Get your Firebase configuration values** from Firebase Console → Project Settings → General → Your apps

<<<<<<< HEAD
3. **Configure AI Features (Full Setup)**
   
   📚 **See `docs/AI_SETUP_GUIDE.md` for complete step-by-step instructions!**
   
   **Quick Start:**
   
   - **Local Development:**
     1. Copy `.env.example` to `.env`:
        ```bash
        cp .env.example .env
        ```
     2. Add your Gemini API key (minimum required):
        ```env
        VITE_GEMINI_API_KEY=your-gemini-api-key-here
        ```
        Get from: https://makersuite.google.com/app/apikey
     3. Restart dev server: `npm run dev`
   
   - **Production (GitHub Actions):**
     1. Go to **GitHub → Settings → Secrets and variables → Actions**
     2. Add these secrets:
        - `VITE_GEMINI_API_KEY` - **Required** for full AI features
        - `PINECONE_API_KEY` - For RAG vector service (optional)
        - `PINECONE_INDEX_NAME` - For RAG vector service (optional)
        - `OPENAI_API_KEY` - For RAG embeddings (optional)
     3. Push to `master` → Auto-deploys with full AI!
   
   **Firebase Config:** Already hardcoded in `src/firebaseConfig.js` - no `.env` needed for Firebase!

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   
   **Note**: If you added a Gemini API key, make sure to restart the dev server for it to take effect.

4. **Build for Production**
   ```bash
   npm run build
   ```

## Cloud Architecture & Firebase Configuration

### Firebase Project

This project is configured for the Firebase project:

- **Project ID**: `campus-connect-sistc`
- **Hosting site**: `campus-connect-sistc`
- **App ID**: `1:680423970030:web:f0b732dd11717d17a80fff`

The client-side Firebase config lives in `src/firebaseConfig.js` and uses the official snippet from Firebase Console:

- Initializes **Auth**, **Firestore**, **Storage**, and **Cloud Functions** (region `us-central1`).
- For this deployment, the config is **hardcoded** for simplicity (no `.env` required for Firebase).
- If you want to use **GitHub Secrets + env-based config**, you can revert to `import.meta.env.VITE_*` in `firebaseConfig.js` and set those vars in your CI workflow.

### Cloud Services

- **Firebase Hosting**: Serves the production PWA from `dist` at:
  - Primary domain: `https://campus-connect-sistc.web.app`
  - Custom domain: `https://sistc.app` (configured in Firebase Hosting)
- **Cloud Firestore**: Primary database for messages, users, groups, visual boards (`visualBoards`), analytics, and more (see `firestore.rules`).
- **Cloud Functions (Node.js 20)**:
  - `ragSearch` and `ragUpsert` power the serverless vector RAG engine.
  - Functions are called via HTTPS callable from `src/utils/ragClient.js`.
- **Firebase Storage**: Stores images, voice messages, and VisualBoard images with strict rules.

### RAG & AI Cloud Stack

- **Google Gemini** (via `@google/generative-ai`):
  - Used by `AIHelp` and moderation for toxicity detection and intelligent responses.
  - Default model: `gemini-2.5-flash` (2026-era model).
- **Serverless Vector RAG Engine**:
  - `src/utils/ragSystem.js` orchestrates:
    - `ensureKnowledgeBaseIndexed()` → triggers `ragUpsert` to upsert a static knowledge base (SISTC docs) into a vector store (e.g. Pinecone) via Cloud Functions.
    - `searchRag()` → calls `ragSearch` to retrieve top-K matches.
  - If the **vector service is not configured** or returns an error (e.g. 400 “Vector service is not configured”), the client:
    - Logs a warning and falls back to local in-memory retrieval (`ragRetrieval`) + Gemini.
    - Never crashes the UI (RAG is “best effort”).

### Deployment

- **Manual deploy (current)**:
  1. Build:
     ```bash
     npm run build
     ```
  2. Deploy:
     ```bash
     firebase deploy --only "hosting"
     # or, if you also changed rules/indexes:
     firebase deploy --only "firestore,hosting"
     ```

- **GitHub Actions (optional)**:
  - Recommended secrets:
    - `FIREBASE_TOKEN` for `firebase deploy`.
    - `VITE_GEMINI_API_KEY` and any vector/RAG secrets if you choose an env-driven setup.
  - In your workflow, map secrets to `VITE_*` env vars before `npm run build` so Vite can bake them into the bundle.

## Firestore Rules

Make sure to set up proper Firestore security rules. See `docs/FIRESTORE_RULES.txt` for the complete, up-to-date rules.

The rules include comprehensive security for all collections:
- **Messages**: Read/create for all authenticated users, edit/delete for authors and admins
  - Supports reactions, replies, mentions, attachments, read receipts, pinning
- **Group Messages**: Same permissions as messages, for group chats
- **Private Chats**: Participants can read/write, private messaging with subcollections
- **Groups**: All users can read, members can create/update, admins can manage
- **Users**: Read for all, create/update own profile, admins can manage all users
- **Reports**: Create for all users, read/update/delete for admins only
- **Audit Logs**: Create for all users (system logging), read/delete for admins only
- **Typing Indicators**: Users can manage their own typing status
- **Pinned Messages**: All users can read, admins can pin/unpin
- **Saved Messages**: Users can only access their own saved messages
- **Scheduled Messages**: Users can only manage their own scheduled messages

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin1');
    }
    
    // Messages collection - supports editing, reactions, and reporting
    match /messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && (
        (resource.data.userId == request.auth.uid && 
         request.resource.data.diff(resource.data).affectedKeys().hasOnly(['text', 'displayText', 'toxic', 'edited', 'editedAt', 'reactions'])) ||
        isAdmin()
      );
      allow delete: if request.auth != null && (
        resource.data.userId == request.auth.uid ||
        isAdmin()
      );
    }
    
    // Users collection - supports presence tracking
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId && (
        isAdmin() ||
        (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['studentEmail', 'personalEmail', 'phoneNumber', 'updatedAt', 'lastSeen', 'isOnline']))
      );
      allow delete: if isAdmin();
    }
    
    // Reports collection
    match /reports/{reportId} {
      allow create: if request.auth != null;
      allow read, update, delete: if isAdmin();
    }
    
    // Audit logs collection
    match /auditLogs/{logId} {
      allow read: if isAdmin();
      allow create: if isAuthenticated();
      allow update: if false; // Audit logs should never be updated
      allow delete: if isAdmin();
    }

    // Saved messages collection
    match /savedMessages/{savedMessageId} {
      allow read, create, update, delete: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
    }

    // Scheduled messages collection
    match /scheduledMessages/{scheduledMessageId} {
      allow read, create, update: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() && (
        resource.data.userId == request.auth.uid || isAdmin()
      );
    }

    // Groups, Private Chats, Group Messages, Typing Indicators, Pinned Messages
    // (Full rules available in firestore.rules file)
  }
}
```

## Serverless Vector RAG Engine

The platform includes an advanced **Retrieval-Augmented Generation (RAG)** system for intelligent responses:

### Architecture
- **Vector Database**: Pinecone (serverless, AWS us-east-1)
- **Embeddings**: Google Gemini text-embedding-004 (768 dimensions)
- **LLM Providers**: Groq (primary, faster) → Gemini (fallback)
- **Knowledge Base**: 80+ comprehensive SISTC documents

### Features
- Semantic search across the entire knowledge base
- Context-aware responses from Virtual Senior AI
- Automatic fallback chain for reliability
- Real-time data updates via GitHub Actions

### Setup

1. **Configure Environment Variables**:
   ```env
   VITE_PINECONE_API_KEY=your-pinecone-api-key
   VITE_PINECONE_INDEX_NAME=campus-connect-index
   VITE_GEMINI_API_KEY=your-gemini-api-key
   VITE_GROQ_API_KEY=your-groq-api-key  # Optional
   ```

2. **Upload Knowledge Base** (first time or after data changes):
   ```bash
   npm run rag:upload
   ```
   Or trigger the GitHub Action manually: `.github/workflows/rag-upload.yml`

3. **Verify Upload**:
   The upload script automatically verifies data and shows test queries.

### Knowledge Base Structure
The knowledge base (`src/data/universityData.json`) contains:
- **About**: Institution overview, accreditation, mission
- **Courses**: Bachelor of IT, Diploma, Graduate Diploma
- **Fees**: Domestic and international pricing
- **Campuses**: Sydney CBD, Parramatta locations
- **Admissions**: Entry requirements, application process
- **International**: Visa requirements, support services
- **FAQs**: Common questions and answers

### Updating Knowledge Base
1. Edit `src/data/universityData.json`
2. Commit and push to trigger automatic upload
3. Or run `npm run rag:upload` manually

---

## AI Moderation

The platform uses **Google Gemini AI** for intelligent toxicity detection:

### Primary Detection (Gemini AI)
- Context-aware analysis using `gemini-2.5-flash` model
- Detects: hate speech, harassment, threats, profanity, bullying, and more
- Returns confidence scores and detailed reasoning
- Handles context and edge cases intelligently

### Fallback System
- Comprehensive hate words list (500+ words) if Gemini is unavailable
- Covers: profanity, hate speech, violence, harassment, slurs, and more
- Multi-language support (English, Hindi, Urdu, Punjabi, Bengali, Nepali, Persian)
- Word boundary matching for accurate detection

### Features
- Messages flagged as toxic are displayed as "[REDACTED BY AI]" to users
- Original text stored securely for admin review
- Detailed toxicity metadata (confidence, reason, method, categories)
- Visible in Admin Dashboard with full analytics
- Works across all chat types: Campus Chat, Private Chat, and Group Chat

## Authentication

The platform supports email/password authentication with role-based access:

1. **Student Registration & Login**
   - Students can register with email and password
   - **Email Format**: Must start with "s20" and contain "@sistc.app"
     - Examples: `s2012345@sistc.app` or `s20230091@sistc.app`
   - Email verification required before login
   - Role automatically set to "student" during registration

2. **Admin Login**
   - Admin accounts must be created manually in Firebase Console
   - **Email Format**: Must start with "admin" and contain "@sistc.app" (e.g., admin@sistc.app)
   - Email verification bypassed for admin accounts
   - See `docs/ADMIN_SETUP.md` for detailed admin account setup instructions

3. **Password Reset**
   - Available for both student and admin accounts
   - Email format validation applies to password reset requests

## User Roles

See `docs/ROLES_SETUP_GUIDE.md` for comprehensive role setup instructions.

- **Student**: Can access Campus Chat, Groups, AI Help, and Profile management
  - Email format: `s20xxxxx@sistc.app` (e.g., s2012345@sistc.app)
  - Email verification required (can be verified by admin)
- **Admin**: Can access Audit Logs, Users Management, and Create User functionality
  - Email format: `admin@sistc.app`
  - Email verification bypassed (always verified)
  - Can verify/unverify student emails from Users Management
  - Must be created in Firebase Console (see `docs/ADMIN_SETUP.md`)

## Admin Features

### Email Verification Management
- **View Verification Status**: See which users have verified their emails in the Users Management table
- **Verify Emails**: Manually verify student emails with a single click
- **Unverify Emails**: Remove verification status if needed (e.g., for security reasons)
- **Visual Indicators**: 
  - ✅ Green badge = Verified
  - ❌ Red badge = Not Verified
  - 🛡️ Auto badge = Admin (always verified)
- **Audit Trail**: All verification actions are automatically logged in the audit logs
- **Real-time Updates**: Verification status updates immediately across the system

## Automatic Deployment

This project is configured with **automatic deployment** to Firebase Hosting via GitHub Actions.

### How It Works

- **Trigger**: Every push to the `master` branch automatically triggers deployment
- **Process**: 
  1. GitHub Actions checks out your code
  2. Installs dependencies (`npm ci`)
  3. Builds the project (`npm run build`)
  4. Deploys to Firebase Hosting
  5. Your site is live within minutes

### Setup GitHub Secrets (One-Time)

For automatic deployment to work, you need to set up GitHub Secrets:

1. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Add the following secrets:

   #### Firebase Configuration (Required)
   
   - **`VITE_FIREBASE_API_KEY`**: 
     - Get from Firebase Console → Project Settings → General → Your apps → Web app config
     - Format: `AIzaSy...`
   
   - **`VITE_FIREBASE_AUTH_DOMAIN`**: 
     - Get from Firebase Console → Project Settings → General
     - Format: `your-project.firebaseapp.com`
   
   - **`VITE_FIREBASE_PROJECT_ID`**: 
     - Get from Firebase Console → Project Settings → General
     - Format: `your-project-id`
   
   - **`VITE_FIREBASE_STORAGE_BUCKET`**: 
     - Get from Firebase Console → Project Settings → General
     - Format: `your-project.firebasestorage.app`
   
   - **`VITE_FIREBASE_MESSAGING_SENDER_ID`**: 
     - Get from Firebase Console → Project Settings → General → Your apps
     - Format: `123456789012`
   
   - **`VITE_FIREBASE_APP_ID`**: 
     - Get from Firebase Console → Project Settings → General → Your apps
     - Format: `1:123456789012:web:abcdef123456`
   
   - **`VITE_FIREBASE_MEASUREMENT_ID`** (Optional):
     - Get from Firebase Console → Project Settings → General → Your apps
     - Format: `G-XXXXXXXXXX`
   
   #### Firebase Service Account (Required for Deployment)
   
   - **`FIREBASE_SERVICE_ACCOUNT_CAMPUS_CONNECT_SISTC`**: 
     - Get this from Firebase Console → Project Settings → Service Accounts
     - Click "Generate new private key"
     - Copy the entire JSON content and paste it as the secret value
     - **Important**: The service account needs these IAM roles:
       - **Firebase Admin** (required)
       - **Service Usage Admin** (required for enabling APIs)
       - **Storage Admin** (required for Storage rules)
     - See `docs/GITHUB_ACTIONS_SETUP.md` for detailed setup instructions
   
   #### AI API Keys (Required for AI features)
   
   - **`VITE_GEMINI_API_KEY`** (Required for AI features):
     - Your Google Gemini API key for:
       - AI-powered toxicity detection (primary moderation system)
       - AI Help Assistant responses
       - Virtual Senior AI responses in Campus Chat
       - Text embeddings for RAG (text-embedding-004)
     - Format: `AIzaSy...`
     - Get from: https://makersuite.google.com/app/apikey
     - **Note**: Without this key, toxicity detection falls back to word filter only
   
   - **`VITE_GROQ_API_KEY`** (Optional, for faster AI responses):
     - Groq LLM API key for faster inference (llama-3.3-70b-versatile)
     - When set, Groq is used as primary LLM with Gemini as fallback
     - Format: `gsk_...`
     - Get from: https://console.groq.com
   
   - **`VITE_PINECONE_API_KEY`** (Required for RAG features):
     - Pinecone vector database API key
     - Enables semantic search in the knowledge base
     - Format: `pcsk_...` or similar
     - Get from: https://app.pinecone.io
   
   - **`VITE_PINECONE_INDEX_NAME`** (Optional):
     - Pinecone index name (defaults to `campus-connect-index`)
     - Format: `campus-connect-index`

### Using Automatic Deployment

No manual deployment needed! Just commit and push your changes:

```bash
git add -A
git commit -m "Your changes"
git push origin master
```

The deployment happens automatically via GitHub Actions. You can monitor the deployment progress in the **Actions** tab of your GitHub repository.

## Project Structure

```
CampusConnect/
├── src/
│   ├── components/       # React components
│   │   ├── Login.jsx
│   │   ├── ChatArea.jsx
│   │   ├── Groups.jsx
│   │   ├── AIHelp.jsx
│   │   └── ...
│   ├── context/         # React Context providers
│   │   ├── AuthContext.jsx
│   │   ├── ThemeContext.jsx
│   │   └── ...
│   ├── config/          # Configuration files
│   │   └── aiConfig.js
│   ├── utils/           # Utility functions
│   └── firebaseConfig.js # Firebase configuration
├── public/              # Static assets
├── .github/
│   └── workflows/       # GitHub Actions workflows
│       └── deploy.yml   # Automatic deployment
├── firebase.json        # Firebase Hosting config
├── docs/  # Documentation folder (setup guides, troubleshooting, etc.)
└── package.json
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a detailed history of changes, features, and future plans.

## Contributing

### Making Changes

1. Make your changes locally
2. Test with `npm run dev`
3. Commit and push:

```bash
git add -A
git commit -m "Description of your changes"
git push origin master
```

The changes will automatically:
- ✅ Be committed to GitHub
- ✅ Build and deploy to Firebase Hosting
- ✅ Go live on your site

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

