import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { Mail, Lock, UserPlus, LogIn, Moon, Sun, RotateCcw } from 'lucide-react';
import Logo from './Logo';

const Login = () => {
  const { register, login, resetPassword } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { success, error: showError } = useToast();
  const [mode, setMode] = useState('login'); // 'login' or 'register' or 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (mode === 'register') {
        // Only allow student registration
        if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }
        await register(email, password, 'student');
      } else {
        await login(email, password);
      }
    } catch (err) {
      let errorMessage = 'An error occurred. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please login instead.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email. Please create an account first.';
        if (email === 'admin@admin.com') {
          errorMessage += ' Admin account needs to be created in Firebase Console. See ADMIN_SETUP.md for instructions.';
        }
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      setError(errorMessage);
      showError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      showError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await resetPassword(email);
      success('Password reset email sent! Please check your inbox.');
      setMode('login');
    } catch (err) {
      let errorMessage = 'Failed to send password reset email. Please try again.';
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4 relative">
      {/* Dark Mode Toggle Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleDarkMode();
        }}
        className="absolute top-4 right-4 p-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 z-50"
        aria-label="Toggle dark mode"
        type="button"
      >
        {darkMode ? (
          <Sun className="text-yellow-500 dark:text-yellow-400" size={24} />
        ) : (
          <Moon className="text-black dark:text-white" size={24} />
        )}
      </button>

      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="large" className="mb-4" />
          <p className="text-black dark:text-white mt-2 font-medium">Secure Student Messaging Platform</p>
        </div>

        {/* Toggle between Login and Register - Cyan background with readable text */}
        <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 gap-1 border-2 border-gray-200 dark:border-gray-600">
          <button
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-3 px-4 rounded-md font-bold text-base transition-all duration-200 ${
              mode === 'login'
                ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-400 ring-offset-2'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-3 px-4 rounded-md font-bold text-base transition-all duration-200 ${
              mode === 'register'
                ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-400 ring-offset-2'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border-2 border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={mode === 'reset' ? handlePasswordReset : handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black dark:text-white opacity-50" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black dark:text-white opacity-50" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'register' ? 'At least 6 characters' : 'Enter your password'}
                    required
                    minLength={mode === 'register' ? 6 : undefined}
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                  <span>Processing...</span>
                </>
              ) : mode === 'register' ? (
                <>
                  <UserPlus size={20} />
                  <span>Create Account</span>
                </>
              ) : mode === 'reset' ? (
                <>
                  <RotateCcw size={20} />
                  <span>Send Reset Email</span>
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

        {mode !== 'reset' && (
          <button
            onClick={() => {
              setMode('reset');
              setError(null);
            }}
            className="w-full mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline font-medium transition-colors"
          >
            Forgot your password?
          </button>
        )}

        <p className="text-center text-sm text-black dark:text-white opacity-80 mt-6">
          {mode === 'register' 
            ? 'Already have an account? Switch to Login mode.'
            : mode === 'reset'
            ? 'Remember your password? Switch to Login mode.'
            : "Don't have an account? Switch to Register mode."}
        </p>
      </div>
    </div>
  );
};

export default Login;
