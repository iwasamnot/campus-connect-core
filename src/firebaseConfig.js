import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDcsJKYKFvL-nGQtk7iLfW9mTfCZ0kc0qQ",
  authDomain: "campus-connect-sistc.firebaseapp.com",
  projectId: "campus-connect-sistc",
  storageBucket: "campus-connect-sistc.firebasestorage.app",
  messagingSenderId: "680423970030",
  appId: "1:680423970030:web:f0b732dd11717d17a80fff",
  measurementId: "G-NRYYQRSBJD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;

