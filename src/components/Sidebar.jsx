import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { isAdminRole } from '../utils/helpers';
import { MessageSquare, Bot, FileText, LogOut, User, Users, Moon, Sun, UserPlus } from 'lucide-react';
import Logo from './Logo';

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
    <div className="w-64 bg-gray-900 dark:bg-gray-900 text-white flex flex-col h-screen border-r border-gray-800">
      <div className="p-6 border-b border-gray-800">
        <Logo size="small" showText={true} className="mb-2" />
        <p className="text-sm text-gray-300 dark:text-gray-300 mt-1 text-center">
          {isAdminRole(userRole) ? 'Admin Panel' : 'Student Portal'}
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {!isAdminRole(userRole) ? (
          <>
            <button
              onClick={() => setActiveView('chat')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeView === 'chat'
                  ? 'bg-indigo-600 text-white shadow-lg scale-105 font-semibold'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <MessageSquare size={20} />
              <span>Campus Chat</span>
            </button>
            <button
              onClick={() => setActiveView('ai-help')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeView === 'ai-help'
                  ? 'bg-indigo-600 text-white shadow-lg scale-105 font-semibold'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Bot size={20} />
              <span>AI Help</span>
            </button>
            <button
              onClick={() => setActiveView('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeView === 'profile'
                  ? 'bg-indigo-600 text-white shadow-lg scale-105 font-semibold'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeView === 'audit'
                  ? 'bg-indigo-600 text-white shadow-lg scale-105 font-semibold'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <FileText size={20} />
              <span>Audit Logs</span>
            </button>
            <button
              onClick={() => setActiveView('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeView === 'users'
                  ? 'bg-indigo-600 text-white shadow-lg scale-105 font-semibold'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Users size={20} />
              <span>Users Management</span>
            </button>
            <button
              onClick={() => setActiveView('create-user')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeView === 'create-user'
                  ? 'bg-indigo-600 text-white shadow-lg scale-105 font-semibold'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
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
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
