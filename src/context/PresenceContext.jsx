import { createContext, useContext, useEffect } from 'react';
import { doc, updateDoc, onDisconnect, serverTimestamp } from 'firebase/firestore';
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

    // Set user as online
    updateDoc(userRef, {
      isOnline: true,
      lastSeen: serverTimestamp()
    }).catch(console.error);

    // Set user as offline when they disconnect
    onDisconnect(userRef).update({
      isOnline: false,
      lastSeen: serverTimestamp()
    }).catch(console.error);

    // Cleanup on unmount
    return () => {
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

