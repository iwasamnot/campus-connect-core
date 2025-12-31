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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'student' or 'admin'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
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

  // Restore role from Firestore or localStorage on mount
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          // First try to get role from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role);
            localStorage.setItem('userRole', userData.role);
          } else {
            // Fallback to localStorage for anonymous users
            const savedRole = localStorage.getItem('userRole');
            if (savedRole) {
              setUserRole(savedRole);
            }
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          // Fallback to localStorage
          const savedRole = localStorage.getItem('userRole');
          if (savedRole) {
            setUserRole(savedRole);
          }
        }
      }
    };

    fetchUserRole();
  }, [user]);

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
      
      // Check if email is verified (skip for admin accounts)
      if (!loggedInUser.emailVerified && userRole !== 'admin') {
        // Update Firestore emailVerified status
        await setDoc(doc(db, 'users', loggedInUser.uid), {
          emailVerified: false
        }, { merge: true });
        
        // Sign out the user since email is not verified
        await firebaseSignOut(auth);
        
        // Throw error to prompt user to verify email
        const error = new Error('EMAIL_NOT_VERIFIED');
        error.code = 'auth/email-not-verified';
        throw error;
      }
      
      // Update emailVerified status in Firestore (admins are always verified)
      await setDoc(doc(db, 'users', loggedInUser.uid), {
        emailVerified: userRole === 'admin' ? true : loggedInUser.emailVerified // Admins are always verified
      }, { merge: true });
      
      // Set user role
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role) {
          setUserRole(userData.role);
          localStorage.setItem('userRole', userData.role);
        } else {
          // If role field doesn't exist, default to student
          console.warn('User document exists but no role found. Defaulting to student.');
          setUserRole('student');
          localStorage.setItem('userRole', 'student');
        }
      } else {
        // If no user document found, check if it's an admin email and create accordingly
        const isAdminEmail = loggedInUser.email && loggedInUser.email.toLowerCase().startsWith('admin') && loggedInUser.email.toLowerCase().includes('@campusconnect');
        const defaultRole = isAdminEmail ? 'admin' : 'student';
        console.warn(`No user document found in Firestore. Creating one with ${defaultRole} role.`);
        await setDoc(doc(db, 'users', loggedInUser.uid), {
          email: loggedInUser.email,
          role: defaultRole,
          emailVerified: isAdminEmail ? true : loggedInUser.emailVerified, // Admins are automatically verified
          createdAt: new Date().toISOString()
        });
        setUserRole(defaultRole);
        localStorage.setItem('userRole', defaultRole);
      }

      setUser(loggedInUser);
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

