import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { createUserWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { UserPlus, Mail, Lock, User, Shield, CheckCircle, AlertCircle } from 'lucide-react';

const CreateUser = () => {
  const { user: currentUser } = useAuth();
  const { darkMode } = useTheme();
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

  // Validate student email format: must start with "s20" and contain "@sistc.edu.au" or "@sistc.nsw.edu.au"
  const validateStudentEmail = (email) => {
    if (!email) return false;
    const emailLower = email.toLowerCase();
    return emailLower.startsWith('s20') && (emailLower.includes('@sistc.edu.au') || emailLower.includes('@sistc.nsw.edu.au'));
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

    // Validate student email format: must start with "s20" and contain "@sistc.edu.au" or "@sistc.nsw.edu.au"
    if (formData.role === 'student' && !validateStudentEmail(formData.email)) {
      setError('Invalid student email address. Please use a valid student email format.');
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
    <div className={`flex flex-col h-screen p-6 ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`border-b ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} px-6 py-4 -mx-6 -mt-6 mb-6`}>
        <h2 className="text-2xl font-bold">Create New User</h2>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
          Add new student or admin accounts to the platform
        </p>
      </div>

      {/* Form */}
      <div className={`max-w-2xl mx-auto w-full ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} p-8 rounded-lg shadow-md`}>
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-400 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle size={18} />
            <span>User created successfully! You will be redirected to login page...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter Your Email"
                required
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent ${
                  darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
                }`}
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
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
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent ${
                  darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
                }`}
                disabled={loading}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Password must be at least 6 characters long
            </p>
          </div>

          {/* Role Selection */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              User Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, role: 'student' }))}
                className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg transition-colors ${
                  formData.role === 'student'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : `${darkMode ? 'border-gray-600 bg-gray-800 text-gray-300' : 'border-gray-300 bg-white text-gray-700'} hover:border-indigo-400`
                }`}
                disabled={loading}
              >
                <User size={18} />
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, role: 'admin' }))}
                className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg transition-colors ${
                  formData.role === 'admin'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : `${darkMode ? 'border-gray-600 bg-gray-800 text-gray-300' : 'border-gray-300 bg-white text-gray-700'} hover:border-indigo-400`
                }`}
                disabled={loading}
              >
                <Shield size={18} />
                <span>Admin</span>
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Selected: <span className="font-semibold">{formData.role}</span>
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Creating User...</span>
              </>
            ) : (
              <>
                <UserPlus size={20} />
                <span>Create User</span>
              </>
            )}
          </button>
        </form>

        {/* Info Box */}
        <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-indigo-900/20 border border-indigo-700' : 'bg-indigo-50 border border-indigo-200'}`}>
          <div className="flex items-start gap-2">
            <AlertCircle className={`${darkMode ? 'text-indigo-400' : 'text-indigo-600'} mt-0.5`} size={18} />
            <div className="text-sm">
              <p className={`font-medium ${darkMode ? 'text-indigo-300' : 'text-indigo-800'}`}>
                Important Note
              </p>
              <p className={`mt-1 ${darkMode ? 'text-indigo-400' : 'text-indigo-700'}`}>
                After creating a user, you will be signed out and redirected to the login page. 
                This is because the system needs to create the user account. Please sign back in to continue.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateUser;

