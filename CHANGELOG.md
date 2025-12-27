# Changelog

All notable changes to the CampusConnect project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Two-factor authentication (2FA)
- Multi-language support
- Progressive Web App (PWA) features
- Voice messages
- Message scheduling
- Advanced analytics dashboard

## [4.0.0] - 2024-12-27

### Added
- **Advanced Theme Customization**: Complete theme personalization system
  - 8 accent color options (Indigo, Blue, Purple, Pink, Red, Orange, Green, Teal)
  - Custom accent colors applied throughout the app
  - Font size preferences (Small, Medium, Large, X-Large)
  - Dynamic CSS variables for real-time theme updates
  - Preferences saved to localStorage
- **Message Forwarding**: Forward messages to different chats
  - Forward messages to Campus Chat, Direct Messages, or Group Chats
  - Forward button on all messages (when enabled)
  - Forward modal with destination selection
  - Respects user preferences for forwarding
- **Enhanced Chat Preferences**: Comprehensive chat customization
  - Read receipts toggle (show/hide when messages are read)
  - Typing indicators toggle (show/hide typing status)
  - Online status toggle (show/hide online status)
  - Message forwarding toggle (enable/disable forwarding)
  - Sound effects toggle (enable/disable notification sounds)
  - Keyboard shortcuts toggle (enable/disable shortcuts)
  - All preferences saved and synced across sessions
- **Preferences Context**: New global preferences management system
  - Centralized preferences storage
  - Real-time preference updates
  - Reset to defaults functionality
  - Persistent storage with localStorage
- **Keyboard Shortcuts Support**: Keyboard navigation and shortcuts
  - Enable/disable keyboard shortcuts in settings
  - Foundation for future keyboard shortcut features
  - Better accessibility support
- **Enhanced Settings Page**: Expanded settings with more customization
  - Appearance section with theme and font controls
  - Chat Preferences section with granular controls
  - Reset Settings option to restore defaults
  - Better organized and categorized settings
  - Smooth animations and transitions

### Changed
- **Settings UI**: Completely redesigned settings page
  - Better organization with clear sections
  - More intuitive toggle switches
  - Enhanced visual feedback
  - Improved mobile responsiveness
- **Theme System**: Enhanced theme context with customization support
  - Added PreferencesContext for user preferences
  - Dynamic CSS variable injection
  - Better theme persistence
- **Message Actions**: Enhanced message action buttons
  - Added forward button to message actions
  - Better button organization
  - Improved hover states and animations
- **Version Number**: Updated to v4.0.0 in About section

### Fixed
- Improved preference persistence across page reloads
- Better theme color application throughout the app
- Enhanced settings page accessibility

## [3.0.0] - 2024-12-27

### Added
- **AI-Powered Toxicity Detection with Gemini**: Advanced toxicity checking using Google Gemini AI
  - Primary toxicity detection using Gemini AI (`gemini-2.0-flash-exp` model)
  - Intelligent context-aware toxicity analysis
  - Returns detailed toxicity metadata: confidence score, reason, detection method, and categories
  - Comprehensive fallback system with extensive hate words list (500+ words)
  - Automatic fallback to word filter if Gemini API is unavailable
  - Toxicity data stored in Firestore for admin review and analytics
- **Comprehensive Hate Words List**: Expanded toxicity word filter
  - 500+ toxic words and phrases covering:
    - Profanity and vulgar language
    - Hate speech and discriminatory terms
    - Violence and threatening language
    - Harassment and cyberbullying terms
    - Body shaming and mental health slurs
    - Minor insults and derogatory terms
    - **South Asian Languages**: Hindi, Urdu, Punjabi, Bengali/Bangladeshi, Nepali, Persian/Farsi
      - Comprehensive transliterated toxic words from all major South Asian languages
      - Common variations and spellings
      - Cultural context-aware terms
    - Common misspellings and alternatives
  - Word boundary matching for accurate detection
  - Normalized text processing for better matching
  - Multi-language support for diverse user base
- **Enhanced Toxicity Metadata**: Detailed toxicity information stored with messages
  - `toxicityConfidence`: Confidence score (0.0-1.0) from AI analysis
  - `toxicityReason`: Brief explanation of why content was flagged
  - `toxicityMethod`: Detection method used (gemini, fallback, etc.)
  - `toxicityCategories`: Array of detected categories (hate_speech, harassment, threats, etc.)
  - Enables better admin review and analytics
