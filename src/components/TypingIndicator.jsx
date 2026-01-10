import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, doc, onSnapshot, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
// Use window.__firebaseDb to avoid import/export issues in production builds
const db = typeof window !== 'undefined' && window.__firebaseDb 
  ? window.__firebaseDb 
  : null;

// Hook for managing typing indicators
// CRITICAL: Declare useTypingIndicator as a top-level const before exporting
const useTypingIndicator = (chatId, chatType = 'global') => {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState({});

  useEffect(() => {
    if (!user) return;
    
    // For global chat, chatId might be 'global' or empty
    const typingCollection = chatType === 'global' ? 'typing' : 
      chatType === 'private' ? `privateChats/${chatId}/typing` : 
      `groups/${chatId}/typing`;

    // Listen for other users' typing status
    const unsubscribe = onSnapshot(
      collection(db, typingCollection),
      (snapshot) => {
        const typing = {};
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          if (docSnap.id !== user.uid && data.typing) {
            // Check if typing status is recent (within 5 seconds)
            const timestamp = data.timestamp?.toDate?.() || new Date();
            const now = new Date();
            if (now - timestamp < 5000) {
              typing[docSnap.id] = true;
            }
          }
        });
        setTypingUsers(typing);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [chatId, chatType, user]);

  return typingUsers;
};

// Export the declared hook
export { useTypingIndicator };

// Typing indicator component
const TypingIndicator = ({ typingUsers, userNames }) => {
  const typingUserIds = Object.keys(typingUsers);
  
  if (typingUserIds.length === 0) return null;

  const names = typingUserIds
    .map(uid => userNames[uid] || 'Someone')
    .join(', ');

  return (
    <div className="px-4 py-2 text-sm text-white/60 italic animate-fade-in">
      <span className="inline-flex items-center gap-2">
        <span className="flex gap-1">
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
        </span>
        {names} {typingUserIds.length === 1 ? 'is' : 'are'} typing...
      </span>
    </div>
  );
};

export default TypingIndicator;

