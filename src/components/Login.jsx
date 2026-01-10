import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedButton, FadeIn, SlideIn, ScaleIn, StaggerContainer, StaggerItem, GSAPEntrance } from './AnimatedComponents';

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
        // Login successful - clear any errors
        setError(null);
      }
    } catch (err) {
      console.error('Login/Register error:', err);
      let errorMessage = 'An error occurred. Please try again.';
      
      // Handle specific Firebase auth errors
      if (err.code === 'auth/email-not-verified' || err.code === 'EMAIL_NOT_VERIFIED') {
        if (validateAdminEmail(sanitizeEmail(email))) {
          errorMessage = 'Admin login error. Please contact support if this issue persists.';
        } else {
          errorMessage = 'Please verify your email address before logging in. Check your inbox for the verification email.';
          setEmailVerificationSent(true);
        }
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address. Please register first.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMessage = 'Incorrect password. Please try again or reset your password.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format. Please check your email and try again.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later or reset your password.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support.';
      } else if (err.message) {
        errorMessage = err.message;
      } else {
        // Fallback to handleError for other errors
        const { message } = handleError(err, 'Login/Register', (errorMsg) => {
          return errorMsg;
        });
        if (message) errorMessage = message;
      }
      
      setError(errorMessage);
      showError(errorMessage);
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
    <div className="h-screen h-[100dvh] overflow-y-auto bg-transparent relative">
      {/* Aurora Background - Fluid.so aesthetic */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="aurora-background">
          <div className="aurora-blob aurora-blob-1" />
          <div className="aurora-blob aurora-blob-2" />
          <div className="aurora-blob aurora-blob-3" />
          <div className="aurora-blob aurora-blob-4" />
          <div className="aurora-blob aurora-blob-5" />
        </div>
      </div>

      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center p-4 relative z-10 safe-area-inset" style={{
        paddingTop: `max(1rem, env(safe-area-inset-top, 0px) + 1rem)`,
        paddingBottom: `max(1rem, env(safe-area-inset-bottom, 0px) + 1rem)`,
        paddingLeft: `max(1rem, env(safe-area-inset-left, 0px) + 1rem)`,
        paddingRight: `max(1rem, env(safe-area-inset-right, 0px) + 1rem)`
      }}>
        {/* Animated Navigation Bar */}
        <FadeIn delay={0.1} duration={0.5}>
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute top-0 left-0 right-0 z-50 glass-panel border-b border-white/10 backdrop-blur-xl"
          >
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
              <motion.button
                onClick={onBack || (() => {
                  if (window.history.length > 1) {
                    window.history.back();
                  } else {
                    // Fallback: use the showLogin state change
                    if (typeof onBack === 'function') {
                      onBack();
                    } else {
                      // Force navigation to landing page
                      window.location.href = '/';
                    }
                  }
                })}
                whileHover={{ scale: 1.05, x: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-white/70 hover:text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                type="button"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span className="text-sm">Back</span>
              </motion.button>
              <div className="flex items-center gap-2">
                <Logo size="small" showText={false} />
              </div>
              <motion.button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleDarkMode();
                }}
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.95 }}
                className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg hover:shadow-xl transition-all"
                aria-label="Toggle dark mode"
                type="button"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-yellow-400" size={20} />
                ) : (
                  <Moon className="w-5 h-5 text-indigo-300" size={20} />
                )}
              </motion.button>
            </div>
          </motion.div>
        </FadeIn>

        {/* Animated Form Container */}
        <ScaleIn delay={0.3} duration={0.6}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="glass-panel shadow-2xl border border-white/10 rounded-[2rem] p-6 md:p-8 w-full max-w-3xl mx-auto"
          >
            <StaggerContainer staggerDelay={0.1} initialDelay={0.4}>
              <StaggerItem>
                {/* Back Button Inside Form - Always Visible */}
                <div className="mb-4 flex justify-start">
                  <button
                    onClick={onBack || (() => {
                      if (window.history.length > 1) {
                        window.history.back();
                      } else {
                        window.location.href = '/';
                      }
                    })}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:text-white font-medium transition-colors rounded-xl hover:bg-white/10 border border-white/20 bg-white/5 backdrop-blur-sm"
                    type="button"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    <span>Back to Home</span>
                  </button>
                </div>
                
                <div className="text-center mb-6">
                  <motion.div
                    className="mb-4 flex justify-center"
                    animate={{
                      y: [0, -10, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Logo size="large" showText={false} />
                  </motion.div>
                  <h1 className="text-2xl md:text-3xl font-semibold text-white mb-1.5 text-glow">
                    {mode === 'register' ? 'Create Account' : mode === 'reset' ? 'Reset Password' : 'Welcome Back'}
                  </h1>
                  <p className="text-sm text-white/60">
                    {mode === 'register' ? 'Join your campus community' : mode === 'reset' ? 'Recover your account' : 'Sign in to continue'}
                  </p>
                </div>
              </StaggerItem>

              <StaggerItem>
                {/* Animated Toggle between Login and Register */}
                <motion.div
                  layout
                  className="flex mb-8 bg-white/10 backdrop-blur-sm rounded-full p-1 gap-1 border border-white/20"
                >
                  <motion.button
                    onClick={() => {
                      setMode('login');
                      setError(null);
                      setConfirmEmail('');
                      setConfirmPassword('');
                      setEmailVerificationSent(false);
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex-1 py-2.5 px-4 rounded-full font-medium text-sm transition-colors ${
                      mode === 'login'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-transparent text-white/70 hover:text-white'
                    }`}
                  >
                    Login
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      setMode('register');
                      setError(null);
                      setConfirmEmail('');
                      setConfirmPassword('');
                      setEmailVerificationSent(false);
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex-1 py-2.5 px-4 rounded-full font-medium text-sm transition-colors ${
                      mode === 'register'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-transparent text-white/70 hover:text-white'
                    }`}
                  >
                    Register
                  </motion.button>
                </motion.div>
              </StaggerItem>

              <StaggerItem>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-200 rounded-xl text-sm flex items-start gap-2"
                  >
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-300" />
                    <div className="flex-1 font-light">{error}</div>
                  </motion.div>
                )}
              </StaggerItem>

              <StaggerItem>
                {emailVerificationSent && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 bg-green-500/20 backdrop-blur-sm border border-green-500/30 text-green-200 rounded-xl text-sm"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <CheckCircle size={16} className="mt-0.5 flex-shrink-0 text-green-300" />
                      <div className="flex-1">
                        <p className="font-medium text-xs text-green-100">Verification Email Sent!</p>
                        <p className="mt-1 text-xs font-light text-white/80">Check your inbox to activate your account.</p>
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
                        className="mt-2 text-xs text-indigo-300 hover:text-indigo-200 hover:underline font-light disabled:opacity-50 transition-colors"
                      >
                        {resendingVerification ? 'Sending...' : 'Resend Verification Email'}
                      </button>
                    )}
                  </motion.div>
                )}
              </StaggerItem>

              <StaggerItem>
                <form onSubmit={mode === 'reset' ? handlePasswordReset : handleEmailAuth} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label htmlFor="register-name" className="block text-xs font-medium text-white/90 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50" size={18} />
                  <input
                    type="text"
                    id="register-name"
                    name="name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    className="w-full pl-11 pr-4 py-2.5 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300"
                    disabled={loading}
                  />
                </div>
              </div>
            )}
            <div>
              <label htmlFor="login-email" className="block text-xs font-medium text-white/90 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50" size={18} />
                <input
                  type="email"
                  id="login-email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full pl-11 pr-4 py-2.5 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300"
                  disabled={loading}
                />
              </div>
            </div>
            {mode === 'register' && (
              <div>
                <label htmlFor="register-confirm-email" className="block text-xs font-medium text-white/90 mb-2">
                  Confirm Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50" size={18} />
                  <input
                    type="email"
                    id="register-confirm-email"
                    name="confirmEmail"
                    autoComplete="email"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    placeholder="Confirm your email"
                    required
                    className={`w-full pl-11 pr-4 py-2.5 border rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 transition-all duration-300 ${
                      confirmEmail && email !== confirmEmail
                        ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50'
                        : 'border-white/10 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10'
                    }`}
                    disabled={loading}
                  />
                </div>
                {confirmEmail && email !== confirmEmail && (
                  <p className="text-xs text-red-300 mt-1 ml-4">
                    Emails do not match
                  </p>
                )}
              </div>
            )}

            {mode !== 'reset' && (
              <div>
                <label htmlFor="login-password" className="block text-xs font-medium text-white/90 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50" size={18} />
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
                    className="w-full pl-11 pr-4 py-2.5 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label htmlFor="register-confirm-password" className="block text-xs font-medium text-white/90 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50" size={18} />
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
                    className={`w-full pl-11 pr-4 py-2.5 border rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 transition-all duration-300 ${
                      confirmPassword && password !== confirmPassword
                        ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50'
                        : 'border-white/10 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10'
                    }`}
                    disabled={loading}
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-300 mt-1 ml-4">
                    Passwords do not match
                  </p>
                )}
              </div>
            )}

                <AnimatedButton
                  type="submit"
                  disabled={loading}
                  variant="default"
                  className="send-button-shimmer w-full flex items-center justify-center gap-2 text-white font-semibold py-3 px-6 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 disabled:transform-none"
                >
                    {loading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="rounded-full h-5 w-5 border-b-2 border-white"
                        />
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
                  </AnimatedButton>
                </form>
              </StaggerItem>
            </StaggerContainer>

            {/* Back to Landing Page Button - Fluid.so aesthetic */}
            <motion.button
              onClick={onBack || (() => {
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  window.location.href = '/';
                }
              })}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full mt-4 mb-2 flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-white/70 hover:text-white font-medium border border-white/20 rounded-xl hover:bg-white/10 transition-all bg-white/5 backdrop-blur-sm"
              type="button"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Back to Home</span>
            </motion.button>

            {mode !== 'reset' && (
              <motion.button
                onClick={() => {
                  setMode('reset');
                  setError(null);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-2 text-sm text-white/60 hover:text-indigo-300 transition-colors"
                type="button"
              >
                Forgot password?
              </motion.button>
            )}

            <p className="text-center text-xs text-white/60 mt-8 font-light">
              {mode === 'register' 
                ? 'Already have an account?'
                : mode === 'reset'
                ? 'Remember your password?'
                : "Don't have an account?"}
              {' '}
              <motion.button
                onClick={() => {
                  setMode(mode === 'register' ? 'login' : mode === 'reset' ? 'login' : 'register');
                  setError(null);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-indigo-300 hover:text-indigo-200 hover:underline font-medium"
              >
                {mode === 'register' ? 'Login' : mode === 'reset' ? 'Login' : 'Register'}
              </motion.button>
            </p>

            {/* Contact Admin - Fluid.so aesthetic */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <motion.button
                onClick={() => setShowContactForm(true)}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-white/70 hover:text-white rounded-full transition-all duration-300 hover:bg-white/10 font-light border border-white/10 bg-white/5 backdrop-blur-sm"
              >
                <MessageSquare size={16} />
                <span>Contact Admin</span>
              </motion.button>
            </div>
          </motion.div>
        </ScaleIn>

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
