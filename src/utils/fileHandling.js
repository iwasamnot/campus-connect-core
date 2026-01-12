/**
 * Modern File Handling Utilities
 * Uses File System Access API, File API, and other modern standards
 */

/**
 * Check if File System Access API is supported
 */
export const isFileSystemAccessSupported = () => {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window;
};

/**
 * Check if File API is supported
 */
export const isFileAPISupported = () => {
  return typeof window !== 'undefined' && 'File' in window && 'FileReader' in window;
};

/**
 * Open file picker using File System Access API
 * Falls back to traditional input if not supported
 * 
 * @param {Object} options - File picker options
 * @param {string[]} options.accept - Accepted file types (e.g., ['image/*', '.pdf'])
 * @param {boolean} options.multiple - Allow multiple file selection
 * @returns {Promise<File[]|FileList>} - Selected files
 */
export const openFilePicker = async (options = {}) => {
  const { accept = ['*/*'], multiple = false } = options;
  
  if (isFileSystemAccessSupported()) {
    try {
      const fileHandles = await window.showOpenFilePicker({
        types: [{
          description: 'Files',
          accept: accept.reduce((acc, type) => {
            if (type.includes('*')) {
              const [mimeType] = type.split('/');
              acc[type] = [];
            } else if (type.startsWith('.')) {
              acc['application/octet-stream'] = [type];
            } else {
              acc[type] = [];
            }
            return acc;
          }, {})
        }],
        multiple: multiple
      });
      
      const files = await Promise.all(
        fileHandles.map(handle => handle.getFile())
      );
      
      return files;
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('File picker failed:', error);
      }
      return null;
    }
  } else {
    // Fallback to traditional input
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept.join(',');
      input.multiple = multiple;
      
      input.onchange = (e) => {
        resolve(e.target.files || []);
      };
      
      input.oncancel = () => {
        resolve(null);
      };
      
      input.click();
    });
  }
};

/**
 * Save file using File System Access API
 * Falls back to download if not supported
 * 
 * @param {Blob|File} blob - File to save
 * @param {string} filename - Suggested filename
 * @returns {Promise<boolean>} - Success status
 */
export const saveFile = async (blob, filename) => {
  if (!blob || !filename) {
    console.warn('Blob or filename not provided');
    return false;
  }
  
  if (isFileSystemAccessSupported()) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{
          description: 'File',
          accept: {
            'application/octet-stream': ['.*']
          }
        }]
      });
      
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      
      return true;
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('File save failed:', error);
      }
      return false;
    }
  } else {
    // Fallback to download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  }
};

/**
 * Read file as text
 */
export const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    if (!isFileAPISupported()) {
      reject(new Error('File API not supported'));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};

/**
 * Read file as data URL (base64)
 */
export const readFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    if (!isFileAPISupported()) {
      reject(new Error('File API not supported'));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
};

/**
 * Validate file size
 */
export const validateFileSize = (file, maxSizeMB = 10) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Validate file type
 */
export const validateFileType = (file, allowedTypes = ['*/*']) => {
  if (allowedTypes.includes('*/*')) {
    return true;
  }
  
  return allowedTypes.some(type => {
    if (type.includes('*')) {
      const [mainType] = type.split('/');
      return file.type.startsWith(`${mainType}/`);
    }
    return file.type === type || file.name.endsWith(type);
  });
};

export default {
  isFileSystemAccessSupported,
  isFileAPISupported,
  openFilePicker,
  saveFile,
  readFileAsText,
  readFileAsDataURL,
  validateFileSize,
  validateFileType
};

