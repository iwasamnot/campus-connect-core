import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Loader } from 'lucide-react';
import { uploadFile, uploadImage } from '../utils/storageService';
// Use window globals to avoid import/export issues
const validateFile = typeof window !== 'undefined' && window.__validateFile 
  ? window.__validateFile 
  : () => ({ valid: true });
// Use window.__handleError to avoid import/export issues in production builds
// Fallback to direct import if global is not available (for local dev)
const handleError = typeof window !== 'undefined' && window.__handleError 
  ? window.__handleError 
  : ((error, context, onError) => {
      // Fallback error handler if global is not available
      const errorMessage = error?.message || 'An error occurred';
      console.error(`[${context}] Error:`, error);
      if (onError) onError(errorMessage);
      return { message: errorMessage, type: 'UNKNOWN' };
    });

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
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(file);
      }

      // Upload using storage service (supports Firebase and Cloudinary with auto-fallback)
      console.log('Uploading file:', file.name);
      console.log('File size:', file.size, 'bytes');
      console.log('File type:', file.type);
      
      let uploadResult;
      if (file.type.startsWith('image/')) {
        // Use optimized image upload (Cloudinary handles optimization automatically)
        uploadResult = await uploadImage(file, 'messages', {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 'auto',
        });
      } else {
        // Use regular file upload
        uploadResult = await uploadFile(file, 'messages');
      }
      
      console.log('File uploaded successfully via', uploadResult.provider || 'unknown provider');
      console.log('Download URL:', uploadResult.url);

      // Callback with file info
      onFileUpload({
        url: uploadResult.url,
        name: file.name,
        type: file.type,
        size: uploadResult.bytes || file.size,
        preview: file.type.startsWith('image/') ? uploadResult.url : null,
        provider: uploadResult.provider || 'unknown'
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
        id="file-upload"
        name="file-upload"
        onChange={handleFileSelect}
        accept={allowedTypes.join(',')}
        className="hidden"
        disabled={uploading}
      />
      <motion.label
        htmlFor="file-upload"
        whileHover={!uploading ? { scale: 1.05, y: -2 } : {}}
        whileTap={!uploading ? { scale: 0.95 } : {}}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all duration-300 border border-white/10 ${
          uploading
            ? 'bg-white/10 text-white/40 cursor-not-allowed border-white/5'
            : 'glass-panel text-white/90 hover:text-white hover:bg-white/10'
        }`}
      >
        {uploading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader size={18} />
          </motion.div>
        ) : (
          <Upload size={18} />
        )}
        <span className="text-sm font-medium">
          {uploading ? 'Uploading...' : 'Upload File'}
        </span>
      </motion.label>
      
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute bottom-full left-0 mb-2 p-2 glass-panel border border-white/10 rounded-xl shadow-xl overflow-hidden"
          >
            <img src={preview} alt="Preview" className="max-w-xs max-h-48 rounded-lg" />
            <motion.button
              onClick={() => setPreview(null)}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Remove preview"
              className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-colors shadow-lg"
            >
              <X size={14} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute top-full left-0 mt-1 text-xs text-red-400 bg-red-500/20 border border-red-500/50 rounded-lg px-2 py-1 backdrop-blur-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUpload;

