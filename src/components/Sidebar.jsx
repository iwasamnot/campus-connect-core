import { useAuth } from '../context/AuthContext';
import { isAdminRole } from '../utils/helpers';
import { MessageSquare, Bot, FileText, Users, UserPlus, UserCircle, X, MessageCircle, Settings } from 'lucide-react';
import Logo from './Logo';

const Sidebar = ({ activeView, setActiveView, isOpen, onClose }) => {
  const { userRole } = useAuth();

  const handleNavClick = (view) => {
    setActiveView(view);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed md:static
        top-0 left-0
        w-64 bg-gray-900 dark:bg-gray-900 text-white 
        flex flex-col h-screen border-r border-gray-800
        z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Mobile Close Button */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-800 flex-shrink-0">
          <Logo size="small" showText={true} />
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="hidden md:block p-6 border-b border-gray-800 flex-shrink-0">
          <Logo size="small" showText={true} className="mb-2" />
          <p className="text-sm text-gray-300 dark:text-gray-300 mt-1 text-center">
            {isAdminRole(userRole) ? 'Admin Panel' : 'Student Portal'}
          </p>
        </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {!isAdminRole(userRole) ? (
          <>
            <button
              onClick={() => handleNavClick('chat')}
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
              onClick={() => handleNavClick('ai-help')}
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
              onClick={() => handleNavClick('groups')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeView === 'groups' || activeView === 'group-chat'
                  ? 'bg-indigo-600 text-white shadow-lg scale-105 font-semibold'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <UserCircle size={20} />
              <span>Groups</span>
            </button>
            <button
              onClick={() => handleNavClick('private-chat')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeView === 'private-chat'
                  ? 'bg-indigo-600 text-white shadow-lg scale-105 font-semibold'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <MessageCircle size={20} />
              <span>Private Chat</span>
            </button>
            <button
              onClick={() => handleNavClick('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeView === 'settings'
                  ? 'bg-indigo-600 text-white shadow-lg scale-105 font-semibold'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Settings size={20} />
              <span>Settings</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleNavClick('chat')}
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
              onClick={() => handleNavClick('audit')}
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
              onClick={() => handleNavClick('users')}
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
              onClick={() => handleNavClick('create-user')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeView === 'create-user'
                  ? 'bg-indigo-600 text-white shadow-lg scale-105 font-semibold'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <UserPlus size={20} />
              <span>Create User</span>
            </button>
            <button
              onClick={() => handleNavClick('private-chat')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeView === 'private-chat'
                  ? 'bg-indigo-600 text-white shadow-lg scale-105 font-semibold'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <MessageCircle size={20} />
              <span>Private Chat</span>
            </button>
            <button
              onClick={() => handleNavClick('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeView === 'settings'
                  ? 'bg-indigo-600 text-white shadow-lg scale-105 font-semibold'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Settings size={20} />
              <span>Settings</span>
            </button>
          </>
        )}
      </nav>
    </div>
    </>
  );
};

export default Sidebar;
