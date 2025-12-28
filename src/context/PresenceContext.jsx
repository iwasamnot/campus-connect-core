import { createContext, useContext, useEffect } from 'react';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from './AuthContext';

const PresenceContext = createContext();

export const usePresence = () => {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
};

export const PresenceProvider = ({ children }) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    let intervalId;

    // Function to set user as online (creates document if it doesn't exist)
    const setOnline = async () => {
      try {
        // Check if document exists first
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          // Document exists, update it
          await setDoc(userRef, {
            isOnline: true,
            lastSeen: serverTimestamp()
          }, { merge: true });
        } else {
          // Document doesn't exist, create it with online status
          await setDoc(userRef, {
            isOnline: true,
            lastSeen: serverTimestamp(),
            email: user.email || null,
            role: 'student' // Default role, will be updated by AuthContext if needed
          }, { merge: true });
        }
      } catch (error) {
        console.error('Error setting user online:', error);
      }
    };

    // Set user as online immediately
    setOnline();

    // Update lastSeen periodically (every 30 seconds)
    intervalId = setInterval(() => {
      setDoc(userRef, {
        lastSeen: serverTimestamp()
      }, { merge: true }).catch((error) => {
        console.error('Error updating lastSeen:', error);
      });
    }, 30000);

    // Set user as offline when component unmounts or user changes
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      setDoc(userRef, {
        isOnline: false,
        lastSeen: serverTimestamp()
      }, { merge: true }).catch((error) => {
        console.error('Error setting user offline:', error);
      });
    };
  }, [user]);

  return (
    <PresenceContext.Provider value={{}}>
      {children}
    </PresenceContext.Provider>
  );
};

