/**
 * Modern Clipboard API Utilities
 * Follows W3C Clipboard API standards
 */

/**
 * Check if Clipboard API is supported
 */
export const isClipboardSupported = () => {
  return typeof navigator !== 'undefined' && 'clipboard' in navigator && 'writeText' in navigator.clipboard;
};

/**
 * Copy text to clipboard using modern Clipboard API
 * Falls back to legacy method if not supported
 * 
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
export const copyToClipboard = async (text) => {
  if (!text) {
    console.warn('No text provided to copy');
    return false;
  }
  
  if (isClipboardSupported()) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Clipboard API failed:', error);
      // Fallback to legacy method
      return fallbackCopyToClipboard(text);
    }
  } else {
    // Fallback to legacy method
    return fallbackCopyToClipboard(text);
  }
};

/**
 * Read text from clipboard using modern Clipboard API
 * 
 * @returns {Promise<string|null>} - Clipboard text or null
 */
export const readFromClipboard = async () => {
  if (!isClipboardSupported()) {
    console.warn('Clipboard API not supported');
    return null;
  }
  
  try {
    // Check if clipboard read permission is granted
    if (navigator.permissions) {
      const { state } = await navigator.permissions.query({ name: 'clipboard-read' });
      if (state === 'denied') {
        console.warn('Clipboard read permission denied');
        return null;
      }
    }
    
    const text = await navigator.clipboard.readText();
    return text;
  } catch (error) {
    console.error('Clipboard read failed:', error);
    return null;
  }
};

/**
 * Fallback method for older browsers
 */
const fallbackCopyToClipboard = (text) => {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    return successful;
  } catch (error) {
    console.error('Fallback clipboard copy failed:', error);
    return false;
  }
};

/**
 * Copy image to clipboard (when supported)
 */
export const copyImageToClipboard = async (imageBlob) => {
  if (!isClipboardSupported() || !navigator.clipboard.write) {
    console.warn('Image clipboard API not supported');
    return false;
  }
  
  try {
    const clipboardItem = new ClipboardItem({ 'image/png': imageBlob });
    await navigator.clipboard.write([clipboardItem]);
    return true;
  } catch (error) {
    console.error('Image clipboard copy failed:', error);
    return false;
  }
};

export default {
  isClipboardSupported,
  copyToClipboard,
  readFromClipboard,
  copyImageToClipboard
};

