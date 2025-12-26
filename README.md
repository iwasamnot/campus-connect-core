# CampusConnect

A secure, student-only messaging platform for universities with AI-powered content moderation.

## Features

- **Student Portal**: Global chat with AI moderation
- **Admin Dashboard**: Audit logs for toxic messages with user ban functionality
- **AI Moderation**: Automatic detection and redaction of toxic content
- **Real-time Messaging**: Powered by Firebase Firestore

## Tech Stack

- React (Vite)
- Tailwind CSS
- Firebase v9 (Firestore & Auth)
- Lucide React (Icons)

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication:
     - **Email/Password**: Go to Authentication → Sign-in method → Enable Email/Password
     - **Anonymous** (optional): Enable Anonymous sign-in for quick login
   - Create a Firestore database
   - Copy your Firebase config to `src/firebaseConfig.js`

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## Firebase Configuration

Replace the placeholder values in `src/firebaseConfig.js` with your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Firestore Rules

Make sure to set up proper Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is admin (supports both 'admin' and 'admin1')
    function isAdmin() {
      return request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin1');
    }
    
    // Messages collection
    match /messages/{messageId} {
      // Allow authenticated users to read all messages
      allow read: if request.auth != null;
      
      // Allow authenticated users to create messages
      allow create: if request.auth != null;
      
      // Allow authenticated users to update only ban-related fields
      // Admins can update any field
      allow update: if request.auth != null && (
        (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['userBanned', 'bannedAt'])) ||
        isAdmin()
      );
      
      // Allow admins to delete messages
      allow delete: if isAdmin();
    }
    
    // Users collection
    match /users/{userId} {
      // Allow authenticated users to read any user document
      allow read: if request.auth != null;
      
      // Allow users to create their own user document (during registration)
      allow create: if request.auth != null && request.auth.uid == userId;
      
      // Allow users to update their own user document
      // Students can update: studentEmail, personalEmail, phoneNumber, updatedAt
      // Admins can update any field
      allow update: if request.auth != null && request.auth.uid == userId && (
        isAdmin() ||
        (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['studentEmail', 'personalEmail', 'phoneNumber', 'updatedAt']))
      );
      
      // Allow admins to delete users
      allow delete: if isAdmin();
    }
  }
}
```

## AI Moderation

The platform automatically flags messages containing the words: "bad", "hate", or "stupid". Flagged messages are:
- Displayed as "[REDACTED BY AI]" to users
- Stored with both original and redacted text
- Visible in the Admin Dashboard for review

## Authentication

The platform supports two authentication methods:

1. **Email/Password Registration & Login**
   - Users can register with email and password
   - Choose role (Student or Admin) during registration
   - Role is stored in Firestore `users` collection

2. **Anonymous Quick Login** (Optional)
   - Quick access without registration
   - Role selected at login time

## User Roles

- **Student**: Can access Global Chat and AI Help
- **Admin**: Can access Audit Logs to review and ban users

