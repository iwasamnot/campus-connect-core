import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import { isAdminRole } from './utils/helpers';
import { useState, useEffect, lazy, Suspense } from 'react';
import { Menu } from 'lucide-react';

// Code-split large components for better performance
const ChatArea = lazy(() => import('./components/ChatArea'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const StudentProfile = lazy(() => import('./components/StudentProfile'));
const UsersManagement = lazy(() => import('./components/UsersManagement'));
const CreateUser = lazy(() => import('./components/CreateUser'));
const AIHelp = lazy(() => import('./components/AIHelp'));
const Groups = lazy(() => import('./components/Groups'));
const GroupChat = lazy(() => import('./components/GroupChat'));
const PrivateChat = lazy(() => import('./components/PrivateChat'));
const Settings = lazy(() => import('./components/Settings'));

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
              {activeView === 'chat' && <div className="page-transition"><ChatArea setActiveView={setActiveView} /></div>}
              {activeView === 'audit' && <div className="page-transition"><AdminDashboard /></div>}
              {activeView === 'users' && <div className="page-transition"><UsersManagement /></div>}
              {activeView === 'create-user' && <div className="page-transition"><CreateUser /></div>}
              {activeView === 'private-chat' && <div className="page-transition"><PrivateChat /></div>}
              {activeView === 'settings' && <div className="page-transition"><Settings setActiveView={setActiveView} /></div>}
            </>
          ) : (
            <>
              {activeView === 'chat' && <div className="page-transition"><ChatArea setActiveView={setActiveView} /></div>}
              {activeView === 'ai-help' && <div className="page-transition"><AIHelp /></div>}
              {activeView === 'profile' && <div className="page-transition"><StudentProfile /></div>}
              {activeView === 'groups' && (
                <div className="page-transition">
                  <Groups 
                    setActiveView={setActiveView} 
                    setSelectedGroup={setSelectedGroup}
                  />
                </div>
              )}
              {activeView === 'group-chat' && (
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
              )}
              {activeView === 'private-chat' && <div className="page-transition"><PrivateChat /></div>}
              {activeView === 'settings' && <div className="page-transition"><Settings setActiveView={setActiveView} /></div>}
            </>
          )}
        </Suspense>
      </div>
    </div>
  );
}

export default App;

