/**
 * Native Optimizations Utilities
 * Helper functions for native feel optimizations
 */

/**
 * Check if device is mobile/touch
 */
export const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * Check if running in Capacitor/WebView
 */
export const isCapacitor = () => {
  return typeof window !== 'undefined' && window.Capacitor !== undefined;
};

/**
 * Check if running in PWA/standalone mode
 */
export const isStandalone = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator.standalone === true) ||
         document.referrer.includes('android-app://');
};

/**
 * Apply native optimizations on mount
 */
export const applyNativeOptimizations = () => {
  if (typeof window === 'undefined') return;

  // Disable text selection on non-input elements
  document.addEventListener('selectstart', (e) => {
    const target = e.target;
    if (target.tagName !== 'INPUT' && 
        target.tagName !== 'TEXTAREA' && 
        !target.isContentEditable) {
      e.preventDefault();
    }
  }, { passive: false });

  // Disable context menu on long press (except for images/links)
  document.addEventListener('contextmenu', (e) => {
    const target = e.target;
    if (target.tagName !== 'IMG' && 
        target.tagName !== 'A' && 
        !target.closest('a') &&
        !target.closest('img')) {
      e.preventDefault();
    }
  });

  // Force GPU acceleration for all transforms
  const style = document.createElement('style');
  style.textContent = `
    /* Force GPU acceleration for all animated elements */
    [class*="animate-"],
    [class*="motion-"],
    .gpu-accelerated {
      transform: translate3d(0, 0, 0);
      will-change: transform, opacity;
      backface-visibility: hidden;
    }
    
    /* Ensure modals and slide-out menus use transform */
    [class*="modal"],
    [class*="drawer"],
    [class*="sidebar"],
    [class*="menu"] {
      transform: translate3d(0, 0, 0);
    }
  `;
  document.head.appendChild(style);
};

/**
 * Get safe area insets
 */
export const getSafeAreaInsets = () => {
  if (typeof window === 'undefined') {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }

  const style = getComputedStyle(document.documentElement);
  return {
    top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0', 10),
    bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0', 10),
    left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0', 10),
    right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0', 10)
  };
};
