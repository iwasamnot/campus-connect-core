/**
 * UI Standardizer Component
 * Ensures all components follow modern UI standards
 * This is a development/testing tool
 */

import { useEffect } from 'react';

const UIStandardizer = () => {
  useEffect(() => {
    // Add global styles for consistency
    const style = document.createElement('style');
    style.textContent = `
      /* Ensure consistent button sizes */
      button:not(.custom-button) {
        min-height: 44px;
        min-width: 44px;
      }
      
      /* Consistent focus states */
      *:focus-visible {
        outline: 2px solid #6366f1;
        outline-offset: 2px;
      }
      
      /* Consistent transitions */
      button, a, input, select {
        transition: all 0.2s ease;
      }
      
      /* Ensure proper touch targets on mobile */
      @media (max-width: 768px) {
        button, a, [role="button"] {
          min-height: 44px;
          min-width: 44px;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return null;
};

export default UIStandardizer;
