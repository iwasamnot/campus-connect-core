/**
 * User Profile AI Context System
 * Automatically extracts and updates user information from conversations
 * to provide personalized AI assistance
 */

import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { callAI } from './aiProvider';

// Use window.__firebaseDb to avoid import/export issues
const db = typeof window !== 'undefined' && window.__firebaseDb 
  ? window.__firebaseDb 
  : null;

/**
 * Get user profile with AI context
 */
export const getUserProfile = async (userId) => {
  if (!db || !userId) return null;
  
  try {
    const profileRef = doc(db, 'userProfiles', userId);
    const profileDoc = await getDoc(profileRef);
    
    if (profileDoc.exists()) {
      return profileDoc.data();
    }
    
    // Create default profile
    const defaultProfile = {
      userId,
      assistantName: 'AI Assistant',
      userName: null,
      context: '',
      preferences: {
        communicationStyle: 'friendly',
        detailLevel: 'moderate'
      },
      interests: [],
      courseInfo: null,
      studyGoals: [],
      conversationHistory: [],
      lastUpdated: serverTimestamp(),
      createdAt: serverTimestamp()
    };
    
    await setDoc(profileRef, defaultProfile);
    return defaultProfile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

/**
 * Update user profile using AI to extract information from conversation
 */
export const updateProfileFromConversation = async (userId, conversationMessages) => {
  if (!db || !userId || !conversationMessages || conversationMessages.length === 0) return;
  
  try {
    const profileRef = doc(db, 'userProfiles', userId);
    const currentProfile = await getUserProfile(userId);
    
    // Build conversation context for AI analysis
    const conversationText = conversationMessages
      .slice(-10) // Last 10 messages
      .map(msg => `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');
    
    // Use AI to extract user information
    const extractionPrompt = `Analyze this conversation and extract relevant information about the user. Return a JSON object with:
{
  "userName": "the user's name if mentioned (e.g., 'My name is John' or 'Call me Sarah'), or null if not mentioned",
  "interests": ["array of topics the user is interested in"],
  "courseInfo": "course name or null",
  "studyGoals": ["array of study goals mentioned"],
  "communicationStyle": "friendly/professional/casual",
  "contextNotes": "brief summary of important context about this user"
}

Conversation:
${conversationText}

Only return valid JSON, no other text.`;

    const aiResponse = await callAI(extractionPrompt, {
      systemPrompt: 'You are an expert at extracting user information from conversations. Return only valid JSON.',
      maxTokens: 500,
      temperature: 0.3
    });
    
    // Parse AI response
    let extractedInfo = {};
    try {
      // Try to extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedInfo = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.warn('Failed to parse AI extraction:', parseError);
    }
    
    // Update profile with extracted information
    const updates = {
      lastUpdated: serverTimestamp()
    };
    
    // Extract and store user name if mentioned
    // Save to both userProfiles collection AND users collection (main profile)
    if (extractedInfo.userName && extractedInfo.userName.trim()) {
      const userName = extractedInfo.userName.trim();
      updates.userName = userName;
      
      // Also update the user's main profile in users collection
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          name: userName,
          updatedAt: serverTimestamp()
        });
        console.log('Updated user name in main profile:', userName);
      } catch (userUpdateError) {
        console.warn('Could not update user name in main profile (may not have permission):', userUpdateError);
        // This is okay - Firestore rules might prevent it, but we still saved it in userProfiles
      }
    }
    
    if (extractedInfo.interests && extractedInfo.interests.length > 0) {
      updates.interests = [...new Set([
        ...(currentProfile?.interests || []),
        ...extractedInfo.interests
      ])].slice(0, 10); // Limit to 10 interests
    }
    
    if (extractedInfo.courseInfo) {
      updates.courseInfo = extractedInfo.courseInfo;
    }
    
    if (extractedInfo.studyGoals && extractedInfo.studyGoals.length > 0) {
      updates.studyGoals = [...new Set([
        ...(currentProfile?.studyGoals || []),
        ...extractedInfo.studyGoals
      ])].slice(0, 5); // Limit to 5 goals
    }
    
    if (extractedInfo.communicationStyle) {
      updates['preferences.communicationStyle'] = extractedInfo.communicationStyle;
    }
    
    // Update context notes with smart summarization
    const existingContext = currentProfile?.context || '';
    
    // Get conversation summary from AI extraction (more efficient than storing full text)
    let conversationSummary = '';
    if (extractedInfo.contextNotes) {
      conversationSummary = extractedInfo.contextNotes;
    } else if (conversationMessages.length > 0) {
      // If no AI summary, create a brief summary
      const recentMessages = conversationMessages.slice(-4); // Last 4 messages
      conversationSummary = recentMessages
        .map(msg => `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`)
        .join(' | ');
    }
    
    // Build new context with date separator
    let newContext = existingContext;
    if (conversationSummary) {
      const datePrefix = `\n\n--- ${new Date().toLocaleDateString()} ---\n`;
      newContext = existingContext 
        ? `${existingContext}${datePrefix}${conversationSummary}`
        : `${datePrefix}${conversationSummary}`;
    }
    
    // Smart summarization: If context is getting long (>8000 chars), summarize it
    if (newContext.length > 8000) {
      try {
        // Use AI to summarize the old context while preserving important info
        const summarizePrompt = `Summarize this user context history into a concise format. Keep:
- User's name and key personal details
- Main interests and study goals
- Course information
- Important conversation patterns or preferences
- Recent key topics discussed

Return a brief summary (max 3000 characters) that preserves essential context:

Context to summarize:
${newContext.substring(0, 8000)}`;

        const summaryResponse = await callAI(summarizePrompt, {
          systemPrompt: 'You are an expert at condensing conversation context while preserving important information. Return only the summarized context, no extra text.',
          maxTokens: 1000,
          temperature: 0.3
        });
        
        // If summarization worked, use it; otherwise truncate
        if (summaryResponse && summaryResponse.trim().length > 100 && summaryResponse.trim().length < 5000) {
          newContext = `${summaryResponse.trim()}\n\n--- ${new Date().toLocaleDateString()} ---\n${conversationSummary || 'Recent conversation'}`;
        } else {
          // Fallback: Keep most recent 4000 chars + new summary
          newContext = `${newContext.slice(-4000)}\n\n--- ${new Date().toLocaleDateString()} ---\n${conversationSummary || 'Recent conversation'}`;
        }
      } catch (summaryError) {
        console.warn('Context summarization failed, truncating instead:', summaryError);
        // Fallback: Keep most recent 4000 chars + new summary
        newContext = `${newContext.slice(-4000)}\n\n--- ${new Date().toLocaleDateString()} ---\n${conversationSummary || 'Recent conversation'}`;
      }
    }
    
    // Final limit to 8000 characters
    if (newContext.length > 8000) {
      newContext = newContext.slice(-8000);
    }
    
    updates.context = newContext;
    
    // Store conversation summary
    updates.conversationHistory = [
      ...(currentProfile?.conversationHistory || []).slice(-9), // Keep last 9
      {
        date: new Date().toISOString(),
        summary: extractedInfo.contextNotes || 'Conversation occurred',
        messageCount: conversationMessages.length
      }
    ];
    
    await updateDoc(profileRef, updates);
  } catch (error) {
    console.error('Error updating profile from conversation:', error);
  }
};

/**
 * Get personalized system prompt for user
 */
export const getPersonalizedSystemPrompt = (userProfile, activeTab) => {
  if (!userProfile) {
    return activeTab === 'sistc' 
      ? 'You are a helpful SISTC AI Assistant.'
      : 'You are a helpful AI study assistant.';
  }
  
  const assistantName = userProfile.assistantName || 'AI Assistant';
  const context = userProfile.context || '';
  const interests = userProfile.interests || [];
  const courseInfo = userProfile.courseInfo || '';
  const studyGoals = userProfile.studyGoals || [];
  const commStyle = userProfile.preferences?.communicationStyle || 'friendly';
  
  let prompt = `You are ${assistantName}, a personalized AI assistant. `;
  
  if (activeTab === 'sistc') {
    prompt += 'You help with SISTC information. ';
  } else if (activeTab === 'study-tips') {
    prompt += 'You are an expert study coach. ';
  } else {
    prompt += 'You are a helpful tutor. ';
  }
  
  if (context) {
    prompt += `\n\nImportant context about this user: ${context}`;
  }
  
  if (courseInfo) {
    prompt += `\n\nThe user is studying: ${courseInfo}`;
  }
  
  if (interests.length > 0) {
    prompt += `\n\nUser interests: ${interests.join(', ')}`;
  }
  
  if (studyGoals.length > 0) {
    prompt += `\n\nUser study goals: ${studyGoals.join(', ')}`;
  }
  
  prompt += `\n\nCommunication style: ${commStyle}. Provide responses that match this style.`;
  prompt += '\n\nUse this context to provide personalized, relevant answers.';
  
  return prompt;
};

/**
 * Update assistant name
 */
export const updateAssistantName = async (userId, newName) => {
  if (!db || !userId || !newName) return;
  
  try {
    const profileRef = doc(db, 'userProfiles', userId);
    await updateDoc(profileRef, {
      assistantName: newName.trim(),
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating assistant name:', error);
    throw error;
  }
};
