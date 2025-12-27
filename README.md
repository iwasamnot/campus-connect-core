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
- **AI-Powered Toxicity Detection**: Advanced content moderation using Google Gemini AI
  - Context-aware toxicity analysis with confidence scoring
  - Comprehensive hate words list (100+ words) as fallback
  - Detailed toxicity metadata (confidence, reason, categories)
  - Automatic redaction of toxic content
- **Real-time Updates**: Live synchronization using Firebase Firestore
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Code-Split Bundles**: Optimized performance with lazy-loaded components
- **Secure**: Role-based access control with Firestore security rules
- **Direct Messages**: Private messaging between users with chat history
- **Disappearing Messages**: Optional auto-delete messages after 24h or 7 days

## Tech Stack

- **Frontend**: React 18.2 with Vite 7.3
- **Styling**: Tailwind CSS 3.4
- **Backend**: Firebase 12.7
  - Firestore (Database)
  - Authentication (Email/Password)
  - Storage (Profile Pictures)
- **AI**: 
  - Google Gemini AI (for toxicity detection and Virtual Senior responses)
  - OpenAI GPT models (optional) with local knowledge base fallback
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

3. **Configure API Keys (Optional - for AI Features)**
   - Create a `.env` file in the root directory (`CampusConnect/.env`)
   - Add your API keys:
     ```
     VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
     VITE_GEMINI_API_KEY=your-gemini-api-key-here
     ```
   - **OpenAI API Key**: Get from https://platform.openai.com/api-keys (for AI Help Assistant)
   - **Gemini API Key**: Get from https://makersuite.google.com/app/apikey (for Virtual Senior in Campus Chat)
   - **Important**: Restart the dev server after adding API keys
   - If no API keys are provided, the AI will use the local knowledge base

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

The platform uses **Google Gemini AI** for intelligent toxicity detection:

### Primary Detection (Gemini AI)
- Context-aware analysis using `gemini-2.0-flash-exp` model
- Detects: hate speech, harassment, threats, profanity, bullying, and more
- Returns confidence scores and detailed reasoning
- Handles context and edge cases intelligently

### Fallback System
- Comprehensive hate words list (100+ words) if Gemini is unavailable
- Covers: profanity, hate speech, violence, harassment, slurs, and more
- Word boundary matching for accurate detection

### Features
- Messages flagged as toxic are displayed as "[REDACTED BY AI]" to users
- Original text stored securely for admin review
- Detailed toxicity metadata (confidence, reason, method, categories)
- Visible in Admin Dashboard with full analytics
- Works across all chat types: Campus Chat, Private Chat, and Group Chat

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

   - **`FIREBASE_SERVICE_ACCOUNT_CAMPUS_CONNECT_SISTC`**: 
     - Get this from Firebase Console → Project Settings → Service Accounts
     - Click "Generate new private key"
     - Copy the entire JSON content and paste it as the secret value
   
   - **`VITE_OPENAI_API_KEY`** (Optional):
     - Your OpenAI API key if you want ChatGPT features in production
     - Format: `sk-your-key-here`
   
   - **`VITE_GEMINI_API_KEY`** (Required for AI features):
     - Your Google Gemini API key for:
       - AI-powered toxicity detection (primary moderation system)
       - Virtual Senior AI responses in Campus Chat
     - Format: `AIzaSy...`
     - Get from: https://makersuite.google.com/app/apikey
     - **Note**: Without this key, toxicity detection falls back to word filter only

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

