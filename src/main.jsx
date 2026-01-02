import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { PresenceProvider } from './context/PresenceContext.jsx'
import { PreferencesProvider } from './context/PreferencesContext.jsx'
import { CallProvider } from './context/CallContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
// Import Logo in main bundle to prevent code-splitting issues with lazy-loaded components
// This ensures Logo is always available synchronously
import Logo, { Logo as LogoNamed } from './components/Logo.jsx'
// Keep reference to prevent tree-shaking (Logo is used by lazy-loaded components)
// Export it so it's available globally if needed
window.__LogoComponent = Logo
window.__LogoNamed = LogoNamed
// Ensure Logo is always available - force inclusion in main bundle
const _logoRef = Logo;
const _logoNamedRef = LogoNamed;
if (false) {
  // This code never runs but ensures Logo is included in bundle
  console.log(_logoRef, _logoNamedRef);
}

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // VitePWA plugin will auto-register, but we can add custom handling here
    navigator.serviceWorker.ready.then(() => {
      console.log('Service Worker ready');
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
            <AuthProvider>
              <PresenceProvider>
                <ToastProvider>
                  <CallProvider>
                    <App />
                  </CallProvider>
                </ToastProvider>
              </PresenceProvider>
            </AuthProvider>
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

