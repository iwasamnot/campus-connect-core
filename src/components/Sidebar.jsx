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
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden animate-fade-in"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`
          fixed md:static
          top-0 left-0
          w-full md:w-64 bg-gray-900 dark:bg-gray-900 text-white 
          flex flex-col h-screen h-[100dvh] border-r border-gray-800
          z-[70]
          transform transition-transform duration-300 ease-in-out
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
        {/* Mobile Header - Always visible on mobile */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-800 flex-shrink-0"
             style={{ paddingTop: `calc(1rem + env(safe-area-inset-top, 0px))` }}>
          <Logo size="small" showText={true} />
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-95"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Desktop Header - Always visible on desktop */}
        <div className="hidden md:block p-6 border-b border-gray-800 flex-shrink-0"
             style={{ paddingTop: `calc(1.5rem + env(safe-area-inset-top, 0px))` }}>
          <Logo size="small" showText={true} className="mb-2" />
          <p className="text-sm text-gray-300 dark:text-gray-300 mt-1 text-center">
            {isAdminRole(userRole) ? 'Admin Panel' : 'Student Portal'}
          </p>
        </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto overscroll-contain touch-pan-y -webkit-overflow-scrolling-touch">
        {!isAdminRole(userRole) ? (
          <>
            <button
              onClick={() => handleNavClick('chat')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${
                activeView === 'chat'
                  ? 'bg-indigo-600 text-white shadow-lg scale-105 font-semibold animate-scale-in'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:shadow-md'
              }`}
            >
              <MessageSquare size={20} />
              <span>Campus Chat</span>
            </button>
            <button
              onClick={() => handleNavClick('ai-help')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${
                activeView === 'ai-help'
                  ? 'bg-indigo-600 text-white shadow-lg scale-105 font-semibold animate-scale-in'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:shadow-md'
              }`}
            >
              <Bot size={20} />
              <span>AI Help</span>
            </button>
            <button
              onClick={() => handleNavClick('groups')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${
                activeView === 'groups' || activeView === 'group-chat'
                  ? 'bg-indigo-600 text-white shadow-lg scale-105 font-semibold animate-scale-in'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:shadow-md'
              }`}
            >
              <UserCircle size={20} />
              <span>Groups</span>
            </button>
            <button
              onClick={() => handleNavClick('private-chat')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${
                activeView === 'private-chat'
                  ? 'bg-indigo-600 text-white shadow-lg scale-105 font-semibold animate-scale-in'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:shadow-md'
              }`}
            >
              <MessageCircle size={20} />
              <span>Private Chat</span>
            </button>
            <button
              onClick={() => handleNavClick('activity')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${
                activeView === 'activity'
                  ? 'bg-indigo-600 text-white shadow-lg scale-105 font-semibold animate-scale-in'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:shadow-md'
              }`}
            >
              <Activity size={20} />
              <span>Activity</span>
            </button>
            <button
              onClick={() => handleNavClick('scheduler')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${
                activeView === 'scheduler'
                  ? 'bg-indigo-600 text-white shadow-lg scale-105 font-semibold animate-scale-in'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:shadow-md'
              }`}
            >
              <Calendar size={20} />
              <span>Scheduler</span>
            </button>
            <button
              onClick={() => handleNavClick('saved')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${
                activeView === 'saved'
                  ? 'bg-indigo-600 text-white shadow-lg scale-105 font-semibold animate-scale-in'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:shadow-md'
              }`}
            >
              <Bookmark size={20} />
              <span>Saved</span>
            </button>
            <button
              onClick={() => handleNavClick('gallery')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${
                activeView === 'gallery'
                  ? 'bg-indigo-600 text-white shadow-lg scale-105 font-semibold animate-scale-in'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:shadow-md'
              }`}
            >
              <ImageIcon size={20} />
              <span>Gallery</span>
            </button>
            <button
              onClick={() => handleNavClick('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${
                activeView === 'settings'
                  ? 'bg-indigo-600 text-white shadow-lg scale-105 font-semibold animate-scale-in'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:shadow-md'
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${
                activeView === 'chat'
                  ? 'bg-indigo-600 text-white shadow-lg scale-105 font-semibold animate-scale-in'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:shadow-md'
              }`}
            >
              <MessageSquare size={20} />
              <span>Campus Chat</span>
            </button>
            <button
              onClick={() => handleNavClick('audit')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${
                activeView === 'audit'
                  ? 'bg-indigo-600 text-white shadow-lg scale-105 font-semibold animate-scale-in'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:shadow-md'
              }`}
            >
              <FileText size={20} />
              <span>Audit Logs</span>
            </button>
            <button
              onClick={() => handleNavClick('analytics')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${
                activeView === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-lg scale-105 font-semibold animate-scale-in'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:shadow-md'
              }`}
            >
              <BarChart3 size={20} />
              <span>Analytics</span>
            </button>
            <button
              onClick={() => handleNavClick('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${
                activeView === 'users'
                  ? 'bg-indigo-600 text-white shadow-lg scale-105 font-semibold animate-scale-in'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:shadow-md'
              }`}
            >
              <Users size={20} />
              <span>Users Management</span>
            </button>
            <button
              onClick={() => handleNavClick('create-user')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${
                activeView === 'create-user'
                  ? 'bg-indigo-600 text-white shadow-lg scale-105 font-semibold animate-scale-in'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:shadow-md'
              }`}
            >
              <UserPlus size={20} />
              <span>Create User</span>
            </button>
            <button
              onClick={() => handleNavClick('private-chat')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${
                activeView === 'private-chat'
                  ? 'bg-indigo-600 text-white shadow-lg scale-105 font-semibold animate-scale-in'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:shadow-md'
              }`}
            >
              <MessageCircle size={20} />
              <span>Private Chat</span>
            </button>
            <button
              onClick={() => handleNavClick('contact-messages')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${
                activeView === 'contact-messages'
                  ? 'bg-indigo-600 text-white shadow-lg scale-105 font-semibold animate-scale-in'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:shadow-md'
              }`}
            >
              <Mail size={20} />
              <span>Contact Messages</span>
            </button>
            <button
              onClick={() => handleNavClick('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${
                activeView === 'settings'
                  ? 'bg-indigo-600 text-white shadow-lg scale-105 font-semibold animate-scale-in'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:shadow-md'
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
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