- **Direct Messages Chat History**: Show only users you've previously chatted with
  - Automatically fetches users from private chat history
  - Sorted by most recent conversation first
  - Shows last message preview and timestamp
  - More focused and efficient user list
  - Empty state if no previous chats exist
  - Still allows adding new users via email search
- **Toxicity Checker Utility Module**: Centralized toxicity checking system
  - Reusable `toxicityChecker.js` utility module
  - Consistent toxicity checking across all chat components
  - Easy to maintain and update
  - Supports both AI-based and fallback methods

### Changed
- **Toxicity Detection System**: Upgraded from simple word filter to AI-powered detection
  - All chat components (ChatArea, PrivateChat, GroupChat) now use Gemini AI for toxicity checking
  - More accurate and context-aware toxicity detection
  - Better handling of edge cases and false positives
  - Improved performance with async/await pattern
- **Message Data Structure**: Enhanced message documents with toxicity metadata
  - Messages now include detailed toxicity information
  - Better tracking and analytics capabilities
  - Improved admin review process
- **Firestore Security Rules**: Updated to support new toxicity fields
  - Added `toxicityConfidence`, `toxicityReason`, `toxicityMethod` to allowed update fields
  - Maintains security while enabling toxicity metadata updates
- **Direct Messages User List**: Changed from showing all users to showing only chat history
  - More focused and relevant user list
  - Better user experience with conversation previews
  - Improved performance by reducing unnecessary user data fetching

### Fixed
- Improved toxicity detection accuracy with AI-powered analysis
- Better handling of context in toxicity checking
- Enhanced fallback system for reliability
- Fixed Direct Messages showing all users instead of chat history
- Improved message metadata consistency across all chat types

## [2.0.1] - 2024-12-27

### Added
- **Private Chat from User Popup**: Start private chat directly from user profile popup
  - "Start Private Chat" button in user profile popup (Campus Chat, Group Chat, Private Chat)
  - Automatic navigation to Direct Messages with user pre-selected
  - Works for both students and admins
- **Email Search in Direct Messages**: Search and add users by email address
  - "Add by Email" button in Direct Messages view
  - Search users by email, studentEmail, or personalEmail
  - Automatically adds found users to chat list
  - Validates role compatibility (student ↔ admin)
- **Message History Preview**: See last message and timestamp in Direct Messages user list
  - Last message preview for each conversation
  - Relative timestamps (Just now, 5m ago, 2h ago, 3d ago)
  - Shows email if no conversation exists yet
  - Real-time updates when new messages are sent
- **Enhanced Settings Page**: Expanded settings with more options
  - Notifications section with browser notification enable button
  - Privacy & Security section with account security information
  - Help & Support section with AI Help access and About information
  - Organized into logical sections for better navigation
  - All settings options with smooth animations

### Changed
- **Direct Messages Heading**: Changed from "Private Chat with Students/Admins" to "Direct Messages"
  - More modern and user-friendly heading
  - Updated subtitle to be more descriptive
- **User Name Display**: Improved name extraction and display throughout private chat
  - Better fallback logic for user names (name → studentEmail → email → personalEmail → userId)
  - Name properly displayed in chat header
  - Name properly displayed in user list
  - Name properly cached when selecting chats
- **Emoji Picker**: Improved visibility and positioning
  - Better responsive sizing for mobile and desktop
  - Proper z-index to appear above other elements
  - Right-aligned positioning for better visibility
  - Improved mobile layout (6 columns on mobile, 8 on desktop)

### Fixed
- **Private Chat Button Visibility**: Fixed button not showing in user profile popup
  - Button now always shows when callback is provided
  - Removed overly strict role checking that was hiding button
  - Proper navigation to Direct Messages view
- **Private Chat Not Starting**: Fixed issue where clicking "Start Private Chat" didn't work
  - Now stores both userId and userData in sessionStorage
  - Automatically adds user to availableUsers if not already present
  - Proper role validation and user caching
  - Better error handling and logging
- **Unknown User Display**: Fixed "Unknown User" appearing in private chat
  - Improved name extraction with multiple fallback options
  - Proper name caching when users are added
  - Name displayed correctly in chat header and user list
- **Message History Not Showing**: Fixed previous messages not displaying in private chat
  - Improved message fetching with better timestamp handling
  - Added optimistic updates for immediate message display
  - Enhanced logging for debugging message issues
  - Better error handling for message queries
  - Fixed message sorting and deduplication
- **Emoji Picker Not Visible**: Fixed emoji picker being cut off or not visible
  - Improved positioning with proper container
  - Better responsive sizing
  - Higher z-index for proper layering
