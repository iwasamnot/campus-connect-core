import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInAnonymously, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

// CRITICAL: Declare useAuth as a top-level const before exporting
// This ensures the export binding refers to a top-level declared variable
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export the declared function
export { useAuth };

// CRITICAL: Declare AuthProvider as a top-level const before exporting
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'student' or 'admin'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // If user exists, fetch role from Firestore or localStorage
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.role) {
              setUserRole(userData.role);
              localStorage.setItem('userRole', userData.role);
            } else {
              // Fallback to localStorage
              const savedRole = localStorage.getItem('userRole');
              if (savedRole) {
                setUserRole(savedRole);
              }
            }
          } else {
            // Fallback to localStorage
            const savedRole = localStorage.getItem('userRole');
            if (savedRole) {
              setUserRole(savedRole);
            }
          }
        } catch (error) {
          console.error('Error fetching user role in auth state change:', error);
          // Fallback to localStorage
          const savedRole = localStorage.getItem('userRole');
          if (savedRole) {
            setUserRole(savedRole);
          }
        }
      } else {
        // User logged out - clear role
        setUserRole(null);
        localStorage.removeItem('userRole');
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginAsStudent = async () => {
    try {
      const userCredential = await signInAnonymously(auth);
      setUser(userCredential.user);
      setUserRole('student');
      // Store role in localStorage for persistence
      localStorage.setItem('userRole', 'student');
    } catch (error) {
      console.error('Error logging in as student:', error);
      throw error;
    }
  };

  const loginAsAdmin = async () => {
    try {
      const userCredential = await signInAnonymously(auth);
      setUser(userCredential.user);
      setUserRole('admin');
      // Store role in localStorage for persistence
      localStorage.setItem('userRole', 'admin');
    } catch (error) {
      console.error('Error logging in as admin:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserRole(null);
      localStorage.removeItem('userRole');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Note: Role fetching is now handled in onAuthStateChanged to avoid race conditions
  // This useEffect is kept for backward compatibility but role is primarily set in auth state change

  const register = async (name, email, password, role) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      
      // Send email verification only for students (admins don't need verification)
      if (role !== 'admin') {
        await sendEmailVerification(newUser);
      }
      
      // Store user data in Firestore
      await setDoc(doc(db, 'users', newUser.uid), {
        name: name,
        email: email,
        studentEmail: email, // Set registration email as default student email
        role: role,
        emailVerified: role === 'admin' ? true : false, // Admins are automatically verified
        createdAt: new Date().toISOString()
      });

      setUser(newUser);
      setUserRole(role);
      localStorage.setItem('userRole', role);
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      // Check if it's an admin email format before attempting login (must be exactly admin@sistc.app)
      const emailLower = email ? email.toLowerCase().trim() : '';
      const isAdminEmail = emailLower === 'admin@sistc.app';
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const loggedInUser = userCredential.user;
      
      // Reload user to get latest emailVerified status
      await loggedInUser.reload();
      
      // Fetch user role from Firestore first to check if user is admin
      const userDoc = await getDoc(doc(db, 'users', loggedInUser.uid));
      let userRole = 'student';
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role) {
          userRole = userData.role;
        }
      }
      
      // If email format suggests admin or role is admin, treat as admin
      const isAdmin = userRole === 'admin' || isAdminEmail;
      
      // Get current Firestore emailVerified status (may have been manually set by admin)
      let firestoreEmailVerified = false;
      let adminVerified = false; // Track if admin manually verified
      if (userDoc.exists()) {
        const userData = userDoc.data();
        firestoreEmailVerified = userData.emailVerified === true; // Preserve admin-verified status
        adminVerified = userData.adminVerified === true; // Check if admin manually verified
      }
      
      // Check if email is verified (skip for admin accounts)
      // Use Firestore emailVerified if it exists (admin may have verified it), otherwise use Firebase Auth status
      const isEmailVerified = isAdmin ? true : (firestoreEmailVerified || loggedInUser.emailVerified);
      
      // Only require email verification for students, and only if explicitly required
      // Allow login even if email is not verified, but show a warning
      if (!isEmailVerified && !isAdmin) {
        // Update Firestore to reflect current verification status
        if (!firestoreEmailVerified) {
          await setDoc(doc(db, 'users', loggedInUser.uid), {
            emailVerified: false
          }, { merge: true });
        }
        
        // Don't block login - just log a warning
        // User can still access the app, but might see verification prompts
        console.warn('User logged in with unverified email:', loggedInUser.email);
        
        // Note: We're NOT signing out the user or throwing an error
        // This allows users to login and use the app even if email is not verified
        // Admin can verify emails manually if needed
      }
      
      // Update emailVerified status in Firestore
      // CRITICAL: NEVER overwrite emailVerified if admin manually verified it
      // Only update if:
      // 1. User is admin (always verified)
      // 2. NOT admin-verified AND Firebase Auth says verified (user verified via email)
      // 3. NOT admin-verified AND email not verified (set to false)
      
      if (isAdmin) {
        // Admins are always verified - update to true
        await setDoc(doc(db, 'users', loggedInUser.uid), {
          emailVerified: true
        }, { merge: true });
      } else if (adminVerified || firestoreEmailVerified === true) {
        // Email is admin-verified or already verified in Firestore - DO NOT OVERWRITE
        // This preserves admin verification - never change it
        console.log('Preserving admin-verified email status for user:', loggedInUser.uid, 'adminVerified:', adminVerified);
        // Do nothing - preserve the existing verified status
      } else if (loggedInUser.emailVerified) {
        // User verified via Firebase Auth email - update Firestore (only if not admin-verified)
        await setDoc(doc(db, 'users', loggedInUser.uid), {
          emailVerified: true
        }, { merge: true });
      } else {
        // Email not verified - only update if not already verified
        // Don't overwrite if it's already true
        if (firestoreEmailVerified !== true) {
          await setDoc(doc(db, 'users', loggedInUser.uid), {
            emailVerified: false
          }, { merge: true });
        }
      }
      
      // Set user role - ensure document exists and role is set FIRST
      let finalRole = 'student'; // Default role
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role) {
          finalRole = userData.role;
        } else {
          // If role field doesn't exist but email suggests admin, set as admin
          if (isAdminEmail) {
            await setDoc(doc(db, 'users', loggedInUser.uid), {
              role: 'admin',
              emailVerified: true
            }, { merge: true });
            finalRole = 'admin';
          } else {
            console.warn('User document exists but no role found. Setting role to student.');
            // Update document with student role
            await setDoc(doc(db, 'users', loggedInUser.uid), {
              role: 'student'
            }, { merge: true });
            finalRole = 'student';
          }
        }
      } else {
        // If no user document found, check if it's an admin email and create accordingly
        const emailLower = loggedInUser.email ? loggedInUser.email.toLowerCase() : '';
        const isStudentEmail = emailLower.startsWith('s20') && emailLower.includes('@sistc.app');
        finalRole = isAdminEmail ? 'admin' : (isStudentEmail ? 'student' : 'student');
        console.log(`Creating user document in Firestore with ${finalRole} role.`);
        
        // CRITICAL: Create user document BEFORE setting user state to avoid race conditions
        await setDoc(doc(db, 'users', loggedInUser.uid), {
          email: loggedInUser.email,
          name: loggedInUser.displayName || '',
          role: finalRole,
          emailVerified: isAdminEmail ? true : loggedInUser.emailVerified, // Admins are automatically verified
          createdAt: new Date().toISOString()
        });
      }

      // CRITICAL: Set role FIRST, then user state
      // This ensures role is set before onAuthStateChanged fires
      setUserRole(finalRole);
      localStorage.setItem('userRole', finalRole);
      
      // Set user state AFTER role is set
      // onAuthStateChanged will fire and update user, but role is already set
      setUser(loggedInUser);
      
      console.log('Login successful:', { email: loggedInUser.email, role: finalRole, uid: loggedInUser.uid });
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  };

  const resendVerificationEmail = async () => {
    try {
      if (!user) {
        throw new Error('No user logged in');
      }
      // Check if user is admin - admins don't need email verification
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'admin') {
          throw new Error('Admin accounts do not require email verification.');
        }
      }
      await sendEmailVerification(user);
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  };

  const value = {
    user,
    userRole,
    loginAsStudent,
    loginAsAdmin,
    register,
    login,
    signOut,
    resetPassword,
    resendVerificationEmail,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Export the declared component
export { AuthProvider };

