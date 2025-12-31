import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { Mail, Lock, UserPlus, LogIn, Moon, Sun, RotateCcw, User, CheckCircle, AlertCircle } from 'lucide-react';
import Logo from './Logo';

const Login = () => {
  const { register, login, resetPassword, resendVerificationEmail } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { success, error: showError } = useToast();
  const [mode, setMode] = useState('login'); // 'login' or 'register' or 'reset'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);

  // Validate student email format: must start with "s20" and contain "@sistc.edu.au" or "@sistc.nsw.edu.au"
  const validateStudentEmail = (email) => {
    if (!email) return false;
    const emailLower = email.toLowerCase().trim(); // Trim whitespace
    return emailLower.startsWith('s20') && (emailLower.includes('@sistc.edu.au') || emailLower.includes('@sistc.nsw.edu.au'));
  };

  // Validate admin email format: must start with "admin" and contain "@campusconnect"
  const validateAdminEmail = (email) => {
    if (!email) return false;
    const emailLower = email.toLowerCase().trim(); // Trim whitespace
    return emailLower.startsWith('admin') && emailLower.includes('@campusconnect');
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (mode === 'register') {
        // Only allow student registration with valid email format
        if (!name.trim()) {
          setError('Please enter your full name.');
          setLoading(false);
          return;
        }
        
        // Validate email format
        if (!validateStudentEmail(email)) {
          setError('Email must start with "s20" and contain "@sistc.edu.au" or "@sistc.nsw.edu.au" (e.g., s20xxxxx@sistc.edu.au or s20xxxxx@sistc.nsw.edu.au). Only students can register.');
          setLoading(false);
          return;
        }
        
        // Check email confirmation
        if (email !== confirmEmail) {
          setError('Email addresses do not match. Please confirm your email.');
          setLoading(false);
          return;
        }
        
        // Check password confirmation
        if (password !== confirmPassword) {
          setError('Passwords do not match. Please confirm your password.');
          setLoading(false);
          return;
        }
        
        if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }
        await register(name.trim(), email, password, 'student');
        // Show success message about email verification
        setEmailVerificationSent(true);
        success('Registration successful! Please check your email to verify your account before logging in.');
      } else {
        // Validate email format for login - allow both student and admin emails
        const isStudentEmail = validateStudentEmail(email);
        const isAdminEmail = validateAdminEmail(email);
        
        // Debug logging
        console.log('Login attempt:', { email, isStudentEmail, isAdminEmail });
        
        if (!isStudentEmail && !isAdminEmail) {
          setError('Email must be either:\n- Student: start with "s20" and contain "@sistc.edu.au" or "@sistc.nsw.edu.au" (e.g., s20xxxxx@sistc.edu.au or s20xxxxx@sistc.nsw.edu.au)\n- Admin: start with "admin" and contain "@campusconnect" (e.g., admin1@campusconnect.com)');
          setLoading(false);
          return;
        }
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
        // Check if it's an admin email format
        if (validateAdminEmail(email)) {
          errorMessage += ' Admin account needs to be created in Firebase Console. See ADMIN_SETUP.md for instructions.';
        }
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (err.code === 'auth/email-not-verified') {
        // Don't show email verification error for admin emails
        if (validateAdminEmail(email)) {
          errorMessage = 'Admin login error. Please contact support if this issue persists.';
        } else {
          errorMessage = 'Please verify your email address before logging in. Check your inbox for the verification email.';
          setEmailVerificationSent(true);
        }
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

    // Validate email format for password reset - allow both student and admin emails
    const isStudentEmail = validateStudentEmail(email);
    const isAdminEmail = validateAdminEmail(email);
    
    if (!isStudentEmail && !isAdminEmail) {
      setError('Email must be either:\n- Student: start with "s20" and contain "@sistc.edu.au" or "@sistc.nsw.edu.au" (e.g., s20xxxxx@sistc.edu.au or s20xxxxx@sistc.nsw.edu.au)\n- Admin: start with "admin" and contain "@campusconnect" (e.g., admin1@campusconnect.com)');
      showError('Invalid email format. Must be a valid student or admin email.');
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
        className="absolute top-4 right-4 p-3 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 z-50 hover:border-indigo-400 dark:hover:border-indigo-500"
        aria-label="Toggle dark mode"
        type="button"
      >
        {darkMode ? (
          <Sun className="text-yellow-500 dark:text-yellow-400" size={24} />
        ) : (
          <Moon className="text-black dark:text-white" size={24} />
        )}
      </button>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="large" className="mb-4" />
          <p className="text-black dark:text-white mt-2 font-medium">Secure Student Messaging Platform</p>
        </div>

        {/* Toggle between Login and Register */}
        <div className="flex mb-6 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-1 gap-1">
          <button
            onClick={() => {
              setMode('login');
              setError(null);
              setConfirmEmail('');
              setConfirmPassword('');
              setEmailVerificationSent(false);
            }}
            className={`flex-1 py-3 px-4 rounded-md font-bold text-base transition-all duration-200 ${
              mode === 'login'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-transparent text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-800/50'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setMode('register');
              setError(null);
              setConfirmEmail('');
              setConfirmPassword('');
              setEmailVerificationSent(false);
            }}
            className={`flex-1 py-3 px-4 rounded-md font-bold text-base transition-all duration-200 ${
              mode === 'register'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-transparent text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-800/50'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg text-sm flex items-start gap-2">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {emailVerificationSent && (
          <div className="mb-4 p-4 bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-400 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm">
            <div className="flex items-start gap-2 mb-2">
              <CheckCircle size={18} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">Verification Email Sent!</p>
                <p className="mt-1">Please check your email inbox and click the verification link to activate your account.</p>
              </div>
            </div>
            {mode === 'login' && (
              <button
                type="button"
                onClick={async () => {
                  setResendingVerification(true);
                  try {
                    await resendVerificationEmail();
                    success('Verification email resent! Please check your inbox.');
                  } catch (err) {
                    showError('Failed to resend verification email. Please try again.');
                  } finally {
                    setResendingVerification(false);
                  }
                }}
                disabled={resendingVerification}
                className="mt-2 text-sm text-indigo-700 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-200 hover:underline font-medium disabled:opacity-50"
              >
                {resendingVerification ? 'Sending...' : 'Resend Verification Email'}
              </button>
            )}
          </div>
        )}

        <form onSubmit={mode === 'reset' ? handlePasswordReset : handleEmailAuth} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  <User className="inline mr-2" size={16} />
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black dark:text-white opacity-50" size={20} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
                    disabled={loading}
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                <Mail className="inline mr-2" size={16} />
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black dark:text-white opacity-50" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter Your Email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
                  disabled={loading}
                />
              </div>
            </div>
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  <Mail className="inline mr-2" size={16} />
                  Confirm Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black dark:text-white opacity-50" size={20} />
                  <input
                    type="email"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    placeholder="Confirm your email"
                    required
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                      confirmEmail && email !== confirmEmail
                        ? 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-600 focus:border-indigo-600'
                    }`}
                    disabled={loading}
                  />
                </div>
                {confirmEmail && email !== confirmEmail && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1 ml-1">
                    Email addresses do not match
                  </p>
                )}
              </div>
            )}

            {mode !== 'reset' && (
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  <Lock className="inline mr-2" size={16} />
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
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  <Lock className="inline mr-2" size={16} />
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black dark:text-white opacity-50" size={20} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    minLength={6}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                      confirmPassword && password !== confirmPassword
                        ? 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-600 focus:border-indigo-600'
                    }`}
                    disabled={loading}
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1 ml-1">
                    Passwords do not match
                  </p>
                )}
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
