import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { isAdminRole } from '../utils/helpers';
import { Moon, Sun, LogOut, User, Settings as SettingsIcon } from 'lucide-react';

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
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 md:p-6">
        <div className="flex items-center gap-3">
          <SettingsIcon className="text-indigo-600 dark:text-indigo-400" size={28} />
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
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Appearance
            </h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {darkMode ? (
                  <Sun className="text-yellow-500" size={24} />
                ) : (
                  <Moon className="text-gray-600 dark:text-gray-400" size={24} />
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
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  darkMode ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Account Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Account
            </h2>
            <div className="space-y-3">
              {!isAdminRole(userRole) && (
                <button
                  onClick={() => setActiveView('profile')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <User size={20} className="text-indigo-600 dark:text-indigo-400" />
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
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-left"
              >
                <LogOut size={20} className="text-red-600 dark:text-red-400" />
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

