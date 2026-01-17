import { useState, useEffect, useMemo } from 'react';
import { Search, Command, ArrowRight, Hash, Users, MessageSquare, Bot, Settings, BarChart3, Activity, Calendar, Bookmark, Image as ImageIcon, Mail, Radio, UserCircle, MessageCircle, FileText, Sparkles, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const isAdminRole = typeof window !== 'undefined' && window.__isAdminRole 
  ? window.__isAdminRole 
  : (role) => role === 'admin' || role === 'admin1';

/**
 * Modern Command Palette Component
 * Press Ctrl/Cmd + K to open
 */
const CommandPalette = ({ isOpen, onClose, onNavigate, userRole }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands = useMemo(() => {
    const baseCommands = [
      { id: 'chat', label: 'Campus Chat', icon: MessageSquare, category: 'Navigation', shortcut: 'C' },
      { id: 'ai-help', label: 'AI Help', icon: Bot, category: 'Navigation', shortcut: 'A' },
      { id: 'groups', label: 'Groups', icon: UserCircle, category: 'Navigation', shortcut: 'G' },
      { id: 'private-chat', label: 'Private Chat', icon: MessageCircle, category: 'Navigation', shortcut: 'P' },
      { id: 'nearby', label: 'Nearby Chat', icon: Radio, category: 'Navigation', shortcut: 'N' },
      { id: 'activity', label: 'Activity Dashboard', icon: Activity, category: 'Navigation', shortcut: 'D' },
      { id: 'saved-messages', label: 'Saved Messages', icon: Bookmark, category: 'Navigation', shortcut: 'S' },
      { id: 'image-gallery', label: 'Image Gallery', icon: ImageIcon, category: 'Navigation', shortcut: 'I' },
      { id: 'message-scheduler', label: 'Message Scheduler', icon: Calendar, category: 'Navigation', shortcut: 'M' },
      { id: 'settings', label: 'Settings', icon: Settings, category: 'Navigation', shortcut: 'T' },
    ];

    if (isAdminRole(userRole)) {
      baseCommands.push(
        { id: 'admin-dashboard', label: 'Admin Dashboard', icon: BarChart3, category: 'Admin', shortcut: 'AD' },
        { id: 'users-management', label: 'Users Management', icon: Users, category: 'Admin', shortcut: 'U' },
        { id: 'contact-messages', label: 'Contact Messages', icon: Mail, category: 'Admin', shortcut: 'CM' }
      );
    }

    return baseCommands;
  }, [userRole]);

  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) return commands;
    
    const query = searchQuery.toLowerCase();
    return commands.filter(cmd => 
      cmd.label.toLowerCase().includes(query) ||
      cmd.category.toLowerCase().includes(query) ||
      cmd.shortcut?.toLowerCase().includes(query)
    );
  }, [commands, searchQuery]);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          handleSelect(filteredCommands[selectedIndex].id);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  const handleSelect = (commandId) => {
    onNavigate(commandId);
    onClose();
  };

  const groupedCommands = useMemo(() => {
    const groups = {};
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center pt-[20vh] px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-panel border border-white/20 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
            <Search size={20} className="text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search commands, navigate, or type a command..."
              className="flex-1 bg-transparent text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded-lg px-2 py-1 text-lg min-h-[44px]"
              autoFocus
              aria-label="Search commands"
            />
            <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg border border-white/10">
              <Command size={14} className="text-white/40" />
              <span className="text-xs text-white/40">K</span>
            </div>
          </div>

          {/* Commands List */}
          <div className="max-h-[60vh] overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-white/60">No commands found</p>
                <p className="text-sm text-white/40 mt-2">Try a different search term</p>
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, cmds]) => (
                <div key={category} className="py-2">
                  <div className="px-4 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
                    {category}
                  </div>
                  {cmds.map((cmd, index) => {
                    const globalIndex = filteredCommands.findIndex(c => c.id === cmd.id);
                    const isSelected = globalIndex === selectedIndex;
                    const Icon = cmd.icon;

                    return (
                      <motion.button
                        key={cmd.id}
                        onClick={() => handleSelect(cmd.id)}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={`w-full flex items-center gap-3 px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[44px] ${
                          isSelected ? 'bg-indigo-600/30' : 'hover:bg-white/5'
                        }`}
                        whileHover={{ x: 4 }}
                        aria-label={`Select ${cmd.label}`}
                      >
                        <Icon size={18} className={isSelected ? 'text-indigo-400' : 'text-white/60'} />
                        <span className={`flex-1 text-left ${isSelected ? 'text-white font-medium' : 'text-white/80'}`}>
                          {cmd.label}
                        </span>
                        {cmd.shortcut && (
                          <div className="flex items-center gap-1">
                            {cmd.shortcut.split('').map((key, i) => (
                              <kbd
                                key={i}
                                className="px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white/60"
                              >
                                {key}
                              </kbd>
                            ))}
                          </div>
                        )}
                        {isSelected && (
                          <ArrowRight size={16} className="text-indigo-400" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <ArrowRight size={12} />
                <span>Select</span>
              </div>
              <div className="flex items-center gap-1">
                <span>↑↓</span>
                <span>Navigate</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span>Esc</span>
              <span>Close</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CommandPalette;
