# Changelog

All notable changes to the CampusConnect project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Enhanced AI moderation with machine learning model integration
- File/image sharing in messages
- Message threading/replies
- Typing indicators
- Two-factor authentication (2FA)
- Multi-language support
- Progressive Web App (PWA) features

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
