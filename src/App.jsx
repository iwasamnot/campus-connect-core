import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import { isAdminRole } from './utils/helpers';
import { useState, useEffect, lazy, Suspense } from 'react';
import { Menu } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';

// Code-split large components for better performance with error handling
const ChatArea = lazy(() => import('./components/ChatArea').catch(err => {
  console.error('Error loading ChatArea:', err);
  return { default: () => <div className="p-4 text-red-600">Error loading Chat Area. Please refresh the page.</div> };
}));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').catch(err => {
  console.error('Error loading AdminDashboard:', err);
  return { default: () => <div className="p-4 text-red-600">Error loading Admin Dashboard. Please refresh the page.</div> };
}));
const StudentProfile = lazy(() => import('./components/StudentProfile').catch(err => {
  console.error('Error loading StudentProfile:', err);
  return { default: () => <div className="p-4 text-red-600">Error loading Student Profile. Please refresh the page.</div> };
}));
const UsersManagement = lazy(() => import('./components/UsersManagement').catch(err => {
  console.error('Error loading UsersManagement:', err);
  return { default: () => <div className="p-4 text-red-600">Error loading Users Management. Please refresh the page.</div> };
}));
const CreateUser = lazy(() => import('./components/CreateUser').catch(err => {
  console.error('Error loading CreateUser:', err);
  return { default: () => <div className="p-4 text-red-600">Error loading Create User. Please refresh the page.</div> };
}));
const AIHelp = lazy(() => import('./components/AIHelp').catch(err => {
  console.error('Error loading AIHelp:', err);
  return { default: () => <div className="p-4 text-red-600">Error loading AI Help. Please refresh the page.</div> };
}));
const Groups = lazy(() => import('./components/Groups').catch(err => {
  console.error('Error loading Groups:', err);
  return { default: () => <div className="p-4 text-red-600">Error loading Groups. Please refresh the page.</div> };
}));
const GroupChat = lazy(() => import('./components/GroupChat').catch(err => {
  console.error('Error loading GroupChat:', err);
  return { default: () => <div className="p-4 text-red-600">Error loading Group Chat. Please refresh the page.</div> };
}));
const PrivateChat = lazy(() => import('./components/PrivateChat').catch(err => {
  console.error('Error loading PrivateChat:', err);
  return { default: () => <div className="p-4 text-red-600">Error loading Private Chat. Please refresh the page.</div> };
}));
const Settings = lazy(() => import('./components/Settings').catch(err => {
  console.error('Error loading Settings:', err);
  return { default: () => <div className="p-4 text-red-600">Error loading Settings. Please refresh the page.</div> };
}));
const AdminAnalytics = lazy(() => import('./components/AdminAnalytics').catch(err => {
  console.error('Error loading AdminAnalytics:', err);
  return { default: () => <div className="p-4 text-red-600">Error loading Admin Analytics. Please refresh the page.</div> };
}));
const KeyboardShortcuts = lazy(() => import('./components/KeyboardShortcuts').catch(err => {
  console.error('Error loading KeyboardShortcuts:', err);
  return { default: () => null };
}));
const ActivityDashboard = lazy(() => import('./components/ActivityDashboard').catch(err => {
  console.error('Error loading ActivityDashboard:', err);
  return { default: () => <div className="p-4 text-red-600">Error loading Activity Dashboard. Please refresh the page.</div> };
}));
const MessageScheduler = lazy(() => import('./components/MessageScheduler').catch(err => {
  console.error('Error loading MessageScheduler:', err);
  return { default: () => <div className="p-4 text-red-600">Error loading Message Scheduler. Please refresh the page.</div> };
}));
const SavedMessages = lazy(() => import('./components/SavedMessages').catch(err => {
  console.error('Error loading SavedMessages:', err);
  return { default: () => <div className="p-4 text-red-600">Error loading Saved Messages. Please refresh the page.</div> };
}));
const ImageGallery = lazy(() => import('./components/ImageGallery').catch(err => {
  console.error('Error loading ImageGallery:', err);
  return { default: () => <div className="p-4 text-red-600">Error loading Image Gallery. Please refresh the page.</div> };
}));
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
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 overflow-hidden relative">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed top-4 left-4 z-30 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-95 hover:shadow-xl"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
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
  );
}

export default App;

