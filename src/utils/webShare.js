/**
 * Web Share API Utilities
 * Modern web standard for native sharing
 */

/**
 * Check if Web Share API is supported
 */
export const isWebShareSupported = () => {
  return typeof navigator !== 'undefined' && 'share' in navigator;
};

/**
 * Share content using Web Share API
 * Falls back to clipboard copy if not supported
 * 
 * @param {Object} shareData - Data to share
 * @param {string} shareData.title - Title of shared content
 * @param {string} shareData.text - Text content
 * @param {string} shareData.url - URL to share
 * @returns {Promise<boolean>} - Success status
 */
export const shareContent = async ({ title, text, url }) => {
  if (isWebShareSupported()) {
    try {
      await navigator.share({
        title: title || 'CampusConnect',
        text: text || '',
        url: url || window.location.href
      });
      return true;
    } catch (error) {
      // User cancelled or error occurred
      if (error.name !== 'AbortError') {
        console.error('Share failed:', error);
      }
      return false;
    }
  } else {
    // Fallback: Copy to clipboard
    try {
      const shareText = [title, text, url].filter(Boolean).join('\n');
      await navigator.clipboard.writeText(shareText);
      return true;
    } catch (error) {
      console.error('Clipboard copy failed:', error);
      return false;
    }
  }
};

/**
 * Share a message
 */
export const shareMessage = async (messageText, messageId) => {
  const url = `${window.location.origin}${window.location.pathname}?message=${messageId}`;
  return await shareContent({
    title: 'Check out this message on CampusConnect',
    text: messageText,
    url: url
  });
};

/**
 * Share a group
 */
export const shareGroup = async (groupName, groupId) => {
  const url = `${window.location.origin}${window.location.pathname}?group=${groupId}`;
  return await shareContent({
    title: `Join ${groupName} on CampusConnect`,
    text: `Join ${groupName} on CampusConnect`,
    url: url
  });
};

export default {
  isWebShareSupported,
  shareContent,
  shareMessage,
  shareGroup
};

