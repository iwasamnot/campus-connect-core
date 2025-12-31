/**
 * Utility to save/bookmark messages
 */

import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Save a message to user's saved messages
 * @param {string} userId - User ID
 * @param {Object} message - Message object to save
 * @returns {Promise<string>} Document ID of saved message
 */
export const saveMessage = async (userId, message) => {
  try {
    // Check if already saved
    const existingQuery = query(
      collection(db, 'savedMessages'),
      where('userId', '==', userId),
      where('messageId', '==', message.id)
    );
    const existing = await getDocs(existingQuery);
    
    if (!existing.empty) {
      throw new Error('Message already saved');
    }

    const savedMessage = {
      userId,
      messageId: message.id,
      messageText: message.text || message.displayText || '',
      authorId: message.userId,
      authorName: message.userName || 'Unknown',
      originalTimestamp: message.timestamp,
      savedAt: serverTimestamp(),
      chatType: message.chatType || 'global'
    };

    const docRef = await addDoc(collection(db, 'savedMessages'), savedMessage);
    return docRef.id;
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
};

