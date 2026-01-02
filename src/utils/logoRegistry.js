// Logo Registry - ensures Logo is always available for lazy-loaded components
// This prevents "Export 'Logo' is not defined" errors
// CRITICAL: This file must be in the main bundle, not code-split

import React from 'react';

let LogoComponent = null;

// Function to register Logo component (called from main bundle)
export const registerLogo = (Logo) => {
  LogoComponent = Logo;
  if (typeof window !== 'undefined') {
    window.__LogoComponent = Logo;
    window.__LogoRegistry = { registerLogo, getLogo };
  }
};

// Function to get Logo component (used by lazy-loaded components)
export const getLogo = () => {
  // First check registered component
  if (LogoComponent) {
    return LogoComponent;
  }
  // Fallback to window if available
  if (typeof window !== 'undefined' && window.__LogoComponent) {
    return window.__LogoComponent;
  }
  // Last resort: return a simple placeholder
  return () => React.createElement('div', null, 'Logo');
};

// Default export for convenience
export default getLogo;

// Ensure this module is never tree-shaken
if (typeof window !== 'undefined') {
  window.__logoRegistryLoaded = true;
}

