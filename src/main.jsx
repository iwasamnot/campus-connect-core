import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// CRITICAL: Import ALL context providers in main.jsx to ensure they're in main bundle
// Lazy components import hooks (useAuth, useToast, etc.) from these contexts
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx'
import { ToastProvider, useToast } from './context/ToastContext.jsx'
import { PresenceProvider } from './context/PresenceContext.jsx'
import { PreferencesProvider, usePreferences } from './context/PreferencesContext.jsx'
import { CallProvider, useCall } from './context/CallContext.jsx'
import ThemeWrapper from './components/ThemeWrapper.jsx'

// Keep references to prevent tree-shaking (contexts are used by lazy components)
// Note: We can't expose hooks via window (they're React hooks), but importing them here
// ensures the context modules are in the main bundle
if (false) {
  // This code never runs but ensures contexts are included in bundle
  console.log(useAuth, useTheme, useToast, usePreferences, useCall);
}
import ErrorBoundary from './components/ErrorBoundary.jsx'
// Import Logo in main bundle to prevent code-splitting issues with lazy-loaded components
// This ensures Logo is always available synchronously
import Logo, { Logo as LogoNamed } from './components/Logo.jsx'
import { registerLogo } from './utils/logoRegistry.js'

// CRITICAL: Import firebaseConfig in main.jsx to ensure it's in main bundle
// Lazy components import auth, db, etc. from firebaseConfig
import { auth, db, storage, functions } from './firebaseConfig.js'

// CRITICAL: Import ALL utility modules in main.jsx to prevent export errors
// This ensures ALL utilities are in main bundle before lazy components load
import { handleError } from './utils/errorHandler.js'
import { isAdminRole, isUserOnline } from './utils/helpers.js'
import { sanitizeFileName, sanitizeEmail, sanitizeText, sanitizeHTML } from './utils/sanitize.js'
import { validateFile, isValidStudentEmail, isValidAdminEmail, validatePassword, validateName, isValidEmail } from './utils/validation.js'
import { saveDraft, getDraft, clearDraft } from './utils/drafts.js'
import { exportMessagesToJSON, exportMessagesToCSV, exportMessagesToTXT } from './utils/export.js'
import { saveMessage } from './utils/saveMessage.js'
import { parseMarkdown, hasMarkdown } from './utils/markdown.js'
import notificationService from './utils/notifications.js'
import { checkToxicity } from './utils/toxicityChecker.js'
import { debounce } from './utils/debounce.js'
import { keyboard } from './utils/accessibility.js'
import { calculateVisibleRange, getVisibleItems, calculateTotalHeight, calculateOffset } from './utils/virtualScroll.js'
import { measureWebVitals, observePerformance } from './utils/webVitals.js'
import { getCurrentLanguage, setLanguage } from './utils/i18n.js'

// Register Logo in the registry so lazy-loaded components can access it
// Note: Logo is also registered in App.jsx, but we register it here too for safety
registerLogo(Logo);

// Keep reference to prevent tree-shaking (Logo is used by lazy-loaded components)
// Export it so it's available globally if needed
window.__LogoComponent = Logo
window.__LogoNamed = LogoNamed

// CRITICAL: Store ALL exports globally to prevent export errors
// Lazy components can access these via window if import fails
if (typeof window !== 'undefined') {
  // Firebase exports
  window.__firebaseAuth = auth;
  window.__firebaseDb = db;
  window.__firebaseStorage = storage;
  window.__firebaseFunctions = functions;
  
  // Utility exports - ALL utilities used by lazy components
  window.__handleError = handleError;
  window.__isAdminRole = isAdminRole;
  window.__isUserOnline = isUserOnline;
  window.__sanitizeFileName = sanitizeFileName;
  window.__sanitizeEmail = sanitizeEmail;
  window.__sanitizeText = sanitizeText;
  window.__sanitizeHTML = sanitizeHTML;
  window.__validateFile = validateFile;
  window.__isValidStudentEmail = isValidStudentEmail;
  window.__isValidAdminEmail = isValidAdminEmail;
  window.__validatePassword = validatePassword;
  window.__validateName = validateName;
  window.__isValidEmail = isValidEmail;
  window.__saveDraft = saveDraft;
  window.__getDraft = getDraft;
  window.__clearDraft = clearDraft;
  window.__exportMessagesToJSON = exportMessagesToJSON;
  window.__exportMessagesToCSV = exportMessagesToCSV;
  window.__exportMessagesToTXT = exportMessagesToTXT;
  window.__saveMessage = saveMessage;
  window.__parseMarkdown = parseMarkdown;
  window.__hasMarkdown = hasMarkdown;
  window.__notificationService = notificationService;
  window.__checkToxicity = checkToxicity;
  window.__debounce = debounce;
  window.__keyboard = keyboard;
  window.__calculateVisibleRange = calculateVisibleRange;
  window.__getVisibleItems = getVisibleItems;
  window.__calculateTotalHeight = calculateTotalHeight;
  window.__calculateOffset = calculateOffset;
}

