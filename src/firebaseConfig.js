import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Firebase configuration from environment variables
// IMPORTANT: Never hardcode API keys or secrets in source code!
// Set these in .env file for local development and production
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
  
  const errorMsg = `Firebase configuration missing: ${missingFields.join(', ')}. Please check your environment variables.`;
  
  console.error('❌ Firebase configuration is missing required fields:', missingFields.join(', '));
  console.error('📝 Please set these in your .env file for local development');
  console.error('📝 For production, add them to your deployment environment variables');
  console.error('📚 See README.md for setup instructions');
  
  // Show error on screen for mobile debugging
  if (typeof document !== 'undefined') {
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `
        <div style="padding: 20px; font-family: system-ui; max-width: 600px; margin: 50px auto;">
          <h1 style="color: #dc2626; margin-bottom: 16px;">⚠️ Configuration Error</h1>
          <p style="color: #374151; margin-bottom: 12px;"><strong>Missing:</strong> ${missingFields.join(', ')}</p>
          <p style="color: #6b7280; margin-bottom: 20px;">
            This error usually occurs when environment variables are not set in production.
            Check the browser console for more details.
          </p>
          <details style="margin-top: 20px;">
            <summary style="cursor: pointer; color: #4f46e5;">Show Debug Info</summary>
            <pre style="background: #f3f4f6; padding: 12px; border-radius: 6px; overflow-x: auto; margin-top: 12px; font-size: 12px;">
API Key: ${firebaseConfig.apiKey ? 'Set' : 'Missing'}
Project ID: ${firebaseConfig.projectId ? 'Set' : 'Missing'}
Auth Domain: ${firebaseConfig.authDomain || 'Missing'}
Storage Bucket: ${firebaseConfig.storageBucket || 'Missing'}
App ID: ${firebaseConfig.appId || 'Missing'}
            </pre>
          </details>
        </div>
      `;
    }
  }
  
  throw new Error(errorMsg);
}

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error('Error initializing Firebase:', error);
  
  // Show error on screen for mobile debugging
  if (typeof document !== 'undefined') {
    const root = document.getElementById('root');
    if (root && !root.innerHTML.includes('Configuration Error')) {
      root.innerHTML = `
        <div style="padding: 20px; font-family: system-ui; max-width: 600px; margin: 50px auto;">
          <h1 style="color: #dc2626; margin-bottom: 16px;">⚠️ Firebase Initialization Error</h1>
          <p style="color: #374151; margin-bottom: 12px;">${error.message || 'Unknown error occurred'}</p>
          <p style="color: #6b7280; margin-bottom: 20px;">
            Please check the browser console for more details.
          </p>
          <button onclick="window.location.reload()" style="background: #4f46e5; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer;">
            Reload Page
          </button>
        </div>
      `;
    }
  }
  
  throw error;
}

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
// Initialize Functions with explicit region (us-central1) to match deployed functions
export const functions = getFunctions(app, 'us-central1');
export default app;

