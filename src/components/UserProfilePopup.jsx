import { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { X, User, Mail, Phone, Calendar, GraduationCap, MapPin, FileText, Image, Circle } from 'lucide-react';

const UserProfilePopup = ({ userId, onClose }) => {
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
          // Normalize isOnline to boolean
          isOnline: data.isOnline === true || data.isOnline === 'true',
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">User Profile</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : userData ? (
            <div className="space-y-6">
              {/* Profile Picture */}
              <div className="flex justify-center">
                {userData.profilePicture ? (
                  <img 
                    src={userData.profilePicture} 
                    alt={userData.name || 'Profile'} 
                    className="w-24 h-24 rounded-full object-cover border-4 border-indigo-200 dark:border-indigo-700"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className={`w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center border-4 border-indigo-200 dark:border-indigo-700 ${userData.profilePicture ? 'hidden' : ''}`}
                >
                  <User size={48} className="text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>

              {/* Name */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h4 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {userData.name}
                  </h4>
                  {userData.isOnline === true ? (
                    <div className="w-3 h-3 bg-green-500 rounded-full" title="Online" />
                  ) : userData.lastSeen ? (
                    <div className="w-3 h-3 bg-gray-400 rounded-full" title={`Last seen: ${formatLastSeen(userData.lastSeen)}`} />
                  ) : (
                    <div className="w-3 h-3 bg-gray-400 rounded-full" title="Offline" />
                  )}
                </div>
                <span className={`inline-block mt-1 px-3 py-1 text-xs font-semibold rounded-full ${
                  userData.role === 'admin' || userData.role === 'admin1'
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}>
                  {userData.role || 'student'}
                </span>
                {/* Online Status / Last Seen */}
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {userData.isOnline === true ? (
                    <span className="flex items-center justify-center gap-1">
                      <Circle size={8} className="fill-green-500 text-green-500" />
                      Online
                    </span>
                  ) : userData.lastSeen ? (
                    <span className="flex items-center justify-center gap-1">
                      <Circle size={8} className="fill-gray-400 text-gray-400" />
                      Last seen: {formatLastSeen(userData.lastSeen)}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1">
                      <Circle size={8} className="fill-gray-400 text-gray-400" />
                      Offline
                    </span>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4">
                {/* Debug info in development */}
                {import.meta.env.DEV && (
                  <div className="text-xs text-gray-400 dark:text-gray-500 p-2 bg-gray-100 dark:bg-gray-900 rounded">
                    <strong>Debug:</strong> User ID: {userId}<br/>
                    Fields: {Object.keys(userData).join(', ')}
                  </div>
                )}
                
                {/* Always show email if available */}
                {(userData.email || userData.studentEmail || userData.personalEmail) && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Mail size={16} className="text-indigo-600 dark:text-indigo-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                      {userData.email || userData.studentEmail || userData.personalEmail || 'Not set'}
                    </p>
                  </div>
                )}
                
                {userData.bio && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={16} className="text-indigo-600 dark:text-indigo-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bio</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">{userData.bio}</p>
                  </div>
                )}

                {userData.studentEmail && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Mail size={16} className="text-indigo-600 dark:text-indigo-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Student Email</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">{userData.studentEmail}</p>
                  </div>
                )}

                {userData.personalEmail && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Mail size={16} className="text-indigo-600 dark:text-indigo-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Personal Email</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">{userData.personalEmail}</p>
                  </div>
                )}

                {userData.phoneNumber && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Phone size={16} className="text-indigo-600 dark:text-indigo-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">{userData.phoneNumber}</p>
                  </div>
                )}

                {userData.course && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <GraduationCap size={16} className="text-indigo-600 dark:text-indigo-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Course</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">{userData.course}</p>
                  </div>
                )}

                {userData.yearOfStudy && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <GraduationCap size={16} className="text-indigo-600 dark:text-indigo-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Year of Study</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">{userData.yearOfStudy}</p>
                  </div>
                )}

                {userData.dateOfBirth && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar size={16} className="text-indigo-600 dark:text-indigo-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                      {new Date(userData.dateOfBirth).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {userData.address && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin size={16} className="text-indigo-600 dark:text-indigo-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">{userData.address}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">User not found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePopup;

