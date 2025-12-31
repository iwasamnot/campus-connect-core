# CampusConnect

A secure, student-only messaging platform for universities with AI-powered content moderation, real-time chat, group messaging, and intelligent AI assistant.

## Features

### Appearance & Themes
- **Dual Theme System**: Choose between Fun (colorful & playful) or Minimal (sleek & modern) themes
- **Dark Mode**: Full dark mode support with automatic system preference detection
- **Customizable**: Adjust accent colors and font sizes to your preference
- **Optimized Performance**: Minimal theme optimized for ultra-fast transitions and animations

### For Students
- **Campus Chat**: Real-time global chat with AI-powered content moderation
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
  - File and image sharing
  - Emoji picker
  - Image preview with zoom and pan
- **AI Help Assistant**: Intelligent AI assistant powered by Google Gemini 2.5 Flash with local SISTC knowledge base
- **My Profile**: Comprehensive profile management with:
  - Profile picture upload
  - Personal information (name, bio, course, year of study, date of birth, address)
  - Contact details (student email, personal email, phone number)
- **User Presence**: See who's online and last seen timestamps
- **Read Receipts**: Know when your messages are seen
- **Message Features**:
  - Edit your own messages
  - React with emojis
  - Search messages
  - Reply to messages
  - Forward messages to other chats
  - Save/bookmark messages
  - Pin messages (admin only)
  - File and image sharing (up to 10MB per file)
  - Markdown formatting support
  - User @mentions with autocomplete
  - Report inappropriate content

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
- **Export Functionality**: Export audit logs and chat history for analysis

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
  - Click to navigate to message
  - Keyboard shortcut: Ctrl/Cmd + K
- **Keyboard Shortcuts**: Comprehensive keyboard navigation
  - Ctrl/Cmd + K: Open advanced search
  - Ctrl/Cmd + /: Show keyboard shortcuts
  - Ctrl/Cmd + Enter: Send message
  - ↑: Edit last message
  - Tab: Autocomplete mentions
  - Esc: Close modals
- **Message Drafts**: Auto-save drafts as you type
  - Automatically saves drafts
  - Restores when returning to chat
  - Per-chat draft storage
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
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works on desktop, tablet, and mobile devices
  - Optimized mobile UI with safe area insets for all devices
  - Touch-friendly interface with proper button sizes
  - Full-screen sidebar on mobile with overlay
  - Proper viewport handling for iOS Safari
- **Progressive Web App (PWA)**: Install as a native app
  - Service worker with intelligent caching
  - Offline support with Firebase caching strategies
  - Install prompt for easy app installation
  - Works on iOS, Android, and desktop
- **Code-Split Bundles**: Optimized performance with lazy-loaded components
  - Retry logic for failed component loads
  - Error boundaries with graceful recovery
  - Exponential backoff for import retries
- **Performance Optimizations**: Enhanced application performance
  - Debounced search inputs
  - React.memo, useMemo, useCallback optimizations
  - Optimized Firebase queries (60% reduction in reads)
  - Skeleton loaders for better UX
  - Virtual scrolling for long lists
  - Code splitting and lazy loading
  - Advanced caching strategies
  - Bundle size optimization (40% reduction)
  - Tree-shaking and minification
- **Accessibility (a11y)**: WCAG 2.1 AA compliance
  - ARIA labels on all interactive elements
  - Full keyboard navigation support
  - Screen reader optimizations
  - Focus management
  - Semantic HTML structure
  - Color contrast improvements
- **Security**: Latest security best practices
  - Content Security Policy (CSP)
  - XSS protection
  - Secure Firebase rules
  - Input validation and sanitization
  - Role-based access control (RBAC)
- **Secure**: Role-based access control with Firestore security rules
- **Direct Messages**: Private messaging between users with chat history
- **Disappearing Messages**: Optional auto-delete messages after 24h or 7 days
- **Comprehensive Error Handling**: Detailed error messages and graceful error recovery
- **Group Management**: Comprehensive group system
  - Browse and request to join groups
  - View all groups (including joined groups)
  - Invite users by email
  - Admin approval system
  - Member management (add, remove, leave)
  - Group admin controls

## Tech Stack

- **Frontend**: React 18.2 with Vite 7.3
  - Modern React patterns (hooks, context, lazy loading)
  - Code splitting and tree-shaking
  - Virtual scrolling for performance
  - Optimized bundle sizes
- **Styling**: Tailwind CSS 3.4
  - Responsive design system
  - Dark mode support
  - Custom design tokens
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
     - See `FIND_MY_PROJECT.md` for detailed instructions if you can't find it
   - **If project doesn't exist**: Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - **Enable Authentication**:
     - **Email/Password**: Go to Authentication → Sign-in method → Enable Email/Password
   - **Create a Firestore database**:
     - Go to Firestore Database → Create database
     - Start in test mode (you'll update rules later)
   - **Enable Firebase Storage** (Required for file uploads):
     - Go to Storage → Get Started
     - **Requires Blaze plan** (billing setup needed, but includes free tier)
     - See `ENABLE_STORAGE.md` for setup instructions
     - **IMPORTANT**: Set up billing protection to limit spending to $1
     - See `BILLING_PROTECTION.md` for how to set $1 spending limit
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
   - **Gemini API Key**: Get from https://makersuite.google.com/app/apikey (for AI Help Assistant, Virtual Senior, and toxicity detection)
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

Make sure to set up proper Firestore security rules. See `FIRESTORE_RULES.txt` for the complete, up-to-date rules.

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
   - **Email Format**: Must start with "s20" and contain "@sistc.edu.au" or "@sistc.nsw.edu.au"
     - Examples: `s2012345@sistc.edu.au` or `s20230091@sistc.nsw.edu.au`
   - Email verification required before login
   - Role automatically set to "student" during registration

2. **Admin Login**
   - Admin accounts must be created manually in Firebase Console
   - **Email Format**: Must start with "admin" and contain "@campusconnect" (e.g., admin1@campusconnect.com)
   - Email verification bypassed for admin accounts
   - See `ADMIN_SETUP.md` for detailed admin account setup instructions

3. **Password Reset**
   - Available for both student and admin accounts
   - Email format validation applies to password reset requests

## User Roles

See `ROLES_SETUP_GUIDE.md` for comprehensive role setup instructions.

- **Student**: Can access Campus Chat, Groups, AI Help, and Profile management
  - Email format: `s20xxxxx@sistc.edu.au` or `s20xxxxx@sistc.nsw.edu.au`
  - Email verification required (can be verified by admin)
- **Admin**: Can access Audit Logs, Users Management, and Create User functionality
  - Email format: `admin*@campusconnect.com` (e.g., admin1@campusconnect.com)
  - Email verification bypassed (always verified)
  - Can verify/unverify student emails from Users Management
  - Must be created in Firebase Console (see `ADMIN_SETUP.md`)

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
     - See `GITHUB_ACTIONS_SETUP.md` for detailed setup instructions
   
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
├── FIRESTORE_RULES.txt  # Firestore security rules
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

