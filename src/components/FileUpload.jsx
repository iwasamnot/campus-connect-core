import { useState, useRef, useCallback, useMemo } from 'react';
import { Upload, X, Image, File, Loader } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseConfig';
import { sanitizeFileName } from '../utils/sanitize';
import { validateFile } from '../utils/validation';
import { handleError } from '../utils/errorHandler';

// STRICT LIMITS to stay within Firebase free tier (5GB storage, 1GB/day downloads)
// Max file size: 5MB (reduced from 10MB to conserve storage)
const FileUpload = ({ onFileUpload, maxSize = 5 * 1024 * 1024, allowedTypes = ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file using utility
    const validation = validateFile(file, maxSize, allowedTypes);
    if (!validation.isValid) {
      setError(validation.errors[0]);
      return;
    }
    
    // Additional check: Warn if file is very large (close to limit)
    if (file.size > maxSize * 0.9) {
      console.warn('File is close to size limit:', file.size, 'bytes');
    }

    setError(null);
    setUploading(true);

    try {
      // Create preview for images
      let imagePreview = null;
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          imagePreview = reader.result;
          setPreview(reader.result);
        };
        reader.readAsDataURL(file);
      }

      // Upload to Firebase Storage
      const timestamp = Date.now();
      const sanitizedFileName = sanitizeFileName(file.name);
      const fileName = `${timestamp}_${sanitizedFileName}`;
      const storageRef = ref(storage, `messages/${fileName}`);
      
      console.log('Uploading file to:', `messages/${fileName}`);
      console.log('File size:', file.size, 'bytes');
      console.log('File type:', file.type);
      
      await uploadBytes(storageRef, file);
      console.log('File uploaded successfully');
      
      const downloadURL = await getDownloadURL(storageRef);
      console.log('Download URL obtained:', downloadURL);

      // Callback with file info
      onFileUpload({
        url: downloadURL,
        name: file.name,
        type: file.type,
        size: file.size,
        preview: file.type.startsWith('image/') ? downloadURL : null
      });

      // Reset
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      const { message } = handleError(err, 'FileUpload', (errorMessage) => {
        setError(errorMessage);
      });
      setError(message);
    } finally {
      setUploading(false);
    }
  }, [maxSize, allowedTypes, onFileUpload]);

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept={allowedTypes.join(',')}
        className="hidden"
        id="file-upload"
        disabled={uploading}
      />
      <label
        htmlFor="file-upload"
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${
          uploading
            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        {uploading ? (
          <Loader className="animate-spin" size={18} />
        ) : (
          <Upload size={18} />
        )}
        <span className="text-sm font-medium">
          {uploading ? 'Uploading...' : 'Upload File'}
        </span>
      </label>
      
      {preview && (
        <div className="absolute bottom-full left-0 mb-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <img src={preview} alt="Preview" className="max-w-xs max-h-48 rounded" />
          <button
            onClick={() => setPreview(null)}
            aria-label="Remove preview"
            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {error && (
        <div className="absolute top-full left-0 mt-1 text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUpload;

