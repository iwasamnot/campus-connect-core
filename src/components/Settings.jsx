import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePreferences } from '../context/PreferencesContext';
// Use window globals to avoid import/export issues
const isAdminRole = typeof window !== 'undefined' && window.__isAdminRole 
  ? window.__isAdminRole 
  : (role) => role === 'admin' || role === 'admin1';
import { 
  LogOut, User, Settings as SettingsIcon, Bell, Shield, HelpCircle, Info, 
  Palette, Type, Eye, EyeOff, Forward, Keyboard, Volume2, VolumeX, RotateCcw, Sparkles, 
  Minus, Droplet, Database, Download, Trash2, Lock, Globe, Smartphone, Monitor, Laptop,
  HardDrive, Wifi, WifiOff, Mic, MicOff, Camera, CameraOff, MapPin, MapPinOff, 
  MessageSquare, Mail, Phone, Calendar, Clock, Users, UserCheck, UserX, FileText,
  Zap, TrendingUp, BarChart, Activity, Target, Award, ChevronRight, CheckCircle2,
  XCircle, AlertCircle, Plus, Edit3, Save, Copy, ExternalLink, RefreshCw
} from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from './AnimatedComponents';
import { useToast } from '../context/ToastContext';

const Settings = ({ setActiveView }) => {
  const { user, userRole, signOut } = useAuth();
  const { themeStyle, changeThemeStyle } = useTheme();
  const { preferences, updatePreference, resetPreferences } = usePreferences();
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState('appearance');
  const [exporting, setExporting] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      showError('Failed to sign out. Please try again.');
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      // Export user preferences and settings
      const data = {
        preferences,
        themeStyle,
        exportDate: new Date().toISOString(),
        version: '8.3.0'
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campus-connect-settings-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      success('Settings exported successfully!');
    } catch (err) {
      console.error('Error exporting data:', err);
      showError('Failed to export settings. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleClearCache = () => {
    if (confirm('Are you sure you want to clear all cached data? This will sign you out.')) {
      localStorage.clear();
      sessionStorage.clear();
      success('Cache cleared. Signing out...');
      setTimeout(() => {
        handleSignOut();
      }, 1000);
    }
  };

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'chat', label: 'Chat & Messaging', icon: MessageSquare },
    { id: 'accessibility', label: 'Accessibility', icon: Eye },
    { id: 'data', label: 'Data & Storage', icon: Database },
    { id: 'account', label: 'Account', icon: User }
  ];

  const SettingToggle = ({ label, desc, icon: Icon, value, onChange, disabled = false }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className={`${value ? 'text-indigo-300' : 'text-white/50'} transition-colors`} size={20} />
        <div>
          <p className="font-medium text-white">{label}</p>
          <p className="text-sm text-white/60">{desc}</p>
        </div>
      </div>
      <motion.button
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        whileHover={disabled ? {} : { scale: 1.05 }}
        whileTap={disabled ? {} : { scale: 0.95 }}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
          value ? 'bg-indigo-600' : 'bg-white/20'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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

  const SettingSection = ({ title, icon: Icon, children }) => (
    <motion.div
      whileHover={{ y: -2 }}
      className="glass-panel rounded-[2rem] border border-white/10 p-6 md:p-8 shadow-xl"
    >
      <div className="flex items-center gap-3 mb-6">
        {Icon && <Icon className="text-indigo-300" size={24} />}
        <h2 className="text-xl md:text-2xl font-semibold text-white">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </motion.div>
  );

  return (
    <div className="h-full min-h-0 flex flex-col bg-transparent relative overflow-hidden">
      {/* Header */}
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
          <div className="flex items-center justify-between">
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
                  Customize your CampusConnect experience
                </p>
              </div>
            </div>
            {user && (
              <div className="text-right">
                <p className="text-sm text-white/60">Logged in as</p>
                <p className="text-sm font-medium text-white">{user.email || 'User'}</p>
              </div>
            )}
          </div>
        </motion.div>
      </FadeIn>

      {/* Tabs Navigation */}
      <div className="flex-shrink-0 glass-panel border-b border-white/10 px-4 py-2 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={18} />
                <span className="whitespace-nowrap">{tab.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'appearance' && (
              <motion.div
                key="appearance"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <SettingSection title="Theme" icon={Palette}>
                  <div className="space-y-4">
                    <div className="pt-4">
                      <div className="mb-4">
                        <p className="font-medium text-white mb-2">Theme Style</p>
                        <p className="text-sm text-white/60">Choose your preferred design style</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { id: 'fluid', icon: Droplet, label: 'Fluid', desc: 'Glassmorphism & Aurora' },
                          { id: 'fun', icon: Sparkles, label: 'Fun', desc: 'Colorful & Playful' },
                          { id: 'minimal', icon: Minus, label: 'Minimal', desc: 'Sleek & Modern' }
                        ].map((style) => {
                          const Icon = style.icon;
                          return (
                            <motion.button
                              key={style.id}
                              onClick={() => changeThemeStyle(style.id)}
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl border-2 transition-all duration-300 ${
                                themeStyle === style.id
                                  ? 'border-indigo-500 bg-indigo-600/30 text-white shadow-lg'
                                  : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10'
                              }`}
                            >
                              <Icon size={20} className="text-indigo-400" />
                              <span className="font-medium text-sm">{style.label}</span>
                              <span className="text-xs opacity-75 text-center">{style.desc}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                    {(themeStyle === 'fun' || themeStyle === 'fluid') && (
                      <div className="pt-4 border-t border-white/10">
                        <div className="mb-4">
                          <p className="font-medium text-white mb-2">Accent Color</p>
                          <p className="text-sm text-white/60">Choose your preferred accent color</p>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          {['indigo', 'blue', 'purple', 'pink', 'red', 'orange', 'green', 'teal'].map((color) => {
                            const colorMap = {
                              indigo: '#6366f1', blue: '#3b82f6', purple: '#8b5cf6', pink: '#ec4899',
                              red: '#ef4444', orange: '#f97316', green: '#10b981', teal: '#14b8a6'
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
                    <div className="pt-4 border-t border-white/10">
                      <div className="mb-4">
                        <p className="font-medium text-white mb-2">Font Size</p>
                        <p className="text-sm text-white/60">Adjust text size for better readability</p>
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
                </SettingSection>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <SettingSection title="Browser Notifications" icon={Bell}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex items-center gap-3">
                        <Bell className="text-indigo-300" size={20} />
                        <div>
                          <p className="font-medium text-white">Browser Notifications</p>
                          <p className="text-sm text-white/60">Get notified about new messages</p>
                        </div>
                      </div>
                      <motion.button
                        onClick={async () => {
                          if ('Notification' in window) {
                            const permission = await Notification.requestPermission();
                            if (permission === 'granted') {
                              success('Notifications enabled!');
                            } else {
                              showError('Please enable notifications in your browser settings.');
                            }
                          } else {
                            showError('Your browser does not support notifications.');
                          }
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all text-sm font-medium"
                      >
                        Enable
                      </motion.button>
                    </div>
                    <SettingToggle
                      label="Sound Effects"
                      desc="Play sounds for notifications and messages"
                      icon={preferences.soundEnabled ? Volume2 : VolumeX}
                      value={preferences.soundEnabled || false}
                      onChange={(val) => updatePreference('soundEnabled', val)}
                    />
                    <SettingToggle
                      label="Message Notifications"
                      desc="Notify when you receive new messages"
                      icon={Mail}
                      value={preferences.messageNotifications !== false}
                      onChange={(val) => updatePreference('messageNotifications', val)}
                    />
                    <SettingToggle
                      label="Group Notifications"
                      desc="Notify about group activity"
                      icon={Users}
                      value={preferences.groupNotifications !== false}
                      onChange={(val) => updatePreference('groupNotifications', val)}
                    />
                    <SettingToggle
                      label="Mention Notifications"
                      desc="Notify when you're mentioned"
                      icon={UserCheck}
                      value={preferences.mentionNotifications !== false}
                      onChange={(val) => updatePreference('mentionNotifications', val)}
                    />
                  </div>
                </SettingSection>
              </motion.div>
            )}

            {activeTab === 'privacy' && (
              <motion.div
                key="privacy"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <SettingSection title="Privacy Settings" icon={Shield}>
                  <div className="space-y-4">
                    <SettingToggle
                      label="Online Status"
                      desc="Show your online status to others"
                      icon={Eye}
                      value={preferences.showOnlineStatus !== false}
                      onChange={(val) => updatePreference('showOnlineStatus', val)}
                    />
                    <SettingToggle
                      label="Read Receipts"
                      desc="Let others know when you read their messages"
                      icon={Eye}
                      value={preferences.showReadReceipts || false}
                      onChange={(val) => updatePreference('showReadReceipts', val)}
                    />
                    <SettingToggle
                      label="Profile Visibility"
                      desc="Allow others to view your profile"
                      icon={User}
                      value={preferences.profileVisible !== false}
                      onChange={(val) => updatePreference('profileVisible', val)}
                    />
                    <SettingToggle
                      label="Location Sharing"
                      desc="Share your location with nearby users (if available)"
                      icon={MapPin}
                      value={preferences.locationSharing || false}
                      onChange={(val) => updatePreference('locationSharing', val)}
                    />
                    <SettingToggle
                      label="Block Unknown Contacts"
                      desc="Only receive messages from known contacts"
                      icon={UserX}
                      value={preferences.blockUnknown || false}
                      onChange={(val) => updatePreference('blockUnknown', val)}
                    />
                  </div>
                </SettingSection>
                <SettingSection title="Security" icon={Lock}>
                  <div className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <Shield className="text-indigo-300" size={20} />
                        <p className="font-medium text-white">Account Security</p>
                      </div>
                      <p className="text-sm text-white/60">Your data is encrypted and secure</p>
                    </div>
                    <motion.button
                      onClick={() => {
                        if (confirm('This will clear all your data and sign you out. Continue?')) {
                          handleClearCache();
                        }
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center gap-3 px-4 py-4 rounded-xl border border-red-500/30 bg-red-600/20 hover:bg-red-600/30 transition-all text-left"
                    >
                      <Trash2 className="text-red-300" size={20} />
                      <div className="flex-1">
                        <p className="font-medium text-red-200">Clear All Data</p>
                        <p className="text-sm text-white/60">Remove all cached data and preferences</p>
                      </div>
                    </motion.button>
                  </div>
                </SettingSection>
              </motion.div>
            )}

            {activeTab === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <SettingSection title="Chat Preferences" icon={MessageSquare}>
                  <div className="space-y-4">
                    <SettingToggle
                      label="Typing Indicators"
                      desc="Show when others are typing"
                      icon={Keyboard}
                      value={preferences.showTypingIndicators !== false}
                      onChange={(val) => updatePreference('showTypingIndicators', val)}
                    />
                    <SettingToggle
                      label="Message Forwarding"
                      desc="Allow forwarding messages to other chats"
                      icon={Forward}
                      value={preferences.allowMessageForwarding !== false}
                      onChange={(val) => updatePreference('allowMessageForwarding', val)}
                    />
                    <SettingToggle
                      label="Auto-save Messages"
                      desc="Automatically save important messages"
                      icon={Save}
                      value={preferences.autoSaveMessages !== false}
                      onChange={(val) => updatePreference('autoSaveMessages', val)}
                    />
                    <SettingToggle
                      label="Compact Mode"
                      desc="Use compact message display"
                      icon={Minus}
                      value={preferences.compactMode || false}
                      onChange={(val) => updatePreference('compactMode', val)}
                    />
                    <SettingToggle
                      label="Emoji Reactions"
                      desc="Enable emoji reactions on messages"
                      icon={Sparkles}
                      value={preferences.emojiReactions !== false}
                      onChange={(val) => updatePreference('emojiReactions', val)}
                    />
                  </div>
                </SettingSection>
              </motion.div>
            )}

            {activeTab === 'accessibility' && (
              <motion.div
                key="accessibility"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <SettingSection title="Accessibility Options" icon={Eye}>
                  <div className="space-y-4">
                    <SettingToggle
                      label="High Contrast Mode"
                      desc="Increase contrast for better visibility"
                      icon={Eye}
                      value={preferences.highContrast || false}
                      onChange={(val) => updatePreference('highContrast', val)}
                    />
                    <SettingToggle
                      label="Reduce Motion"
                      desc="Minimize animations and transitions"
                      icon={Activity}
                      value={preferences.reduceMotion || false}
                      onChange={(val) => updatePreference('reduceMotion', val)}
                    />
                    <SettingToggle
                      label="Keyboard Shortcuts"
                      desc="Enable keyboard shortcuts (Ctrl+K for help)"
                      icon={Keyboard}
                      value={preferences.keyboardShortcuts !== false}
                      onChange={(val) => updatePreference('keyboardShortcuts', val)}
                    />
                    <SettingToggle
                      label="Screen Reader Support"
                      desc="Optimize for screen readers"
                      icon={Eye}
                      value={preferences.screenReader || false}
                      onChange={(val) => updatePreference('screenReader', val)}
                    />
                  </div>
                </SettingSection>
              </motion.div>
            )}

            {activeTab === 'data' && (
              <motion.div
                key="data"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <SettingSection title="Data Management" icon={Database}>
                  <div className="space-y-4">
                    <motion.button
                      onClick={handleExportData}
                      disabled={exporting}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center gap-3 px-4 py-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-left"
                    >
                      <Download className="text-indigo-300" size={20} />
                      <div className="flex-1">
                        <p className="font-medium text-white">Export Settings</p>
                        <p className="text-sm text-white/60">Download your preferences as JSON</p>
                      </div>
                      {exporting && <RefreshCw className="animate-spin text-indigo-300" size={20} />}
                    </motion.button>
                    <SettingToggle
                      label="Auto-delete Old Messages"
                      desc="Automatically delete messages older than specified days"
                      icon={Trash2}
                      value={preferences.autoDeleteMessages || false}
                      onChange={(val) => updatePreference('autoDeleteMessages', val)}
                    />
                    {preferences.autoDeleteMessages && (
                      <div className="ml-8 p-3 bg-white/5 rounded-lg border border-white/10">
                        <label className="text-sm text-white/60 mb-2 block">Auto-delete after (days)</label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={preferences.autoDeleteDays || 30}
                          onChange={(e) => updatePreference('autoDeleteDays', parseInt(e.target.value))}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                        />
                      </div>
                    )}
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <HardDrive className="text-indigo-300" size={20} />
                        <p className="font-medium text-white">Storage Usage</p>
                      </div>
                      <p className="text-sm text-white/60">
                        Cache and local storage: ~{Math.round((localStorage.length || 0) / 1024)}KB
                      </p>
                    </div>
                  </div>
                </SettingSection>
              </motion.div>
            )}

            {activeTab === 'account' && (
              <motion.div
                key="account"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <SettingSection title="Account Settings" icon={User}>
                  <div className="space-y-4">
                    {!isAdminRole(userRole) && (
                      <motion.button
                        onClick={() => setActiveView('profile')}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center gap-3 px-4 py-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-left"
                      >
                        <User className="text-indigo-300" size={20} />
                        <div className="flex-1">
                          <p className="font-medium text-white">My Profile</p>
                          <p className="text-sm text-white/60">View and edit your profile information</p>
                        </div>
                        <ChevronRight className="text-white/40" size={20} />
                      </motion.button>
                    )}
                    {user && (
                      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-sm text-white/60 mb-1">Email</p>
                        <p className="font-medium text-white">{user.email || 'N/A'}</p>
                      </div>
                    )}
                  </div>
                </SettingSection>
                <SettingSection title="Help & Support" icon={HelpCircle}>
                  <div className="space-y-3">
                    <motion.button
                      onClick={() => setActiveView('ai-help')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center gap-3 px-4 py-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-left"
                    >
                      <HelpCircle className="text-indigo-300" size={20} />
                      <div className="flex-1">
                        <p className="font-medium text-white">AI Help</p>
                        <p className="text-sm text-white/60">Get help from our AI assistant</p>
                      </div>
                      <ChevronRight className="text-white/40" size={20} />
                    </motion.button>
                    <div className="flex items-center gap-3 px-4 py-4 rounded-xl border border-white/10 bg-white/5">
                      <Info className="text-indigo-300" size={20} />
                      <div className="flex-1">
                        <p className="font-medium text-white">About</p>
                        <p className="text-sm text-white/60">CampusConnect v8.3.0</p>
                      </div>
                    </div>
                  </div>
                </SettingSection>
                <SettingSection title="Reset Settings" icon={RotateCcw}>
                  <motion.button
                    onClick={() => {
                      if (confirm('Are you sure you want to reset all preferences to default?')) {
                        resetPreferences();
                        success('All preferences reset to default');
                      }
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center gap-3 px-4 py-4 rounded-xl border border-red-500/30 bg-red-600/20 hover:bg-red-600/30 transition-all text-left"
                  >
                    <RotateCcw className="text-red-300" size={20} />
                    <div className="flex-1">
                      <p className="font-medium text-red-200">Reset All Preferences</p>
                      <p className="text-sm text-white/60">Restore all settings to default values</p>
                    </div>
                  </motion.button>
                </SettingSection>
                <SettingSection title="Sign Out" icon={LogOut}>
                  <motion.button
                    onClick={handleSignOut}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center gap-3 px-4 py-4 rounded-xl border border-red-500/30 bg-red-600/20 hover:bg-red-600/30 transition-all text-left"
                  >
                    <LogOut className="text-red-300" size={20} />
                    <div className="flex-1">
                      <p className="font-medium text-red-200">Sign Out</p>
                      <p className="text-sm text-white/60">Sign out of your account</p>
                    </div>
                  </motion.button>
                </SettingSection>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Settings;
