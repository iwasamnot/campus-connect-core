import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import AdminDashboard from './components/AdminDashboard';
import StudentProfile from './components/StudentProfile';
import UsersManagement from './components/UsersManagement';
import CreateUser from './components/CreateUser';
import AIHelp from './components/AIHelp';
import Groups from './components/Groups';
import GroupChat from './components/GroupChat';
import { isAdminRole } from './utils/helpers';
import { useState, useEffect } from 'react';

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
      </div>
    </div>
  );
}

export default App;

