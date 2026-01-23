/**
 * Native Touch Hook
 * Provides instant visual feedback for touch interactions
 * Fixes iOS Safari's :active state issues by adding .is-active class
 */

import { useRef, useCallback } from 'react';

/**
 * Hook to add native-like touch feedback
 * @param {Object} options - Configuration options
 * @param {boolean} options.disabled - Disable the hook
 * @returns {Object} - Touch event handlers
 */
export const useNativeTouch = (options = {}) => {
  const { disabled = false } = options;
  const timeoutRef = useRef(null);
  const elementRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (disabled) return;
    
    const target = e.currentTarget;
    elementRef.current = target;
    
    // Add active class immediately
    target.classList.add('is-active');
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [disabled]);

  const handleTouchEnd = useCallback((e) => {
    if (disabled) return;
    
    const target = elementRef.current || e.currentTarget;
    
    // Remove active class after a short delay for visual feedback
    timeoutRef.current = setTimeout(() => {
      target.classList.remove('is-active');
      elementRef.current = null;
    }, 150);
  }, [disabled]);

  const handleTouchCancel = useCallback((e) => {
    if (disabled) return;
    
    const target = elementRef.current || e.currentTarget;
    target.classList.remove('is-active');
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    elementRef.current = null;
  }, [disabled]);

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel
  };
};

/**
 * Higher-order component to add native touch to any component
 */
export const withNativeTouch = (Component) => {
  return function NativeTouchComponent(props) {
    const touchHandlers = useNativeTouch();
    return <Component {...props} {...touchHandlers} />;
  };
};
