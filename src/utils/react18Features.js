/**
 * React 18.3+ Modern Features Utilities
 * useTransition, useDeferredValue, and other modern React patterns
 */

import { useTransition, useDeferredValue, useId, useSyncExternalStore, startTransition } from 'react';

/**
 * Hook for managing non-urgent updates with useTransition
 * Improves perceived performance by marking updates as non-urgent
 */
export const useNonUrgentUpdate = () => {
  const [isPending, startTransitionFn] = useTransition();
  
  const scheduleUpdate = (updateFn) => {
    startTransitionFn(() => {
      updateFn();
    });
  };
  
  return { isPending, scheduleUpdate };
};

/**
 * Hook for deferring value updates
 * Useful for search inputs and filtering
 */
export const useDeferredState = (value) => {
  return useDeferredValue(value);
};

/**
 * Hook for generating unique IDs (accessibility)
 */
export const useUniqueId = (prefix = 'id') => {
  const id = useId();
  return `${prefix}-${id}`;
};

/**
 * Hook for syncing with external stores (React 18+)
 * Useful for syncing with browser APIs, third-party libraries, etc.
 */
export const useBrowserStorage = (key, initialValue) => {
  const subscribe = (callback) => {
    const handleStorageChange = (e) => {
      if (e.key === key || !e.key) {
        callback();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  };
  
  const getSnapshot = () => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  };
  
  const getServerSnapshot = () => initialValue;
  
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};

/**
 * Utility to wrap updates in startTransition
 * Marks updates as non-urgent for better performance
 */
export const nonUrgentUpdate = (updateFn) => {
  startTransition(updateFn);
};

export default {
  useNonUrgentUpdate,
  useDeferredState,
  useUniqueId,
  useBrowserStorage,
  nonUrgentUpdate
};

