/**
 * Input validation utilities
 * Comprehensive validation for all input types
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Is valid email
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate student email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Is valid student email
 */
export const isValidStudentEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  const emailLower = email.toLowerCase().trim();
  // Accept both old domain (@sistc.nsw.edu.au) and new domain (@sistc.app) for backward compatibility
  return emailLower.startsWith('s20') && 
         (emailLower.includes('@sistc.app') || emailLower.includes('@sistc.nsw.edu.au'));
};

/**
 * Validate admin email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Is valid admin email
 */
export const isValidAdminEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  const emailLower = email.toLowerCase().trim();
  return emailLower === 'admin@sistc.app';
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with isValid and errors
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate message text
 * @param {string} text - Message text
 * @param {number} maxLength - Maximum length
 * @returns {Object} - Validation result
 */
export const validateMessage = (text, maxLength = 5000) => {
  const errors = [];
  
  if (!text || typeof text !== 'string') {
    errors.push('Message cannot be empty');
  }
  
  if (text.trim().length === 0) {
    errors.push('Message cannot be empty');
  }
  
  if (text.length > maxLength) {
    errors.push(`Message must be less than ${maxLength} characters`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate file upload
 * @param {File} file - File to validate
 * @param {number} maxSize - Maximum size in bytes
 * @param {string[]} allowedTypes - Allowed MIME types
 * @returns {Object} - Validation result
 */
export const validateFile = (file, maxSize = 10 * 1024 * 1024, allowedTypes = []) => {
  const errors = [];
  
  if (!file) {
    errors.push('No file selected');
    return { isValid: false, errors };
  }
  
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
  }
  
  if (allowedTypes.length > 0 && !allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.slice(0, -1));
    }
    return file.type === type;
  })) {
    errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate name
 * @param {string} name - Name to validate
 * @returns {Object} - Validation result
 */
export const validateName = (name) => {
  const errors = [];
  
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Name is required');
  }
  
  if (name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  if (name.length > 100) {
    errors.push('Name must be less than 100 characters');
  }
  
  // Check for dangerous characters
  if (/[<>{}[\]\\\/]/.test(name)) {
    errors.push('Name contains invalid characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @returns {Object} - Validation result
 */
export const validatePhone = (phone) => {
  const errors = [];
  
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, errors: ['Phone number is required'] };
  }
  
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  if (!phoneRegex.test(phone)) {
    errors.push('Phone number contains invalid characters');
  }
  
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    errors.push('Phone number must be between 10 and 15 digits');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

