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
   - Create a Firestore database
   - Copy your Firebase config to `src/firebaseConfig.js`
   - Update Firestore security rules from `FIRESTORE_RULES.txt`

3. **Configure OpenAI API Key (Optional - for AI Help Assistant)**
   - Create a `.env` file in the root directory (`CampusConnect/.env`)
   - Add your OpenAI API key:
     ```
     VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
     ```
   - Get your API key from: https://platform.openai.com/api-keys
   - **Important**: Restart the dev server after adding the API key
   - If no API key is provided, the AI will use the local knowledge base

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   
   **Note**: If you added an OpenAI API key, make sure to restart the dev server for it to take effect.

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

Make sure to set up proper Firestore security rules. See `FIRESTORE_RULES.txt` for the complete, up-to-date rules.

The rules include:
- **Messages**: Read/create for all authenticated users, edit/delete for authors and admins
- **Users**: Read for all, create/update own profile, admins can manage all users
- **Reports**: Create for all users, read/update/delete for admins only
- **Audit Logs**: Admin-only access for complete security

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
      allow read, create, update, delete: if isAdmin();
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

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a detailed history of changes, features, and future plans.

## Contributing

### Committing Changes

After making changes, commit and push to GitHub:

```powershell
# Using the helper script
.\scripts\commit-and-push.ps1 "Your commit message"

# Or manually
git add -A
git commit -m "Your commit message"
git push origin master
```

All changes are automatically documented in the CHANGELOG.md file.

