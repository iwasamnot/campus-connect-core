import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import CallModal from './components/CallModal';
import { isAdminRole } from './utils/helpers';
import { useState, useEffect, lazy, Suspense } from 'react';
// Removed Menu import - using swipe gesture instead
import ErrorBoundary from './components/ErrorBoundary';

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
      <div className="text-center max-w-md">
        <div className="text-red-600 dark:text-red-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Unable to Load {componentName}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          There was an error loading this component. This might be a temporary network issue.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {retrying ? 'Retrying...' : 'Retry'}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors"
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
const PWAInstallPrompt = lazy(() => import('./components/PWAInstallPrompt').catch(() => {
  return { default: () => null };
}));

// Loading component for lazy-loaded routes
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 animate-fade-in">
    <div className="text-center">
      <img 
        src="/logo.png" 
        alt="CampusConnect Logo" 
        className="w-24 h-24 mx-auto mb-4 animate-pulse-slow object-contain"
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
    </div>
  </div>
);

function App() {
  const { user, userRole, loading } = useAuth();
  const [activeView, setActiveView] = useState('chat');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasSetDefaultView, setHasSetDefaultView] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Track window size for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      // Close sidebar when switching from mobile to desktop
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !userRole) {
    return <Login />;
  }

  return (
    <>
      <CallModal />
      <div className="flex h-screen h-[100dvh] h-[100vh] overflow-hidden w-full bg-white dark:bg-gray-900 md:flex-row">
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div 
        id="main-content" 
        className="flex-1 overflow-hidden relative w-full"
        onTouchStart={(e) => {
          // Swipe from left edge to open menu (only on mobile, when sidebar is closed)
          if (isMobile && !sidebarOpen && e.touches[0].clientX < 30) {
            setSidebarOpen(true);
          }
        }}
      >
        {/* Swipe indicator on mobile - subtle hint */}
        {!sidebarOpen && isMobile && (
          <div 
            className="fixed left-0 top-1/2 -translate-y-1/2 z-20 w-1 h-20 bg-indigo-600/20 dark:bg-indigo-400/20 rounded-r-full transition-opacity duration-300"
            style={{
              left: '0px',
              animation: 'pulse 3s infinite'
            }}
            aria-hidden="true"
          />
        )}
        <Suspense fallback={<LoadingSpinner />}>
          {isAdminRole(userRole) ? (
            <>
              {activeView === 'chat' && <ErrorBoundary><div className="page-transition"><ChatArea setActiveView={setActiveView} /></div></ErrorBoundary>}
              {activeView === 'audit' && <ErrorBoundary><div className="page-transition"><AdminDashboard /></div></ErrorBoundary>}
              {activeView === 'analytics' && <ErrorBoundary><div className="page-transition"><AdminAnalytics /></div></ErrorBoundary>}
              {activeView === 'users' && <ErrorBoundary><div className="page-transition"><UsersManagement /></div></ErrorBoundary>}
              {activeView === 'create-user' && <ErrorBoundary><div className="page-transition"><CreateUser /></div></ErrorBoundary>}
              {activeView === 'private-chat' && <ErrorBoundary><div className="page-transition"><PrivateChat /></div></ErrorBoundary>}
              {activeView === 'settings' && <ErrorBoundary><div className="page-transition"><Settings setActiveView={setActiveView} /></div></ErrorBoundary>}
              <KeyboardShortcuts />
              <PWAInstallPrompt />
            </>
          ) : (
            <>
              {activeView === 'chat' && <ErrorBoundary><div className="page-transition"><ChatArea setActiveView={setActiveView} /></div></ErrorBoundary>}
              {activeView === 'ai-help' && <ErrorBoundary><div className="page-transition"><AIHelp /></div></ErrorBoundary>}
              {activeView === 'profile' && <ErrorBoundary><div className="page-transition"><StudentProfile /></div></ErrorBoundary>}
              {activeView === 'groups' && (
                <ErrorBoundary>
                  <div className="page-transition">
                    <Groups 
                      setActiveView={setActiveView} 
                      setSelectedGroup={setSelectedGroup}
                    />
                  </div>
                </ErrorBoundary>
              )}
              {activeView === 'group-chat' && (
                <ErrorBoundary>
                  <div className="page-transition">
                    <GroupChat 
                      group={selectedGroup}
                      setActiveView={setActiveView}
                      onBack={() => {
                        setActiveView('groups');
                        setSelectedGroup(null);
                      }}
                    />
                  </div>
                </ErrorBoundary>
              )}
              {activeView === 'private-chat' && <ErrorBoundary><div className="page-transition"><PrivateChat /></div></ErrorBoundary>}
              {activeView === 'activity' && <ErrorBoundary><div className="page-transition"><ActivityDashboard /></div></ErrorBoundary>}
              {activeView === 'scheduler' && <ErrorBoundary><div className="page-transition"><MessageScheduler /></div></ErrorBoundary>}
              {activeView === 'saved' && <ErrorBoundary><div className="page-transition"><SavedMessages /></div></ErrorBoundary>}
              {activeView === 'gallery' && <ErrorBoundary><div className="page-transition"><ImageGallery /></div></ErrorBoundary>}
              {activeView === 'settings' && <ErrorBoundary><div className="page-transition"><Settings setActiveView={setActiveView} /></div></ErrorBoundary>}
              <KeyboardShortcuts />
              <PWAInstallPrompt />
            </>
          )}
        </Suspense>
      </div>
    </div>
    </>
  );
}

export default App;

