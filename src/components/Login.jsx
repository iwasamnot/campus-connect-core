import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { Mail, Lock, UserPlus, LogIn, Moon, Sun, RotateCcw, User, CheckCircle, AlertCircle, MessageSquare, ArrowLeft } from 'lucide-react';
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
    <div className="h-screen h-[100dvh] h-[100svh] overflow-y-auto overscroll-contain touch-pan-y bg-transparent relative" style={{
      WebkitOverflowScrolling: 'touch',
      overscrollBehavior: 'contain',
      height: '100dvh',
      minHeight: '-webkit-fill-available'
    }}>
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

      {/* Floating Back Arrow - Fluid.so aesthetic */}
      <FadeIn delay={0.1}>
        <motion.button
          onClick={onBack || (() => window.history.length > 1 ? window.history.back() : window.location.href = '/')}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.1, x: -4 }}
          whileTap={{ scale: 0.9 }}
          className="fixed top-6 left-4 md:left-6 z-50 glass-panel border border-white/10 rounded-2xl p-3 md:p-3.5 text-white/70 hover:text-white hover:border-indigo-500/50 hover:bg-indigo-600/20 transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-xl group"
          style={{
            top: `max(1.5rem, calc(env(safe-area-inset-top, 0px) + 1.5rem))`,
            left: `max(1rem, calc(env(safe-area-inset-left, 0px) + 1rem))`
          }}
          type="button"
          aria-label="Go back"
        >
          <ArrowLeft 
            size={22} 
            className="md:w-6 md:h-6 transition-transform duration-300 group-hover:-translate-x-1" 
            strokeWidth={2.5}
          />
        </motion.button>
      </FadeIn>

      {/* Navigation Bar - Clean & Minimal */}
      <FadeIn delay={0.15}>
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-0 right-0 z-40 glass-panel border-l border-b border-white/10 backdrop-blur-xl rounded-bl-2xl rounded-tr-2xl"
        >
          <div className="px-4 md:px-6 py-4 flex items-center gap-3">
            <Logo size="small" showText={false} />
            <motion.button
              onClick={() => toggleDarkMode()}
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 glass-panel border border-white/10 rounded-xl text-white/70 hover:text-white transition-all"
              aria-label="Toggle dark mode"
              type="button"
            >
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-indigo-300" />}
            </motion.button>
          </div>
        </motion.div>
      </FadeIn>

      {/* Main Content - Centered & Spacious */}
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center p-4 pt-24 relative z-10" style={{
        paddingTop: `max(6rem, calc(env(safe-area-inset-top, 0px) + 5rem))`,
        paddingBottom: `max(2rem, calc(env(safe-area-inset-bottom, 0px) + 2rem))`,
        paddingLeft: `max(1rem, calc(env(safe-area-inset-left, 0px) + 1rem))`,
        paddingRight: `max(1rem, calc(env(safe-area-inset-right, 0px) + 1rem))`
      }}>
        <ScaleIn delay={0.2} duration={0.5}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="glass-panel shadow-2xl border border-white/10 rounded-[2rem] p-8 md:p-10 w-full min-w-[320px] max-w-lg md:max-w-xl lg:max-w-2xl mx-auto backdrop-blur-xl"
          >
            <StaggerContainer staggerDelay={0.08} initialDelay={0.3}>
              <StaggerItem>
                {/* Logo & Header */}
                <div className="text-center mb-8">
                  <motion.div
                    className="mb-6 flex justify-center"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Logo size="large" showText={false} />
                  </motion.div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 text-glow">
                    {mode === 'register' ? 'Create Account' : mode === 'reset' ? 'Reset Password' : 'Welcome Back'}
                  </h1>
                  <p className="text-base text-white/60 font-light">
                    {mode === 'register' ? 'Join your campus community' : mode === 'reset' ? 'Recover your account' : 'Sign in to continue'}
                  </p>
                </div>
              </StaggerItem>

              <StaggerItem>
                {/* Mode Toggle - Beautiful Pill Design */}
                <motion.div
                  layout
                  className="relative flex mb-8 bg-white/5 backdrop-blur-sm rounded-2xl p-1.5 gap-1.5 border border-white/10"
                >
                  <motion.div
                    layoutId="activeMode"
                    className="absolute inset-y-1.5 rounded-xl bg-indigo-600/80 backdrop-blur-sm border border-indigo-500/50 shadow-lg"
                    style={{
                      left: mode === 'login' ? '0.375rem' : '50%',
                      right: mode === 'login' ? '50%' : '0.375rem',
                      width: 'calc(50% - 0.375rem)',
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                  <motion.button
                    onClick={() => {
                      setMode('login');
                      setError(null);
                      setConfirmEmail('');
                      setConfirmPassword('');
                      setEmailVerificationSent(false);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-colors z-10 ${
                      mode === 'login'
                        ? 'text-white'
                        : 'text-white/60 hover:text-white/80'
                    }`}
                  >
                    <LogIn size={16} className="inline mr-2" />
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
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-colors z-10 ${
                      mode === 'register'
                        ? 'text-white'
                        : 'text-white/60 hover:text-white/80'
                    }`}
                  >
                    <UserPlus size={16} className="inline mr-2" />
                    Register
                  </motion.button>
                </motion.div>
              </StaggerItem>

              <AnimatePresence mode="wait">
                {error && (
                  <StaggerItem key="error">
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="mb-6 p-4 glass-panel bg-red-500/10 border border-red-500/30 text-red-200 rounded-xl text-sm flex items-start gap-3"
                    >
                      <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-red-400" />
                      <div className="flex-1 font-medium leading-relaxed">{error}</div>
                    </motion.div>
                  </StaggerItem>
                )}

                {emailVerificationSent && (
                  <StaggerItem key="verification">
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="mb-6 p-4 glass-panel bg-green-500/10 border border-green-500/30 text-green-200 rounded-xl text-sm"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <CheckCircle size={18} className="mt-0.5 flex-shrink-0 text-green-400" />
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-green-100 mb-1">Verification Email Sent!</p>
                          <p className="text-xs font-light text-white/80 leading-relaxed">Check your inbox to activate your account.</p>
                        </div>
                      </div>
                      {mode === 'login' && (
                        <motion.button
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
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="mt-2 text-xs text-indigo-300 hover:text-indigo-200 hover:underline font-medium disabled:opacity-50 transition-colors"
                        >
                          {resendingVerification ? 'Sending...' : 'Resend Verification Email'}
                        </motion.button>
                      )}
                    </motion.div>
                  </StaggerItem>
                )}
              </AnimatePresence>

              <StaggerItem>
                <form onSubmit={mode === 'reset' ? handlePasswordReset : handleEmailAuth} className="space-y-5">
                  {/* Full Name (Register only) */}
                  <AnimatePresence>
                    {mode === 'register' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <label htmlFor="register-name" className="block text-sm font-semibold text-white/90 mb-2.5">
                          Full Name
                        </label>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 group-focus-within:text-indigo-400 transition-colors" size={20} />
                          <input
                            type="text"
                            id="register-name"
                            name="name"
                            autoComplete="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            required
                            className="w-full pl-12 pr-4 py-3.5 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300 hover:border-white/20"
                            disabled={loading}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email */}
                  <div>
                    <label htmlFor="login-email" className="block text-sm font-semibold text-white/90 mb-2.5">
                      Email Address
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 group-focus-within:text-indigo-400 transition-colors" size={20} />
                      <input
                        type="email"
                        id="login-email"
                        name="email"
                        autoComplete="off"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck="false"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="s20230091@sistc.app"
                        required
                        className="w-full pl-12 pr-4 py-3.5 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300 hover:border-white/20"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Confirm Email (Register only) */}
                  <AnimatePresence>
                    {mode === 'register' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <label htmlFor="register-confirm-email" className="block text-sm font-semibold text-white/90 mb-2.5">
                          Confirm Email
                        </label>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 group-focus-within:text-indigo-400 transition-colors" size={20} />
                          <input
                            type="email"
                            id="register-confirm-email"
                            name="confirmEmail"
                            autoComplete="off"
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck="false"
                            value={confirmEmail}
                            onChange={(e) => setConfirmEmail(e.target.value)}
                            placeholder="Confirm your email"
                            required
                            className={`w-full pl-12 pr-4 py-3.5 border rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 transition-all duration-300 hover:border-white/20 ${
                              confirmEmail && email !== confirmEmail
                                ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50'
                                : 'border-white/10 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10'
                            }`}
                            disabled={loading}
                          />
                        </div>
                        {confirmEmail && email !== confirmEmail && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs text-red-400 mt-2 ml-4 font-medium flex items-center gap-1"
                          >
                            <AlertCircle size={12} />
                            Emails do not match
                          </motion.p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Password (Login & Register) */}
                  <AnimatePresence>
                    {mode !== 'reset' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <label htmlFor="login-password" className="block text-sm font-semibold text-white/90 mb-2.5">
                          Password
                        </label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 group-focus-within:text-indigo-400 transition-colors" size={20} />
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
                            className="w-full pl-12 pr-4 py-3.5 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300 hover:border-white/20"
                            disabled={loading}
                          />
                        </div>
                        {mode === 'register' && (
                          <p className="text-xs text-white/50 mt-2 ml-4 font-light">Minimum 6 characters</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Confirm Password (Register only) */}
                  <AnimatePresence>
                    {mode === 'register' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <label htmlFor="register-confirm-password" className="block text-sm font-semibold text-white/90 mb-2.5">
                          Confirm Password
                        </label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 group-focus-within:text-indigo-400 transition-colors" size={20} />
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
                            className={`w-full pl-12 pr-4 py-3.5 border rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 transition-all duration-300 hover:border-white/20 ${
                              confirmPassword && password !== confirmPassword
                                ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50'
                                : 'border-white/10 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10'
                            }`}
                            disabled={loading}
                          />
                        </div>
                        {confirmPassword && password !== confirmPassword && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs text-red-400 mt-2 ml-4 font-medium flex items-center gap-1"
                          >
                            <AlertCircle size={12} />
                            Passwords do not match
                          </motion.p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit Button - Beautiful & Prominent */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={!loading ? { scale: 1.02, y: -2 } : {}}
                    whileTap={!loading ? { scale: 0.98 } : {}}
                    className="send-button-shimmer w-full flex items-center justify-center gap-3 text-white font-semibold py-4 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 disabled:transform-none shadow-lg hover:shadow-xl mt-6"
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
                  </motion.button>
                </form>
              </StaggerItem>

              {/* Footer Actions */}
              <StaggerItem>
                <div className="mt-8 space-y-4">
                  {/* Forgot Password (Login only) */}
                  {mode !== 'reset' && (
                    <motion.button
                      onClick={() => {
                        setMode('reset');
                        setError(null);
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full text-sm text-white/60 hover:text-indigo-300 transition-colors font-medium"
                      type="button"
                    >
                      Forgot password?
                    </motion.button>
                  )}

                  {/* Switch Mode Text */}
                  <p className="text-center text-sm text-white/60 font-light">
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
                      className="text-indigo-300 hover:text-indigo-200 hover:underline font-semibold"
                    >
                      {mode === 'register' ? 'Login' : mode === 'reset' ? 'Login' : 'Register'}
                    </motion.button>
                  </p>

                  {/* Contact Admin */}
                  <div className="pt-6 border-t border-white/10">
                    <motion.button
                      onClick={() => setShowContactForm(true)}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-white/70 hover:text-white rounded-xl transition-all duration-300 hover:bg-white/10 font-medium border border-white/10 bg-white/5 backdrop-blur-sm"
                    >
                      <MessageSquare size={16} />
                      <span>Contact Admin</span>
                    </motion.button>
                  </div>
                </div>
              </StaggerItem>
            </StaggerContainer>
          </motion.div>
        </ScaleIn>
      </div>

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

      {/* Contact Form Modal */}
      <AnimatePresence>
        {showContactForm && (
          <ContactForm onClose={() => setShowContactForm(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
