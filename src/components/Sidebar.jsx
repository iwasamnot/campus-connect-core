import { useState, useCallback, memo } from 'react';
import { useAuth } from '../context/AuthContext';
import { isAdminRole } from '../utils/helpers';
import { MessageSquare, Bot, FileText, Users, UserPlus, UserCircle, X, MessageCircle, Settings, BarChart3, Activity, Calendar, Bookmark, Image as ImageIcon, Mail } from 'lucide-react';
// Use window.__LogoComponent directly to avoid import/export issues
const Logo = typeof window !== 'undefined' && window.__LogoComponent 
  ? window.__LogoComponent 
  : () => <div>Logo</div>; // Fallback placeholder

const Sidebar = memo(({ activeView, setActiveView, isOpen, onClose }) => {
  const { userRole } = useAuth();
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Minimum swipe distance
  const minSwipeDistance = 50;

  const handleNavClick = useCallback((view) => {
    setActiveView(view);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      onClose();
    }
  }, [setActiveView, onClose]);

  // Handle touch events for swipe to close
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    
    // Close sidebar on left swipe
    if (isLeftSwipe && isOpen && window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay - Minimal */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar - Minimal Fluid Design */}
      <div 
        className={`
          fixed md:static
          top-0 left-0
          w-full md:w-64 bg-gray-900/95 dark:bg-gray-900/95 backdrop-blur-xl text-white 
          flex flex-col h-screen h-[100dvh] border-r border-gray-800/50
          z-[70]
          transform transition-transform duration-500 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          maxHeight: '100dvh',
          height: '100dvh'
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Mobile Header - Minimal Design */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-800/50 flex-shrink-0"
             style={{ paddingTop: `calc(1rem + env(safe-area-inset-top, 0px))` }}>
          <Logo size="small" showText={false} />
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800/50 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Desktop Header - Minimal Design */}
        <div className="hidden md:block p-6 border-b border-gray-800/50 flex-shrink-0"
             style={{ paddingTop: `calc(1.5rem + env(safe-area-inset-top, 0px))` }}>
          <Logo size="small" showText={false} className="mb-3" />
          <p className="text-xs text-gray-400 dark:text-gray-400 mt-2 text-center font-light uppercase tracking-wider">
            {isAdminRole(userRole) ? 'Admin' : 'Student'}
          </p>
        </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto overscroll-contain touch-pan-y -webkit-overflow-scrolling-touch">
        {!isAdminRole(userRole) ? (
          <>
            <button
              onClick={() => handleNavClick('chat')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                activeView === 'chat'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <MessageSquare size={18} className="transition-transform duration-300" />
              <span className="text-sm">Campus Chat</span>
            </button>
            <button
              onClick={() => handleNavClick('ai-help')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                activeView === 'ai-help'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <Bot size={18} />
              <span className="text-sm">AI Help</span>
            </button>
            <button
              onClick={() => handleNavClick('groups')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                activeView === 'groups' || activeView === 'group-chat'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <UserCircle size={18} />
              <span className="text-sm">Groups</span>
            </button>
            <button
              onClick={() => handleNavClick('private-chat')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                activeView === 'private-chat'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <MessageCircle size={18} />
              <span className="text-sm">Private Chat</span>
            </button>
            <button
              onClick={() => handleNavClick('activity')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                activeView === 'activity'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <Activity size={18} />
              <span className="text-sm">Activity</span>
            </button>
            <button
              onClick={() => handleNavClick('scheduler')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                activeView === 'scheduler'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <Calendar size={18} />
              <span className="text-sm">Scheduler</span>
            </button>
            <button
              onClick={() => handleNavClick('saved')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                activeView === 'saved'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <Bookmark size={18} />
              <span className="text-sm">Saved</span>
            </button>
            <button
              onClick={() => handleNavClick('gallery')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                activeView === 'gallery'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <ImageIcon size={18} />
              <span className="text-sm">Gallery</span>
            </button>
            <button
              onClick={() => handleNavClick('settings')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                activeView === 'settings'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <Settings size={18} />
              <span className="text-sm">Settings</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleNavClick('chat')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                activeView === 'chat'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <MessageSquare size={18} />
              <span className="text-sm">Campus Chat</span>
            </button>
            <button
              onClick={() => handleNavClick('audit')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                activeView === 'audit'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <FileText size={18} />
              <span className="text-sm">Audit Logs</span>
            </button>
            <button
              onClick={() => handleNavClick('analytics')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                activeView === 'analytics'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <BarChart3 size={18} />
              <span className="text-sm">Analytics</span>
            </button>
            <button
              onClick={() => handleNavClick('users')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                activeView === 'users'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <Users size={18} />
              <span className="text-sm">Users</span>
            </button>
            <button
              onClick={() => handleNavClick('create-user')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                activeView === 'create-user'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <UserPlus size={18} />
              <span className="text-sm">Create User</span>
            </button>
            <button
              onClick={() => handleNavClick('private-chat')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                activeView === 'private-chat'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <MessageCircle size={18} />
              <span className="text-sm">Private Chat</span>
            </button>
            <button
              onClick={() => handleNavClick('contact-messages')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                activeView === 'contact-messages'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <Mail size={18} />
              <span className="text-sm">Messages</span>
            </button>
            <button
              onClick={() => handleNavClick('settings')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                activeView === 'settings'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <Settings size={18} />
              <span className="text-sm">Settings</span>
            </button>
          </>
        )}
      </nav>
    </div>
    </>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
