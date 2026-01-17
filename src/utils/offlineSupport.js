/**
 * Offline Support Utilities
 * Handles offline detection, caching, and sync
 */

/**
 * Check if app is currently online
 */
export const isOnline = () => {
  return typeof navigator !== 'undefined' && navigator.onLine;
};

/**
 * Get network status information
 */
export const getNetworkStatus = () => {
  if (typeof navigator === 'undefined') {
    return { online: false, type: 'unknown' };
  }

  const connection = navigator.connection || 
                    navigator.mozConnection || 
                    navigator.webkitConnection;

  return {
    online: navigator.onLine,
    effectiveType: connection?.effectiveType || 'unknown',
    downlink: connection?.downlink || 0,
    rtt: connection?.rtt || 0,
    saveData: connection?.saveData || false,
  };
};

/**
 * Listen for online/offline status changes
 */
export const onNetworkStatusChange = (callback) => {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => callback({ online: true, ...getNetworkStatus() });
  const handleOffline = () => callback({ online: false, ...getNetworkStatus() });

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Also listen for connection changes
  const connection = navigator.connection || 
                    navigator.mozConnection || 
                    navigator.webkitConnection;
  
  if (connection) {
    connection.addEventListener('change', () => {
      callback(getNetworkStatus());
    });
  }

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    if (connection) {
      connection.removeEventListener('change', () => {});
    }
  };
};

/**
 * Store data in IndexedDB for offline access
 */
export const storeOffline = async (store, key, data) => {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    // Fallback to localStorage
    try {
      localStorage.setItem(`offline_${store}_${key}`, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
      return true;
    } catch (e) {
      console.error('Error storing offline data:', e);
      return false;
    }
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CampusConnectDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(store)) {
        // Create object store if it doesn't exist
        const transaction = db.transaction([store], 'readwrite');
        const objectStore = transaction.objectStore.createObjectStore(store, { keyPath: 'id' });
        transaction.oncomplete = () => {
          const tx = db.transaction([store], 'readwrite');
          const storeObj = tx.objectStore(store);
          const putRequest = storeObj.put({
            id: key,
            data,
            timestamp: Date.now(),
          });
          putRequest.onsuccess = () => resolve(true);
          putRequest.onerror = () => reject(putRequest.error);
        };
      } else {
        const tx = db.transaction([store], 'readwrite');
        const storeObj = tx.objectStore(store);
        const putRequest = storeObj.put({
          id: key,
          data,
          timestamp: Date.now(),
        });
        putRequest.onsuccess = () => resolve(true);
        putRequest.onerror = () => reject(putRequest.error);
      }
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(store)) {
        db.createObjectStore(store, { keyPath: 'id' });
      }
    };
  });
};

/**
 * Retrieve data from IndexedDB for offline access
 */
export const getOffline = async (store, key) => {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    // Fallback to localStorage
    try {
      const item = localStorage.getItem(`offline_${store}_${key}`);
      return item ? JSON.parse(item).data : null;
    } catch (e) {
      console.error('Error retrieving offline data:', e);
      return null;
    }
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CampusConnectDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(store)) {
        resolve(null);
        return;
      }

      const tx = db.transaction([store], 'readonly');
      const storeObj = tx.objectStore(store);
      const getRequest = storeObj.get(key);

      getRequest.onsuccess = () => {
        resolve(getRequest.result?.data || null);
      };
      getRequest.onerror = () => reject(getRequest.error);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(store)) {
        db.createObjectStore(store, { keyPath: 'id' });
      }
    };
  });
};

/**
 * Queue message for offline sync
 */
export const queueOfflineMessage = async (message) => {
  const queue = await getOffline('pendingMessages', 'queue') || [];
  queue.push({
    ...message,
    queuedAt: Date.now(),
    synced: false,
  });
  await storeOffline('pendingMessages', 'queue', queue);
};

/**
 * Get queued messages for sync
 */
export const getQueuedMessages = async () => {
  return await getOffline('pendingMessages', 'queue') || [];
};

/**
 * Clear synced messages from queue
 */
export const clearSyncedMessages = async () => {
  const queue = await getQueuedMessages();
  const pending = queue.filter(msg => !msg.synced);
  await storeOffline('pendingMessages', 'queue', pending);
};

/**
 * Cache messages for offline viewing
 */
export const cacheMessages = async (messages) => {
  await storeOffline('messages', 'cached', messages);
};

/**
 * Get cached messages for offline viewing
 */
export const getCachedMessages = async () => {
  return await getOffline('messages', 'cached') || [];
};

export default {
  isOnline,
  getNetworkStatus,
  onNetworkStatusChange,
  storeOffline,
  getOffline,
  queueOfflineMessage,
  getQueuedMessages,
  clearSyncedMessages,
  cacheMessages,
  getCachedMessages,
};
