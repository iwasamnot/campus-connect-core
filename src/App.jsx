import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import Sidebar from './components/Sidebar';
import CallModal from './components/CallModal';
import { isAdminRole } from './utils/helpers';
import { useState, useEffect, lazy, Suspense, useCallback, useMemo, useRef, startTransition } from 'react';
// Removed Menu import - using swipe gesture instead
import ErrorBoundary from './components/ErrorBoundary';
import { debounce } from './utils/debounce';
import { AnimatePresence, motion } from 'framer-motion';
import { AnimatedPage } from './components/AnimatedComponents';
// CRITICAL: Import firebaseConfig in main App to ensure it's in main bundle
// Lazy components import auth, db, etc. from firebaseConfig
import { auth, db } from './firebaseConfig';
// Ensure firebaseConfig is never tree-shaken
if (false) {
  // This code never runs but ensures firebaseConfig is included in bundle
  console.log(auth, db);
}
// CRITICAL: Import Logo in main App to ensure it's ALWAYS in the main bundle
// Lazy components use window.__LogoComponent directly (set in main.jsx)
// This prevents export errors when lazy-loaded components need Logo
import Logo from './components/Logo';

// Store Logo globally for lazy components (also set in main.jsx for redundancy)
// Lazy components access Logo via window.__LogoComponent to avoid import/export issues
if (typeof window !== 'undefined') {
  window.__AppLogo = Logo;
  window.__LogoComponent = Logo;
}

