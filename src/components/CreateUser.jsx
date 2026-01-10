import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { createUserWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
// Use window globals to avoid import/export issues in production builds
const auth = typeof window !== 'undefined' && window.__firebaseAuth 
  ? window.__firebaseAuth 
  : null;
const db = typeof window !== 'undefined' && window.__firebaseDb 
  ? window.__firebaseDb 
  : null;
import { UserPlus, Mail, Lock, User, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { FadeIn, ScaleIn, StaggerContainer, StaggerItem } from './AnimatedComponents';

const CreateUser = () => {
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student' // 'student' or 'admin'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    if (error) setError(null);
    if (success) setSuccess(false);
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Validate student email format: must start with "s20" and contain "@sistc.app" or "@sistc.nsw.edu.au"
  const validateStudentEmail = (email) => {
    if (!email) return false;
    const emailLower = email.toLowerCase();
    // Accept both old domain (@sistc.nsw.edu.au) and new domain (@sistc.app) for backward compatibility
    return emailLower.startsWith('s20') && 
           (emailLower.includes('@sistc.app') || emailLower.includes('@sistc.nsw.edu.au'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Validate student email format: must start with "s20" and contain "@sistc.app" or "@sistc.nsw.edu.au"
    if (formData.role === 'student' && !validateStudentEmail(formData.email)) {
      setError('Invalid student email address. Please use a valid student email format (s20xxxxx@sistc.app or s20xxxxx@sistc.nsw.edu.au).');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!['student', 'admin'].includes(formData.role)) {
      setError('Invalid role selected.');
      return;
    }

    setLoading(true);

    try {
      // Store current admin's email and password (we'll need to sign them back in)
      // Note: In a production app, you'd use Firebase Admin SDK on a backend
      // For now, we'll create the user and immediately sign them out, then sign admin back in
      
      // Create the new user account
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const newUser = userCredential.user;

      // Create user document in Firestore with the specified role
      await setDoc(doc(db, 'users', newUser.uid), {
        email: formData.email,
        role: formData.role,
        emailVerified: formData.role === 'admin' ? true : false, // Admins are automatically verified
        createdAt: new Date().toISOString(),
        createdBy: currentUser.uid, // Track who created this user
        createdByEmail: currentUser.email
      });

      // Sign out the newly created user (they were auto-signed in)
      await firebaseSignOut(auth);
      
      setSuccess(true);
      setFormData({
        email: '',
        password: '',
        role: 'student'
      });

      // Show success message and redirect to login after a delay
      // Note: Admin will need to sign back in manually
      setTimeout(() => {
        window.location.href = '/'; // Redirect to home/login
      }, 3000);

    } catch (error) {
      console.error('Error creating user:', error);
      let errorMessage = 'Failed to create user. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen h-[100dvh] overflow-y-auto overscroll-contain touch-pan-y bg-transparent relative">
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

      {/* Main Content */}
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center p-4 relative z-10" style={{
        paddingTop: `max(2rem, calc(env(safe-area-inset-top, 0px) + 2rem))`,
        paddingBottom: `max(2rem, calc(env(safe-area-inset-bottom, 0px) + 2rem))`,
        paddingLeft: `max(1rem, calc(env(safe-area-inset-left, 0px) + 1rem))`,
        paddingRight: `max(1rem, calc(env(safe-area-inset-right, 0px) + 1rem))`
      }}>
        {/* Form - Fluid.so aesthetic */}
        <ScaleIn delay={0.2} duration={0.5}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="max-w-md mx-auto w-full glass-panel p-8 md:p-10 rounded-[2rem] shadow-2xl border border-white/10 backdrop-blur-xl"
          >
            <StaggerContainer staggerDelay={0.08} initialDelay={0.3}>
              {/* Header */}
              <StaggerItem>
                <div className="text-center mb-8">
                  <motion.div
                    className="mb-6 flex justify-center"
                    animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <div className="p-4 bg-indigo-600/30 border border-indigo-500/50 rounded-2xl">
                      <UserPlus className="w-12 h-12 text-indigo-300" />
                    </div>
                  </motion.div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 text-glow">Create New User</h2>
                  <p className="text-base text-white/60 font-light">
                    Add new student or admin accounts to the platform
                  </p>
                </div>
              </StaggerItem>

              <StaggerItem>
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="mb-6 p-4 glass-panel bg-red-500/10 border border-red-500/30 text-red-200 rounded-xl text-sm flex items-start gap-3"
                    >
                      <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-red-400" />
                      <span className="font-medium leading-relaxed">{error}</span>
                    </motion.div>
                  )}

                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="mb-6 p-4 glass-panel bg-green-500/10 border border-green-500/30 text-green-200 rounded-xl text-sm flex items-start gap-3"
                    >
                      <CheckCircle size={18} className="mt-0.5 flex-shrink-0 text-green-400" />
                      <span className="font-medium leading-relaxed">User created successfully! You will be redirected to login page...</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </StaggerItem>

              <StaggerItem>
                <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-white/90 mb-2.5">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 group-focus-within:text-indigo-400 transition-colors" size={20} />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="s20230091@sistc.app"
                    required
                    className="w-full pl-12 pr-4 py-3.5 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300 hover:border-white/20"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-white/90 mb-2.5">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 group-focus-within:text-indigo-400 transition-colors" size={20} />
                  <input
                    type="password"
                    id="password"
                    name="password"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    className="w-full pl-12 pr-4 py-3.5 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300 hover:border-white/20"
                    disabled={loading}
                  />
                </div>
                <p className="mt-2 text-xs text-white/50 ml-4 font-light">
                  Password must be at least 6 characters long
                </p>
              </div>

              {/* Role Selection - Enhanced Design */}
              <div>
                <label htmlFor="role" className="block text-sm font-semibold text-white/90 mb-3">
                  User Role
                </label>
                <div className="relative flex bg-white/5 backdrop-blur-sm rounded-2xl p-1.5 gap-1.5 border border-white/10">
                  <motion.div
                    layoutId="activeRole"
                    className="absolute inset-y-1.5 rounded-xl bg-indigo-600/80 backdrop-blur-sm border border-indigo-500/50 shadow-lg"
                    style={{
                      left: formData.role === 'student' ? '0.375rem' : '50%',
                      right: formData.role === 'student' ? '50%' : '0.375rem',
                      width: 'calc(50% - 0.375rem)',
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                  <motion.button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: 'student' }))}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                    className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl transition-all duration-300 z-10 font-semibold ${
                      formData.role === 'student'
                        ? 'text-white'
                        : 'text-white/60 hover:text-white/80'
                    }`}
                  >
                    <User size={18} />
                    <span>Student</span>
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: 'admin' }))}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                    className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl transition-all duration-300 z-10 font-semibold ${
                      formData.role === 'admin'
                        ? 'text-white'
                        : 'text-white/60 hover:text-white/80'
                    }`}
                  >
                    <Shield size={18} />
                    <span>Admin</span>
                  </motion.button>
                </div>
              </div>

                  {/* Submit Button - Enhanced */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={!loading ? { scale: 1.02, y: -2 } : {}}
                    whileTap={!loading ? { scale: 0.98 } : {}}
                    className="send-button-shimmer w-full flex items-center justify-center gap-3 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl mt-6"
                  >
                    {loading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="rounded-full h-5 w-5 border-b-2 border-white"
                        />
                        <span>Creating User...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={20} />
                        <span>Create User</span>
                      </>
                    )}
                  </motion.button>
                </form>
              </StaggerItem>

              {/* Info Box - Enhanced Fluid.so aesthetic */}
              <StaggerItem>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 pt-6 border-t border-white/10"
                >
                  <div className="glass-panel bg-indigo-600/10 border border-indigo-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="text-indigo-300 mt-0.5 flex-shrink-0" size={18} />
                      <div className="text-sm">
                        <p className="font-semibold text-indigo-200 mb-1.5">
                          Important Note
                        </p>
                        <p className="text-white/70 font-light leading-relaxed">
                          After creating a user, you will be signed out and redirected to the login page. 
                          This is because the system needs to create the user account. Please sign back in to continue.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            </StaggerContainer>
          </motion.div>
        </ScaleIn>
      </div>
    </div>
  );
};

export default CreateUser;

