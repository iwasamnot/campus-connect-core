/**
 * Advanced error handling utilities
 * Provides consistent error handling across the application
 */

/**
 * Error types
 */
export const ErrorTypes = {
  NETWORK: 'NETWORK',
  AUTH: 'AUTH',
  VALIDATION: 'VALIDATION',
  PERMISSION: 'PERMISSION',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMIT: 'RATE_LIMIT',
  UNKNOWN: 'UNKNOWN'
};

/**
 * Get user-friendly error message
 * @param {Error} error - Error object
 * @returns {string} - User-friendly error message
 */
export const getErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred. Please try again.';
  
  // Firebase Auth errors
  if (error.code) {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please login instead.';
      case 'auth/invalid-email':
        return 'Invalid email address. Please check your email format.';
      case 'auth/user-not-found':
        return 'No account found with this email. Please create an account first.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'auth/invalid-login-credentials':
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use a stronger password.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'auth/email-not-verified':
        return 'Please verify your email address before logging in.';
      
      // Firestore errors
      case 'permission-denied':
        return 'You do not have permission to perform this action.';
      case 'not-found':
        return 'The requested resource was not found.';
      case 'resource-exhausted':
        return 'Service temporarily unavailable. Please try again later.';
      case 'failed-precondition':
        return 'A required index is missing. Please contact support.';
      case 'unavailable':
        return 'Service is temporarily unavailable. Please try again later.';
      case 'deadline-exceeded':
        return 'Request timed out. Please try again.';
      
      default:
        return error.message || 'An error occurred. Please try again.';
    }
  }
  
  // Network errors
  if (error.message && error.message.includes('network')) {
    return 'Network error. Please check your internet connection.';
  }
  
  // Generic error message
  return error.message || 'An unexpected error occurred. Please try again.';
};

/**
 * Get error type from error object
 * @param {Error} error - Error object
 * @returns {string} - Error type
 */
export const getErrorType = (error) => {
  if (!error) return ErrorTypes.UNKNOWN;
  
  if (error.code) {
    if (error.code.startsWith('auth/')) {
      return ErrorTypes.AUTH;
    }
    if (error.code === 'permission-denied') {
      return ErrorTypes.PERMISSION;
    }
    if (error.code === 'not-found') {
      return ErrorTypes.NOT_FOUND;
    }
    if (error.code === 'resource-exhausted' || error.code === 'too-many-requests') {
      return ErrorTypes.RATE_LIMIT;
    }
  }
  
  if (error.message && error.message.includes('network')) {
    return ErrorTypes.NETWORK;
  }
  
  if (error.message && error.message.includes('validation')) {
    return ErrorTypes.VALIDATION;
  }
  
  return ErrorTypes.UNKNOWN;
};

/**
 * Check if error is retryable
 * @param {Error} error - Error object
 * @returns {boolean} - Is retryable
 */
export const isRetryableError = (error) => {
  if (!error) return false;
  
  const retryableCodes = [
    'network-request-failed',
    'unavailable',
    'deadline-exceeded',
    'resource-exhausted'
  ];
  
  if (error.code && retryableCodes.some(code => error.code.includes(code))) {
    return true;
  }
  
  if (error.message && error.message.includes('network')) {
    return true;
  }
  
  return false;
};

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum retries
 * @param {number} initialDelay - Initial delay in ms
 * @returns {Promise} - Result of function
 */
export const retryWithBackoff = async (fn, maxRetries = 3, initialDelay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries && isRetryableError(error)) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError;
};

/**
 * Handle error with logging
 * @param {Error} error - Error object
 * @param {string} context - Error context
 * @param {Function} onError - Error callback
 */
export const handleError = (error, context = '', onError = null) => {
  const errorMessage = getErrorMessage(error);
  const errorType = getErrorType(error);
  
  // Log error for debugging
  console.error(`[${context}] Error:`, {
    message: error.message,
    code: error.code,
    type: errorType,
    stack: error.stack
  });
  
  // Call error handler if provided
  if (onError) {
    onError(errorMessage, errorType);
  }
  
  return { message: errorMessage, type: errorType };
};