// Ensure firebaseConfig is never tree-shaken
if (false) {
  // This code never runs but ensures firebaseConfig is included in bundle
  console.log(auth, db, storage, functions);
}
// Ensure Logo is always available - force inclusion in main bundle
const _logoRef = Logo;
const _logoNamedRef = LogoNamed;
if (false) {
  // This code never runs but ensures Logo is included in bundle
  console.log(_logoRef, _logoNamedRef);
}

// Initialize internationalization
if (typeof window !== 'undefined') {
  const currentLang = getCurrentLanguage();
  setLanguage(currentLang);
  
  // Listen for language changes
  window.addEventListener('languagechange', () => {
    // Re-initialize on language change
    const newLang = getCurrentLanguage();
    setLanguage(newLang);
  });
}

// Measure Core Web Vitals for performance monitoring
if (typeof window !== 'undefined') {
  // Measure Web Vitals after page load
  window.addEventListener('load', () => {
    measureWebVitals();
    observePerformance();
  });
}

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // VitePWA plugin will auto-register, but we can add custom handling here
    navigator.serviceWorker.ready.then((registration) => {
      console.log('Service Worker ready');
      
      // Register background sync for offline actions
      try {
        if (registration && 'sync' in registration) {
          // Background sync is available
          console.log('Background Sync API available');
        }
        
        // Register periodic background sync for cache updates
        if (registration && 'periodicSync' in registration) {
          // Periodic sync is available
          console.log('Periodic Background Sync API available');
        }
      } catch (error) {
        // Background sync APIs might not be supported
        console.log('Background Sync APIs not available:', error.message);
      }
    }).catch(err => {
      console.error('Service Worker registration failed:', err);
    });
  });
}

// Remove loading fallback when React mounts
const rootElement = document.getElementById('root');
const loadingFallback = document.getElementById('loading-fallback');
if (loadingFallback) {
  loadingFallback.style.display = 'none';
}

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', function(e) {
  console.error('Unhandled promise rejection:', e.reason);
  
  // Check if it's a ZEGOCLOUD token error
  const errorMessage = e.reason?.message || String(e.reason || '');
  if (errorMessage.includes('substring') || errorMessage.includes('token') || errorMessage.includes('ZEGOCLOUD')) {
    console.warn('⚠️ ZEGOCLOUD token error detected. This usually means token-less mode is not enabled or token generation is required.');
    console.warn('💡 Solution: Enable token-less mode in ZEGOCLOUD Console OR implement server-side token generation.');
    // Don't prevent default - let it be handled by CallContext error handler
  }
  
  // Don't show error UI here - let ErrorBoundary handle it
  // But we can prevent the error from showing in console if it's expected
  if (errorMessage.includes('substring') && errorMessage.includes('null')) {
    // This is the known ZEGOCLOUD token issue - suppress noisy error
    e.preventDefault();
  }
});

try {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ThemeProvider>
        <ErrorBoundary>
          <PreferencesProvider>
            <ThemeWrapper>
              <AuthProvider>
                <PresenceProvider>
                  <ToastProvider>
                    <CallProvider>
                      <App />
                    </CallProvider>
                  </ToastProvider>
                </PresenceProvider>
              </AuthProvider>
            </ThemeWrapper>
          </PreferencesProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </React.StrictMode>,
  );
} catch (error) {
  console.error('Failed to render React app:', error);
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: system-ui; max-width: 600px; margin: 50px auto;">
        <h1 style="color: #dc2626; margin-bottom: 16px;">⚠️ React Render Error</h1>
        <p style="color: #374151; margin-bottom: 12px;">${error.message || 'Unknown error occurred'}</p>
        <p style="color: #6b7280; margin-bottom: 20px;">Please check the browser console for more details.</p>
        <button onclick="window.location.reload()" style="background: #4f46e5; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer;">
          Reload Page
        </button>
      </div>
    `;
  }
}

