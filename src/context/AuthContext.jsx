import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInAnonymously, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
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

  const register = async (email, password, role) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      
      // Store user role in Firestore
      await setDoc(doc(db, 'users', newUser.uid), {
        email: email,
        role: role,
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
      
      // Fetch user role from Firestore
      const userDoc = await getDoc(doc(db, 'users', loggedInUser.uid));
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
        // If no user document found, create one with student role
        console.warn('No user document found in Firestore. Creating one with student role.');
        await setDoc(doc(db, 'users', loggedInUser.uid), {
          email: loggedInUser.email,
          role: 'student',
          createdAt: new Date().toISOString()
        });
        setUserRole('student');
        localStorage.setItem('userRole', 'student');
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

  const value = {
    user,
    userRole,
    loginAsStudent,
    loginAsAdmin,
    register,
    login,
    signOut,
    resetPassword,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

