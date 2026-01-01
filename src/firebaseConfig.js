import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Firebase configuration from environment variables
// IMPORTANT: Never hardcode API keys or secrets in source code!
// Set these in .env file for local development and GitHub Secrets for production
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate Firebase config
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  const missingFields = [];
  if (!firebaseConfig.apiKey) missingFields.push('VITE_FIREBASE_API_KEY');
  if (!firebaseConfig.projectId) missingFields.push('VITE_FIREBASE_PROJECT_ID');
  
  console.error('❌ Firebase configuration is missing required fields:', missingFields.join(', '));
  console.error('📝 Please set these in your .env file for local development');
  console.error('📝 For production, add them to GitHub Secrets (Settings → Secrets → Actions)');
  console.error('📚 See README.md for setup instructions');
  
  throw new Error(`Firebase configuration missing: ${missingFields.join(', ')}. Please check your environment variables.`);
}

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export default app;

