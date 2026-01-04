# Changelog

All notable changes to CampusConnect will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.1.2] - 2025-01-XX

### Changed
- **Repo cleanup**: Removed legacy calling-provider artifacts (docs, workflow secrets, and Cloud Function) and kept calling documentation focused on VideoSDK.live.

## [5.1.1] - 2025-01-02

### Fixed
- **Build Error - Logo Export**: Fixed "Export 'Logo' is not defined in module" error that occurred in production builds
  - Imported Logo component in main.jsx to ensure it's always in the main bundle
  - Updated vite.config.js to prevent Logo from being code-split into separate chunks
  - Ensured Logo component has both default and named exports for compatibility
  - This fixes the issue where lazy-loaded components couldn't import Logo correctly
- **Service Worker**: Disabled navigation preload to prevent service worker preload cancellation warnings
- **Build Configuration**: Improved build stability by ensuring critical components are in the main bundle

### Technical Improvements
- Enhanced build configuration to prevent code-splitting issues with shared components
- Improved module resolution for components used by lazy-loaded routes
- Better error handling for build-time module resolution

## [5.1.0] - 2024-12-XX

### Added
- **Modern Minimal Theme**: New sleek, minimalist theme option alongside the fun theme
  - Ultra-modern flat design with sharp corners (no rounded edges)
  - Completely flat design (no shadows)
  - Neutral grayscale color palette replacing colorful accents
  - Ultra-fast performance (0.05s transitions, 0.1s animations)
  - Optimized for maximum speed and efficiency
  - Theme style selector in Settings (Fun vs Minimal)
  - Better text selection colors for dark mode
- **Enhanced AI Intelligence**:
  - Improved system instructions with detailed capabilities
  - Conversation history support (maintains context from last 10 messages)
  - Better prompt structure and context handling
  - More comprehensive and contextually aware responses
- **Improved Documentation**:
  - Updated AI_SETUP.md to reflect Google Gemini 2.5 Flash usage
  - Removed outdated OpenAI and Tavily references
  - Updated README.md with current tech stack information

### Changed
- **Theme System**: Extended ThemeContext to support theme styles (fun vs minimal)
- **AI Configuration**: Removed OpenAI fallback code, using Gemini exclusively
- **Performance**: Optimized minimal theme with fastest transitions possible
- **Dark Mode**: Enhanced dark mode support with better contrast and readability
- **Code Cleanup**: Removed debug logs and temporary code for production readiness

### Fixed
- **Dark Mode Issues**: Fixed background colors and text colors in minimal theme dark mode
- **Text Selection**: Improved text selection colors for better visibility in dark mode
- **Theme Application**: Ensured minimal theme applies consistently across all pages (Login, Admin, all views)
- **PWA Support**: Theme now works correctly in PWA/standalone mode
- **Accessibility**: All form fields now have proper id, name, and label associations
- **Scheduled Messages**: Fixed scheduled messages not sending (created Cloud Function to process them)
- **Firestore Reads**: Optimized user fetching in PrivateChat to use batch queries
- **Private Chat Header**: Fixed header positioning and padding for mobile devices

### Technical Improvements
- Cleaned up console.log statements and debug code
- Removed unused aiConfig.js file
- Optimized CSS for minimal theme performance
- Enhanced scrollbar styling for minimal theme
- Better border and shadow handling across themes

## [5.0.0] - 2024-12-XX

### Added
- **Message Scheduling**: Schedule messages for future delivery in Campus Chat, Private Chat, or Group Chat
- **Saved Messages**: Bookmark and save important messages with search functionality
- **Image Gallery**: Browse all shared images with filtering and full-screen viewer
- **Activity Dashboard**: Comprehensive activity feed with statistics and insights
- **Advanced Search**: Enhanced search capabilities across messages, users, and content
- **Groups Feature**: Study group creation and management with group chat functionality
- **User Presence**: Online status indicators and last seen timestamps
- **Read Receipts**: Know when your messages are seen by others
- **Message Features**: Edit, react, reply, forward, save, and pin messages
- **File Sharing**: Support for images and files up to 10MB
- **Markdown Support**: Format messages with markdown
- **User @mentions**: Mention users with autocomplete
- **AI Help Assistant**: Intelligent AI assistant powered by Google Gemini 2.5 Flash
- **Dark Mode**: Full dark mode support with system preference detection
- **PWA Support**: Progressive Web App with offline capabilities
- **Mobile Optimized**: Responsive design with touch-friendly interface

### Changed
- Updated Firestore rules for groups, group messages, and private chats
- Enhanced navigation with new options (Groups, Private Chat, Activity Dashboard, etc.)
- Improved message moderation with AI-powered toxicity detection
- Better error handling and user feedback throughout the application

### Fixed
- Fixed profile data persistence after server restart
- Fixed duplicate email fields in user profile popup
- Fixed message reaction failures and duplicates
- Fixed group creation permissions
- Improved message deduplication logic
- Fixed accessibility issues with form fields

## [4.0.0] - 2024-12-XX

### Added
- **Virtual Senior AI**: AI-powered responses in Campus Chat
- **Enhanced Admin Features**: 
  - Analytics dashboard with comprehensive statistics
  - Improved user management interface
  - Better audit logging
- **Improved UX**: 
  - Better loading states
  - Enhanced error messages
  - Smooth animations and transitions

## [3.0.0] - 2024-12-XX

### Added
- **Private Messaging**: Direct messaging between users
- **Enhanced Admin Dashboard**: Better toxic message review interface
- **Improved Moderation**: AI-powered content moderation using Google Gemini

## [2.0.0] - 2024-12-XX

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
- Firestore security rules enforce role-based access
- Admin-only endpoints and UI elements
- Secure authentication with Firebase Auth
- Input sanitization and validation
