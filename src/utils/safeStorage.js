/**
 * Safe Storage Utility
 * Handles browser tracking prevention and storage access failures gracefully
 */

// Check if storage is available
const isStorageAvailable = (type = 'localStorage') => {
  try {
    const storage = window[type];
    const testKey = '__storage_test__';
    storage.setItem(testKey, 'test');
    storage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

// Safe localStorage wrapper
export const safeLocalStorage = {
  getItem: (key) => {
    try {
      if (!isStorageAvailable('localStorage')) {
        console.warn('⚠️ [SafeStorage] localStorage not available (tracking prevention)');
        return null;
      }
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('⚠️ [SafeStorage] Error reading from localStorage:', error);
      return null;
    }
  },

  setItem: (key, value) => {
    try {
      if (!isStorageAvailable('localStorage')) {
        console.warn('⚠️ [SafeStorage] localStorage not available (tracking prevention)');
        return false;
      }
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('⚠️ [SafeStorage] Error writing to localStorage:', error);
      return false;
    }
  },

  removeItem: (key) => {
    try {
      if (!isStorageAvailable('localStorage')) {
        return false;
      }
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('⚠️ [SafeStorage] Error removing from localStorage:', error);
      return false;
    }
  },

  clear: () => {
    try {
      if (!isStorageAvailable('localStorage')) {
        return false;
      }
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('⚠️ [SafeStorage] Error clearing localStorage:', error);
      return false;
    }
  }
};

// Safe sessionStorage wrapper
export const safeSessionStorage = {
  getItem: (key) => {
    try {
      if (!isStorageAvailable('sessionStorage')) {
        console.warn('⚠️ [SafeStorage] sessionStorage not available (tracking prevention)');
        return null;
      }
      return sessionStorage.getItem(key);
    } catch (error) {
      console.warn('⚠️ [SafeStorage] Error reading from sessionStorage:', error);
      return null;
    }
  },

  setItem: (key, value) => {
    try {
      if (!isStorageAvailable('sessionStorage')) {
        console.warn('⚠️ [SafeStorage] sessionStorage not available (tracking prevention)');
        return false;
      }
      sessionStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('⚠️ [SafeStorage] Error writing to sessionStorage:', error);
      return false;
    }
  },

  removeItem: (key) => {
    try {
      if (!isStorageAvailable('sessionStorage')) {
        return false;
      }
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('⚠️ [SafeStorage] Error removing from sessionStorage:', error);
      return false;
    }
  }
};

// In-memory fallback storage (when browser storage is blocked)
const memoryStorage = new Map();

export const memoryStorageFallback = {
  getItem: (key) => {
    return memoryStorage.get(key) || null;
  },
  setItem: (key, value) => {
    memoryStorage.set(key, value);
    return true;
  },
  removeItem: (key) => {
    memoryStorage.delete(key);
    return true;
  },
  clear: () => {
    memoryStorage.clear();
    return true;
  }
};
