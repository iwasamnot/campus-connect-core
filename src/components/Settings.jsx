import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePreferences } from '../context/PreferencesContext';
import { isAdminRole } from '../utils/helpers';
import { Moon, Sun, LogOut, User, Settings as SettingsIcon, Bell, Shield, HelpCircle, Info, Palette, Type, Eye, EyeOff, Forward, Keyboard, Volume2, VolumeX, RotateCcw } from 'lucide-react';

const Settings = ({ setActiveView }) => {
  const { userRole, signOut } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { preferences, updatePreference, resetPreferences } = usePreferences();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 animate-fade-in">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 md:p-6 animate-slide-in-down">
        <div className="flex items-center gap-3">
          <SettingsIcon className="text-indigo-600 dark:text-indigo-400 transition-all duration-300 ease-in-out transform hover:rotate-90" size={28} />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Settings
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage your preferences and account
            </p>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Appearance Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 card-hover animate-fade-in">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Appearance
            </h2>
            <div className="space-y-4">
              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {darkMode ? (
                    <Sun className="text-yellow-500 transition-all duration-300 ease-in-out" size={24} />
                  ) : (
                    <Moon className="text-gray-600 dark:text-gray-400 transition-all duration-300 ease-in-out" size={24} />
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {darkMode ? 'Light Mode' : 'Dark Mode'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Switch between light and dark themes
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-95 ${
                    darkMode ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ease-in-out ${
                      darkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Accent Color */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <Palette className="text-indigo-600 dark:text-indigo-400" size={20} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Accent Color</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Choose your preferred accent color
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
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
                      <button
                        key={color}
                        onClick={() => updatePreference('accentColor', color)}
                        style={{ backgroundColor: colorMap[color] }}
                        className={`h-10 rounded-lg border-2 transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-95 ${
                          preferences.accentColor === color
                            ? 'border-gray-900 dark:border-white ring-2 ring-offset-2'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                        title={color.charAt(0).toUpperCase() + color.slice(1)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Font Size */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <Type className="text-indigo-600 dark:text-indigo-400" size={20} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Font Size</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Adjust text size for better readability
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {['small', 'medium', 'large', 'xlarge'].map((size) => (
                    <button
                      key={size}
                      onClick={() => updatePreference('fontSize', size)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${
                        preferences.fontSize === size
                          ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Chat Preferences Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 card-hover animate-fade-in">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Chat Preferences
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Eye className="text-indigo-600 dark:text-indigo-400" size={20} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Read Receipts</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Show when messages are read
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => updatePreference('showReadReceipts', !preferences.showReadReceipts)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                    preferences.showReadReceipts ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all ${
                      preferences.showReadReceipts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Keyboard className="text-indigo-600 dark:text-indigo-400" size={20} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Typing Indicators</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Show when others are typing
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => updatePreference('showTypingIndicators', !preferences.showTypingIndicators)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                    preferences.showTypingIndicators ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all ${
                      preferences.showTypingIndicators ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Eye className="text-indigo-600 dark:text-indigo-400" size={20} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Online Status</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Show your online status to others
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => updatePreference('showOnlineStatus', !preferences.showOnlineStatus)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                    preferences.showOnlineStatus ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all ${
                      preferences.showOnlineStatus ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Forward className="text-indigo-600 dark:text-indigo-400" size={20} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Message Forwarding</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Allow forwarding messages
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => updatePreference('allowMessageForwarding', !preferences.allowMessageForwarding)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                    preferences.allowMessageForwarding ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all ${
                      preferences.allowMessageForwarding ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {preferences.soundEnabled ? (
                    <Volume2 className="text-indigo-600 dark:text-indigo-400" size={20} />
                  ) : (
                    <VolumeX className="text-gray-400" size={20} />
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Sound Effects</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Play sounds for notifications
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => updatePreference('soundEnabled', !preferences.soundEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                    preferences.soundEnabled ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all ${
                      preferences.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Keyboard className="text-indigo-600 dark:text-indigo-400" size={20} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Keyboard Shortcuts</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Enable keyboard shortcuts (Ctrl+K for help)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => updatePreference('keyboardShortcuts', !preferences.keyboardShortcuts)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                    preferences.keyboardShortcuts ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all ${
                      preferences.keyboardShortcuts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 card-hover animate-fade-in">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Notifications
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="text-indigo-600 dark:text-indigo-400 transition-all duration-300" size={20} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Browser Notifications
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get notified about new messages
                    </p>
                  </div>
                </div>
                <button
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 text-sm"
                >
                  Enable
                </button>
              </div>
            </div>
          </div>

          {/* Privacy & Security Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 card-hover animate-fade-in">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Privacy & Security
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Shield className="text-indigo-600 dark:text-indigo-400 transition-all duration-300" size={20} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Account Security
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your data is encrypted and secure
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Help & Support Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 card-hover animate-fade-in">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Help & Support
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => setActiveView('ai-help')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-95 hover:shadow-md text-left"
              >
                <HelpCircle size={20} className="text-indigo-600 dark:text-indigo-400 transition-all duration-300" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">AI Help</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get help from our AI assistant
                  </p>
                </div>
              </button>
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <Info size={20} className="text-indigo-600 dark:text-indigo-400 transition-all duration-300" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">About</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    CampusConnect v4.0.0
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Reset Preferences */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 card-hover animate-fade-in">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Reset Settings
            </h2>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to reset all preferences to default?')) {
                  resetPreferences();
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-95 hover:shadow-md text-left"
            >
              <RotateCcw size={20} className="text-red-600 dark:text-red-400 transition-all duration-300" />
              <div className="flex-1">
                <p className="font-medium text-red-600 dark:text-red-400">Reset All Preferences</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Restore all settings to default values
                </p>
              </div>
            </button>
          </div>

          {/* Account Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 card-hover animate-fade-in">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Account
            </h2>
            <div className="space-y-3">
              {!isAdminRole(userRole) && (
                <button
                  onClick={() => setActiveView('profile')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-95 hover:shadow-md text-left"
                >
                  <User size={20} className="text-indigo-600 dark:text-indigo-400 transition-all duration-300" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">My Profile</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      View and edit your profile information
                    </p>
                  </div>
                </button>
              )}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-95 hover:shadow-md text-left"
              >
                <LogOut size={20} className="text-red-600 dark:text-red-400 transition-all duration-300" />
                <div className="flex-1">
                  <p className="font-medium text-red-600 dark:text-red-400">Sign Out</p>
                  <p className="text-sm text-red-500 dark:text-red-500">
                    Sign out of your account
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

