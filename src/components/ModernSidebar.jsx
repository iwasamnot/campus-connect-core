import { useState, useCallback, memo, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { isAdminRole } from '../utils/helpers';
import { 
  MessageSquare, Bot, FileText, Users, UserPlus, UserCircle, X, MessageCircle, 
  Settings, BarChart3, Activity, Calendar, Bookmark, Image as ImageIcon, Mail, Radio,
  Search, Bell, Command, Star, Clock, TrendingUp, Home, Grid3x3, Menu, BookOpen, Brain,
  Workflow, Languages, Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CommandPalette from './CommandPalette';
import NotificationCenter from './NotificationCenter';
import VoiceCommands from './VoiceCommands';

const Logo = typeof window !== 'undefined' && window.__LogoComponent 
  ? window.__LogoComponent 
  : () => <div>Logo</div>;

// Modern Navigation Item with badges and shortcuts
const ModernNavItem = memo(({ view, activeView, onClick, icon: Icon, label, badge, shortcut, isPinned, onPin }) => {
  const isActive = activeView === view;
  
  return (
    <motion.div
      layout
      className="relative group"
      whileHover={{ x: 2 }}
    >
      {isActive && (
        <motion.div
          layoutId="activeNav"
          className="absolute inset-0 bg-gradient-to-r from-indigo-600/80 to-purple-600/80 rounded-xl"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
      <button
        onClick={() => onClick(view)}
        className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[44px] ${
          isActive
            ? 'text-white font-semibold'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
        aria-label={`Navigate to ${label}`}
        aria-current={isActive ? 'page' : undefined}
      >
        <Icon size={18} className={isActive ? 'text-white' : 'text-gray-400'} />
        <span className="flex-1 text-sm font-medium text-left">{label}</span>
        <div className="flex items-center gap-2">
          {badge && (
            <span className="px-2 py-0.5 bg-indigo-600 rounded-full text-xs text-white">
              {badge}
            </span>
          )}
          {shortcut && (
            <kbd className="hidden md:inline-flex px-1.5 py-0.5 text-xs bg-white/10 border border-white/20 rounded text-white/60">
              {shortcut}
            </kbd>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPin?.(view);
            }}
            className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded ${
              isPinned ? 'opacity-100 text-yellow-400' : 'text-white/40'
            }`}
          >
            <Star size={14} fill={isPinned ? 'currentColor' : 'none'} />
          </button>
        </div>
      </button>
    </motion.div>
  );
});

ModernNavItem.displayName = 'ModernNavItem';

const ModernSidebar = memo(({ activeView, setActiveView, isOpen, onClose }) => {
  const { user, userRole } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pinnedItems, setPinnedItems] = useState(() => {
    const saved = localStorage.getItem('pinnedNavItems');
    return saved ? JSON.parse(saved) : ['chat', 'ai-help'];
  });
  const [recentViews, setRecentViews] = useState(() => {
    const saved = localStorage.getItem('recentNavViews');
    return saved ? JSON.parse(saved) : [];
  });

  // Track recent views
  useEffect(() => {
    if (activeView && !recentViews.includes(activeView)) {
      const updated = [activeView, ...recentViews].slice(0, 5);
      setRecentViews(updated);
      localStorage.setItem('recentNavViews', JSON.stringify(updated));
    }
  }, [activeView]);

  // Save pinned items
  useEffect(() => {
    localStorage.setItem('pinnedNavItems', JSON.stringify(pinnedItems));
  }, [pinnedItems]);

  const handleNavClick = useCallback((view) => {
    // Special handling for interview mode (opens as modal, not view)
    if (view === 'interview') {
      // Trigger interview mode via App.jsx state
      if (typeof window !== 'undefined' && window.__setShowInterviewMode) {
        window.__setShowInterviewMode(true);
      }
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        onClose();
      }
      return;
    }
    
    setActiveView(view);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      onClose();
    }
  }, [setActiveView, onClose]);

  const handlePin = useCallback((view) => {
    setPinnedItems(prev => 
      prev.includes(view) 
        ? prev.filter(v => v !== view)
        : [...prev, view]
    );
  }, []);

  // Navigation items
  const navItems = useMemo(() => {
    const items = [
      { id: 'chat', label: 'Campus Chat', icon: MessageSquare, shortcut: 'C', category: 'main' },
      { id: 'ai-help', label: 'AI Help', icon: Bot, shortcut: 'A', category: 'main', badge: 'NEW' },
      { id: 'groups', label: 'Groups', icon: UserCircle, shortcut: 'G', category: 'main' },
      { id: 'private-chat', label: 'Private Chat', icon: MessageCircle, shortcut: 'P', category: 'main' },
      { id: 'nearby', label: 'Nearby Chat', icon: Radio, shortcut: 'N', category: 'main' },
      { id: 'global-commons', label: 'Global Commons', icon: Languages, shortcut: 'GC', category: 'main', badge: 'NEW' },
      { id: 'visual-board', label: 'Visual Board', icon: Grid3x3, shortcut: 'VB', category: 'tools', badge: 'NEW' },
      { id: 'interview', label: 'Mock Interview', icon: Briefcase, shortcut: 'MI', category: 'tools', badge: 'NEW' },
      { id: 'activity', label: 'Activity', icon: Activity, shortcut: 'D', category: 'tools' },
      { id: 'scheduler', label: 'Scheduler', icon: Calendar, shortcut: 'M', category: 'tools' },
      { id: 'saved', label: 'Saved', icon: Bookmark, shortcut: 'S', category: 'tools' },
      { id: 'gallery', label: 'Gallery', icon: ImageIcon, shortcut: 'I', category: 'tools' },
      { id: 'settings', label: 'Settings', icon: Settings, shortcut: 'T', category: 'tools' },
    ];

    if (isAdminRole(userRole)) {
      items.push(
        { id: 'analytics', label: 'Analytics', icon: BarChart3, shortcut: 'AD', category: 'admin' },
        { id: 'users', label: 'Users', icon: Users, shortcut: 'U', category: 'admin' },
        { id: 'create-user', label: 'Create User', icon: UserPlus, shortcut: 'CU', category: 'admin' },
        { id: 'contact-messages', label: 'Messages', icon: Mail, shortcut: 'CM', category: 'admin' },
        { id: 'audit', label: 'Audit Logs', icon: FileText, shortcut: 'AL', category: 'admin' }
      );
    }

    return items;
  }, [userRole]);

  // Filtered items based on search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return navItems;
    const query = searchQuery.toLowerCase();
    return navItems.filter(item => 
      item.label.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query)
    );
  }, [navItems, searchQuery]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups = { pinned: [], main: [], tools: [], admin: [], recent: [] };
    
    // Add pinned items first
    pinnedItems.forEach(pinnedId => {
      const item = navItems.find(i => i.id === pinnedId);
      if (item) groups.pinned.push({ ...item, isPinned: true });
    });

    // Add other items by category
    filteredItems.forEach(item => {
      if (!pinnedItems.includes(item.id)) {
        if (groups[item.category]) {
          groups[item.category].push(item);
        }
      }
    });

    // Add recent items
    recentViews.forEach(recentId => {
      const item = navItems.find(i => i.id === recentId);
      if (item && !pinnedItems.includes(recentId) && !groups[item.category]?.find(i => i.id === recentId)) {
        if (!groups.recent.find(i => i.id === recentId)) {
          groups.recent.push({ ...item, isRecent: true });
        }
      }
    });

    return groups;
  }, [filteredItems, pinnedItems, recentViews, navItems]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNavigate={handleNavClick}
        userRole={userRole}
      />

      {/* Notification Center */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        userId={user?.uid}
      />

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>
      
      {/* Modern Sidebar - GPU Accelerated with translate3d */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{
          x: isOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth >= 768 ? 0 : -1000),
          opacity: isOpen || (typeof window !== 'undefined' && window.innerWidth >= 768) ? 1 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          // Force GPU acceleration with translate3d
          transform: 'translate3d(0, 0, 0)',
          willChange: 'transform, opacity',
          backfaceVisibility: 'hidden',
        }}
        className="fixed md:static top-4 left-4 md:left-4 md:top-4 w-[calc(100%-2rem)] md:w-80 glass-panel text-white flex flex-col h-[calc(100vh-2rem)] max-h-[calc(100dvh-2rem)] rounded-[2rem] z-[70] overflow-hidden gpu-accelerated"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <Logo size="small" showText={false} />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCommandPalette(true)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Command Palette (Ctrl+K)"
                aria-label="Open command palette"
              >
                <Command size={18} className="text-white/60" />
              </button>
              <button
                onClick={() => setShowNotifications(true)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors relative focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Notifications"
                aria-label="Open notifications"
                aria-haspopup="true"
              >
                <Bell size={18} className="text-white/60" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" aria-label="Unread notifications" />
              </button>
              <button
                onClick={onClose}
                className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close sidebar"
              >
                <X size={18} className="text-white/60" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search navigation..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
            />
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Pinned Items */}
          {groupedItems.pinned.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 px-2">
                <Star size={14} className="text-yellow-400" />
                <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Pinned</span>
              </div>
              <div className="space-y-1">
                {groupedItems.pinned.map(item => (
                  <ModernNavItem
                    key={item.id}
                    view={item.id}
                    activeView={activeView}
                    onClick={handleNavClick}
                    icon={item.icon}
                    label={item.label}
                    shortcut={item.shortcut}
                    isPinned={true}
                    onPin={handlePin}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Main Navigation */}
          {groupedItems.main.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 px-2">
                <Home size={14} className="text-indigo-400" />
                <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Main</span>
              </div>
              <div className="space-y-1">
                {groupedItems.main.map(item => (
                  <ModernNavItem
                    key={item.id}
                    view={item.id}
                    activeView={activeView}
                    onClick={handleNavClick}
                    icon={item.icon}
                    label={item.label}
                    shortcut={item.shortcut}
                    isPinned={pinnedItems.includes(item.id)}
                    onPin={handlePin}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tools */}
          {groupedItems.tools.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 px-2">
                <Grid3x3 size={14} className="text-purple-400" />
                <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Tools</span>
              </div>
              <div className="space-y-1">
                {groupedItems.tools.map(item => (
                  <ModernNavItem
                    key={item.id}
                    view={item.id}
                    activeView={activeView}
                    onClick={handleNavClick}
                    icon={item.icon}
                    label={item.label}
                    shortcut={item.shortcut}
                    isPinned={pinnedItems.includes(item.id)}
                    onPin={handlePin}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Admin */}
          {isAdminRole(userRole) && groupedItems.admin.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 px-2">
                <Settings size={14} className="text-red-400" />
                <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Admin</span>
              </div>
              <div className="space-y-1">
                {groupedItems.admin.map(item => (
                  <ModernNavItem
                    key={item.id}
                    view={item.id}
                    activeView={activeView}
                    onClick={handleNavClick}
                    icon={item.icon}
                    label={item.label}
                    shortcut={item.shortcut}
                    isPinned={pinnedItems.includes(item.id)}
                    onPin={handlePin}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recent */}
          {groupedItems.recent.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 px-2">
                <Clock size={14} className="text-blue-400" />
                <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Recent</span>
              </div>
              <div className="space-y-1">
                {groupedItems.recent.map(item => (
                  <ModernNavItem
                    key={item.id}
                    view={item.id}
                    activeView={activeView}
                    onClick={handleNavClick}
                    icon={item.icon}
                    label={item.label}
                    shortcut={item.shortcut}
                    isPinned={pinnedItems.includes(item.id)}
                    onPin={handlePin}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Footer */}
        {user && (
          <div className="p-4 border-t border-white/10 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                {user.email?.charAt(0).toUpperCase() || 'U'}
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
          </div>
        )}
      </motion.div>
    </>
  );
});

ModernSidebar.displayName = 'ModernSidebar';

export default ModernSidebar;
