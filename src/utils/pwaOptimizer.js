/**
 * PWA Optimization Utilities
 * Handles PWA updates, caching, and performance optimizations
 */

/**
 * Register service worker update handler
 * ✅ FIX: Improved service worker update handling
 */
export const registerServiceWorkerUpdate = () => {
  if ('serviceWorker' in navigator) {
    // Listen for service worker updates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // New service worker activated - reload to get latest version
      console.log('[PWA] New service worker activated, reloading...');
      window.location.reload();
    });

    // Check for updates periodically (but don't create multiple intervals)
    if (!window.__pwaUpdateInterval) {
      window.__pwaUpdateInterval = setInterval(() => {
        navigator.serviceWorker.getRegistration().then(registration => {
          if (registration) {
            registration.update().catch(err => {
              console.warn('[PWA] Service worker update check failed:', err);
            });
          }
        });
      }, 60 * 60 * 1000); // Check every hour
    }

    // Also check for updates on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        navigator.serviceWorker.getRegistration().then(registration => {
          if (registration) {
            registration.update().catch(err => {
              console.warn('[PWA] Service worker update check failed:', err);
            });
          }
        });
      }
    });
  }
};

/**
 * Prefetch critical resources
 */
export const prefetchCriticalResources = () => {
  const criticalResources = [
    '/logo.png',
    '/src/main.jsx'
  ];

  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = resource;
    link.as = resource.endsWith('.js') || resource.endsWith('.jsx') ? 'script' : 'image';
    document.head.appendChild(link);
  });
};

/**
 * Optimize images for PWA
 */
export const optimizeImageForPWA = (imageUrl, options = {}) => {
  const { width, height, quality = 0.8 } = options;
  
  // If using Firebase Storage, add resize parameters
  if (imageUrl.includes('firebasestorage')) {
    const url = new URL(imageUrl);
    if (width) url.searchParams.set('width', width);
    if (height) url.searchParams.set('height', height);
    url.searchParams.set('quality', quality);
    return url.toString();
  }
  
  return imageUrl;
};

/**
 * Cache API responses for offline support
 */
export const cacheAPIResponse = async (url, data) => {
  if ('caches' in window) {
    const cache = await caches.open('api-cache-v1');
    const response = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put(url, response);
  }
};

/**
 * Get cached API response
 */
export const getCachedAPIResponse = async (url) => {
  if ('caches' in window) {
    const cache = await caches.open('api-cache-v1');
    const cached = await cache.match(url);
    if (cached) {
      return await cached.json();
    }
  }
  return null;
};

/**
 * Clear old caches
 */
export const clearOldCaches = async () => {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name => 
      name.includes('campusconnect') && 
      !name.includes('v1') && 
      !name.includes('v8.3.0')
    );
    
    await Promise.all(oldCaches.map(name => caches.delete(name)));
    console.log(`[PWA] Cleared ${oldCaches.length} old cache(s)`);
  }
};

/**
 * Get cache storage usage
 */
export const getCacheStorageUsage = async () => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      quota: estimate.quota,
      usage: estimate.usage,
      usageDetails: estimate.usageDetails
    };
  }
  return null;
};

/**
 * Request persistent storage
 */
export const requestPersistentStorage = async () => {
  if ('storage' in navigator && 'persist' in navigator.storage) {
    const isPersistent = await navigator.storage.persist();
    if (isPersistent) {
      console.log('[PWA] Persistent storage granted');
    } else {
      console.warn('[PWA] Persistent storage denied');
    }
    return isPersistent;
  }
  return false;
};

/**
 * Initialize PWA optimizations
 */
export const initializePWAOptimizations = () => {
  // Register service worker updates
  registerServiceWorkerUpdate();
  
  // Prefetch critical resources
  prefetchCriticalResources();
  
  // Clear old caches on load
  clearOldCaches();
  
  // Request persistent storage
  requestPersistentStorage();
  
  // Monitor cache usage
  getCacheStorageUsage().then(usage => {
    if (usage) {
      const usageMB = (usage.usage / 1024 / 1024).toFixed(2);
      const quotaMB = (usage.quota / 1024 / 1024).toFixed(2);
      console.log(`[PWA] Cache usage: ${usageMB}MB / ${quotaMB}MB`);
    }
  });
};
