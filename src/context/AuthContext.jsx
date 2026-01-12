import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
        // Don't try to set emailVerified to false - Firestore rules don't allow it
        // The default state (false/undefined) is fine for unverified emails
        
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
      // NOTE: Firestore rules only allow setting emailVerified to true, not to false
      
      try {
        if (isAdmin) {
          // Admins are always verified - update to true
          // This should work because admins can update their own emailVerified
          // OR if document doesn't exist, it will be created with emailVerified: true
          if (!userDoc.exists() || !firestoreEmailVerified) {
            await setDoc(doc(db, 'users', loggedInUser.uid), {
              emailVerified: true
            }, { merge: true });
          }
        } else if (adminVerified || firestoreEmailVerified === true) {
          // Email is admin-verified or already verified in Firestore - DO NOT OVERWRITE
          // This preserves admin verification - never change it
          console.log('Preserving admin-verified email status for user:', loggedInUser.uid, 'adminVerified:', adminVerified);
          // Do nothing - preserve the existing verified status
        } else if (loggedInUser.emailVerified && !firestoreEmailVerified) {
          // User verified via Firebase Auth email - update Firestore to true
          // This is allowed by Firestore rules (false/undefined -> true)
          await setDoc(doc(db, 'users', loggedInUser.uid), {
            emailVerified: true
          }, { merge: true });
        }
        // Note: We don't set emailVerified to false because Firestore rules don't allow it
        // The default state (false/undefined) is fine for unverified emails
      } catch (emailVerifiedError) {
        console.error('Error updating emailVerified status in Firestore:', emailVerifiedError);
        // Don't throw - allow login to proceed even if emailVerified update fails
        // The user can still login, they just won't have emailVerified updated in Firestore
      }
      
      // Set user role - ensure document exists and role is set FIRST
      let finalRole = 'student'; // Default role
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role) {
          finalRole = userData.role;
        } else {
          // If role field doesn't exist, try to set it
          // This is allowed by Firestore rules if role doesn't exist yet
          try {
            if (isAdminEmail) {
              // For admin, set both role and emailVerified (only if role doesn't exist)
              await setDoc(doc(db, 'users', loggedInUser.uid), {
                role: 'admin',
                emailVerified: true
              }, { merge: true });
              finalRole = 'admin';
            } else {
              console.warn('User document exists but no role found. Setting role to student.');
              // For student, only set role (emailVerified is handled separately above)
              await setDoc(doc(db, 'users', loggedInUser.uid), {
                role: 'student'
              }, { merge: true });
              finalRole = 'student';
            }
          } catch (firestoreError) {
            console.error('Error updating user role in Firestore:', firestoreError);
            // If Firestore update fails (e.g., permission denied), use default role
            // The user can still login, but admin functions won't work
            finalRole = isAdminEmail ? 'admin' : 'student';
            // Log warning but don't throw - allow login to proceed
            console.warn('Could not update user role in Firestore. Using default role:', finalRole);
          }
        }
      } else {
        // If no user document found, create it
        // This should always work because users can create their own document
        const emailLower = loggedInUser.email ? loggedInUser.email.toLowerCase() : '';
        // Accept both old domain (@sistc.nsw.edu.au) and new domain (@sistc.app) for backward compatibility
        const isStudentEmail = emailLower.startsWith('s20') && 
                               (emailLower.includes('@sistc.app') || emailLower.includes('@sistc.nsw.edu.au'));
        finalRole = isAdminEmail ? 'admin' : (isStudentEmail ? 'student' : 'student');
        console.log(`Creating user document in Firestore with ${finalRole} role.`);
        
        try {
          // CRITICAL: Create user document BEFORE setting user state to avoid race conditions
          await setDoc(doc(db, 'users', loggedInUser.uid), {
            email: loggedInUser.email,
            name: loggedInUser.displayName || '',
            role: finalRole,
            emailVerified: isAdminEmail ? true : loggedInUser.emailVerified, // Admins are automatically verified
            createdAt: new Date().toISOString()
          });
        } catch (firestoreError) {
          console.error('Error creating user document in Firestore:', firestoreError);
          // If Firestore create fails, still allow login but log the error
          // This should rarely happen since users can create their own document
          console.warn('Could not create user document in Firestore. Login will proceed but some features may not work.');
          // Don't throw - allow login to proceed
        }
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

  const loginAsStudentMemo = useCallback(loginAsStudent, []);
  const loginAsAdminMemo = useCallback(loginAsAdmin, []);
  const registerMemo = useCallback(register, []);
  const loginMemo = useCallback(login, []);
  const signOutMemo = useCallback(signOut, []);
  const resetPasswordMemo = useCallback(resetPassword, []);
  const resendVerificationEmailMemo = useCallback(resendVerificationEmail, [user]);

  const value = useMemo(() => ({
    user,
    userRole,
    loginAsStudent: loginAsStudentMemo,
    loginAsAdmin: loginAsAdminMemo,
    register: registerMemo,
    login: loginMemo,
    signOut: signOutMemo,
    resetPassword: resetPasswordMemo,
    resendVerificationEmail: resendVerificationEmailMemo,
    loading
  }), [user, userRole, loading, loginAsStudentMemo, loginAsAdminMemo, registerMemo, loginMemo, signOutMemo, resetPasswordMemo, resendVerificationEmailMemo]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Export the declared component
export { AuthProvider };

