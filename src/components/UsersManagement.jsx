import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, deleteDoc, updateDoc, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isAdminRole } from '../utils/helpers';
import { Trash2, User, Mail, Phone, Calendar, AlertCircle, Edit2, X, Check, Image, GraduationCap, MapPin, FileText, Upload, CheckCircle, XCircle, Shield, MoreVertical } from 'lucide-react';

const UsersManagement = () => {
  const { user: currentUser } = useAuth();
  const { success, error: showError } = useToast();
  const [users, setUsers] = useState([]);
  const [deleting, setDeleting] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(null);
  const [uploading, setUploading] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [verifying, setVerifying] = useState(null);
  const [openActionMenu, setOpenActionMenu] = useState(null);

  // Fetch all users (limited to prevent quota exhaustion)
  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      limit(100) // Reduced to 100 users for Spark free plan (was 200)
    );

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Sort by createdAt if available, otherwise by document ID
        usersData.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          if (a.createdAt) return -1;
          if (b.createdAt) return 1;
          return b.id.localeCompare(a.id);
        });
        setUsers(usersData);
        console.log('Users loaded:', usersData.length);
      },
      (error) => {
        console.error('Error fetching users:', error);
        if (error.code === 'resource-exhausted') {
          console.warn('UsersManagement: Firestore quota exceeded');
        } else if (error.code === 'failed-precondition') {
          console.warn('UsersManagement: Index missing, using simple query');
          // Try without orderBy if there's an index error (with limit and cleanup)
          const simpleQuery = query(
            collection(db, 'users'),
            limit(100) // Reduced to 100 users for Spark free plan
          );
          const fallbackUnsubscribe = onSnapshot(simpleQuery, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setUsers(usersData);
          });
          // Return cleanup for fallback listener
          return () => {
            unsubscribe();
            fallbackUnsubscribe();
          };
        }
      }
    );

    return () => unsubscribe();
  }, []);

  // Log audit action
  const logAuditAction = async (action, details) => {
    try {
      await addDoc(collection(db, 'auditLogs'), {
        action,
        details,
        performedBy: currentUser.uid,
        performedByEmail: currentUser.email,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!confirm(`Are you sure you want to delete user "${userEmail || userId}"? This action cannot be undone and will also delete all their messages.`)) return;

    setDeleting(userId);
    try {
      await deleteDoc(doc(db, 'users', userId));
      
      await logAuditAction('delete_user', {
        userId,
        userEmail
      });

      success('User deleted successfully.');
    } catch (error) {
      console.error('Error deleting user:', error);
      showError('Failed to delete user. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleEditUser = (user) => {
    setEditing(user.id);
    setEditData({
      name: user.name || '',
      studentEmail: user.studentEmail || '',
      personalEmail: user.personalEmail || '',
      phoneNumber: user.phoneNumber || '',
      bio: user.bio || '',
      profilePicture: user.profilePicture || '',
      course: user.course || '',
      yearOfStudy: user.yearOfStudy || '',
      dateOfBirth: user.dateOfBirth || '',
      address: user.address || '',
      role: user.role || 'student'
    });
    setShowEditModal(true);
  };

  const handleCancelEdit = () => {
    setEditing(null);
    setEditData({});
    setShowEditModal(false);
  };

  const handleSaveEdit = async (userId) => {
    setSaving(userId);
    try {
      const originalUser = users.find(u => u.id === userId);
      const changes = {};

      if (editData.name !== (originalUser.name || '')) {
        changes.name = editData.name.trim() || null;
      }
      if (editData.studentEmail !== (originalUser.studentEmail || '')) {
        changes.studentEmail = editData.studentEmail.trim() || null;
      }
      if (editData.personalEmail !== (originalUser.personalEmail || '')) {
        changes.personalEmail = editData.personalEmail.trim() || null;
      }
      if (editData.phoneNumber !== (originalUser.phoneNumber || '')) {
        changes.phoneNumber = editData.phoneNumber.trim() || null;
      }
      if (editData.bio !== (originalUser.bio || '')) {
        changes.bio = editData.bio.trim() || null;
      }
      if (editData.profilePicture !== (originalUser.profilePicture || '')) {
        changes.profilePicture = editData.profilePicture.trim() || null;
      }
      if (editData.course !== (originalUser.course || '')) {
        changes.course = editData.course.trim() || null;
      }
      if (editData.yearOfStudy !== (originalUser.yearOfStudy || '')) {
        changes.yearOfStudy = editData.yearOfStudy.trim() || null;
      }
      if (editData.dateOfBirth !== (originalUser.dateOfBirth || '')) {
        changes.dateOfBirth = editData.dateOfBirth.trim() || null;
      }
      if (editData.address !== (originalUser.address || '')) {
        changes.address = editData.address.trim() || null;
      }
      if (editData.role !== originalUser.role) {
        changes.role = editData.role;
      }

      changes.updatedAt = new Date().toISOString();
      
      // If role changed to admin, automatically verify email
      if (editData.role === 'admin' && originalUser.role !== 'admin') {
        changes.emailVerified = true;
      }
      changes.updatedBy = currentUser.uid;
      changes.updatedByEmail = currentUser.email;

      await updateDoc(doc(db, 'users', userId), changes);

      await logAuditAction('edit_user', {
        userId,
        userEmail: originalUser.email,
        changes
      });

      setEditing(null);
      setEditData({});
      setShowEditModal(false);
      success('User updated successfully.');
    } catch (error) {
      console.error('Error updating user:', error);
      showError('Failed to update user. Please try again.');
    } finally {
      setSaving(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'N/A';
    }
  };

  const handleVerifyEmail = async (userId, userEmail, currentStatus) => {
    const newStatus = !currentStatus;
    setVerifying(userId);
    try {
      // Add adminVerified flag to track that this was manually verified by admin
      // This helps prevent automatic reverting
      await updateDoc(doc(db, 'users', userId), {
        emailVerified: newStatus,
        adminVerified: newStatus ? true : null, // Track if admin verified (null if unverified)
        adminVerifiedAt: newStatus ? new Date().toISOString() : null,
        adminVerifiedBy: newStatus ? currentUser.uid : null,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.uid,
        updatedByEmail: currentUser.email
      });

      await logAuditAction('verify_email', {
        userId,
        userEmail,
        verified: newStatus,
        verifiedBy: currentUser.email,
        adminVerified: newStatus
      });

      success(`Email ${newStatus ? 'verified' : 'unverified'} successfully.`);
    } catch (error) {
      console.error('Error updating email verification:', error);
      showError('Failed to update email verification status. Please try again.');
    } finally {
      setVerifying(null);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.studentEmail?.toLowerCase().includes(searchLower) ||
      user.personalEmail?.toLowerCase().includes(searchLower) ||
      user.phoneNumber?.includes(searchTerm) ||
      user.id.toLowerCase().includes(searchLower) ||
      user.role?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div 
        className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4"
        style={{
          paddingTop: `max(0.75rem, env(safe-area-inset-top, 0px) + 0.5rem)`,
          paddingBottom: `0.75rem`,
          paddingLeft: `calc(1rem + env(safe-area-inset-left, 0px))`,
          paddingRight: `calc(1rem + env(safe-area-inset-right, 0px))`,
          position: 'relative',
          zIndex: 10
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-white">Users Management</h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Manage, edit, and delete user accounts
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4">
        <input
          type="text"
          placeholder="Search by email, phone, or user ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
        />
      </div>

      {/* Users Table */}
      <div className="flex-1 overflow-auto overscroll-contain touch-pan-y px-3 sm:px-6 py-4">
        {filteredUsers.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <User className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={48} />
              <p className="text-gray-400 dark:text-gray-500 text-lg">
                {searchTerm ? 'No users found matching your search' : 'No users found'}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto smooth-scroll overscroll-contain touch-pan-x">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                    User ID
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                    Student Email
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden xl:table-cell">
                    Personal Email
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden xl:table-cell">
                    Phone
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                    Created
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Verified
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky right-0 bg-gray-50 dark:bg-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-mono text-gray-700 dark:text-gray-300 hidden md:table-cell">
                      {user.id.substring(0, 8)}...
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        isAdminRole(user.role)
                          ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200'
                          : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200'
                      }`}>
                        {user.role || 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-1 max-w-[200px] sm:max-w-none truncate">
                        <Mail size={12} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        <span className="truncate">{user.email || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700 dark:text-gray-300 hidden lg:table-cell">
                      {user.studentEmail ? (
                        <div className="flex items-center gap-1 max-w-[200px] truncate">
                          <Mail size={12} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                          <span className="truncate">{user.studentEmail}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700 dark:text-gray-300 hidden xl:table-cell">
                      {user.personalEmail ? (
                        <div className="flex items-center gap-1 max-w-[200px] truncate">
                          <Mail size={12} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                          <span className="truncate">{user.personalEmail}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700 dark:text-gray-300 hidden xl:table-cell">
                      {user.phoneNumber ? (
                        <div className="flex items-center gap-1">
                          <Phone size={12} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                          {user.phoneNumber}
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        <span className="truncate">{formatDate(user.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        {user.role === 'admin' ? (
                          <span className="flex items-center gap-1 px-1.5 sm:px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                            <Shield size={10} className="sm:w-3 sm:h-3" />
                            <span className="hidden sm:inline">Auto</span>
                          </span>
                        ) : (
                          <>
                            <span className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 text-xs font-semibold rounded-full ${
                              user.emailVerified
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                            }`}>
                              {user.emailVerified ? (
                                <CheckCircle size={10} className="sm:w-3 sm:h-3" />
                              ) : (
                                <XCircle size={10} className="sm:w-3 sm:h-3" />
                              )}
                              <span className="hidden sm:inline">{user.emailVerified ? 'Verified' : 'Not Verified'}</span>
                            </span>
                            <button
                              onClick={() => handleVerifyEmail(user.id, user.email, user.emailVerified)}
                              disabled={verifying === user.id}
                              className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 text-xs rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                user.emailVerified
                                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                              }`}
                              title={user.emailVerified ? 'Unverify email' : 'Verify email'}
                            >
                              {verifying === user.id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                              ) : user.emailVerified ? (
                                <XCircle size={10} className="sm:w-3 sm:h-3" />
                              ) : (
                                <CheckCircle size={10} className="sm:w-3 sm:h-3" />
                              )}
                              <span className="hidden sm:inline">{user.emailVerified ? 'Unverify' : 'Verify'}</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm sticky right-0 bg-white dark:bg-gray-800 z-10">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          disabled={user.id === currentUser?.uid}
                          className="flex items-center justify-center gap-1 px-2 sm:px-3 py-1.5 sm:py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs min-w-[60px] sm:min-w-auto"
                          title={user.id === currentUser?.uid ? 'Cannot edit your own account' : 'Edit user profile'}
                        >
                          <Edit2 size={14} className="sm:w-3.5 sm:h-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          disabled={deleting === user.id || isAdminRole(user.role) || user.id === currentUser?.uid}
                          className="flex items-center justify-center gap-1 px-2 sm:px-3 py-1.5 sm:py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs min-w-[60px] sm:min-w-auto"
                          title={
                            user.id === currentUser?.uid 
                              ? 'Cannot delete your own account' 
                              : isAdminRole(user.role)
                              ? 'Cannot delete admin accounts' 
                              : 'Delete user'
                          }
                        >
                          <Trash2 size={14} className="sm:w-3.5 sm:h-3.5" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden space-y-3 p-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          isAdminRole(user.role)
                            ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200'
                            : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200'
                        }`}>
                          {user.role || 'N/A'}
                        </span>
                        {user.role === 'admin' ? (
                          <span className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                            <Shield size={12} />
                            Auto Verified
                          </span>
                        ) : (
                          <span className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                            user.emailVerified
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                              : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                          }`}>
                            {user.emailVerified ? (
                              <>
                                <CheckCircle size={12} />
                                Verified
                              </>
                            ) : (
                              <>
                                <XCircle size={12} />
                                Not Verified
                              </>
                            )}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <Mail size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                          <span className="truncate">{user.email || 'N/A'}</span>
                        </div>
                        {user.studentEmail && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-xs">
                            <Mail size={12} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                            <span className="truncate">Student: {user.studentEmail}</span>
                          </div>
                        )}
                        {user.phoneNumber && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-xs">
                            <Phone size={12} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                            {user.phoneNumber}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs">
                          <Calendar size={12} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                          {formatDate(user.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => handleVerifyEmail(user.id, user.email, user.emailVerified)}
                        disabled={verifying === user.id}
                        className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1 min-w-[100px] justify-center ${
                          user.emailVerified
                            ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {verifying === user.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        ) : user.emailVerified ? (
                          <>
                            <XCircle size={14} />
                            Unverify
                          </>
                        ) : (
                          <>
                            <CheckCircle size={14} />
                            Verify
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleEditUser(user)}
                      disabled={user.id === currentUser?.uid}
                      className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs flex-1 min-w-[100px] justify-center"
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.email)}
                      disabled={deleting === user.id || isAdminRole(user.role) || user.id === currentUser?.uid}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs flex-1 min-w-[100px] justify-center"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border-t border-indigo-200 dark:border-indigo-800 px-4 sm:px-6 py-2 sm:py-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-indigo-800 dark:text-indigo-300">
          <AlertCircle size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
          <span className="truncate">Total: {users.length} | Showing: {filteredUsers.length}</span>
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditModal && editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Edit User Profile</h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="inline mr-2" size={16} />
                  Full Name
                </label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  disabled={saving === editing}
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={editData.role}
                  onChange={(e) => setEditData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  disabled={saving === editing}
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Student Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Mail className="inline mr-2" size={16} />
                  Student Email
                </label>
                <input
                  type="email"
                  value={editData.studentEmail}
                  onChange={(e) => setEditData(prev => ({ ...prev, studentEmail: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  disabled={saving === editing}
                />
              </div>

              {/* Personal Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Mail className="inline mr-2" size={16} />
                  Personal Email
                </label>
                <input
                  type="email"
                  value={editData.personalEmail}
                  onChange={(e) => setEditData(prev => ({ ...prev, personalEmail: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  disabled={saving === editing}
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Phone className="inline mr-2" size={16} />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editData.phoneNumber}
                  onChange={(e) => setEditData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  disabled={saving === editing}
                />
              </div>

              {/* Profile Picture */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Image className="inline mr-2" size={16} />
                  Profile Picture
                </label>
                <div className="flex items-center gap-4 mb-2">
                  {editData.profilePicture && (
                    <img 
                      src={editData.profilePicture} 
                      alt="Profile preview" 
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <div className="flex-1">
                    <label className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      <Upload size={18} />
                      <span>{uploading === editing ? 'Uploading...' : 'Upload Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          
                          if (file.size > 5 * 1024 * 1024) {
                            showError('Image size must be less than 5MB');
                            return;
                          }

                          setUploading(editing);
                          try {
                            const storageRef = ref(storage, `profile-pictures/${editing}/${Date.now()}_${file.name}`);
                            await uploadBytes(storageRef, file);
                            const downloadURL = await getDownloadURL(storageRef);
                            setEditData(prev => ({ ...prev, profilePicture: downloadURL }));
                            success('Image uploaded successfully!');
                          } catch (error) {
                            console.error('Error uploading image:', error);
                            showError('Failed to upload image. Please try again.');
                          } finally {
                            setUploading(null);
                          }
                        }}
                        className="hidden"
                        disabled={uploading === editing || saving === editing}
                      />
                    </label>
                  </div>
                </div>
                <input
                  type="url"
                  value={editData.profilePicture}
                  onChange={(e) => setEditData(prev => ({ ...prev, profilePicture: e.target.value }))}
                  placeholder="Or enter image URL"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  disabled={saving === editing}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Upload an image or enter a URL (optional, max 5MB)
                </p>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FileText className="inline mr-2" size={16} />
                  Bio / About Me
                </label>
                <textarea
                  value={editData.bio}
                  onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none"
                  disabled={saving === editing}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {editData.bio.length}/500 characters
                </p>
              </div>

              {/* Course */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <GraduationCap className="inline mr-2" size={16} />
                  Course / Major
                </label>
                <input
                  type="text"
                  value={editData.course}
                  onChange={(e) => setEditData(prev => ({ ...prev, course: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  disabled={saving === editing}
                />
              </div>

              {/* Year of Study */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <GraduationCap className="inline mr-2" size={16} />
                  Year of Study
                </label>
                <select
                  value={editData.yearOfStudy}
                  onChange={(e) => setEditData(prev => ({ ...prev, yearOfStudy: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  disabled={saving === editing}
                >
                  <option value="">Select year...</option>
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
                  <option value="5+">Year 5+</option>
                  <option value="Graduate">Graduate</option>
                </select>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="inline mr-2" size={16} />
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={editData.dateOfBirth}
                  onChange={(e) => setEditData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  disabled={saving === editing}
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MapPin className="inline mr-2" size={16} />
                  Address
                </label>
                <textarea
                  value={editData.address}
                  onChange={(e) => setEditData(prev => ({ ...prev, address: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none"
                  disabled={saving === editing}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleSaveEdit(editing)}
                  disabled={saving === editing}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check size={20} />
                  <span>{saving === editing ? 'Saving...' : 'Save Changes'}</span>
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={saving === editing}
                  className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 font-semibold rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X size={20} />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
