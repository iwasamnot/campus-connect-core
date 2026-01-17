/**
 * Storage Service - Cloudinary Only
 * All photos, videos, and files are stored in Cloudinary
 * Firebase is still used for database, users, and text messages
 */

// Cloudinary configuration from environment variables
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim() || '';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim() || '';

/**
 * Upload file to Cloudinary
 */
const uploadToCloudinary = async (file, folder = 'messages') => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    const missing = [];
    if (!CLOUDINARY_CLOUD_NAME) missing.push('VITE_CLOUDINARY_CLOUD_NAME');
    if (!CLOUDINARY_UPLOAD_PRESET) missing.push('VITE_CLOUDINARY_UPLOAD_PRESET');
    throw new Error(`Cloudinary configuration missing: ${missing.join(', ')}. Please set these environment variables in GitHub Secrets or .env file.`);
  }

  // Validate cloud name is not empty
  if (!CLOUDINARY_CLOUD_NAME || CLOUDINARY_CLOUD_NAME.trim() === '') {
    throw new Error('Cloudinary cloud name is empty. Please set VITE_CLOUDINARY_CLOUD_NAME environment variable.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);
  
  // Add timestamp to filename for uniqueness
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  formData.append('public_id', `${timestamp}_${sanitizedName}`);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;
  console.log('Uploading to Cloudinary:', uploadUrl.replace(CLOUDINARY_CLOUD_NAME, '***')); // Log without exposing cloud name

  try {
    const response = await fetch(uploadUrl,
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
 * Upload file to Cloudinary (only storage provider)
 */
export const uploadFile = async (file, folder = 'messages') => {
  console.log('Uploading file to Cloudinary:', file.name);
  const result = await uploadToCloudinary(file, folder);
  return { ...result, provider: 'cloudinary' };
};

/**
 * Upload image with optimization (Cloudinary only)
 */
export const uploadImage = async (file, folder = 'messages', options = {}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 'auto',
    format = 'auto',
  } = options;

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
    provider: 'cloudinary',
  };
};

/**
 * Check if Cloudinary is configured
 */
export const isCloudinaryConfigured = () => {
  return !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET);
};

/**
 * Get available storage providers (Cloudinary only now)
 */
export const getAvailableProviders = () => {
  const providers = [];
  
  if (isCloudinaryConfigured()) {
    providers.push('cloudinary');
  }
  
  return providers;
};

