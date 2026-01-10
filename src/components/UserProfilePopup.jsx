import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
// Use window.__firebaseDb to avoid import/export issues in production builds
const db = typeof window !== 'undefined' && window.__firebaseDb 
  ? window.__firebaseDb 
  : null;
import { X, User, Mail, Phone, Calendar, GraduationCap, MapPin, FileText, Image, Circle, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
// Use window globals to avoid import/export issues
const isAdminRole = typeof window !== 'undefined' && window.__isAdminRole 
  ? window.__isAdminRole 
  : (role) => role === 'admin' || role === 'admin1';
const isUserOnline = typeof window !== 'undefined' && window.__isUserOnline 
  ? window.__isUserOnline 
  : (userData) => userData?.isOnline === true;

const UserProfilePopup = ({ userId, onClose, onStartPrivateChat }) => {
  const { user, userRole } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    // Use real-time listener to get online status and last seen
    const unsubscribe = onSnapshot(doc(db, 'users', userId), (userDoc) => {
      if (userDoc.exists()) {
        const data = userDoc.data();
        // Normalize all fields properly - ensure we preserve all data and normalize specific fields
        const normalizedData = {
          ...data, // Spread all original data first
          id: userDoc.id,
          // Normalize name with proper fallback
          name: (data.name && data.name.trim()) ? data.name.trim() : (data.email ? data.email.split('@')[0] : `User ${userId.substring(0, 8)}`),
          // Use helper to check if actually online (validates both flag and recent lastSeen)
          isOnline: isUserOnline(data),
          // Preserve lastSeen or set to null
          lastSeen: data.lastSeen || null,
          // Preserve email
          email: data.email || null,
          // Normalize role with default
          role: data.role || 'student',
          // Ensure all profile fields are preserved
          bio: data.bio || null,
          profilePicture: data.profilePicture || null,
          studentEmail: data.studentEmail || null,
          personalEmail: data.personalEmail || null,
          phoneNumber: data.phoneNumber || null,
          course: data.course || null,
          yearOfStudy: data.yearOfStudy || null,
          dateOfBirth: data.dateOfBirth || null,
          address: data.address || null
        };
        console.log('UserProfilePopup - Loaded user data:', {
          raw: data,
          normalized: normalizedData,
          userId: userId
        });
        setUserData(normalizedData);
      } else {
        console.warn('UserProfilePopup - User document does not exist:', userId);
        // Create a minimal user data object with fallback info
        setUserData({
          id: userId,
          name: `User ${userId.substring(0, 8)}`,
          isOnline: false,
          lastSeen: null,
          role: 'student',
          email: null,
          bio: null,
          profilePicture: null,
          studentEmail: null,
          personalEmail: null,
          phoneNumber: null,
          course: null,
          yearOfStudy: null,
          dateOfBirth: null,
          address: null
        });
      }
      setLoading(false);
    }, (error) => {
      console.error('UserProfilePopup - Error fetching user data:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Never';
    const date = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!userId) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto"
        onClick={onClose}
        style={{ 
          zIndex: 9999,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          minHeight: '100dvh' // Dynamic viewport height for mobile (100dvh > 100vh)
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="glass-panel border border-white/10 rounded-2xl shadow-2xl max-w-md w-full overflow-y-auto overscroll-contain touch-pan-y"
          onClick={(e) => e.stopPropagation()}
          style={{ 
            zIndex: 10000,
            maxHeight: 'calc(100dvh - 2rem)', // Use dynamic viewport height for mobile
            margin: 'auto',
            position: 'relative'
          }}
        >
          <div className="sticky top-0 glass-panel border-b border-white/10 px-6 py-4 flex items-center justify-between backdrop-blur-xl z-10 rounded-t-2xl">
            <h3 className="text-xl font-bold text-white text-glow">User Profile</h3>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              className="text-white/70 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
            >
              <X size={24} />
            </motion.button>
          </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="rounded-full h-8 w-8 border-b-2 border-indigo-400"
              />
            </div>
          ) : userData ? (
            <div className="space-y-6">
              {/* Profile Picture - Fluid.so aesthetic */}
              <div className="flex justify-center">
                {userData.profilePicture ? (
                  <img 
                    src={userData.profilePicture} 
                    alt={userData.name || 'Profile'} 
                    className="w-24 h-24 rounded-full object-cover border-4 border-indigo-500/50 shadow-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className={`w-24 h-24 rounded-full bg-indigo-600/30 flex items-center justify-center border-4 border-indigo-500/50 ${userData.profilePicture ? 'hidden' : ''}`}
                >
                  <User size={48} className="text-indigo-300" />
                </div>
              </div>

              {/* Name - Fluid.so aesthetic */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h4 className="text-2xl font-bold text-white text-glow">
                    {userData.name}
                  </h4>
                  {isUserOnline(userData) ? (
                    <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg" title="Online" />
                  ) : userData.lastSeen ? (
                    <div className="w-3 h-3 bg-white/40 rounded-full" title={`Last seen: ${formatLastSeen(userData.lastSeen)}`} />
                  ) : (
                    <div className="w-3 h-3 bg-white/40 rounded-full" title="Offline" />
                  )}
                </div>
                <span className={`inline-block mt-1 px-3 py-1 text-xs font-semibold rounded-full ${
                  userData.role === 'admin' || userData.role === 'admin1'
                    ? 'bg-indigo-600/30 border border-indigo-500/50 text-indigo-200'
                    : 'bg-white/10 border border-white/20 text-white/80'
                }`}>
                  {userData.role || 'student'}
                </span>
                {/* Online Status / Last Seen - Fluid.so aesthetic */}
                <div className="mt-2 text-sm text-white/60">
                  {isUserOnline(userData) ? (
                    <span className="flex items-center justify-center gap-1">
                      <Circle size={8} className="fill-green-500 text-green-500" />
                      Online
                    </span>
                  ) : userData.lastSeen ? (
                    <span className="flex items-center justify-center gap-1">
                      <Circle size={8} className="fill-white/40 text-white/40" />
                      Last seen: {formatLastSeen(userData.lastSeen)}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1">
                      <Circle size={8} className="fill-white/40 text-white/40" />
                      Offline
                    </span>
                  )}
                </div>
              </div>

              {/* Start Private Chat Button - Fluid.so aesthetic */}
              {onStartPrivateChat && user && userData && user.uid !== userId && (
                <div className="flex justify-center pt-4 pb-4 border-b border-white/10">
                  <motion.button
                    onClick={() => {
                      onStartPrivateChat(userId, userData);
                      onClose();
                    }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="send-button-shimmer flex items-center gap-2 px-6 py-3 text-white rounded-xl transition-all font-medium shadow-lg hover:shadow-xl"
                  >
                    <MessageCircle size={20} />
                    <span>Start Private Chat</span>
                  </motion.button>
                </div>
              )}

              {/* Details - Fluid.so aesthetic */}
              <div className="space-y-4">
                {userData.bio && userData.bio.trim() && (
                  <div className="glass-panel border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={16} className="text-indigo-300" />
                      <span className="text-sm font-medium text-white/90">Bio</span>
                    </div>
                    <p className="text-sm text-white/70 pl-6">{userData.bio}</p>
                  </div>
                )}

                {userData.studentEmail && userData.studentEmail.trim() && (
                  <div className="glass-panel border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail size={16} className="text-indigo-300" />
                      <span className="text-sm font-medium text-white/90">Student Email</span>
                    </div>
                    <p className="text-sm text-white/70 pl-6">{userData.studentEmail}</p>
                  </div>
                )}

                {userData.personalEmail && userData.personalEmail.trim() && (
                  <div className="glass-panel border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail size={16} className="text-indigo-300" />
                      <span className="text-sm font-medium text-white/90">Personal Email</span>
                    </div>
                    <p className="text-sm text-white/70 pl-6">{userData.personalEmail}</p>
                  </div>
                )}

                {userData.phoneNumber && userData.phoneNumber.trim() && (
                  <div className="glass-panel border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Phone size={16} className="text-indigo-300" />
                      <span className="text-sm font-medium text-white/90">Phone</span>
                    </div>
                    <p className="text-sm text-white/70 pl-6">{userData.phoneNumber}</p>
                  </div>
                )}

                {userData.course && userData.course.trim() && (
                  <div className="glass-panel border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <GraduationCap size={16} className="text-indigo-300" />
                      <span className="text-sm font-medium text-white/90">Course</span>
                    </div>
                    <p className="text-sm text-white/70 pl-6">{userData.course}</p>
                  </div>
                )}

                {userData.yearOfStudy && userData.yearOfStudy.trim() && (
                  <div className="glass-panel border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <GraduationCap size={16} className="text-indigo-300" />
                      <span className="text-sm font-medium text-white/90">Year of Study</span>
                    </div>
                    <p className="text-sm text-white/70 pl-6">{userData.yearOfStudy}</p>
                  </div>
                )}

                {userData.dateOfBirth && (
                  <div className="glass-panel border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar size={16} className="text-indigo-300" />
                      <span className="text-sm font-medium text-white/90">Date of Birth</span>
                    </div>
                    <p className="text-sm text-white/70 pl-6">
                      {new Date(userData.dateOfBirth).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {userData.address && userData.address.trim() && (
                  <div className="glass-panel border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin size={16} className="text-indigo-300" />
                      <span className="text-sm font-medium text-white/90">Address</span>
                    </div>
                    <p className="text-sm text-white/70 pl-6">{userData.address}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-white/60">User not found</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
    </AnimatePresence>
  );
};

export default UserProfilePopup;

