import { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import { shareContent, isWebShareSupported } from '../utils/webShare';
import { useToast } from '../context/ToastContext';

/**
 * Modern Share Button Component
 * Uses Web Share API with clipboard fallback
 * Follows W3C Web Share API standards
 */
const ShareButton = ({ 
  title, 
  text, 
  url, 
  className = '', 
  variant = 'default',
  iconOnly = false 
}) => {
  const { success, error: showError } = useToast();
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    setSharing(true);
    
    try {
      const shared = await shareContent({ title, text, url });
      
      if (shared) {
        if (isWebShareSupported()) {
          success('Content shared successfully!');
        } else {
          setCopied(true);
          success('Link copied to clipboard!');
          setTimeout(() => setCopied(false), 2000);
        }
      }
    } catch (err) {
      console.error('Share failed:', err);
      showError('Failed to share content. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const baseClasses = 'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 active:scale-95';
  
  const variantClasses = {
    default: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    outline: 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
    ghost: 'text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
    icon: 'p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
  };

  return (
    <button
      onClick={handleShare}
      disabled={sharing}
      className={`${baseClasses} ${variantClasses[variant]} ${className} ${sharing ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-label={iconOnly ? 'Share' : undefined}
      title="Share"
    >
      {sharing ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          <span className={iconOnly ? 'sr-only' : ''}>Sharing...</span>
        </>
      ) : copied ? (
        <>
          <Check size={iconOnly ? 20 : 18} />
          <span className={iconOnly ? 'sr-only' : ''}>Copied!</span>
        </>
      ) : (
        <>
          <Share2 size={iconOnly ? 20 : 18} />
          {!iconOnly && <span>Share</span>}
        </>
      )}
    </button>
  );
};

export default ShareButton;

