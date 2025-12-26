import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, deleteDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isAdminRole } from '../utils/helpers';
import { Trash2, User, Mail, Phone, Calendar, AlertCircle, Edit2, X, Check } from 'lucide-react';

const UsersManagement = () => {
  const { user: currentUser } = useAuth();
  const { success, error: showError } = useToast();
  const [users, setUsers] = useState([]);
  const [deleting, setDeleting] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all users
  useEffect(() => {
    const q = query(collection(db, 'users'));

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
        // Try without orderBy if there's an index error
        const simpleQuery = query(collection(db, 'users'));
        onSnapshot(simpleQuery, (snapshot) => {
          const usersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setUsers(usersData);
        });
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
      studentEmail: user.studentEmail || '',
      personalEmail: user.personalEmail || '',
      phoneNumber: user.phoneNumber || '',
      role: user.role || 'student'
    });
  };

  const handleCancelEdit = () => {
    setEditing(null);
    setEditData({});
  };

  const handleSaveEdit = async (userId) => {
    setSaving(userId);
    try {
      const originalUser = users.find(u => u.id === userId);
      const changes = {};

      if (editData.studentEmail !== (originalUser.studentEmail || '')) {
        changes.studentEmail = editData.studentEmail.trim() || null;
      }
      if (editData.personalEmail !== (originalUser.personalEmail || '')) {
        changes.personalEmail = editData.personalEmail.trim() || null;
      }
      if (editData.phoneNumber !== (originalUser.phoneNumber || '')) {
        changes.phoneNumber = editData.phoneNumber.trim() || null;
      }
      if (editData.role !== originalUser.role) {
        changes.role = editData.role;
      }

      changes.updatedAt = new Date().toISOString();
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
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Users Management</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage, edit, and delete user accounts
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <input
          type="text"
          placeholder="Search by email, phone, or user ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sistc-600 focus:border-transparent"
        />
      </div>

      {/* Users Table */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
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
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Login Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Student Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Personal Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Phone Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700 dark:text-gray-300">
                      {user.id.substring(0, 12)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editing === user.id ? (
                        <select
                          value={editData.role}
                          onChange={(e) => setEditData(prev => ({ ...prev, role: e.target.value }))}
                          className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          disabled={saving === user.id}
                        >
                          <option value="student">Student</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          isAdminRole(user.role)
                            ? 'bg-sistc-100 dark:bg-sistc-900 text-sistc-800 dark:text-sistc-200'
                            : 'bg-sistc-100 dark:bg-sistc-900 text-sistc-800 dark:text-sistc-200'
                        }`}>
                          {user.role || 'N/A'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <Mail size={14} className="text-gray-400 dark:text-gray-500" />
                        {user.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {editing === user.id ? (
                        <input
                          type="email"
                          value={editData.studentEmail}
                          onChange={(e) => setEditData(prev => ({ ...prev, studentEmail: e.target.value }))}
                          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Student email"
                          disabled={saving === user.id}
                        />
                      ) : (
                        user.studentEmail ? (
                          <div className="flex items-center gap-1">
                            <Mail size={14} className="text-gray-400 dark:text-gray-500" />
                            {user.studentEmail}
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {editing === user.id ? (
                        <input
                          type="email"
                          value={editData.personalEmail}
                          onChange={(e) => setEditData(prev => ({ ...prev, personalEmail: e.target.value }))}
                          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Personal email"
                          disabled={saving === user.id}
                        />
                      ) : (
                        user.personalEmail ? (
                          <div className="flex items-center gap-1">
                            <Mail size={14} className="text-gray-400 dark:text-gray-500" />
                            {user.personalEmail}
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {editing === user.id ? (
                        <input
                          type="tel"
                          value={editData.phoneNumber}
                          onChange={(e) => setEditData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Phone number"
                          disabled={saving === user.id}
                        />
                      ) : (
                        user.phoneNumber ? (
                          <div className="flex items-center gap-1">
                            <Phone size={14} className="text-gray-400 dark:text-gray-500" />
                            {user.phoneNumber}
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} className="text-gray-400 dark:text-gray-500" />
                        {formatDate(user.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {editing === user.id ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(user.id)}
                              disabled={saving === user.id}
                              className="flex items-center gap-1 px-3 py-1 bg-sistc-600 hover:bg-sistc-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                            >
                              <Check size={14} />
                              <span>Save</span>
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={saving === user.id}
                              className="flex items-center gap-1 px-3 py-1 bg-sistc-600 hover:bg-sistc-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                            >
                              <X size={14} />
                              <span>Cancel</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditUser(user)}
                              disabled={user.id === currentUser?.uid}
                              className="flex items-center gap-1 px-3 py-1 bg-sistc-600 hover:bg-sistc-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                              title={user.id === currentUser?.uid ? 'Cannot edit your own account' : 'Edit user'}
                            >
                              <Edit2 size={14} />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id, user.email)}
                              disabled={deleting === user.id || isAdminRole(user.role) || user.id === currentUser?.uid}
                              className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                              title={
                                user.id === currentUser?.uid 
                                  ? 'Cannot delete your own account' 
                                  : isAdminRole(user.role)
                                  ? 'Cannot delete admin accounts' 
                                  : 'Delete user'
                              }
                            >
                              <Trash2 size={14} />
                              <span>Delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-sistc-50 dark:bg-sistc-900/20 border-t border-sistc-200 dark:border-sistc-800 px-6 py-3">
        <div className="flex items-center gap-2 text-sm text-sistc-800 dark:text-sistc-300">
          <AlertCircle size={16} />
          <span>Total Users: {users.length} | Showing: {filteredUsers.length}</span>
        </div>
      </div>
    </div>
  );
};

export default UsersManagement;
