import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// Use window globals to avoid import/export issues in production builds
const db = typeof window !== 'undefined' && window.__firebaseDb 
  ? window.__firebaseDb 
  : null;
const storage = typeof window !== 'undefined' && window.__firebaseStorage 
  ? window.__firebaseStorage 
  : null;
import { motion } from 'framer-motion';
import { User, Mail, Phone, Save, Loader, Edit2, X, Image, GraduationCap, Calendar, MapPin, FileText, Upload } from 'lucide-react';

const StudentProfile = () => {
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    studentEmail: '',
    personalEmail: '',
    phoneNumber: '',
    bio: '',
    profilePicture: '',
    course: '',
    yearOfStudy: '',
    dateOfBirth: '',
    address: ''
  });

  const [originalData, setOriginalData] = useState({
    name: '',
    studentEmail: '',
    personalEmail: '',
    phoneNumber: '',
    bio: '',
    profilePicture: '',
    course: '',
    yearOfStudy: '',
    dateOfBirth: '',
    address: ''
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
            phoneNumber: userData.phoneNumber || '',
            bio: userData.bio || '',
            profilePicture: userData.profilePicture || '',
            course: userData.course || '',
            yearOfStudy: userData.yearOfStudy || '',
            dateOfBirth: userData.dateOfBirth || '',
            address: userData.address || ''
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
      const userRef = doc(db, 'users', user.uid);
      
      // Prepare update data - only include fields that have values or are being cleared
      const updateData = {
        updatedAt: new Date().toISOString()
      };
      
      // Only add fields that have values (don't set to null if they were never set)
      if (formData.name.trim()) updateData.name = formData.name.trim();
      if (formData.studentEmail.trim()) updateData.studentEmail = formData.studentEmail.trim();
      if (formData.personalEmail.trim()) updateData.personalEmail = formData.personalEmail.trim();
      if (formData.phoneNumber.trim()) updateData.phoneNumber = formData.phoneNumber.trim();
      if (formData.bio.trim()) updateData.bio = formData.bio.trim();
      if (formData.profilePicture.trim()) updateData.profilePicture = formData.profilePicture.trim();
      if (formData.course.trim()) updateData.course = formData.course.trim();
      if (formData.yearOfStudy.trim()) updateData.yearOfStudy = formData.yearOfStudy.trim();
      if (formData.dateOfBirth.trim()) updateData.dateOfBirth = formData.dateOfBirth.trim();
      if (formData.address.trim()) updateData.address = formData.address.trim();
      
      // Use setDoc with merge to ensure document exists and update it
      await setDoc(userRef, updateData, { merge: true });
      
      console.log('StudentProfile - Profile saved successfully:', updateData);
      
      // Refresh the data from Firestore to ensure we have the latest
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const refreshedData = {
          name: userData.name || '',
          studentEmail: userData.studentEmail || '',
          personalEmail: userData.personalEmail || '',
          phoneNumber: userData.phoneNumber || '',
          bio: userData.bio || '',
          profilePicture: userData.profilePicture || '',
          course: userData.course || '',
          yearOfStudy: userData.yearOfStudy || '',
          dateOfBirth: userData.dateOfBirth || '',
          address: userData.address || ''
        };
        setFormData(refreshedData);
        setOriginalData(refreshedData);
      }

      setEditing(false);
      setSuccess(true);
      showSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.message || 'Failed to save profile. Please try again.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-transparent">
        <div className="text-center">
          <Loader className="animate-spin mx-auto text-indigo-400 mb-4" size={48} />
          <p className="text-white/60 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-transparent">
      {/* Header */}
      <div 
        className="glass-panel border-b border-white/10 backdrop-blur-xl px-4 md:px-6 py-3 md:py-4"
        style={{
          paddingTop: `max(0.75rem, env(safe-area-inset-top, 0px) + 0.5rem)`,
          paddingBottom: `0.75rem`,
          paddingLeft: `calc(1rem + env(safe-area-inset-left, 0px))`,
          paddingRight: `calc(1rem + env(safe-area-inset-right, 0px))`,
          position: 'relative',
          zIndex: 10
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white text-glow">My Profile</h2>
            <p className="text-xs md:text-sm text-white/60">Manage your contact information</p>
          </div>
          {!editing && (
            <motion.button
              onClick={handleEdit}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
            >
              <Edit2 size={18} />
              <span>Edit Profile</span>
            </motion.button>
          )}
        </div>
      </div>

          {/* Profile Form */}
          <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y px-4 md:px-6 py-4 md:py-8">
            <div className="max-w-2xl mx-auto">
              <div className="glass-panel border border-white/10 rounded-[2rem] shadow-xl p-4 md:p-8 backdrop-blur-xl">
            {error && (
              <div className="mb-6 p-4 glass-panel bg-red-600/10 border border-red-500/30 text-red-300 rounded-xl">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 glass-panel bg-indigo-600/10 border border-indigo-500/30 text-indigo-300 rounded-xl">
                Profile updated successfully!
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label htmlFor="profile-name" className="block text-sm font-semibold text-white/90 mb-2.5">
                  <User className="inline mr-2" size={16} />
                  Full Name
                </label>
                {editing ? (
                  <>
                    <input
                      type="text"
                      id="profile-name"
                      name="name"
                      autoComplete="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 border border-white/10 rounded-xl glass-panel bg-white/5 backdrop-blur-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300 hover:border-white/20 [color-scheme:dark]"
                    />
                    <p className="mt-1 text-xs text-white/60">
                      Your display name (will be shown in chat)
                    </p>
                  </>
                ) : (
                  <div className="px-4 py-2 glass-panel bg-white/5 border border-white/10 rounded-xl text-white min-h-[42px] flex items-center backdrop-blur-sm">
                    {formData.name || <span className="text-white/50 italic">Not set</span>}
                  </div>
                )}
              </div>

              {/* Student Email */}
              <div>
                <label htmlFor="profile-student-email" className="block text-sm font-semibold text-white/90 mb-2.5">
                  <Mail className="inline mr-2" size={16} />
                  Student Email
                </label>
                {editing ? (
                  <>
                    <input
                      type="email"
                      id="profile-student-email"
                      name="studentEmail"
                      autoComplete="email"
                      value={formData.studentEmail}
                      onChange={handleChange}
                      placeholder="student@university.edu"
                      className="w-full px-4 py-3 border border-white/10 rounded-xl glass-panel bg-white/5 backdrop-blur-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300 hover:border-white/20 [color-scheme:dark]"
                    />
                    <p className="mt-1 text-xs text-white/60">
                      Your official university email address
                    </p>
                  </>
                ) : (
                  <div className="px-4 py-2 glass-panel bg-white/5 border border-white/10 rounded-xl text-white min-h-[42px] flex items-center backdrop-blur-sm">
                    {formData.studentEmail || <span className="text-white/50 italic">Not set</span>}
                  </div>
                )}
              </div>

              {/* Personal Email */}
              <div>
                <label htmlFor="profile-personal-email" className="block text-sm font-semibold text-white/90 mb-2.5">
                  <Mail className="inline mr-2" size={16} />
                  Personal Email
                </label>
                {editing ? (
                  <>
                    <input
                      type="email"
                      id="profile-personal-email"
                      name="personalEmail"
                      autoComplete="email"
                      value={formData.personalEmail}
                      onChange={handleChange}
                      placeholder="yourname@example.com"
                      className="w-full px-4 py-3 border border-white/10 rounded-xl glass-panel bg-white/5 backdrop-blur-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300 hover:border-white/20 [color-scheme:dark]"
                    />
                    <p className="mt-1 text-xs text-white/60">
                      Your personal email address (optional)
                    </p>
                  </>
                ) : (
                  <div className="px-4 py-2 glass-panel bg-white/5 border border-white/10 rounded-xl text-white min-h-[42px] flex items-center backdrop-blur-sm">
                    {formData.personalEmail || <span className="text-white/50 italic">Not set</span>}
                  </div>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="profile-phone" className="block text-sm font-semibold text-white/90 mb-2.5">
                  <Phone className="inline mr-2" size={16} />
                  Phone Number
                </label>
                {editing ? (
                  <>
                    <input
                      type="tel"
                      id="profile-phone"
                      name="phoneNumber"
                      autoComplete="tel"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-4 py-3 border border-white/10 rounded-xl glass-panel bg-white/5 backdrop-blur-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300 hover:border-white/20 [color-scheme:dark]"
                    />
                    <p className="mt-1 text-xs text-white/60">
                      Your contact phone number (optional)
                    </p>
                  </>
                ) : (
                  <div className="px-4 py-2 glass-panel bg-white/5 border border-white/10 rounded-xl text-white min-h-[42px] flex items-center backdrop-blur-sm">
                    {formData.phoneNumber || <span className="text-white/50 italic">Not set</span>}
                  </div>
                )}
              </div>

              {/* Profile Picture */}
              <div>
                <label htmlFor="profile-picture-url" className="block text-sm font-semibold text-white/90 mb-2.5">
                  <Image className="inline mr-2" size={16} />
                  Profile Picture
                </label>
                {editing ? (
                  <>
                    <div className="flex items-center gap-4 mb-2">
                      {formData.profilePicture && (
                        <img 
                          src={formData.profilePicture} 
                          alt="Profile preview" 
                          className="w-20 h-20 rounded-full object-cover border-2 border-white/20"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                      <div className="flex-1">
                        <label htmlFor="profile-picture-upload" className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          <Upload size={18} />
                          <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                          <input
                            type="file"
                            id="profile-picture-upload"
                            name="profile-picture-upload"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              
                              // STRICT LIMIT: 2MB max for profile pictures (to stay within free tier)
                              const maxProfileSize = 2 * 1024 * 1024; // 2MB
                              if (file.size > maxProfileSize) {
                                setError(`Image size must be less than 2MB. Please compress the image before uploading.`);
                                showError(`Image size must be less than 2MB. Please compress the image before uploading.`);
                                return;
                              }

                              setUploading(true);
                              setError(null);
                              try {
                                const storageRef = ref(storage, `profile-pictures/${user.uid}/${Date.now()}_${file.name}`);
                                await uploadBytes(storageRef, file);
                                const downloadURL = await getDownloadURL(storageRef);
                                setFormData(prev => ({ ...prev, profilePicture: downloadURL }));
                                showSuccess('Image uploaded successfully!');
                              } catch (error) {
                                console.error('Error uploading image:', error);
                                setError('Failed to upload image. Please try again.');
                                showError('Failed to upload image. Please try again.');
                              } finally {
                                setUploading(false);
                              }
                            }}
                            className="hidden"
                            disabled={uploading}
                          />
                        </label>
                      </div>
                    </div>
                    <input
                      type="url"
                      id="profile-picture-url"
                      name="profilePicture"
                      value={formData.profilePicture}
                      onChange={handleChange}
                      placeholder="Or enter image URL"
                      className="w-full px-4 py-3 border border-white/10 rounded-xl glass-panel bg-white/5 backdrop-blur-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300 hover:border-white/20 [color-scheme:dark]"
                    />
                    <p className="mt-1 text-xs text-white/60">
                      Upload an image or enter a URL (optional, max 5MB)
                    </p>
                  </>
                ) : (
                  <div className="flex items-center gap-4">
                    {formData.profilePicture ? (
                      <img 
                        src={formData.profilePicture} 
                        alt="Profile" 
                        className="w-20 h-20 rounded-full object-cover border-2 border-white/20"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full glass-panel bg-white/10 border border-white/10 flex items-center justify-center">
                        <User size={32} className="text-white/40" />
                      </div>
                    )}
                    <div className="px-4 py-2 glass-panel bg-white/5 border border-white/10 rounded-xl text-white min-h-[42px] flex items-center flex-1 backdrop-blur-sm">
                      {formData.profilePicture || <span className="text-white/50 italic">Not set</span>}
                    </div>
                  </div>
                )}
              </div>

              {/* Bio */}
              <div>
                <label htmlFor="profile-bio" className="block text-sm font-semibold text-white/90 mb-2.5">
                  <FileText className="inline mr-2" size={16} />
                  Bio / About Me
                </label>
                {editing ? (
                  <>
                    <textarea
                      id="profile-bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Tell us about yourself..."
                      rows={4}
                      maxLength={500}
                      className="w-full px-4 py-3 border border-white/10 rounded-xl glass-panel bg-white/5 backdrop-blur-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300 hover:border-white/20 resize-none [color-scheme:dark]"
                    />
                    <p className="mt-1 text-xs text-white/60">
                      {formData.bio.length}/500 characters (optional)
                    </p>
                  </>
                ) : (
                  <div className="px-4 py-2 glass-panel bg-white/5 border border-white/10 rounded-xl text-white min-h-[100px] flex items-start backdrop-blur-sm">
                    {formData.bio || <span className="text-white/50 italic">Not set</span>}
                  </div>
                )}
              </div>

              {/* Course/Major */}
              <div>
                <label htmlFor="profile-course" className="block text-sm font-semibold text-white/90 mb-2.5">
                  <GraduationCap className="inline mr-2" size={16} />
                  Course / Major
                </label>
                {editing ? (
                  <>
                    <input
                      type="text"
                      id="profile-course"
                      name="course"
                      value={formData.course}
                      onChange={handleChange}
                      placeholder="Computer Science, Business, etc."
                      className="w-full px-4 py-3 border border-white/10 rounded-xl glass-panel bg-white/5 backdrop-blur-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300 hover:border-white/20 [color-scheme:dark]"
                    />
                    <p className="mt-1 text-xs text-white/60">
                      Your course or major (optional)
                    </p>
                  </>
                ) : (
                  <div className="px-4 py-2 glass-panel bg-white/5 border border-white/10 rounded-xl text-white min-h-[42px] flex items-center backdrop-blur-sm">
                    {formData.course || <span className="text-white/50 italic">Not set</span>}
                  </div>
                )}
              </div>

              {/* Year of Study */}
              <div>
                <label htmlFor="profile-year-of-study" className="block text-sm font-semibold text-white/90 mb-2.5">
                  <GraduationCap className="inline mr-2" size={16} />
                  Year of Study
                </label>
                {editing ? (
                  <>
                    <select
                      id="profile-year-of-study"
                      name="yearOfStudy"
                      value={formData.yearOfStudy}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-white/10 rounded-xl glass-panel bg-white/5 backdrop-blur-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300 hover:border-white/20 [color-scheme:dark]"
                    >
                      <option value="" className="bg-[#1a1a1a] text-white">Select year...</option>
                      <option value="1" className="bg-[#1a1a1a] text-white">Year 1</option>
                      <option value="2" className="bg-[#1a1a1a] text-white">Year 2</option>
                      <option value="3" className="bg-[#1a1a1a] text-white">Year 3</option>
                      <option value="4" className="bg-[#1a1a1a] text-white">Year 4</option>
                      <option value="5+" className="bg-[#1a1a1a] text-white">Year 5+</option>
                      <option value="Graduate" className="bg-[#1a1a1a] text-white">Graduate</option>
                    </select>
                    <p className="mt-1 text-xs text-white/60">
                      Your current year of study (optional)
                    </p>
                  </>
                ) : (
                  <div className="px-4 py-2 glass-panel bg-white/5 border border-white/10 rounded-xl text-white min-h-[42px] flex items-center backdrop-blur-sm">
                    {formData.yearOfStudy || <span className="text-white/50 italic">Not set</span>}
                  </div>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label htmlFor="profile-date-of-birth" className="block text-sm font-semibold text-white/90 mb-2.5">
                  <Calendar className="inline mr-2" size={16} />
                  Date of Birth
                </label>
                {editing ? (
                  <>
                    <input
                      type="date"
                      id="profile-date-of-birth"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-white/10 rounded-xl glass-panel bg-white/5 backdrop-blur-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300 hover:border-white/20 [color-scheme:dark]"
                    />
                    <p className="mt-1 text-xs text-white/60">
                      Your date of birth (optional)
                    </p>
                  </>
                ) : (
                  <div className="px-4 py-2 glass-panel bg-white/5 border border-white/10 rounded-xl text-white min-h-[42px] flex items-center backdrop-blur-sm">
                    {formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString() : <span className="text-white/50 italic">Not set</span>}
                  </div>
                )}
              </div>

              {/* Address */}
              <div>
                <label htmlFor="profile-address" className="block text-sm font-semibold text-white/90 mb-2.5">
                  <MapPin className="inline mr-2" size={16} />
                  Address
                </label>
                {editing ? (
                  <>
                    <textarea
                      id="profile-address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Your address..."
                      rows={2}
                      className="w-full px-4 py-3 border border-white/10 rounded-xl glass-panel bg-white/5 backdrop-blur-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300 hover:border-white/20 resize-none [color-scheme:dark]"
                    />
                    <p className="mt-1 text-xs text-white/60">
                      Your address (optional)
                    </p>
                  </>
                ) : (
                  <div className="px-4 py-2 glass-panel bg-white/5 border border-white/10 rounded-xl text-white min-h-[42px] flex items-center backdrop-blur-sm">
                    {formData.address || <span className="text-white/50 italic">Not set</span>}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {editing && (
                <div className="pt-4 flex gap-3">
                  <motion.button
                    type="submit"
                    disabled={saving}
                    whileHover={!saving ? { scale: 1.02 } : {}}
                    whileTap={!saving ? { scale: 0.98 } : {}}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
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
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    whileHover={!saving ? { scale: 1.02 } : {}}
                    whileTap={!saving ? { scale: 0.98 } : {}}
                    className="flex items-center justify-center gap-2 px-6 py-3 glass-panel border-2 border-indigo-500/50 text-indigo-300 font-semibold rounded-xl hover:bg-indigo-600/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X size={20} />
                    <span>Cancel</span>
                  </motion.button>
                </div>
              )}
            </form>

            {/* Current Account Info */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <h3 className="text-sm font-semibold text-white/90 mb-3 flex items-center">
                <User className="mr-2" size={16} />
                Account Information
              </h3>
              <div className="space-y-2 text-sm text-white/60">
                <p>
                  <span className="font-medium text-white/90">Login Email:</span> {user?.email || 'N/A'}
                </p>
                <p>
                  <span className="font-medium text-white/90">User ID:</span> {user?.uid.substring(0, 20)}...
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