- **Message Sending Issues**: Fixed messages not appearing after sending
  - Added optimistic updates for immediate feedback
  - Improved message state management
  - Better synchronization with Firestore

## [2.0.0] - 2024-12-27

### Added
- **Real-time Typing Indicators**: See when users are typing in real-time
  - Typing status updates automatically as users type
  - Visual indicator with animated dots
  - Works in global chat, private chats, and group chats
  - Auto-clears after 3 seconds of inactivity
- **File & Image Sharing**: Upload and share files and images in messages
  - Support for images (JPG, PNG, GIF, etc.)
  - Support for documents (PDF, DOC, DOCX)
  - File size limit: 10MB
  - Image preview in messages
  - Clickable file downloads
  - Firebase Storage integration
- **Enhanced Emoji Picker**: Professional emoji picker with search and categories
  - Search functionality
  - Category navigation (Smileys, Gestures, Objects, Symbols, Flags)
  - Smooth animations
  - Easy access from message input
- **Message Threading/Replies**: Reply to specific messages
  - Click reply button on any message
  - Reply preview shows original message context
  - Visual thread indicators
  - Reply references stored in Firestore
- **User Mentions**: @mention users in messages
  - Type @ to trigger mention autocomplete
  - Search users by name or email
  - Keyboard navigation (Arrow keys, Enter, Tab, Escape)
  - Notifications for mentioned users
  - Visual mention indicators
- **Message Pinning**: Pin important messages (Admin only)
  - Admins can pin/unpin messages
  - Pinned messages section at top of chat
  - Shows up to 3 most recent pinned messages
  - Visual pin indicators
- **Markdown Formatting**: Rich text formatting in messages
  - **Bold** text with `**text**` or `__text__`
  - *Italic* text with `*text*` or `_text_`
  - `Code` blocks with backticks
  - [Links](url) with markdown syntax
  - Automatic line breaks
- **Browser Notifications**: Desktop notifications for new messages
  - Notifications when app is in background
  - Special notifications for @mentions
  - Click to focus app
  - Auto-dismiss after 5 seconds
  - Permission request on first use
- **Accessibility Improvements**: Enhanced keyboard navigation and ARIA labels
  - Keyboard navigation for emoji picker
  - Keyboard navigation for mention autocomplete
  - ARIA labels on interactive elements
  - Better focus management

### Changed
- **Message Input Enhanced**: 
  - Added file upload button
  - Added emoji picker button
  - Added mention autocomplete support
  - Improved placeholder text
  - Better visual feedback
- **Message Display Enhanced**:
  - Shows file attachments with previews
  - Shows reply context
  - Renders markdown formatting
  - Better visual hierarchy
- **Performance Optimizations**:
  - Optimized typing indicator updates
  - Efficient mention autocomplete filtering
  - Better state management
- **UI/UX Improvements**:
  - Smooth animations for all new features
  - Better visual feedback
  - Improved mobile responsiveness
  - Enhanced empty states

### Fixed
- Improved message rendering performance
- Better error handling for file uploads
- Fixed notification permission handling
- Improved typing indicator cleanup

## [1.2.2] - 2024-12-27

### Added
- **Logo.png Integration**: Added logo.png throughout the entire application
  - Logo component now uses logo.png image file with fallback to text logo
  - Favicon updated to use logo.png
  - Loading screen displays logo with smooth pulse animation
  - Empty states show logo (ChatArea, PrivateChat, GroupChat, Groups)
  - Error boundary displays logo
  - Logo copied to public folder for proper asset serving
- **Smooth Animations Throughout App**: Comprehensive animation system for enhanced user experience
  - Custom Tailwind animations: fade-in, slide-in (all directions), scale-in, bounce-in, shimmer
  - Smooth button hover and active states with scale and shadow effects
  - Page transition animations with fade-in effects
  - Card hover effects with elevation and shadow
  - Toast notification slide-in animations
  - Message enter animations
  - Modal fade-in animations
  - Skeleton loading animations
  - Global smooth transitions for all interactive elements (buttons, inputs, cards)
  - Animation utility file for consistent animations across components
- **Settings Page**: Dedicated settings page accessible from sidebar
  - Dark mode toggle with smooth switch animation
  - Sign out button
  - My Profile access (for students)
  - Clean, organized settings interface
  - Mobile-responsive design

### Changed
- Enhanced Sidebar navigation buttons with smooth hover/active scale animations
- Improved Toast notifications with enhanced slide-in animations
- Updated Settings component with smooth animations for all interactive elements
- Enhanced mobile menu button with smooth hover/active states
- Improved overall UI responsiveness with consistent animation timing
- Updated Gemini AI model to `gemini-2.5-flash` for newer API key support
- Hardcoded Gemini model name to ensure consistent model usage
- Moved dark mode and sign out buttons from sidebar footer to Settings page

