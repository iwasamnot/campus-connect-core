import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration from environment variables with fallback
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDcsJKYKFvL-nGQtk7iLfW9mTfCZ0kc0qQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "campus-connect-sistc.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "campus-connect-sistc",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "campus-connect-sistc.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "680423970030",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:680423970030:web:f0b732dd11717d17a80fff",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-NRYYQRSBJD"
};

// Validate Firebase config
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('Firebase configuration is missing required fields');
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
export default app;

