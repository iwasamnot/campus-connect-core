/**
 * Accessibility utilities for keyboard navigation and screen readers
 */

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Trap focus within an element
   * @param {HTMLElement} element - Element to trap focus in
   * @param {HTMLElement} firstFocusable - First focusable element
   * @param {HTMLElement} lastFocusable - Last focusable element
   */
  trapFocus: (element, firstFocusable, lastFocusable) => {
    const handleTab = (e) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };
    
    element.addEventListener('keydown', handleTab);
    
    return () => {
      element.removeEventListener('keydown', handleTab);
    };
  },
  
  /**
   * Focus first focusable element in container
   * @param {HTMLElement} container - Container element
   */
  focusFirst: (container) => {
    const focusable = container.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();
  },
  
  /**
   * Restore focus to previous element
   * @param {HTMLElement} element - Element to restore focus to
   */
  restoreFocus: (element) => {
    element?.focus();
  }
};

/**
 * ARIA utilities
 */
export const aria = {
  /**
   * Announce message to screen readers
   * @param {string} message - Message to announce
   * @param {string} priority - Priority: 'polite' or 'assertive'
   */
  announce: (message, priority = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },
  
  /**
   * Get ARIA label for button
   * @param {string} action - Action description
   * @param {string} context - Context (optional)
   * @returns {string} - ARIA label
   */
  getButtonLabel: (action, context = '') => {
    return context ? `${action} ${context}` : action;
  }
};

/**
 * Keyboard navigation utilities
 */
export const keyboard = {
  /**
   * Check if key is Enter
   * @param {KeyboardEvent} e - Keyboard event
   * @returns {boolean}
   */
  isEnter: (e) => e.key === 'Enter' || e.keyCode === 13,
  
  /**
   * Check if key is Escape
   * @param {KeyboardEvent} e - Keyboard event
   * @returns {boolean}
   */
  isEscape: (e) => e.key === 'Escape' || e.keyCode === 27,
  
  /**
   * Check if key is Tab
   * @param {KeyboardEvent} e - Keyboard event
   * @returns {boolean}
   */
  isTab: (e) => e.key === 'Tab' || e.keyCode === 9,
  
  /**
   * Check if key is Arrow Up
   * @param {KeyboardEvent} e - Keyboard event
   * @returns {boolean}
   */
  isArrowUp: (e) => e.key === 'ArrowUp' || e.keyCode === 38,
  
  /**
   * Check if key is Arrow Down
   * @param {KeyboardEvent} e - Keyboard event
   * @returns {boolean}
   */
  isArrowDown: (e) => e.key === 'ArrowDown' || e.keyCode === 40,
  
  /**
   * Handle keyboard navigation in list
   * @param {KeyboardEvent} e - Keyboard event
   * @param {number} currentIndex - Current index
   * @param {number} totalItems - Total items
   * @param {Function} onSelect - Callback when item is selected
   * @returns {number|null} - New index or null
   */
  navigateList: (e, currentIndex, totalItems, onSelect) => {
    if (keyboard.isArrowDown(e)) {
      e.preventDefault();
      const nextIndex = currentIndex < totalItems - 1 ? currentIndex + 1 : 0;
      return nextIndex;
    }
    
    if (keyboard.isArrowUp(e)) {
      e.preventDefault();
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : totalItems - 1;
      return prevIndex;
    }
    
    if (keyboard.isEnter(e)) {
      e.preventDefault();
      onSelect?.(currentIndex);
      return currentIndex;
    }
    
    return null;
  }
};

/**
 * Screen reader only class (for visually hidden but accessible content)
 */
export const srOnly = 'sr-only';

