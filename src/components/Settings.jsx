import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { isAdminRole } from '../utils/helpers';
import { Moon, Sun, LogOut, User, Settings as SettingsIcon, Bell, Shield, HelpCircle, Info } from 'lucide-react';

const Settings = ({ setActiveView }) => {
  const { userRole, signOut } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

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
                    CampusConnect v2.0.0
                  </p>
                </div>
              </div>
            </div>
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

