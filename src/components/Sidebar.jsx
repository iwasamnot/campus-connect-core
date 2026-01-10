import { useState, useCallback, memo } from 'react';
import { useAuth } from '../context/AuthContext';
import { isAdminRole } from '../utils/helpers';
import { MessageSquare, Bot, FileText, Users, UserPlus, UserCircle, X, MessageCircle, Settings, BarChart3, Activity, Calendar, Bookmark, Image as ImageIcon, Mail, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedButton, StaggerContainer, StaggerItem } from './AnimatedComponents';
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
      {/* Mobile Overlay - Animated with Framer Motion */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar - Animated with Framer Motion */}
      <motion.div
        initial={false}
        animate={{
          x: isOpen ? 0 : (window.innerWidth >= 768 ? 0 : -1000),
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
        className={`
          fixed md:static
          top-0 left-0
          w-full md:w-64 bg-gray-900/95 dark:bg-gray-900/95 backdrop-blur-xl text-white 
          flex flex-col h-screen h-[100dvh] border-r border-gray-800/50
          z-[70]
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
        {/* Mobile Header - Animated */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:hidden flex items-center justify-between p-4 border-b border-gray-800/50 flex-shrink-0"
          style={{ paddingTop: `calc(1rem + env(safe-area-inset-top, 0px))` }}
        >
          <Logo size="small" showText={false} />
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 hover:bg-gray-800/50 rounded-full transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </motion.button>
        </motion.div>
        
        {/* Desktop Header - Animated */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="hidden md:block p-6 border-b border-gray-800/50 flex-shrink-0"
          style={{ paddingTop: `calc(1.5rem + env(safe-area-inset-top, 0px))` }}
        >
          <Logo size="small" showText={false} className="mb-3" />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xs text-gray-400 dark:text-gray-400 mt-2 text-center font-light uppercase tracking-wider"
          >
            {isAdminRole(userRole) ? 'Admin' : 'Student'}
          </motion.p>
        </motion.div>

      <StaggerContainer className="flex-1 p-3 space-y-1 overflow-y-auto overscroll-contain touch-pan-y -webkit-overflow-scrolling-touch" staggerDelay={0.05} initialDelay={0.2}>
        {!isAdminRole(userRole) ? (
          <>
            <StaggerItem>
              <motion.button
                onClick={() => handleNavClick('chat')}
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-colors ${
                  activeView === 'chat'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <motion.div
                  animate={{ rotate: activeView === 'chat' ? 360 : 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <MessageSquare size={18} />
                </motion.div>
                <span className="text-sm">Campus Chat</span>
              </motion.button>
            </StaggerItem>
            <StaggerItem>
              <motion.button
                onClick={() => handleNavClick('ai-help')}
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-colors ${
                  activeView === 'ai-help'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <Bot size={18} />
                <span className="text-sm">AI Help</span>
              </motion.button>
            </StaggerItem>
            <StaggerItem>
              <motion.button
                onClick={() => handleNavClick('groups')}
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-colors ${
                  activeView === 'groups' || activeView === 'group-chat'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <UserCircle size={18} />
                <span className="text-sm">Groups</span>
              </motion.button>
            </StaggerItem>
            <StaggerItem>
              <motion.button
                onClick={() => handleNavClick('private-chat')}
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-colors ${
                  activeView === 'private-chat'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <MessageCircle size={18} />
                <span className="text-sm">Private Chat</span>
              </motion.button>
            </StaggerItem>
            <StaggerItem>
              <motion.button
                onClick={() => handleNavClick('nearby')}
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-colors ${
                  activeView === 'nearby'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <Radio size={18} />
                <span className="text-sm">Nearby Chat</span>
              </motion.button>
            </StaggerItem>
            <StaggerItem>
              <motion.button
                onClick={() => handleNavClick('activity')}
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-colors ${
                  activeView === 'activity'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <Activity size={18} />
                <span className="text-sm">Activity</span>
              </motion.button>
            </StaggerItem>
            <StaggerItem>
              <motion.button
                onClick={() => handleNavClick('scheduler')}
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-colors ${
                  activeView === 'scheduler'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <Calendar size={18} />
                <span className="text-sm">Scheduler</span>
              </motion.button>
            </StaggerItem>
            <StaggerItem>
              <motion.button
                onClick={() => handleNavClick('saved')}
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-colors ${
                  activeView === 'saved'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <Bookmark size={18} />
                <span className="text-sm">Saved</span>
              </motion.button>
            </StaggerItem>
            <StaggerItem>
              <motion.button
                onClick={() => handleNavClick('gallery')}
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-colors ${
                  activeView === 'gallery'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <ImageIcon size={18} />
                <span className="text-sm">Gallery</span>
              </motion.button>
            </StaggerItem>
            <StaggerItem>
              <motion.button
                onClick={() => handleNavClick('settings')}
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-colors ${
                  activeView === 'settings'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <Settings size={18} />
                <span className="text-sm">Settings</span>
              </motion.button>
            </StaggerItem>
          </>
        ) : (
          <>
            <StaggerItem>
              <motion.button
                onClick={() => handleNavClick('chat')}
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-colors ${
                  activeView === 'chat'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <MessageSquare size={18} />
                <span className="text-sm">Campus Chat</span>
              </motion.button>
            </StaggerItem>
            <StaggerItem>
              <motion.button
                onClick={() => handleNavClick('audit')}
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-colors ${
                  activeView === 'audit'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <FileText size={18} />
                <span className="text-sm">Audit Logs</span>
              </motion.button>
            </StaggerItem>
            <StaggerItem>
              <motion.button
                onClick={() => handleNavClick('analytics')}
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-colors ${
                  activeView === 'analytics'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <BarChart3 size={18} />
                <span className="text-sm">Analytics</span>
              </motion.button>
            </StaggerItem>
            <StaggerItem>
              <motion.button
                onClick={() => handleNavClick('users')}
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-colors ${
                  activeView === 'users'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <Users size={18} />
                <span className="text-sm">Users</span>
              </motion.button>
            </StaggerItem>
            <StaggerItem>
              <motion.button
                onClick={() => handleNavClick('create-user')}
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-colors ${
                  activeView === 'create-user'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <UserPlus size={18} />
                <span className="text-sm">Create User</span>
              </motion.button>
            </StaggerItem>
            <StaggerItem>
              <motion.button
                onClick={() => handleNavClick('private-chat')}
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-colors ${
                  activeView === 'private-chat'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <MessageCircle size={18} />
                <span className="text-sm">Private Chat</span>
              </motion.button>
            </StaggerItem>
            <StaggerItem>
              <motion.button
                onClick={() => handleNavClick('nearby')}
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-colors ${
                  activeView === 'nearby'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <Radio size={18} />
                <span className="text-sm">Nearby Chat</span>
              </motion.button>
            </StaggerItem>
            <StaggerItem>
              <motion.button
                onClick={() => handleNavClick('contact-messages')}
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-colors ${
                  activeView === 'contact-messages'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <Mail size={18} />
                <span className="text-sm">Messages</span>
              </motion.button>
            </StaggerItem>
            <StaggerItem>
              <motion.button
                onClick={() => handleNavClick('settings')}
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-colors ${
                  activeView === 'settings'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <Settings size={18} />
                <span className="text-sm">Settings</span>
              </motion.button>
            </StaggerItem>
          </>
        )}
      </StaggerContainer>
    </motion.div>
    </>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
