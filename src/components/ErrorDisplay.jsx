import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Reusable Error Display Component
 * Consistent error messaging across the app
 */
const ErrorDisplay = ({ 
  error, 
  onRetry, 
  title = 'Something went wrong',
  className = '' 
}) => {
  if (!error) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-panel border border-red-500/30 rounded-xl p-6 bg-red-500/10 ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
        <div className="flex-1">
          <h3 className="text-white font-semibold mb-1">{title}</h3>
          <p className="text-white/70 text-sm">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[44px]"
              aria-label="Retry"
            >
              <RefreshCw size={16} />
              Retry
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ErrorDisplay;
