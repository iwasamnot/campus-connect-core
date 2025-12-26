# CampusConnect

A secure, student-only messaging platform for universities with AI-powered content moderation, real-time chat, group messaging, and intelligent AI assistant.

## Features

### For Students
- **Campus Chat**: Real-time global chat with AI-powered content moderation
- **Groups**: Create and join study groups with group chat functionality
- **AI Help Assistant**: Intelligent AI assistant powered by ChatGPT with local SISTC knowledge base
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
  - Report inappropriate content

### For Admins
- **Audit Dashboard**: Review all messages with advanced filtering and sorting
- **Users Management**: View, search, edit, and manage all user accounts
- **Create Users**: Create new student and admin accounts from the portal
- **Message Management**: Delete any message and review reported content
- **Audit Trail**: Complete log of all administrative actions
- **Export Functionality**: Export audit logs for analysis

### Platform Features
- **AI Moderation**: Automatic detection and redaction of toxic content
- **Real-time Updates**: Live synchronization using Firebase Firestore
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Code-Split Bundles**: Optimized performance with lazy-loaded components
- **Secure**: Role-based access control with Firestore security rules

## Tech Stack

- **Frontend**: React 18.2 with Vite 7.3
- **Styling**: Tailwind CSS 3.4
- **Backend**: Firebase 12.7
  - Firestore (Database)
  - Authentication (Email/Password)
  - Storage (Profile Pictures)
- **AI**: OpenAI GPT models (optional) with local knowledge base fallback
- **Icons**: Lucide React
- **Deployment**: Firebase Hosting with automatic CI/CD

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

- **Student**: Can access Campus Chat, Groups, AI Help, and Profile management
- **Admin**: Can access Audit Logs, Users Management, and Create User functionality

## Automatic Deployment

This project is configured with **automatic deployment** to Firebase Hosting:

- **Trigger**: Every push to the `master` branch automatically triggers deployment
- **Process**: 
  1. GitHub Actions builds the project
  2. Deploys to Firebase Hosting
  3. Your site is live within minutes

No manual deployment needed! Just commit and push your changes:

```bash
git add -A
git commit -m "Your changes"
git push origin master
```

The deployment happens automatically via GitHub Actions.

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

