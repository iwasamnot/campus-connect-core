/**
 * Storage Service - Supports multiple storage providers
 * Falls back to Cloudinary if Firebase Storage fails (useful for free tier limits)
 */

// Cloudinary configuration from environment variables
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim() || '';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim() || '';

// Storage provider preference (can be 'firebase', 'cloudinary', or 'auto')
const STORAGE_PROVIDER = import.meta.env.VITE_STORAGE_PROVIDER?.trim() || 'auto';

/**
 * Upload file to Cloudinary
 */
const uploadToCloudinary = async (file, folder = 'messages') => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Cloudinary configuration missing. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);
  
  // Add timestamp to filename for uniqueness
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  formData.append('public_id', `${timestamp}_${sanitizedName}`);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Cloudinary upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      url: data.secure_url || data.url,
      publicId: data.public_id,
      format: data.format,
      bytes: data.bytes,
      width: data.width,
      height: data.height,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Upload file to Firebase Storage
 */
const uploadToFirebase = async (file, folder = 'messages') => {
  // Use window globals to avoid import/export issues
  const storage = typeof window !== 'undefined' && window.__firebaseStorage 
    ? window.__firebaseStorage 
    : null;

  if (!storage) {
    throw new Error('Firebase Storage is not available');
  }

  const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
  
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${timestamp}_${sanitizedName}`;
  const storageRef = ref(storage, `${folder}/${fileName}`);
  
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  
  return {
    url: downloadURL,
    fileName: fileName,
    size: file.size,
  };
};

/**
 * Upload file with automatic fallback
 * Tries Firebase first, falls back to Cloudinary if Firebase fails
 */
export const uploadFile = async (file, folder = 'messages', preferredProvider = null) => {
  const provider = preferredProvider || STORAGE_PROVIDER;
  
  // If auto mode, try Firebase first, then Cloudinary
  if (provider === 'auto') {
    try {
      console.log('Attempting Firebase Storage upload...');
      const result = await uploadToFirebase(file, folder);
      console.log('Firebase Storage upload successful');
      return { ...result, provider: 'firebase' };
    } catch (firebaseError) {
      console.warn('Firebase Storage upload failed, falling back to Cloudinary:', firebaseError);
      
      // Fallback to Cloudinary
      try {
        console.log('Attempting Cloudinary upload...');
        const result = await uploadToCloudinary(file, folder);
        console.log('Cloudinary upload successful');
        return { ...result, provider: 'cloudinary' };
      } catch (cloudinaryError) {
        console.error('Both storage providers failed');
        throw new Error(`Storage upload failed. Firebase: ${firebaseError.message}, Cloudinary: ${cloudinaryError.message}`);
      }
    }
  }
  
  // Use specific provider
  if (provider === 'cloudinary') {
    const result = await uploadToCloudinary(file, folder);
    return { ...result, provider: 'cloudinary' };
  }
  
  if (provider === 'firebase') {
    const result = await uploadToFirebase(file, folder);
    return { ...result, provider: 'firebase' };
  }
  
  throw new Error(`Unknown storage provider: ${provider}`);
};

/**
 * Upload image with optimization (for Cloudinary)
 */
export const uploadImage = async (file, folder = 'messages', options = {}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 'auto',
    format = 'auto',
  } = options;

  // If using Cloudinary, we can add transformation parameters
  const provider = STORAGE_PROVIDER === 'auto' ? 'auto' : STORAGE_PROVIDER;
  
  if (provider === 'cloudinary' || provider === 'auto') {
    // Cloudinary handles optimization automatically, but we can add transformations
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);
    
    // Add optimization parameters
    if (maxWidth || maxHeight) {
      formData.append('eager', `c_limit,w_${maxWidth},h_${maxHeight},q_${quality},f_${format}`);
    }
    
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    formData.append('public_id', `${timestamp}_${sanitizedName}`);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Cloudinary upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        url: data.secure_url || data.url,
        publicId: data.public_id,
        format: data.format,
        bytes: data.bytes,
        width: data.width,
        height: data.height,
        provider: 'cloudinary',
      };
    } catch (error) {
      // If Cloudinary fails and we're in auto mode, try Firebase
      if (provider === 'auto') {
        console.warn('Cloudinary upload failed, trying Firebase:', error);
        return uploadToFirebase(file, folder).then(result => ({ ...result, provider: 'firebase' }));
      }
      throw error;
    }
  }
  
  // Default to regular upload
  return uploadFile(file, folder, provider);
};

/**
 * Check if Cloudinary is configured
 */
export const isCloudinaryConfigured = () => {
  return !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET);
};

/**
 * Check if Firebase Storage is available
 */
export const isFirebaseStorageAvailable = () => {
  return typeof window !== 'undefined' && !!window.__firebaseStorage;
};

/**
 * Get available storage providers
 */
export const getAvailableProviders = () => {
  const providers = [];
  
  if (isFirebaseStorageAvailable()) {
    providers.push('firebase');
  }
  
  if (isCloudinaryConfigured()) {
    providers.push('cloudinary');
  }
  
  return providers;
};
