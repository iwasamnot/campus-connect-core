/**
 * Image Error Handler
 * Handles errors when loading images, especially Firebase Storage 402 errors
 */

/**
 * Check if URL is a Firebase Storage URL
 */
export const isFirebaseStorageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return url.includes('firebasestorage.googleapis.com') || 
         url.includes('storage.googleapis.com');
};

/**
 * Handle image load error
 * Shows a user-friendly message for Firebase Storage 402 errors
 */
export const handleImageError = (event, options = {}) => {
  const img = event.target;
  const url = img.src;
  
  // Check if it's a Firebase Storage URL
  if (isFirebaseStorageUrl(url)) {
    console.warn('Firebase Storage image failed to load (likely 402 error - requires Blaze plan):', url);
    
    // Set a placeholder or error image
    if (options.showPlaceholder !== false) {
      // Create a data URI for a placeholder image
      img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzM3NDE1MSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBVbmF2YWlsYWJsZTwvdGV4dD48L3N2Zz4=';
    }
    
    // Show error message if callback provided
    if (options.onError) {
      options.onError({
        type: 'firebase_storage_402',
        message: 'This image is no longer available. Firebase Storage requires the Blaze plan.',
        url
      });
    }
    
    // Add error class for styling
    img.classList.add('image-error');
    img.alt = 'Image unavailable - Firebase Storage requires Blaze plan';
  } else {
    // Handle other image errors
    console.warn('Image failed to load:', url);
    if (options.onError) {
      options.onError({
        type: 'generic',
        message: 'Failed to load image',
        url
      });
    }
  }
  
  // Prevent default error handling if needed
  if (options.preventDefault) {
    event.preventDefault();
  }
};

/**
 * Create an image element with error handling
 */
export const createImageWithErrorHandling = (src, options = {}) => {
  const img = document.createElement('img');
  img.src = src;
  img.loading = options.loading || 'lazy';
  
  img.onerror = (event) => handleImageError(event, options);
  
  if (options.onLoad) {
    img.onload = options.onLoad;
  }
  
  return img;
};

/**
 * React component wrapper for images with error handling
 */
export const ImageWithErrorHandling = ({ src, alt, className, onError, ...props }) => {
  const handleError = (event) => {
    handleImageError(event, {
      onError: (errorInfo) => {
        if (onError) {
          onError(errorInfo);
        }
      }
    });
  };
  
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={handleError}
      {...props}
    />
  );
};

