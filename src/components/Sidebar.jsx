import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { isAdminRole } from '../utils/helpers';
import { MessageSquare, Bot, FileText, LogOut, User, Users, Moon, Sun, UserPlus } from 'lucide-react';

const Sidebar = ({ activeView, setActiveView }) => {
  const { userRole, signOut } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-screen">
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-xl font-bold">CampusConnect</h2>
        <p className="text-sm text-gray-400 mt-1">
          {isAdminRole(userRole) ? 'Admin Panel' : 'Student Portal'}
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {!isAdminRole(userRole) ? (
          <>
            <button
              onClick={() => setActiveView('chat')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeView === 'chat'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <MessageSquare size={20} />
              <span>Global Chat</span>
            </button>
            <button
              onClick={() => setActiveView('ai-help')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeView === 'ai-help'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Bot size={20} />
              <span>AI Help</span>
            </button>
            <button
              onClick={() => setActiveView('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeView === 'profile'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <User size={20} />
              <span>My Profile</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveView('audit')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeView === 'audit'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <FileText size={20} />
              <span>Audit Logs</span>
            </button>
            <button
              onClick={() => setActiveView('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeView === 'users'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Users size={20} />
              <span>Users Management</span>
            </button>
            <button
              onClick={() => setActiveView('create-user')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeView === 'create-user'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <UserPlus size={20} />
              <span>Create User</span>
            </button>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-gray-800 space-y-2">
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

