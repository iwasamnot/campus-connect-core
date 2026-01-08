import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { Mail, Lock, UserPlus, LogIn, Moon, Sun, RotateCcw, User, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
// Import Logo directly - it's in main bundle so no code-splitting issues
import Logo from '../components/Logo.jsx';
import ContactForm from '../components/ContactForm';
import { sanitizeEmail, sanitizeText } from '../utils/sanitize';
import { isValidStudentEmail, isValidAdminEmail, validatePassword, validateName } from '../utils/validation';
import { handleError } from '../utils/errorHandler';
import { keyboard } from '../utils/accessibility';

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
  const [showContactForm, setShowContactForm] = useState(false);

  // Memoized validation functions using imported utilities
  const validateStudentEmail = useCallback((email) => {
    return isValidStudentEmail(email);
  }, []);

  const validateAdminEmail = useCallback((email) => {
    return isValidAdminEmail(email);
  }, []);

  const handleEmailAuth = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (mode === 'register') {
        // Sanitize and validate name
        const sanitizedName = sanitizeText(name);
        const nameValidation = validateName(sanitizedName);
        if (!nameValidation.isValid) {
          setError(nameValidation.errors[0]);
          setLoading(false);
          return;
        }
        
        // Sanitize and validate email
        const sanitizedEmail = sanitizeEmail(email);
        if (!validateStudentEmail(sanitizedEmail)) {
          setError('Invalid email address. Only students with valid email addresses can register.');
          setLoading(false);
          return;
        }
        
        // Check email confirmation
        if (sanitizedEmail !== sanitizeEmail(confirmEmail)) {
          setError('Email addresses do not match. Please confirm your email.');
          setLoading(false);
          return;
        }
        
        // Validate password
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
          setError(passwordValidation.errors[0]);
          setLoading(false);
          return;
        }
        
        // Check password confirmation
        if (password !== confirmPassword) {
          setError('Passwords do not match. Please confirm your password.');
          setLoading(false);
          return;
        }
        
        await register(sanitizedName, sanitizedEmail, password, 'student');
        setEmailVerificationSent(true);
        success('Registration successful! Please check your email to verify your account before logging in.');
      } else {
        // Sanitize email
        const sanitizedEmail = sanitizeEmail(email);
        const isStudentEmail = validateStudentEmail(sanitizedEmail);
        const isAdminEmail = validateAdminEmail(sanitizedEmail);
        
        if (!isStudentEmail && !isAdminEmail) {
          setError('Invalid email address. Please use a valid student or admin email.');
          setLoading(false);
          return;
        }
        await login(sanitizedEmail, password);
      }
    } catch (err) {
      const { message } = handleError(err, 'Login/Register', (errorMessage) => {
        setError(errorMessage);
      });
      
      // Special handling for email verification
      if (err.code === 'auth/email-not-verified' || err.code === 'EMAIL_NOT_VERIFIED') {
        if (validateAdminEmail(email)) {
          setError('Admin login error. Please contact support if this issue persists.');
        } else {
          setError('Please verify your email address before logging in. Check your inbox for the verification email.');
          setEmailVerificationSent(true);
        }
      } else {
        setError(message);
      }
      
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [mode, name, email, confirmEmail, password, confirmPassword, register, login, success, showError, validateStudentEmail, validateAdminEmail]);

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
      setError('Invalid email address. Please use a valid student or admin email.');
      showError('Invalid email address.');
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
    // Use a dedicated scroll container for Login/Register on mobile/PWA.
    // This prevents the viewport from getting "stuck" in standalone mode when the keyboard opens.
    <div className="h-screen h-[100dvh] overflow-y-auto bg-white dark:bg-gray-900 animate-fade-in">
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center p-4 relative">
      {/* Dark Mode Toggle Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleDarkMode();
        }}
        className="absolute top-4 right-4 p-3 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50 hover:border-indigo-400 dark:hover:border-indigo-500 animate-spring"
        aria-label="Toggle dark mode"
        type="button"
      >
        {darkMode ? (
          <Sun className="text-yellow-500 dark:text-yellow-400" size={24} />
        ) : (
          <Moon className="text-black dark:text-white" size={24} />
        )}
      </button>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-8 w-full max-w-md animate-zoom-in">
        <div className="text-center mb-8 animate-slide-down-fade">
          <Logo size="large" className="mb-4 animate-bounce-in" />
          <p className="text-black dark:text-white mt-2 font-medium animate-slide-up-fade">Secure Student Messaging Platform</p>
        </div>

        {/* Toggle between Login and Register */}
        <div className="flex mb-6 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-1 gap-1 animate-slide-left-fade">
          <button
            onClick={() => {
              setMode('login');
              setError(null);
              setConfirmEmail('');
              setConfirmPassword('');
              setEmailVerificationSent(false);
            }}
            className={`flex-1 py-3 px-4 rounded-md font-bold text-base transition-all duration-300 transform hover:scale-105 active:scale-95 ${
              mode === 'login'
                ? 'bg-indigo-600 text-white shadow-lg animate-spring'
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
            className={`flex-1 py-3 px-4 rounded-md font-bold text-base transition-all duration-300 transform hover:scale-105 active:scale-95 ${
              mode === 'register'
                ? 'bg-indigo-600 text-white shadow-lg animate-spring'
                : 'bg-transparent text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-800/50'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg text-sm flex items-start gap-2 animate-slide-right-fade animate-shake">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0 animate-wiggle" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {emailVerificationSent && (
          <div className="mb-4 p-4 bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-400 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm animate-slide-up-fade">
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
                <label htmlFor="register-name" className="block text-sm font-medium text-black dark:text-white mb-2">
                  <User className="inline mr-2" size={16} />
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black dark:text-white opacity-50" size={20} />
                  <input
                    type="text"
                    id="register-name"
                    name="name"
                    autoComplete="name"
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
              <label htmlFor="login-email" className="block text-sm font-medium text-black dark:text-white mb-2">
                <Mail className="inline mr-2" size={16} />
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black dark:text-white opacity-50" size={20} />
                <input
                  type="email"
                  id="login-email"
                  name="email"
                  autoComplete="email"
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
                <label htmlFor="register-confirm-email" className="block text-sm font-medium text-black dark:text-white mb-2">
                  <Mail className="inline mr-2" size={16} />
                  Confirm Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black dark:text-white opacity-50" size={20} />
                  <input
                    type="email"
                    id="register-confirm-email"
                    name="confirmEmail"
                    autoComplete="email"
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
                <label htmlFor="login-password" className="block text-sm font-medium text-black dark:text-white mb-2">
                  <Lock className="inline mr-2" size={16} />
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black dark:text-white opacity-50" size={20} />
                  <input
                    type="password"
                    id="login-password"
                    name="password"
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
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
                <label htmlFor="register-confirm-password" className="block text-sm font-medium text-black dark:text-white mb-2">
                  <Lock className="inline mr-2" size={16} />
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black dark:text-white opacity-50" size={20} />
                  <input
                    type="password"
                    id="register-confirm-password"
                    name="confirmPassword"
                    autoComplete="new-password"
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
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] animate-slide-up-fade hover:animate-glow"
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

        {/* Contact Admin Button */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowContactForm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium"
          >
            <MessageSquare size={18} />
            <span>Contact Admin</span>
          </button>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
            Not a user? Send a message to the administrator
          </p>
        </div>
        
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <ContactForm onClose={() => setShowContactForm(false)} />
      )}
    </div>
    </div>
  );
};

export default Login;
