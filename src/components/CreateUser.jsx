import { useState } from 'react';
import { motion } from 'framer-motion';
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
import { FadeIn } from './AnimatedComponents';

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
    <div className="flex flex-col h-screen h-[100dvh] p-4 md:p-6 bg-transparent relative">
      {/* Form - Fluid.so aesthetic */}
      <FadeIn delay={0.1}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-2xl mx-auto w-full glass-panel p-6 md:p-8 rounded-[2rem] shadow-xl"
        >
          {/* Header */}
          <div className="mb-6 pb-4 border-b border-white/10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Create New User</h2>
            <p className="text-sm text-white/60">
              Add new student or admin accounts to the platform
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-200 rounded-xl text-sm flex items-center gap-2"
            >
              <AlertCircle size={18} className="text-red-400" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-green-500/20 backdrop-blur-sm border border-green-500/30 text-green-200 rounded-xl text-sm flex items-center gap-2"
            >
              <CheckCircle size={18} className="text-green-400" />
              <span>User created successfully! You will be redirected to login page...</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={20} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter Your Email"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={20} />
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
                  className="w-full pl-10 pr-4 py-3 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300"
                  disabled={loading}
                />
              </div>
              <p className="mt-2 text-xs text-white/60">
                Password must be at least 6 characters long
              </p>
            </div>

            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-white/90 mb-2">
                User Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'student' }))}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-xl transition-all duration-300 ${
                    formData.role === 'student'
                      ? 'border-indigo-500 bg-indigo-600/30 text-white shadow-lg'
                      : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10'
                  }`}
                  disabled={loading}
                >
                  <User size={18} />
                  <span>Student</span>
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'admin' }))}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-xl transition-all duration-300 ${
                    formData.role === 'admin'
                      ? 'border-indigo-500 bg-indigo-600/30 text-white shadow-lg'
                      : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10'
                  }`}
                  disabled={loading}
                >
                  <Shield size={18} />
                  <span>Admin</span>
                </motion.button>
              </div>
              <p className="mt-2 text-xs text-white/60">
                Selected: <span className="font-semibold text-white">{formData.role}</span>
              </p>
            </div>

            {/* Submit Button - Fluid.so shimmer effect */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              className="send-button-shimmer w-full flex items-center justify-center gap-2 text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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

          {/* Info Box - Fluid.so aesthetic */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 p-4 bg-indigo-600/20 backdrop-blur-sm border border-indigo-500/30 rounded-xl"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="text-indigo-300 mt-0.5 flex-shrink-0" size={18} />
              <div className="text-sm">
                <p className="font-medium text-indigo-200">
                  Important Note
                </p>
                <p className="mt-1 text-white/70">
                  After creating a user, you will be signed out and redirected to the login page. 
                  This is because the system needs to create the user account. Please sign back in to continue.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </FadeIn>
    </div>
  );
};

export default CreateUser;

