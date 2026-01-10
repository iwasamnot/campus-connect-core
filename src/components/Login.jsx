import { useState, useCallback, useMemo, useEffect } from 'react';
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

const Login = ({ onBack, initialMode = 'login' }) => {
  const { register, login, resetPassword, resendVerificationEmail } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { success, error: showError } = useToast();
  const [mode, setMode] = useState(initialMode); // 'login' or 'register' or 'reset'
  
  // Update mode when initialMode changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);
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


  // Generate floating particles for background
  const [particles] = useState(() => 
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 15,
      duration: 12 + Math.random() * 8,
      size: 80 + Math.random() * 100,
    }))
  );

  return (
    // Use a dedicated scroll container for Login/Register on mobile/PWA.
    // This prevents the viewport from getting "stuck" in standalone mode when the keyboard opens.
    <div className="h-screen h-[100dvh] overflow-y-auto bg-white dark:bg-gray-900 relative">
      {/* Fluid Animated Background Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-gradient-to-br from-indigo-100/20 via-purple-100/15 to-pink-100/20 dark:from-indigo-900/15 dark:via-purple-900/10 dark:to-pink-900/15 blur-3xl"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animation: `float-particles ${particle.duration}s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center p-4 relative z-10 safe-area-inset" style={{
        paddingTop: `max(1rem, env(safe-area-inset-top, 0px) + 1rem)`,
        paddingBottom: `max(1rem, env(safe-area-inset-bottom, 0px) + 1rem)`,
        paddingLeft: `max(1rem, env(safe-area-inset-left, 0px) + 1rem)`,
        paddingRight: `max(1rem, env(safe-area-inset-right, 0px) + 1rem)`
      }}>
        {/* Minimal Navigation Bar */}
        <div className="absolute top-0 left-0 right-0 z-50 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo size="small" showText={false} />
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleDarkMode();
                }}
                className="p-2 rounded-full hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-300 transform hover:scale-110"
                aria-label="Toggle dark mode"
                type="button"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" size={20} />
                ) : (
                  <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" size={20} />
                )}
              </button>
              {onBack && (
                <button
                  onClick={onBack}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-all duration-300 rounded-full hover:bg-gray-100/80 dark:hover:bg-gray-800/80"
                >
                  Back
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Minimal Form Container */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-2xl border border-gray-200/50 dark:border-gray-700/50 rounded-3xl p-8 w-full max-w-md pt-24 pb-8">
          <div className="text-center mb-8">
            <div className="mb-6 animate-float-slow">
              <Logo size="large" showText={false} />
            </div>
            <h1 className="text-3xl font-light text-black dark:text-white mb-2">
              {mode === 'register' ? 'Create Account' : mode === 'reset' ? 'Reset Password' : 'Welcome Back'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
              {mode === 'register' ? 'Join your campus community' : mode === 'reset' ? 'Recover your account' : 'Sign in to continue'}
            </p>
          </div>

        {/* Minimal Toggle between Login and Register */}
        <div className="flex mb-8 bg-gray-100/50 dark:bg-gray-700/30 rounded-full p-1 gap-1">
          <button
            onClick={() => {
              setMode('login');
              setError(null);
              setConfirmEmail('');
              setConfirmPassword('');
              setEmailVerificationSent(false);
            }}
            className={`flex-1 py-2.5 px-4 rounded-full font-medium text-sm transition-all duration-300 ${
              mode === 'login'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
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
            className={`flex-1 py-2.5 px-4 rounded-full font-medium text-sm transition-all duration-300 ${
              mode === 'register'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50/80 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-full text-sm flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <div className="flex-1 font-light">{error}</div>
          </div>
        )}

        {emailVerificationSent && (
          <div className="mb-4 p-4 bg-indigo-50/80 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 rounded-full text-sm">
            <div className="flex items-start gap-2 mb-2">
              <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-xs">Verification Email Sent!</p>
                <p className="mt-1 text-xs font-light">Check your inbox to activate your account.</p>
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
                    className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-light disabled:opacity-50 transition-colors"
              >
                {resendingVerification ? 'Sending...' : 'Resend Verification Email'}
              </button>
            )}
          </div>
        )}

        <form onSubmit={mode === 'reset' ? handlePasswordReset : handleEmailAuth} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label htmlFor="register-name" className="block text-xs font-light text-gray-600 dark:text-gray-400 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                  <input
                    type="text"
                    id="register-name"
                    name="name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-full bg-gray-50/50 dark:bg-gray-800/50 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 transition-all duration-300"
                    disabled={loading}
                  />
                </div>
              </div>
            )}
            <div>
              <label htmlFor="login-email" className="block text-xs font-light text-gray-600 dark:text-gray-400 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                <input
                  type="email"
                  id="login-email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-full bg-gray-50/50 dark:bg-gray-800/50 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 transition-all duration-300"
                  disabled={loading}
                />
              </div>
            </div>
            {mode === 'register' && (
              <div>
                <label htmlFor="register-confirm-email" className="block text-xs font-light text-gray-600 dark:text-gray-400 mb-2">
                  Confirm Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                  <input
                    type="email"
                    id="register-confirm-email"
                    name="confirmEmail"
                    autoComplete="email"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    placeholder="Confirm your email"
                    required
                    className={`w-full pl-11 pr-4 py-3 border rounded-full bg-gray-50/50 dark:bg-gray-800/50 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
                      confirmEmail && email !== confirmEmail
                        ? 'border-red-400 dark:border-red-600 focus:ring-red-400 focus:border-red-400'
                        : 'border-gray-200 dark:border-gray-700 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800'
                    }`}
                    disabled={loading}
                  />
                </div>
                {confirmEmail && email !== confirmEmail && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1 ml-4 font-light">
                    Emails do not match
                  </p>
                )}
              </div>
            )}

            {mode !== 'reset' && (
              <div>
                <label htmlFor="login-password" className="block text-xs font-light text-gray-600 dark:text-gray-400 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
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
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-full bg-gray-50/50 dark:bg-gray-800/50 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 transition-all duration-300"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label htmlFor="register-confirm-password" className="block text-xs font-light text-gray-600 dark:text-gray-400 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
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
                    className={`w-full pl-11 pr-4 py-3 border rounded-full bg-gray-50/50 dark:bg-gray-800/50 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
                      confirmPassword && password !== confirmPassword
                        ? 'border-red-400 dark:border-red-600 focus:ring-red-400 focus:border-red-400'
                        : 'border-gray-200 dark:border-gray-700 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800'
                    }`}
                    disabled={loading}
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1 ml-4 font-light">
                    Passwords do not match
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
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
            className="w-full mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-light transition-colors"
          >
            Forgot password?
          </button>
        )}

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8 font-light">
          {mode === 'register' 
            ? 'Already have an account?'
            : mode === 'reset'
            ? 'Remember your password?'
            : "Don't have an account?"}
          {' '}
          <button
            onClick={() => {
              setMode(mode === 'register' ? 'login' : mode === 'reset' ? 'login' : 'register');
              setError(null);
            }}
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            {mode === 'register' ? 'Login' : mode === 'reset' ? 'Login' : 'Register'}
          </button>
        </p>

        {/* Minimal Contact Admin */}
        <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
          <button
            onClick={() => setShowContactForm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full transition-all duration-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/30 font-light"
          >
            <MessageSquare size={16} />
            <span>Contact Admin</span>
          </button>
        </div>
        
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <ContactForm onClose={() => setShowContactForm(false)} />
      )}

      {/* Custom Fluid Animations */}
      <style>{`
        @keyframes float-particles {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.4;
          }
          33% {
            transform: translate(20px, -20px) scale(1.05);
            opacity: 0.6;
          }
          66% {
            transform: translate(-15px, 15px) scale(0.95);
            opacity: 0.5;
          }
        }
        
        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }
        
        .animate-float-slow {
          animation: float-slow 5s ease-in-out infinite;
        }
      `}</style>
    </div>
    </div>
  );
};

export default Login;
