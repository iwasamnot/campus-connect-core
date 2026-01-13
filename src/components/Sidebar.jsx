import { useState, useCallback, memo } from 'react';
import { useAuth } from '../context/AuthContext';
import { isAdminRole } from '../utils/helpers';
import { MessageSquare, Bot, FileText, Users, UserPlus, UserCircle, X, MessageCircle, Settings, BarChart3, Activity, Calendar, Bookmark, Image as ImageIcon, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedButton, StaggerContainer, StaggerItem } from './AnimatedComponents';
// Use window.__LogoComponent directly to avoid import/export issues
const Logo = typeof window !== 'undefined' && window.__LogoComponent 
  ? window.__LogoComponent 
  : () => <div>Logo</div>; // Fallback placeholder

// Navigation Item Component - Fluid.so aesthetic
const NavItem = memo(({ view, activeView, onClick, icon: Icon, label, activeViews }) => {
  // Support multiple active views (e.g., 'groups' and 'group-chat')
  const isActive = activeView === view || (activeViews && activeViews.includes(activeView));
  
  return (
    <motion.div
      layout
      className="relative w-full"
    >
      {isActive && (
        <motion.div
          layoutId="activeNav"
          className="absolute inset-0 bg-gradient-to-r from-indigo-600/80 to-purple-600/80 rounded-xl"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
      <motion.button
        onClick={() => onClick(view)}
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
        className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
          isActive
            ? 'text-white font-semibold text-glow'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <Icon size={18} />
        <span className="text-sm font-medium">{label}</span>
        {isActive && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="ml-auto w-2 h-2 rounded-full bg-white/80"
          />
        )}
      </motion.button>
    </motion.div>
  );
});

NavItem.displayName = 'NavItem';

const Sidebar = memo(({ activeView, setActiveView, isOpen, onClose }) => {
  const { user, userRole } = useAuth();
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Minimum swipe distance
  const minSwipeDistance = 50;

  const handleNavClick = useCallback((view) => {
    setActiveView(view);
    // Close sidebar on mobile after navigation
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
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
    if (isLeftSwipe && isOpen && typeof window !== 'undefined' && window.innerWidth < 768) {
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
      
      {/* Sidebar - Floating Dock with Glassmorphism - Fluid.so aesthetic */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{
          x: isOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth >= 768 ? 0 : -1000),
          opacity: isOpen || (typeof window !== 'undefined' && window.innerWidth >= 768) ? 1 : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
        className={`
          fixed md:static
          top-4 left-4 md:left-4 md:top-4
          w-[calc(100%-2rem)] md:w-72
          glass-panel
          text-white 
          flex flex-col
          h-[calc(100vh-2rem)] h-[calc(100dvh-2rem)]
          max-h-[calc(100dvh-2rem)]
          rounded-[2rem]
          z-[70]
          overflow-hidden
        `}
        style={{
          paddingTop: 'max(1rem, env(safe-area-inset-top, 0px) + 1rem)',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px) + 1rem)',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Mobile Header - Animated - Fluid.so aesthetic */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:hidden flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0"
          style={{ paddingTop: `calc(1rem + env(safe-area-inset-top, 0px))` }}
        >
          <Logo size="small" showText={false} />
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </motion.button>
        </motion.div>
        
        {/* Desktop Header - Animated - Fluid.so aesthetic */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="hidden md:block p-6 border-b border-white/10 flex-shrink-0"
          style={{ paddingTop: `calc(1.5rem + env(safe-area-inset-top, 0px))` }}
        >
          <Logo size="small" showText={false} className="mb-3" />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xs text-gray-400 mt-2 text-center font-medium uppercase tracking-wider"
          >
            {isAdminRole(userRole) ? 'Admin' : 'Student'}
          </motion.p>
        </motion.div>

      <StaggerContainer className="flex-1 p-4 space-y-2 overflow-y-auto overscroll-contain touch-pan-y -webkit-overflow-scrolling-touch" staggerDelay={0.05} initialDelay={0.2}>
        {!isAdminRole(userRole) ? (
          <>
            <StaggerItem>
              <motion.div
                layout
                className="relative w-full"
              >
                {activeView === 'chat' && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-gradient-to-r from-indigo-600/80 to-purple-600/80 rounded-xl"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <motion.button
                  onClick={() => handleNavClick('chat')}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeView === 'chat'
                      ? 'text-white font-semibold text-glow'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <motion.div
                    animate={{ rotate: activeView === 'chat' ? 360 : 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <MessageSquare size={18} />
                  </motion.div>
                  <span className="text-sm font-medium">Campus Chat</span>
                  {activeView === 'chat' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto w-2 h-2 rounded-full bg-white/80"
                    />
                  )}
                </motion.button>
              </motion.div>
            </StaggerItem>
            <StaggerItem>
              <NavItem view="ai-help" activeView={activeView} onClick={handleNavClick} icon={Bot} label="AI Help" />
            </StaggerItem>
            <StaggerItem>
              <NavItem view="groups" activeView={activeView} onClick={handleNavClick} icon={UserCircle} label="Groups" activeViews={['groups', 'group-chat']} />
            </StaggerItem>
            <StaggerItem>
              <NavItem view="private-chat" activeView={activeView} onClick={handleNavClick} icon={MessageCircle} label="Live Chat" />
            </StaggerItem>
            <StaggerItem>
              <NavItem view="nearby" activeView={activeView} onClick={handleNavClick} icon={Radio} label="Nearby Chat" />
            </StaggerItem>
            <StaggerItem>
              <NavItem view="activity" activeView={activeView} onClick={handleNavClick} icon={Activity} label="Activity" />
            </StaggerItem>
            <StaggerItem>
              <NavItem view="scheduler" activeView={activeView} onClick={handleNavClick} icon={Calendar} label="Scheduler" />
            </StaggerItem>
            <StaggerItem>
              <NavItem view="saved" activeView={activeView} onClick={handleNavClick} icon={Bookmark} label="Saved" />
            </StaggerItem>
            <StaggerItem>
              <NavItem view="gallery" activeView={activeView} onClick={handleNavClick} icon={ImageIcon} label="Gallery" />
            </StaggerItem>
            <StaggerItem>
              <NavItem view="settings" activeView={activeView} onClick={handleNavClick} icon={Settings} label="Settings" />
            </StaggerItem>
          </>
        ) : (
          <>
            <StaggerItem>
              <NavItem view="chat" activeView={activeView} onClick={handleNavClick} icon={MessageSquare} label="Campus Chat" />
            </StaggerItem>
            <StaggerItem>
              <NavItem view="audit" activeView={activeView} onClick={handleNavClick} icon={FileText} label="Audit Logs" />
            </StaggerItem>
            <StaggerItem>
              <NavItem view="analytics" activeView={activeView} onClick={handleNavClick} icon={BarChart3} label="Analytics" />
            </StaggerItem>
            <StaggerItem>
              <NavItem view="users" activeView={activeView} onClick={handleNavClick} icon={Users} label="Users" />
            </StaggerItem>
            <StaggerItem>
              <NavItem view="create-user" activeView={activeView} onClick={handleNavClick} icon={UserPlus} label="Create User" />
            </StaggerItem>
            <StaggerItem>
              <NavItem view="private-chat" activeView={activeView} onClick={handleNavClick} icon={MessageCircle} label="Private Chat" />
            </StaggerItem>
            <StaggerItem>
              <NavItem view="nearby" activeView={activeView} onClick={handleNavClick} icon={Radio} label="Nearby Chat" />
            </StaggerItem>
            <StaggerItem>
              <NavItem view="settings" activeView={activeView} onClick={handleNavClick} icon={Settings} label="Settings" />
            </StaggerItem>
          </>
        )}
      </StaggerContainer>
      
      {/* User Profile Section - Bottom of Floating Dock - Fluid.so aesthetic */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-auto p-4 border-t border-white/10 rounded-xl mx-3 mb-3 bg-white/5 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg">
              {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.email || 'User'}
              </p>
              <p className="text-xs text-gray-400 capitalize">
                {userRole || 'Student'}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
    </>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