### Fixed
- Improved visual feedback for all user interactions
- Enhanced user experience with polished, professional animations
- Fixed mobile sidebar buttons being hidden by browser UI (Chrome tab bar)
- Fixed private chat creation permissions in Firestore rules

## [1.2.1] - 2024-12-27

### Added
- **Disappearing Messages**: Private chat messages can now be set to automatically disappear after 24 hours or 7 days
  - Toggle disappearing messages on/off per chat
  - Duration options: 24 hours or 7 days
  - Visual indicators showing time remaining until expiration
  - Automatic cleanup of expired messages
  - Settings stored per chat conversation

### Changed
- Improved private chat error handling and verification
- Enhanced Firestore rules for disappearing messages support

### Fixed
- Fixed private chat message loading issues
- Improved chat document creation and verification flow

## [1.2.0] - 2024-12-27

### Added
- **Private Chat System**: Direct messaging between students and admins
  - Students can chat privately with any admin
  - Admins can chat privately with any student
  - Real-time messaging with read receipts
  - Message editing and deletion
  - Online/offline status indicators
  - User profile popup integration
  - Mobile-responsive design
  - Automatic chat creation on first message

### Changed
- Updated Sidebar navigation to include "Private Chat" option for both students and admins
- Enhanced Firestore security rules for private chat collections
- Improved mobile navigation with collapsible sidebar

### Fixed
- Fixed Firestore rules for private chat message access
- Improved error handling for chat creation and message loading

## [1.1.0] - 2024-12-26

### Added
- **Google Gemini AI Integration**: 
  - Integrated Google Gemini AI (`@google/generative-ai`) for intelligent responses
  - Hybrid AI system: Gemini → ChatGPT → Local Knowledge Base
  - Model options: Gemini 1.5 Flash (free), Gemini 1.5 Flash 8B, Gemini 1.5 Pro, Gemini Pro
  - AI Help Assistant now uses Gemini AI with local SISTC knowledge base
  - ChatArea AI Help mode with Gemini integration
  - Safety settings configured for content moderation
  - API key management via environment variables (`VITE_GEMINI_API_KEY`)
  - Automatic API key trimming to handle whitespace issues

### Changed
- AI Help Assistant now prioritizes Gemini AI over ChatGPT
- Removed model switching UI - now uses automatic hybrid model selection
- Updated AI Help to show Gemini status indicators
- Improved error handling for AI API calls

### Fixed
- Fixed Gemini API key handling (added `.trim()` to prevent whitespace issues)
- Fixed Gemini model name from `gemini-pro` to `gemini-1.5-flash` for better compatibility
- Improved API key validation and error messages

## [1.0.2] - 2024-12-26

### Added
- **Mobile Responsiveness**: Complete mobile optimization across all components
  - Collapsible sidebar with hamburger menu
  - Responsive padding and text sizes
  - Adaptive layouts for phones and tablets
  - Touch-friendly interface elements
  - Mobile-optimized message display

### Changed
- Sidebar now collapses on mobile devices
- All components adapted for mobile screens
- Improved navigation for small screens
- Code-splitting with React.lazy for better performance

### Fixed
- Fixed sidebar blocking content on mobile devices
- Fixed duplicate logo/header in sidebar
- Improved mobile user experience across all views

## [1.0.1] - 2024-12-26

### Added
- **Groups Feature**: Study group creation and management
  - Create and join study groups
  - Group chat functionality
  - Group member management
  - Group admin controls

### Changed
- Updated Firestore rules for groups and group messages
- Enhanced navigation with Groups option

### Fixed
- Fixed profile data persistence after server restart
- Fixed duplicate email fields in user profile popup
- Removed debug information from user popup
- Fixed message reaction failures and duplicates
- Fixed group creation permissions
- Improved message deduplication logic

## [1.0.0] - 2024-12-XX

### Added
- **Initial MVP Release**
  - Complete React (Vite) + Tailwind CSS + Firebase setup
  - User authentication with email/password
  - Role-based access control (Student/Admin)
  - Real-time messaging with Firestore
  - AI-powered content moderation (flags: "bad", "hate", "stupid")
  - Admin dashboard for toxic message review
  - User ban functionality
  - Dark mode support
  - Student profile management (student email, personal email, phone number)
  - Admin user management portal
  - Admin ability to create new users (students and admins)
  - Message deletion capabilities for admins
  - Firestore security rules with role-based permissions

