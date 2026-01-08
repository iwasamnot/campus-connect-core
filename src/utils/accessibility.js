/**
 * Accessibility utilities for keyboard navigation and screen readers
 * WCAG 2.2 AA compliance utilities
 */

/**
 * Focus management utilities (WCAG 2.1 SC 2.4.3, 2.4.7)
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
 * ARIA utilities (WCAG 2.1 SC 4.1.2)
 */
export const aria = {
  /**
   * Announce message to screen readers (WCAG 2.1 SC 4.1.3)
   * @param {string} message - Message to announce
   * @param {string} priority - Priority: 'polite' or 'assertive'
   */
  announce: (message, priority = 'polite') => {
    if (typeof document === 'undefined') return;
    
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  },
  
  /**
   * Get ARIA label for button (WCAG 2.1 SC 4.1.2)
   * @param {string} action - Action description
   * @param {string} context - Context (optional)
   * @returns {string} - ARIA label
   */
  getButtonLabel: (action, context = '') => {
    return context ? `${action} ${context}` : action;
  },
  
  /**
   * Create ARIA label for icon-only buttons (WCAG 2.1 SC 4.1.2)
   * @param {string} action - Action description
   * @returns {object} - ARIA attributes object
   */
  getIconButtonProps: (action) => ({
    'aria-label': action,
    'role': 'button',
    'tabIndex': 0
  }),
  
  /**
   * Get ARIA description for complex controls
   * @param {string} description - Description text
   * @param {string} id - Unique ID for describedby
   * @returns {object} - ARIA attributes
   */
  getDescribedBy: (description, id) => {
    if (!description) return {};
    
    const descId = `desc-${id}`;
    return {
      'aria-describedby': descId,
      descriptionId: descId,
      description
    };
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

