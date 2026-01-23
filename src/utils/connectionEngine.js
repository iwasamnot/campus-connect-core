/**
 * Connection Engine - Intent Clustering & User Matching
 * Matches users based on similar interests/questions within time windows
 */

import { collection, addDoc, query, where, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';
import { callAI } from './aiProvider';

// Use window.__firebaseDb to avoid import/export issues
const db = typeof window !== 'undefined' && window.__firebaseDb 
  ? window.__firebaseDb 
  : null;

/**
 * Generate a 3-word topic tag from user question using AI
 * @param {string} userQuestion - The user's question
 * @returns {Promise<string>} - 3-word topic tag (e.g., "Data Structures", "Visa Help", "Basketball")
 */
export const generateTopicTag = async (userQuestion) => {
  if (!userQuestion || userQuestion.trim().length === 0) {
    return null;
  }

  try {
    const tagPrompt = `Analyze this question and generate a concise 3-word topic tag that captures the main subject.

Question: "${userQuestion}"

Rules:
- Return EXACTLY 3 words (no more, no less)
- Use title case (e.g., "Data Structures", "Visa Application", "Basketball Team")
- Be specific but concise
- Focus on the main topic/subject

Return ONLY the 3-word tag, nothing else.`;

    const tag = await callAI(tagPrompt, {
      systemPrompt: 'You are a topic classifier. Return only the 3-word tag, no explanations.',
      maxTokens: 20,
      temperature: 0.3
    });

    // Clean and validate the tag
    const cleanedTag = tag.trim().split(/\s+/).slice(0, 3).join(' ');
    
    if (cleanedTag.split(/\s+/).length === 3) {
      return cleanedTag;
    }
    
    // Fallback: Generate from keywords if AI fails
    const words = userQuestion.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    if (words.length >= 3) {
      return words.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    
    return null;
  } catch (error) {
    console.warn('Connection Engine: Failed to generate topic tag:', error);
    return null;
  }
};

/**
 * Store active interest in Firestore
 * @param {string} userId - User ID
 * @param {string} topicTag - 3-word topic tag
 * @param {string} question - Original question (for context)
 * @returns {Promise<string|null>} - Document ID if successful, null otherwise
 */
export const storeActiveInterest = async (userId, topicTag, question) => {
  if (!db || !userId || !topicTag) {
    return null;
  }

  try {
    const interestRef = await addDoc(collection(db, 'activeInterests'), {
      userId,
      topicTag,
      question: question.substring(0, 200), // Store first 200 chars for context
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    });

    console.log(`🔗 [Connection Engine] Stored interest: ${topicTag} for user ${userId}`);
    return interestRef.id;
  } catch (error) {
    console.error('Connection Engine: Error storing active interest:', error);
    return null;
  }
};

/**
 * Find matching users with same topic tag within time window
 * @param {string} userId - Current user ID
 * @param {string} topicTag - Topic tag to match
 * @param {number} timeWindowMinutes - Time window in minutes (default: 60)
 * @returns {Promise<Array>} - Array of matching user objects with userId and question
 */
export const findMatchingUsers = async (userId, topicTag, timeWindowMinutes = 60) => {
  if (!db || !userId || !topicTag) {
    return [];
  }

  try {
    // Calculate time threshold (1 hour ago)
    const timeThreshold = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    
    // Query for same topic tag within time window, excluding current user
    const q = query(
      collection(db, 'activeInterests'),
      where('topicTag', '==', topicTag),
      where('timestamp', '>=', Timestamp.fromDate(timeThreshold))
    );

    const snapshot = await getDocs(q);
    const matches = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      // Exclude current user and ensure we have valid data
      if (data.userId && data.userId !== userId && data.userId.trim() !== '') {
        matches.push({
          userId: data.userId,
          question: data.question || '',
          timestamp: data.timestamp,
          interestId: doc.id
        });
      }
    });

    // Remove duplicates (same user asking multiple times)
    const uniqueMatches = matches.reduce((acc, match) => {
      if (!acc.find(m => m.userId === match.userId)) {
        acc.push(match);
      }
      return acc;
    }, []);

    console.log(`🔗 [Connection Engine] Found ${uniqueMatches.length} matches for tag: ${topicTag}`);
    return uniqueMatches;
  } catch (error) {
    console.error('Connection Engine: Error finding matches:', error);
    return [];
  }
};

/**
 * Process user question and check for connections
 * @param {string} userId - User ID
 * @param {string} question - User's question
 * @returns {Promise<Object>} - { topicTag, matches: [] }
 */
export const processConnection = async (userId, question) => {
  if (!userId || !question) {
    return { topicTag: null, matches: [] };
  }

  try {
    // Step 1: Generate topic tag
    const topicTag = await generateTopicTag(question);
    if (!topicTag) {
      return { topicTag: null, matches: [] };
    }

    // Step 2: Store active interest
    await storeActiveInterest(userId, topicTag, question);

    // Step 3: Find matching users (only if > 2 users needed, so we need at least 1 other match)
    // Since we just stored ours, we need at least 2 total (including ours)
    const matches = await findMatchingUsers(userId, topicTag, 60);
    
    // Check if we have > 2 users total (1 other + current user = 2, but we need > 2)
    // Actually, re-read: "If > 2 users have the same tag" means we need at least 2 OTHER users
    // So matches.length >= 2 (2 other users + current = 3 total)
    if (matches.length >= 2) {
      console.log(`🔗 [Connection Engine] Connection offer triggered! ${matches.length + 1} users interested in: ${topicTag}`);
      return { topicTag, matches: matches.slice(0, 3) }; // Return top 3 matches
    }

    return { topicTag, matches: [] };
  } catch (error) {
    console.error('Connection Engine: Error processing connection:', error);
    return { topicTag: null, matches: [] };
  }
};

/**
 * Format connection offer message for AI response
 * @param {Array} matches - Array of matching users
 * @param {string} topicTag - Topic tag
 * @returns {string} - Formatted connection offer message
 */
export const formatConnectionOffer = (matches, topicTag) => {
  if (!matches || matches.length === 0) {
    return '';
  }

  const matchCount = matches.length;
  const matchText = matchCount === 1 
    ? `${matches[0].userId.substring(0, 8)}...`
    : `${matchCount} other students`;

  return `\n\n🔗 **Connection Found!** ${matchText} ${matchCount === 1 ? 'is' : 'are'} also interested in ${topicTag}. Want to connect?`;
};
