/**
 * Message drafts utility
 * Uses localStorage to persist drafts
 */

const DRAFT_KEY_PREFIX = 'chat_draft_';

/**
 * Save a draft message
 * @param {string} chatId - Chat ID (e.g., 'global', 'private_chat_123')
 * @param {string} text - Draft text
 */
export const saveDraft = (chatId, text) => {
  try {
    const key = `${DRAFT_KEY_PREFIX}${chatId}`;
    if (text && text.trim()) {
      localStorage.setItem(key, text);
    } else {
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.error('Error saving draft:', error);
  }
};

/**
 * Get a draft message
 * @param {string} chatId - Chat ID
 * @returns {string} Draft text or empty string
 */
export const getDraft = (chatId) => {
  try {
    const key = `${DRAFT_KEY_PREFIX}${chatId}`;
    return localStorage.getItem(key) || '';
  } catch (error) {
    console.error('Error getting draft:', error);
    return '';
  }
};

/**
 * Clear a draft message
 * @param {string} chatId - Chat ID
 */
export const clearDraft = (chatId) => {
  try {
    const key = `${DRAFT_KEY_PREFIX}${chatId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing draft:', error);
  }
};

/**
 * Get all drafts
 * @returns {Object} Object with chatId as keys and drafts as values
 */
export const getAllDrafts = () => {
  const drafts = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(DRAFT_KEY_PREFIX)) {
        const chatId = key.replace(DRAFT_KEY_PREFIX, '');
        drafts[chatId] = localStorage.getItem(key);
      }
    }
  } catch (error) {
    console.error('Error getting all drafts:', error);
  }
  return drafts;
};

