import { createContext, useContext, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
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

    // Set user as online
    updateDoc(userRef, {
      isOnline: true,
      lastSeen: serverTimestamp()
    }).catch(console.error);

    // Update lastSeen periodically (every 30 seconds)
    intervalId = setInterval(() => {
      updateDoc(userRef, {
        lastSeen: serverTimestamp()
      }).catch(console.error);
    }, 30000);

    // Set user as offline when component unmounts or user changes
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      updateDoc(userRef, {
        isOnline: false,
        lastSeen: serverTimestamp()
      }).catch(console.error);
    };
  }, [user]);

  return (
    <PresenceContext.Provider value={{}}>
      {children}
    </PresenceContext.Provider>
  );
};