### Components
- `Login.jsx` - Email/password authentication with role-based login
- `Sidebar.jsx` - Role-based navigation (Student: Global Chat, My Profile | Admin: Audit Logs, Users Management, Create User)
- `ChatArea.jsx` - Real-time chat with AI moderation and message deletion
- `AdminDashboard.jsx` - Toxic message review and user ban interface
- `StudentProfile.jsx` - Student profile information management
- `UsersManagement.jsx` - Admin interface for viewing and managing users
- `CreateUser.jsx` - Admin interface for creating new user accounts

### Context Providers
- `AuthContext.jsx` - Global authentication and user role management
- `ThemeContext.jsx` - Dark mode state management
- `ToastContext.jsx` - Global toast notifications

### Security
- Firestore security rules with `isAdmin()` helper function
- Role-based access control for messages and users collections
- Admin-only operations (delete messages, ban users, manage users)

### Features
- **AI Moderation**: Automatic detection and redaction of toxic content
- **Real-time Updates**: Live message synchronization using Firestore `onSnapshot`
- **User Roles**: Support for "student", "admin", and "admin1" roles
- **Profile Management**: Students can update personal information
- **User Management**: Admins can view, search, and delete user accounts
- **User Creation**: Admins can create new student and admin accounts from the portal

## [0.9.0] - Pre-Release

### Added
- **Toast Notification System**: Global toast notifications for success, error, warning, and info messages
- **Password Reset Functionality**: Users can now reset their passwords via email
- **Message Editing**: Message authors can now edit their own messages (one-time edit)
- **Message Reactions**: Users can react to messages with emojis (👍, ❤️, 😂, 😮, 😢, 🔥)
- **Message Search**: Real-time search functionality to find messages by content, user, or email
- **Message Reporting**: Users can report inappropriate messages with reasons
- **User Presence Indicators**: Online/offline status indicators for users
- **Admin Audit Trail**: Complete logging of all administrative actions (ban, delete, resolve reports)
- **Advanced Admin Dashboard**: 
  - Advanced filtering (by date, user, toxic status)
  - Sorting options (by timestamp, user, message)
  - Pagination for better performance
  - Reports management panel
  - Audit logs viewer
- **Export Functionality**: Export audit logs to CSV format
- **Rate Limiting**: 3-second cooldown between messages to prevent spam
- **Error Boundary**: Global error handling with user-friendly error messages
- **Responsive Design**: Improved mobile and tablet support
- **Custom Scrollbars**: Styled scrollbars for better UX

### Changed
- Removed "admin1" role option from user creation portal - admins can now only create users with "student" or "admin" roles
- Updated CreateUser component to use 2-column grid layout instead of 3-column for role selection
- Enhanced ChatArea with message editing, reactions, search, and reporting
- Enhanced AdminDashboard with advanced filtering, sorting, pagination, and export
- Updated Firestore security rules to support message editing, reactions, reports, and audit logs
- Improved error handling throughout the application
- Better loading states and user feedback

---

## Version History Summary

- **v3.0.0** (2024-12-27) - Major update: AI-powered toxicity detection with Gemini, comprehensive hate words list, enhanced toxicity metadata, Direct Messages chat history
- **v2.0.1** (2024-12-27) - Private chat improvements, email search, message history preview, enhanced settings, and bug fixes
- **v2.0.0** (2024-12-27) - Major update: Typing indicators, file sharing, emoji picker, message replies, mentions, pinning, markdown, and notifications
- **v1.2.2** (2024-12-27) - Smooth animations throughout the app
- **v1.2.1** (2024-12-27) - Disappearing Messages feature
- **v1.2.0** (2024-12-27) - Private Chat system
- **v1.1.0** (2024-12-26) - Google Gemini AI integration
- **v1.0.2** (2024-12-26) - Mobile responsiveness improvements
- **v1.0.1** (2024-12-26) - Groups feature and bug fixes
- **v1.0.0** (2024-12-XX) - Initial MVP release
- **v0.9.0** - Pre-release with core features

## Semantic Versioning

This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality (backward compatible)
- **PATCH** version for backward compatible bug fixes

## Contributing

When adding new features or fixes, please update this changelog:
1. Add entries under `[Unreleased]` for ongoing work
2. When releasing, move `[Unreleased]` to a new version number
3. Follow the format: `[MAJOR.MINOR.PATCH] - YYYY-MM-DD`
4. Use sections: Added, Changed, Deprecated, Removed, Fixed, Security
