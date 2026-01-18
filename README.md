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
  - Local SISTC knowledge base integration with RAG (Retrieval-Augmented Generation)
  - Conversation history support (maintains context from last 10 messages)
  - Virtual Senior AI mode in Campus Chat
  - Toggle AI Help mode on/off
  - Model selector for choosing the best AI model
  - Free and paid model options
  - Quick question buttons for common scenarios
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
- **AI**: 
  - Google Gemini 2.5 Flash (for toxicity detection, AI Help Assistant, and Virtual Senior responses)
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

3. **Configure Environment Variables**
   - Create a `.env` file in the root directory (copy from `.env.example`)
   - Add your Firebase configuration:
     ```
     VITE_FIREBASE_API_KEY=your-firebase-api-key
     VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=your-project-id
     VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
     VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
     VITE_FIREBASE_APP_ID=your-app-id
     VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
     ```
   - Add your AI API key:
     ```
     VITE_GEMINI_API_KEY=your-gemini-api-key-here
     ```
   - Add your ZEGOCLOUD App ID (optional, for voice/video calling):
     ```
     VITE_ZEGOCLOUD_APP_ID=your-zegocloud-app-id
     ```
   - **Gemini API Key**: Get from https://makersuite.google.com/app/apikey (for AI Help Assistant, Virtual Senior, and toxicity detection)
   - **ZEGOCLOUD Setup**: Get from https://console.zegocloud.com (for voice and video calling features)
     - App ID: Found in Project Configuration → Basic Information (add to `.env` as `VITE_ZEGOCLOUD_APP_ID`)
     - Server Secret: Found in Project Configuration → Basic Configurations → ServerSecret
     - **Important**: Server Secret is stored securely in Firebase Secret Manager (NOT in `.env` file)
     - See `docs/ZEGOCLOUD_TOKEN_SETUP.md` for complete setup instructions
     - Setup command: `firebase functions:secrets:set ZEGO_SERVER_SECRET`
   - **Important**: Restart the dev server after adding environment variables
   - If no API key is provided, the AI will use the local knowledge base
   - **Note**: The app will use fallback values if environment variables are not set (for backward compatibility)

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   
   **Note**: If you added a Gemini API key, make sure to restart the dev server for it to take effect.

4. **Build for Production**
   ```bash
   npm run build
   ```

## Firebase Configuration

The Firebase configuration is now managed through environment variables for better security and flexibility.

### Local Development
Create a `.env` file in the root directory with your Firebase configuration (see `.env.example` for template):

```env
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

Get these values from Firebase Console → Project Settings → General → Your apps → Web app config.

**Note**: The app includes fallback values for backward compatibility, but it's recommended to use environment variables.

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
   
   #### AI API Key (Required for AI features)
   
   - **`VITE_GEMINI_API_KEY`** (Required for AI features):
     - Your Google Gemini API key for:
       - AI-powered toxicity detection (primary moderation system)
       - AI Help Assistant responses
       - Virtual Senior AI responses in Campus Chat
     - Format: `AIzaSy...`
     - Get from: https://makersuite.google.com/app/apikey
     - **Note**: Without this key, toxicity detection falls back to word filter only, and AI features will use local knowledge base

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

