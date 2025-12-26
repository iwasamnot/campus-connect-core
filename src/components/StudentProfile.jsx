import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { User, Mail, Phone, Save, Loader, Edit2, X } from 'lucide-react';

const StudentProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    studentEmail: '',
    personalEmail: '',
    phoneNumber: ''
  });

  const [originalData, setOriginalData] = useState({
    name: '',
    studentEmail: '',
    personalEmail: '',
    phoneNumber: ''
  });

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const data = {
            name: userData.name || '',
            studentEmail: userData.studentEmail || '',
            personalEmail: userData.personalEmail || '',
            phoneNumber: userData.phoneNumber || ''
          };
          setFormData(data);
          setOriginalData(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
    setSuccess(false);
  };

  const handleEdit = () => {
    setEditing(true);
    setError(null);
    setSuccess(false);
  };

  const handleCancel = () => {
    setFormData({ ...originalData });
    setEditing(false);
    setError(null);
    setSuccess(false);
  };

  const validateEmail = (email) => {
    if (!email) return true; // Allow empty
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    if (!phone) return true; // Allow empty
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (formData.studentEmail && !validateEmail(formData.studentEmail)) {
      setError('Please enter a valid student email address.');
      return;
    }

    if (formData.personalEmail && !validateEmail(formData.personalEmail)) {
      setError('Please enter a valid personal email address.');
      return;
    }

    if (formData.phoneNumber && !validatePhone(formData.phoneNumber)) {
      setError('Please enter a valid phone number (at least 10 digits).');
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: formData.name.trim() || null,
        studentEmail: formData.studentEmail.trim() || null,
        personalEmail: formData.personalEmail.trim() || null,
        phoneNumber: formData.phoneNumber.trim() || null,
        updatedAt: new Date().toISOString()
      });

      setOriginalData({ ...formData });
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader className="animate-spin mx-auto text-sistc-600 mb-4" size={48} />
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">My Profile</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage your contact information</p>
          </div>
          {!editing && (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-sistc-600 hover:bg-sistc-700 text-white rounded-lg transition-colors"
            >
              <Edit2 size={18} />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Profile Form */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-sistc-100 dark:bg-sistc-900/30 border border-sistc-400 dark:border-sistc-700 text-sistc-700 dark:text-sistc-400 rounded-lg">
                Profile updated successfully!
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="inline mr-2" size={16} />
                  Full Name
                </label>
                {editing ? (
                  <>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sistc-600 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Your display name (will be shown in chat)
                    </p>
                  </>
                ) : (
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white min-h-[42px] flex items-center">
                    {formData.name || <span className="text-gray-400 dark:text-gray-500 italic">Not set</span>}
                  </div>
                )}
              </div>

              {/* Student Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Mail className="inline mr-2" size={16} />
                  Student Email
                </label>
                {editing ? (
                  <>
                    <input
                      type="email"
                      name="studentEmail"
                      value={formData.studentEmail}
                      onChange={handleChange}
                      placeholder="student@university.edu"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sistc-600 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Your official university email address
                    </p>
                  </>
                ) : (
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white min-h-[42px] flex items-center">
                    {formData.studentEmail || <span className="text-gray-400 dark:text-gray-500 italic">Not set</span>}
                  </div>
                )}
              </div>

              {/* Personal Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Mail className="inline mr-2" size={16} />
                  Personal Email
                </label>
                {editing ? (
                  <>
                    <input
                      type="email"
                      name="personalEmail"
                      value={formData.personalEmail}
                      onChange={handleChange}
                      placeholder="yourname@example.com"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sistc-600 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Your personal email address (optional)
                    </p>
                  </>
                ) : (
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white min-h-[42px] flex items-center">
                    {formData.personalEmail || <span className="text-gray-400 dark:text-gray-500 italic">Not set</span>}
                  </div>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Phone className="inline mr-2" size={16} />
                  Phone Number
                </label>
                {editing ? (
                  <>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sistc-600 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Your contact phone number (optional)
                    </p>
                  </>
                ) : (
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white min-h-[42px] flex items-center">
                    {formData.phoneNumber || <span className="text-gray-400 dark:text-gray-500 italic">Not set</span>}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {editing && (
                <div className="pt-4 flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 bg-sistc-600 hover:bg-sistc-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {saving ? (
                      <>
                        <Loader className="animate-spin" size={20} />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-sistc-300 dark:border-sistc-600 text-sistc-700 dark:text-sistc-300 font-semibold rounded-lg hover:bg-sistc-50 dark:hover:bg-sistc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X size={20} />
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </form>

            {/* Current Account Info */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <User className="mr-2" size={16} />
                Account Information
              </h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Login Email:</span> {user?.email || 'N/A'}
                </p>
                <p>
                  <span className="font-medium text-gray-700 dark:text-gray-300">User ID:</span> {user?.uid.substring(0, 20)}...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
