import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import { isAdminRole } from './utils/helpers';
import { useState, useEffect, lazy, Suspense } from 'react';

// Code-split large components for better performance
const ChatArea = lazy(() => import('./components/ChatArea'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const StudentProfile = lazy(() => import('./components/StudentProfile'));
const UsersManagement = lazy(() => import('./components/UsersManagement'));
const CreateUser = lazy(() => import('./components/CreateUser'));
const AIHelp = lazy(() => import('./components/AIHelp'));
const Groups = lazy(() => import('./components/Groups'));
const GroupChat = lazy(() => import('./components/GroupChat'));

// Loading component for lazy-loaded routes
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
    </div>
  </div>
);

function App() {
  const { user, userRole, loading } = useAuth();
  const [activeView, setActiveView] = useState('chat');
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Set default view based on user role
  useEffect(() => {
    if (isAdminRole(userRole) && activeView === 'chat') {
      setActiveView('audit');
    }
  }, [userRole]);

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
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<LoadingSpinner />}>
          {isAdminRole(userRole) ? (
            <>
              {activeView === 'audit' && <AdminDashboard />}
              {activeView === 'users' && <UsersManagement />}
              {activeView === 'create-user' && <CreateUser />}
            </>
          ) : (
            <>
              {activeView === 'chat' && <ChatArea />}
              {activeView === 'ai-help' && <AIHelp />}
              {activeView === 'profile' && <StudentProfile />}
              {activeView === 'groups' && (
                <Groups 
                  setActiveView={setActiveView} 
                  setSelectedGroup={setSelectedGroup}
                />
              )}
              {activeView === 'group-chat' && (
                <GroupChat 
                  group={selectedGroup}
                  onBack={() => {
                    setActiveView('groups');
                    setSelectedGroup(null);
                  }}
                />
              )}
            </>
          )}
        </Suspense>
      </div>
    </div>
  );
}

export default App;

