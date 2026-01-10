import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePreferences } from '../context/PreferencesContext';
// Use window globals to avoid import/export issues
const isAdminRole = typeof window !== 'undefined' && window.__isAdminRole 
  ? window.__isAdminRole 
  : (role) => role === 'admin' || role === 'admin1';
import { Moon, Sun, LogOut, User, Settings as SettingsIcon, Bell, Shield, HelpCircle, Info, Palette, Type, Eye, EyeOff, Forward, Keyboard, Volume2, VolumeX, RotateCcw, Sparkles, Minus, Droplet } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from './AnimatedComponents';

const Settings = ({ setActiveView }) => {
  const { userRole, signOut } = useAuth();
  const { darkMode, toggleDarkMode, themeStyle, changeThemeStyle } = useTheme();
  const { preferences, updatePreference, resetPreferences } = usePreferences();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="h-screen h-[100dvh] flex flex-col bg-transparent relative overflow-hidden">
      {/* Header - Fluid.so aesthetic */}
      <FadeIn delay={0.1}>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel border-b border-white/10 p-4 md:p-6 relative z-10 rounded-t-[2rem] flex-shrink-0"
          style={{
            paddingTop: `max(1rem, env(safe-area-inset-top, 0px) + 0.5rem)`,
            paddingBottom: `1rem`,
            paddingLeft: `calc(1rem + env(safe-area-inset-left, 0px))`,
            paddingRight: `calc(1rem + env(safe-area-inset-right, 0px))`
          }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <SettingsIcon className="text-indigo-300 transition-all duration-300" size={28} />
            </motion.div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white text-glow">
                Settings
              </h1>
              <p className="text-sm text-white/60 mt-1">
                Manage your preferences and account
              </p>
            </div>
          </div>
        </motion.div>
      </FadeIn>

      {/* Settings Content - Fluid.so aesthetic */}
      <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y p-4 md:p-6">
        <StaggerContainer className="max-w-2xl mx-auto space-y-6" staggerDelay={0.05} initialDelay={0.2}>
          {/* Appearance Section - Fluid.so aesthetic */}
          <StaggerItem>
            <motion.div
              whileHover={{ y: -2 }}
              className="glass-panel rounded-[2rem] border border-white/10 p-6 md:p-8 shadow-xl"
            >
              <h2 className="text-xl md:text-2xl font-semibold text-white mb-6">
                Appearance
              </h2>
              <div className="space-y-6">
                {/* Dark Mode Toggle */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-3">
                    {darkMode ? (
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      >
                        <Sun className="text-yellow-400 transition-all duration-300" size={24} />
                      </motion.div>
                    ) : (
                      <Moon className="text-indigo-300 transition-all duration-300" size={24} />
                    )}
                    <div>
                      <p className="font-medium text-white">
                        {darkMode ? 'Light Mode' : 'Dark Mode'}
                      </p>
                      <p className="text-sm text-white/60">
                        Switch between light and dark themes
                      </p>
                    </div>
                  </div>
                  <motion.button
                    onClick={toggleDarkMode}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                      darkMode ? 'bg-indigo-600' : 'bg-white/20'
                    }`}
                  >
                    <motion.span
                      layout
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ${
                        darkMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </motion.button>
                </div>

                {/* Theme Style */}
                <div className="pt-6 border-t border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="text-indigo-300" size={20} />
                    <div>
                      <p className="font-medium text-white">Theme Style</p>
                      <p className="text-sm text-white/60">
                        Choose your preferred design style
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <motion.button
                      onClick={() => changeThemeStyle('fluid')}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex-1 px-4 py-4 rounded-xl border-2 transition-all duration-300 ${
                        themeStyle === 'fluid'
                          ? 'border-indigo-500 bg-indigo-600/30 text-white shadow-lg'
                          : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Droplet size={20} className="text-indigo-400" />
                        <span className="font-medium text-sm">Fluid</span>
                        <span className="text-xs opacity-75 text-center">Glassmorphism & Aurora</span>
                      </div>
                    </motion.button>
                    <motion.button
                      onClick={() => changeThemeStyle('fun')}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex-1 px-4 py-4 rounded-xl border-2 transition-all duration-300 ${
                        themeStyle === 'fun'
                          ? 'border-indigo-500 bg-indigo-600/30 text-white shadow-lg'
                          : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Sparkles size={20} />
                        <span className="font-medium text-sm">Fun</span>
                        <span className="text-xs opacity-75 text-center">Colorful & Playful</span>
                      </div>
                    </motion.button>
                    <motion.button
                      onClick={() => changeThemeStyle('minimal')}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex-1 px-4 py-4 rounded-xl border-2 transition-all duration-300 ${
                        themeStyle === 'minimal'
                          ? 'border-indigo-500 bg-indigo-600/30 text-white shadow-lg'
                          : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Minus size={20} />
                        <span className="font-medium text-sm">Minimal</span>
                        <span className="text-xs opacity-75 text-center">Sleek & Modern</span>
                      </div>
                    </motion.button>
                  </div>
                </div>

                {/* Accent Color - show for fluid and fun themes */}
                {(themeStyle === 'fun' || themeStyle === 'fluid') && (
                <div className="pt-6 border-t border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <Palette className="text-indigo-300" size={20} />
                    <div>
                      <p className="font-medium text-white">Accent Color</p>
                      <p className="text-sm text-white/60">
                        Choose your preferred accent color
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {['indigo', 'blue', 'purple', 'pink', 'red', 'orange', 'green', 'teal'].map((color) => {
                      const colorMap = {
                        indigo: '#6366f1',
                        blue: '#3b82f6',
                        purple: '#8b5cf6',
                        pink: '#ec4899',
                        red: '#ef4444',
                        orange: '#f97316',
                        green: '#10b981',
                        teal: '#14b8a6'
                      };
                      return (
                        <motion.button
                          key={color}
                          onClick={() => updatePreference('accentColor', color)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          style={{ backgroundColor: colorMap[color] }}
                          className={`h-12 rounded-xl border-2 transition-all duration-300 ${
                            preferences.accentColor === color
                              ? 'border-white ring-2 ring-white/50 ring-offset-2 ring-offset-black/20 shadow-lg'
                              : 'border-white/20 hover:border-white/40'
                          }`}
                          title={color.charAt(0).toUpperCase() + color.slice(1)}
                        />
                      );
                    })}
                  </div>
                </div>
                )}

                {/* Font Size */}
                <div className="pt-6 border-t border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <Type className="text-indigo-300" size={20} />
                    <div>
                      <p className="font-medium text-white">Font Size</p>
                      <p className="text-sm text-white/60">
                        Adjust text size for better readability
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {['small', 'medium', 'large', 'xlarge'].map((size) => (
                      <motion.button
                        key={size}
                        onClick={() => updatePreference('fontSize', size)}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-3 py-2.5 rounded-xl border-2 transition-all duration-300 text-sm ${
                          preferences.fontSize === size
                            ? 'border-indigo-500 bg-indigo-600/30 text-white shadow-lg'
                            : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10'
                        }`}
                      >
                        {size.charAt(0).toUpperCase() + size.slice(1)}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </StaggerItem>

          {/* Chat Preferences Section - Fluid.so aesthetic */}
          <StaggerItem>
            <motion.div
              whileHover={{ y: -2 }}
              className="glass-panel rounded-[2rem] border border-white/10 p-6 md:p-8 shadow-xl"
            >
              <h2 className="text-xl md:text-2xl font-semibold text-white mb-6">
                Chat Preferences
              </h2>
              <div className="space-y-4">
                {[
                  { key: 'showReadReceipts', icon: Eye, label: 'Read Receipts', desc: 'Show when messages are read' },
                  { key: 'showTypingIndicators', icon: Keyboard, label: 'Typing Indicators', desc: 'Show when others are typing' },
                  { key: 'showOnlineStatus', icon: Eye, label: 'Online Status', desc: 'Show your online status to others' },
                  { key: 'allowMessageForwarding', icon: Forward, label: 'Message Forwarding', desc: 'Allow forwarding messages' },
                  { key: 'soundEnabled', icon: preferences.soundEnabled ? Volume2 : VolumeX, label: 'Sound Effects', desc: 'Play sounds for notifications' },
                  { key: 'keyboardShortcuts', icon: Keyboard, label: 'Keyboard Shortcuts', desc: 'Enable keyboard shortcuts (Ctrl+K for help)' }
                ].map((pref, index) => {
                  const Icon = pref.icon;
                  const value = preferences[pref.key];
                  return (
                    <motion.div
                      key={pref.key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`${value ? 'text-indigo-300' : 'text-white/50'} transition-colors`} size={20} />
                        <div>
                          <p className="font-medium text-white">{pref.label}</p>
                          <p className="text-sm text-white/60">{pref.desc}</p>
                        </div>
                      </div>
                      <motion.button
                        onClick={() => updatePreference(pref.key, !value)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                          value ? 'bg-indigo-600' : 'bg-white/20'
                        }`}
                      >
                        <motion.span
                          layout
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ${
                            value ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </StaggerItem>

          {/* Notifications Section - Fluid.so aesthetic */}
          <StaggerItem>
            <motion.div
              whileHover={{ y: -2 }}
              className="glass-panel rounded-[2rem] border border-white/10 p-6 md:p-8 shadow-xl"
            >
              <h2 className="text-xl md:text-2xl font-semibold text-white mb-6">
                Notifications
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <Bell className="text-indigo-300 transition-all duration-300" size={20} />
                    <div>
                      <p className="font-medium text-white">
                        Browser Notifications
                      </p>
                      <p className="text-sm text-white/60">
                        Get notified about new messages
                      </p>
                    </div>
                  </div>
                  <motion.button
                    onClick={async () => {
                      if ('Notification' in window) {
                        const permission = await Notification.requestPermission();
                        if (permission === 'granted') {
                          alert('Notifications enabled!');
                        } else {
                          alert('Please enable notifications in your browser settings.');
                        }
                      } else {
                        alert('Your browser does not support notifications.');
                      }
                    }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl"
                  >
                    Enable
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </StaggerItem>

          {/* Privacy & Security Section - Fluid.so aesthetic */}
          <StaggerItem>
            <motion.div
              whileHover={{ y: -2 }}
              className="glass-panel rounded-[2rem] border border-white/10 p-6 md:p-8 shadow-xl"
            >
              <h2 className="text-xl md:text-2xl font-semibold text-white mb-6">
                Privacy & Security
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <Shield className="text-indigo-300 transition-all duration-300" size={20} />
                    <div>
                      <p className="font-medium text-white">
                        Account Security
                      </p>
                      <p className="text-sm text-white/60">
                        Your data is encrypted and secure
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </StaggerItem>

          {/* Help & Support Section - Fluid.so aesthetic */}
          <StaggerItem>
            <motion.div
              whileHover={{ y: -2 }}
              className="glass-panel rounded-[2rem] border border-white/10 p-6 md:p-8 shadow-xl"
            >
              <h2 className="text-xl md:text-2xl font-semibold text-white mb-6">
                Help & Support
              </h2>
              <div className="space-y-3">
                <motion.button
                  onClick={() => setActiveView('ai-help')}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 px-4 py-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 text-left"
                >
                  <HelpCircle size={20} className="text-indigo-300 transition-all duration-300" />
                  <div className="flex-1">
                    <p className="font-medium text-white">AI Help</p>
                    <p className="text-sm text-white/60">
                      Get help from our AI assistant
                    </p>
                  </div>
                </motion.button>
                <div className="flex items-center gap-3 px-4 py-4 rounded-xl border border-white/10 bg-white/5">
                  <Info size={20} className="text-indigo-300 transition-all duration-300" />
                  <div className="flex-1">
                    <p className="font-medium text-white">About</p>
                    <p className="text-sm text-white/60">
                      CampusConnect v8.3.0
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </StaggerItem>

          {/* Reset Preferences - Fluid.so aesthetic */}
          <StaggerItem>
            <motion.div
              whileHover={{ y: -2 }}
              className="glass-panel rounded-[2rem] border border-white/10 p-6 md:p-8 shadow-xl"
            >
              <h2 className="text-xl md:text-2xl font-semibold text-white mb-6">
                Reset Settings
              </h2>
              <motion.button
                onClick={() => {
                  if (confirm('Are you sure you want to reset all preferences to default?')) {
                    resetPreferences();
                  }
                }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-xl border border-red-500/30 bg-red-600/20 hover:bg-red-600/30 transition-all duration-300 text-left"
              >
                <RotateCcw size={20} className="text-red-300 transition-all duration-300" />
                <div className="flex-1">
                  <p className="font-medium text-red-200">Reset All Preferences</p>
                  <p className="text-sm text-white/60">
                    Restore all settings to default values
                  </p>
                </div>
              </motion.button>
            </motion.div>
          </StaggerItem>

          {/* Account Section - Fluid.so aesthetic */}
          <StaggerItem>
            <motion.div
              whileHover={{ y: -2 }}
              className="glass-panel rounded-[2rem] border border-white/10 p-6 md:p-8 shadow-xl"
            >
              <h2 className="text-xl md:text-2xl font-semibold text-white mb-6">
                Account
              </h2>
              <div className="space-y-3">
                {!isAdminRole(userRole) && (
                  <motion.button
                    onClick={() => setActiveView('profile')}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center gap-3 px-4 py-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 text-left"
                  >
                    <User size={20} className="text-indigo-300 transition-all duration-300" />
                    <div className="flex-1">
                      <p className="font-medium text-white">My Profile</p>
                      <p className="text-sm text-white/60">
                        View and edit your profile information
                      </p>
                    </div>
                  </motion.button>
                )}
                <motion.button
                  onClick={handleSignOut}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 px-4 py-4 rounded-xl border border-red-500/30 bg-red-600/20 hover:bg-red-600/30 transition-all duration-300 text-left"
                >
                  <LogOut size={20} className="text-red-300 transition-all duration-300" />
                  <div className="flex-1">
                    <p className="font-medium text-red-200">Sign Out</p>
                    <p className="text-sm text-white/60">
                      Sign out of your account
                    </p>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </div>
  );
};

export default Settings;

