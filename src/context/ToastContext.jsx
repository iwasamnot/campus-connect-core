import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

// CRITICAL: Declare useToast as a top-level const before exporting
const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Export the declared function
export { useToast };

// CRITICAL: Declare ToastProvider as a top-level const before exporting
const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type };
    
    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((message, duration) => {
    return showToast(message, 'success', duration);
  }, [showToast]);

  const error = useCallback((message, duration) => {
    return showToast(message, 'error', duration);
  }, [showToast]);

  const warning = useCallback((message, duration) => {
    return showToast(message, 'warning', duration);
  }, [showToast]);

  const info = useCallback((message, duration) => {
    return showToast(message, 'info', duration);
  }, [showToast]);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <XCircle size={20} />;
      case 'warning':
        return <AlertCircle size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  const getStyles = (type) => {
    switch (type) {
      case 'success':
        return 'glass-panel bg-green-600/20 border-green-500/30 text-green-300 backdrop-blur-xl';
      case 'error':
        return 'glass-panel bg-red-600/20 border-red-500/30 text-red-300 backdrop-blur-xl';
      case 'warning':
        return 'glass-panel bg-yellow-600/20 border-yellow-500/30 text-yellow-300 backdrop-blur-xl';
      default:
        return 'glass-panel bg-blue-600/20 border-blue-500/30 text-blue-300 backdrop-blur-xl';
    }
  };

  const value = useMemo(() => ({
    showToast,
    success,
    error,
    warning,
    info,
    removeToast
  }), [showToast, success, error, warning, info, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border min-w-[300px] max-w-md animate-slide-in-right transition-all duration-300 ease-out ${getStyles(toast.type)}`}
          >
            <div className="flex-shrink-0">
              {getIcon(toast.type)}
            </div>
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 hover:opacity-70 transition-all duration-200 ease-in-out transform hover:scale-110 active:scale-95"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Export the declared component
export { ToastProvider };