// Error fallback component with retry logic
const ErrorFallback = ({ componentName, onRetry }) => {
  const [retrying, setRetrying] = useState(false);
  
  const handleRetry = () => {
    setRetrying(true);
    // Clear module cache and retry
    if (onRetry) {
      onRetry();
    } else {
      // Force reload after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <div className="text-center max-w-md glass-panel border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl">
        <div className="text-red-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2 text-glow">
          Unable to Load {componentName}
        </h3>
        <p className="text-white/60 mb-4">
          There was an error loading this component. This might be a temporary network issue.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg hover:shadow-xl"
          >
            {retrying ? 'Retrying...' : 'Retry'}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 glass-panel border border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
};

// Retry function for failed imports with exponential backoff
const retryImport = (importFn, retries = 3, delay = 1000) => {
  return new Promise((resolve, reject) => {
    const attempt = (remaining, currentDelay) => {
      importFn()
        .then((module) => {
          console.log('Import successful');
          resolve(module);
        })
        .catch((error) => {
          console.error(`Import failed (${retries - remaining + 1}/${retries}):`, error);
          if (remaining > 0) {
            const nextDelay = currentDelay * 1.5; // Exponential backoff
            console.warn(`Retrying in ${nextDelay}ms...`);
            setTimeout(() => attempt(remaining - 1, nextDelay), currentDelay);
          } else {
            console.error('Import failed after all retries:', error);
            reject(error);
          }
        });
    };
    attempt(retries, delay);
  });
};

// Code-split large components for better performance with improved error handling
const createLazyComponent = (importFn, componentName) => {
  return lazy(async () => {
    try {
      return await retryImport(importFn, 3, 1000);
    } catch (err) {
      console.error(`Error loading ${componentName} after retries:`, err);
      // Return a component that shows error but allows retry
      // IMPORTANT: Must return a module-like object with default export
      return { 
        default: () => <ErrorFallback componentName={componentName} />
      };
    }
  });
};

const ChatArea = createLazyComponent(() => import('./components/ChatArea'), 'Chat Area');
const AdminDashboard = createLazyComponent(() => import('./components/AdminDashboard'), 'Admin Dashboard');
const AdminContactMessages = createLazyComponent(() => import('./components/AdminContactMessages'), 'Admin Contact Messages');
const StudentProfile = createLazyComponent(() => import('./components/StudentProfile'), 'Student Profile');
const UsersManagement = createLazyComponent(() => import('./components/UsersManagement'), 'Users Management');
const CreateUser = createLazyComponent(() => import('./components/CreateUser'), 'Create User');
const AIHelp = createLazyComponent(() => import('./components/AIHelp'), 'AI Help');
const Groups = createLazyComponent(() => import('./components/Groups'), 'Groups');
const GroupChat = createLazyComponent(() => import('./components/GroupChat'), 'Group Chat');
const PrivateChat = createLazyComponent(() => import('./components/PrivateChat'), 'Private Chat');
const Settings = createLazyComponent(() => import('./components/Settings'), 'Settings');
const AdminAnalytics = createLazyComponent(() => import('./components/AdminAnalytics'), 'Admin Analytics');
const KeyboardShortcuts = lazy(() => import('./components/KeyboardShortcuts').catch(() => {
  return { default: () => null };
}));
const ActivityDashboard = createLazyComponent(() => import('./components/ActivityDashboard'), 'Activity Dashboard');
const MessageScheduler = createLazyComponent(() => import('./components/MessageScheduler'), 'Message Scheduler');
const SavedMessages = createLazyComponent(() => import('./components/SavedMessages'), 'Saved Messages');
const ImageGallery = createLazyComponent(() => import('./components/ImageGallery'), 'Image Gallery');
const NearbyChat = createLazyComponent(() => import('./components/NearbyChat'), 'Nearby Chat');
const AdminContactMessages = createLazyComponent(() => import('./components/AdminContactMessages'), 'Admin Contact Messages');
const PWAInstallPrompt = lazy(() => import('./components/PWAInstallPrompt').catch(() => {
  return { default: () => null };
}));

// Loading component - Minimal Fluid Design
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen h-[100dvh] bg-transparent relative overflow-hidden">
    {/* Fluid Background */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-gradient-to-br from-indigo-200/20 via-purple-200/15 to-pink-200/20 blur-3xl"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${80 + Math.random() * 120}px`,
            height: `${80 + Math.random() * 120}px`,
            animation: `float-particles ${12 + Math.random() * 8}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
    </div>
    <div className="text-center relative z-10">
      <div className="w-16 h-16 mx-auto mb-6 relative">
        <div className="absolute inset-0 rounded-full border-4 border-indigo-400/30"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-400 animate-spin"></div>
      </div>
      <p className="text-sm text-white/60 font-light">Loading...</p>
    </div>
    <style>{`
      @keyframes float-particles {
        0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
        50% { transform: translate(20px, -20px) scale(1.1); opacity: 0.6; }
      }
    `}</style>
  </div>
);

function App() {
  const { user, userRole, loading } = useAuth();
  const [activeView, setActiveView] = useState('chat');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasSetDefaultView, setHasSetDefaultView] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showLogin, setShowLogin] = useState(false);
  const [loginMode, setLoginMode] = useState('login'); // 'login' or 'register'
  
  // Memoize callbacks to prevent unnecessary re-renders
  const handleSetActiveView = useCallback((view) => {
    setActiveView(view);
  }, []);
  
  const handleSetSelectedGroup = useCallback((group) => {
    setSelectedGroup(group);
  }, []);
  
  const handleSetSidebarOpen = useCallback((open) => {
    setSidebarOpen(open);
  }, []);

  // Handle Web Share Target API (when app is launched via share)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check if app was launched via share target
    const urlParams = new URLSearchParams(window.location.search);
    const sharedTitle = urlParams.get('title');
    const sharedText = urlParams.get('text');
    const sharedUrl = urlParams.get('url');
    
    if (sharedTitle || sharedText || sharedUrl) {
      // Handle shared content (could open in chat, create message, etc.)
      console.log('Shared content received:', { sharedTitle, sharedText, sharedUrl });
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Handle File System Access API (when files are opened)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Listen for file open events
    const handleFileOpen = (event) => {
      if (event.detail?.files) {
        // Handle opened files
        console.log('Files opened:', event.detail.files);
      }
    };
    
    window.addEventListener('fileopened', handleFileOpen);
    return () => window.removeEventListener('fileopened', handleFileOpen);
  }, []);

  // Track window size for mobile detection (debounced for performance)
  useEffect(() => {
    const handleResize = debounce(() => {
      setIsMobile(window.innerWidth < 768);
      // Close sidebar when switching from mobile to desktop
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    }, 150); // Debounce resize events for better performance
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Set default view based on user role (only on initial load)
  useEffect(() => {
    if (isAdminRole(userRole) && !hasSetDefaultView) {
      // Default to audit on first load, but allow admins to navigate to chat later
      setActiveView('audit');
      setHasSetDefaultView(true);
    }
  }, [userRole, hasSetDefaultView]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user || !userRole) {
    if (showLogin) {
      return <Login onBack={() => setShowLogin(false)} initialMode={loginMode} />;
    }
    return (
      <LandingPage 
        onLogin={() => {
          setLoginMode('login');
          setShowLogin(true);
        }}
        onRegister={() => {
          setLoginMode('register');
          setShowLogin(true);
        }}
      />
    );
  }

  return (
    <>
      <CallModal />
      {/* IMPORTANT: Avoid forcing 100vh on mobile/PWA (causes "locked" viewport and jumpy layouts).
          Use h-screen as fallback, but prefer 100dvh where supported. */}
      {/* Aurora Background - Fluid.so aesthetic */}
      <div className="aurora-background fixed inset-0 z-0">
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
        <div className="aurora-blob aurora-blob-3" />
        <div className="aurora-blob aurora-blob-4" />
        <div className="aurora-blob aurora-blob-5" />
      </div>
      
      <div className="flex h-screen h-[100dvh] h-[100svh] w-full relative z-10 md:flex-row p-4 gap-4" style={{
        height: '100dvh',
        minHeight: '-webkit-fill-available',
        maxHeight: '100dvh',
        overflow: 'hidden',
        WebkitOverflowScrolling: 'touch'
      }}>
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>
      <Sidebar 
        activeView={activeView} 
        setActiveView={handleSetActiveView}
        isOpen={sidebarOpen}
        onClose={() => handleSetSidebarOpen(false)}
      />
      <motion.div 
        id="main-content" 
        className="flex-1 relative w-full glass-panel rounded-[2rem] flex flex-col"
        style={{ 
          minHeight: 0, 
          maxHeight: '100%', 
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        onTouchStart={(e) => {
          // Swipe from left edge to open menu (only on mobile, when sidebar is closed)
          if (isMobile && !sidebarOpen && e.touches[0].clientX < 30) {
            handleSetSidebarOpen(true);
          }
        }}
      >
        {/* Swipe indicator on mobile - subtle hint */}
        {!sidebarOpen && isMobile && (
          <div 
            className="fixed left-0 top-1/2 -translate-y-1/2 z-20 w-1 h-20 bg-indigo-600/20 rounded-r-full transition-opacity duration-300"
            style={{
              left: '0px',
              animation: 'pulse 3s infinite'
            }}
            aria-hidden="true"
          />
        )}
        <Suspense fallback={<LoadingSpinner />}>
          <AnimatePresence mode="wait" initial={false}>
            {isAdminRole(userRole) ? (
              <>
                {activeView === 'chat' && (
                  <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                    <ErrorBoundary>
                      <AnimatedPage variant="slideRight">
                        <ChatArea setActiveView={handleSetActiveView} />
                      </AnimatedPage>
                    </ErrorBoundary>
                  </motion.div>
                )}
                {activeView === 'audit' && (
                  <motion.div key="audit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <ErrorBoundary>
                      <AnimatedPage variant="slideUp">
                        <AdminDashboard />
                      </AnimatedPage>
                    </ErrorBoundary>
                  </motion.div>
                )}
                {activeView === 'analytics' && (
                  <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <ErrorBoundary>
                      <AnimatedPage variant="slideLeft">
                        <AdminAnalytics />
                      </AnimatedPage>
                    </ErrorBoundary>
                  </motion.div>
                )}
                {activeView === 'users' && (
                  <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <ErrorBoundary>
                      <AnimatedPage variant="slideDown">
                        <UsersManagement />
                      </AnimatedPage>
                    </ErrorBoundary>
                  </motion.div>
                )}
                {activeView === 'create-user' && (
                  <motion.div key="create-user" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <ErrorBoundary>
                      <AnimatedPage variant="scale">
                        <CreateUser />
                      </AnimatedPage>
                    </ErrorBoundary>
                  </motion.div>
                )}
                {activeView === 'contact-messages' && (
                  <motion.div key="contact-messages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <ErrorBoundary>
                      <AnimatedPage variant="slideUp">
                        <AdminContactMessages />
                      </AnimatedPage>
                    </ErrorBoundary>
                  </motion.div>
                )}
                {activeView === 'private-chat' && (
                  <motion.div key="private-chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <ErrorBoundary>
                      <AnimatedPage variant="slideRight">
                        <PrivateChat />
                      </AnimatedPage>
                    </ErrorBoundary>
                  </motion.div>
                )}
                {activeView === 'nearby' && (
                  <motion.div key="nearby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <ErrorBoundary>
                      <AnimatedPage variant="slideRight">
                        <NearbyChat onClose={() => handleSetActiveView('chat')} />
                      </AnimatedPage>
                    </ErrorBoundary>
                  </motion.div>
                )}
                {activeView === 'settings' && (
                  <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <ErrorBoundary>
                      <AnimatedPage variant="scale">
                        <Settings setActiveView={handleSetActiveView} />
                      </AnimatedPage>
                    </ErrorBoundary>
                  </motion.div>
                )}
                <KeyboardShortcuts />
                <PWAInstallPrompt />
              </>
            ) : (
              <>
                {activeView === 'chat' && (
                  <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                    <ErrorBoundary>
                      <AnimatedPage variant="slideRight">
                        <ChatArea setActiveView={handleSetActiveView} />
                      </AnimatedPage>
                    </ErrorBoundary>
                  </motion.div>
                )}
                {activeView === 'ai-help' && (
                  <motion.div key="ai-help" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <ErrorBoundary>
                      <AnimatedPage variant="slideLeft">
                        <AIHelp />
                      </AnimatedPage>
                    </ErrorBoundary>
                  </motion.div>
                )}
                {activeView === 'profile' && (
                  <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <ErrorBoundary>
                      <AnimatedPage variant="scale">
                        <StudentProfile />
                      </AnimatedPage>
                    </ErrorBoundary>
                  </motion.div>
                )}
                {activeView === 'groups' && (
                  <motion.div key="groups" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <ErrorBoundary>
                      <AnimatedPage variant="slideUp">
                        <Groups 
                          setActiveView={handleSetActiveView} 
                          setSelectedGroup={handleSetSelectedGroup}
                        />
                      </AnimatedPage>
                    </ErrorBoundary>
                  </motion.div>
                )}
                {activeView === 'group-chat' && (
                  <motion.div key="group-chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <ErrorBoundary>
                      <AnimatedPage variant="slideRight">
                        <GroupChat 
                          group={selectedGroup}
                          setActiveView={handleSetActiveView}
                          onBack={() => {
                            handleSetActiveView('groups');
                            handleSetSelectedGroup(null);
                          }}
                        />
                      </AnimatedPage>
                    </ErrorBoundary>
                  </motion.div>
                )}
                {activeView === 'private-chat' && (
                  <motion.div key="private-chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <ErrorBoundary>
                      <AnimatedPage variant="slideRight">
                        <PrivateChat />
                      </AnimatedPage>
                    </ErrorBoundary>
                  </motion.div>
                )}
                {activeView === 'activity' && (
                  <motion.div key="activity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <ErrorBoundary>
                      <AnimatedPage variant="slideDown">
                        <ActivityDashboard />
                      </AnimatedPage>
                    </ErrorBoundary>
                  </motion.div>
                )}
                {activeView === 'scheduler' && (
                  <motion.div key="scheduler" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <ErrorBoundary>
                      <AnimatedPage variant="slideLeft">
                        <MessageScheduler />
                      </AnimatedPage>
                    </ErrorBoundary>
                  </motion.div>
                )}
                {activeView === 'saved' && (
                  <motion.div key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <ErrorBoundary>
                      <AnimatedPage variant="slideUp">
                        <SavedMessages />
                      </AnimatedPage>
                    </ErrorBoundary>
                  </motion.div>
                )}
                {activeView === 'gallery' && (
                  <motion.div key="gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <ErrorBoundary>
                      <AnimatedPage variant="scale">
                        <ImageGallery />
                      </AnimatedPage>
                    </ErrorBoundary>
                  </motion.div>
                )}
                {activeView === 'settings' && (
                  <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <ErrorBoundary>
                      <AnimatedPage variant="scale">
                        <Settings setActiveView={handleSetActiveView} />
                      </AnimatedPage>
                    </ErrorBoundary>
                  </motion.div>
                )}
                <KeyboardShortcuts />
                <PWAInstallPrompt />
              </>
            )}
          </AnimatePresence>
        </Suspense>
      </div>
    </div>
    </>
  );
}

export default App;

