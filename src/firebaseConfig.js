import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Firebase configuration (hardcoded for this project)
// You chose NOT to use env vars, so everything is defined here.
// If you ever rotate keys, update this object and rebuild.
const firebaseConfig = {
  apiKey: 'AIzaSyAK8NnWHzvk5bItsp38iytTG7hxcaS5Ng4',
  authDomain: 'campus-connect-sistc.firebaseapp.com',
  projectId: 'campus-connect-sistc',
  storageBucket: 'campus-connect-sistc.firebasestorage.app',
  messagingSenderId: '680423970030',
  appId: '1:680423970030:web:f0b732dd11717d17a80fff',
  measurementId: 'G-NRYYQRSBJD',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
// Initialize Functions with explicit region (us-central1) to match deployed functions
export const functions = getFunctions(app, 'us-central1');
export default app;

