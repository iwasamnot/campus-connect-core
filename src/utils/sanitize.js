/**
 * Input sanitization utilities for XSS protection
 * Sanitizes user input to prevent XSS attacks
 */

/**
 * Sanitize HTML string to prevent XSS
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeHTML = (str) => {
  if (typeof str !== 'string') return '';
  
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

/**
 * Sanitize text input (removes HTML tags)
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized text
 */
export const sanitizeText = (input) => {
  if (typeof input !== 'string') return '';
  
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  return sanitized.trim();
};

/**
 * Sanitize email input
 * @param {string} email - Email to sanitize
 * @returns {string} - Sanitized email
 */
export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return '';
  
  // Remove whitespace and convert to lowercase
  let sanitized = email.trim().toLowerCase();
  
  // Remove any HTML tags
  sanitized = sanitizeText(sanitized);
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return '';
  }
  
  return sanitized;
};

/**
 * Sanitize file name to prevent path traversal
 * @param {string} fileName - File name to sanitize
 * @returns {string} - Sanitized file name
 */
export const sanitizeFileName = (fileName) => {
  if (typeof fileName !== 'string') return 'file';
  
  // Remove path separators and dangerous characters
  let sanitized = fileName
    .replace(/[\/\\]/g, '_') // Replace path separators
    .replace(/[<>:"|?*]/g, '_') // Replace dangerous characters
    .replace(/\.\./g, '_') // Replace parent directory references
    .trim();
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'));
    sanitized = sanitized.substring(0, 255 - ext.length) + ext;
  }
  
  return sanitized || 'file';
};

/**
 * Validate and sanitize message text
 * @param {string} text - Message text
 * @param {number} maxLength - Maximum length (default: 5000)
 * @returns {string} - Sanitized message text
 */
export const sanitizeMessage = (text, maxLength = 5000) => {
  if (typeof text !== 'string') return '';
  
  let sanitized = sanitizeText(text);
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
};

