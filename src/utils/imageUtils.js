/**
 * Image Utilities
 * Helper functions for image processing and conversion
 */

/**
 * Convert image file to Base64 string
 * @param {File} file - The image file to convert
 * @returns {Promise<string>} - Base64 string (without data URI prefix)
 */
export const convertImageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      reject(new Error('Image size exceeds 10MB limit'));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        // Get the base64 string from FileReader result
        const base64String = reader.result;
        
        // Remove data URI prefix (e.g., "data:image/jpeg;base64,")
        // Ollama expects pure base64 string
        const base64Data = base64String.includes(',')
          ? base64String.split(',')[1]
          : base64String;

        resolve(base64Data);
      } catch (error) {
        reject(new Error(`Failed to process image: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };

    // Read file as data URL (base64)
    reader.readAsDataURL(file);
  });
};

/**
 * Create a preview URL for an image file
 * @param {File} file - The image file
 * @returns {string} - Object URL for preview
 */
export const createImagePreview = (file) => {
  if (!file) return null;
  return URL.createObjectURL(file);
};

/**
 * Revoke an image preview URL to free memory
 * @param {string} url - The object URL to revoke
 */
export const revokeImagePreview = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};
