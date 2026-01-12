import React, { Component } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
// Use window.__LogoComponent directly to avoid import/export issues
const Logo = typeof window !== 'undefined' && window.__LogoComponent 
  ? window.__LogoComponent 
  : () => <div>Logo</div>; // Fallback placeholder

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Enhanced error reporting (can be extended to send to analytics)
    if (typeof window !== 'undefined') {
      const errorReport = {
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        componentStack: errorInfo?.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      // Log to console in structured format
      console.error('Error Report:', errorReport);
      
      // Send to error tracking service if available
      if (window.gtag) {
        window.gtag('event', 'exception', {
          description: errorReport.message,
          fatal: true,
          error_category: 'React Error Boundary'
        });
      }
      
      // Store error for retry mechanism
      try {
        sessionStorage.setItem('lastError', JSON.stringify(errorReport));
      } catch (e) {
        // Ignore storage errors
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-transparent relative p-4">
          {/* Aurora Background */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            <div className="aurora-background">
              <div className="aurora-blob aurora-blob-1" />
              <div className="aurora-blob aurora-blob-2" />
              <div className="aurora-blob aurora-blob-3" />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="glass-panel shadow-2xl border border-white/10 rounded-[2rem] p-8 max-w-md w-full relative z-10 backdrop-blur-xl"
          >
            <div className="flex items-center justify-center mb-6">
              <Logo size="small" showText={false} />
            </div>
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex items-center justify-center mb-6"
            >
              <div className="p-4 glass-panel border border-red-500/30 rounded-2xl bg-red-500/10">
                <AlertTriangle className="text-red-400" size={48} />
              </div>
            </motion.div>
            <h2 className="text-2xl font-bold text-white text-glow mb-4 text-center">
              Something went wrong
            </h2>
            <p className="text-white/70 mb-6 text-center leading-relaxed">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <div className="flex flex-col gap-3">
              <motion.button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  // Force a small delay to allow state to reset
                  setTimeout(() => window.location.reload(), 100);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh Page
              </motion.button>
              <motion.button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 glass-panel border border-white/10 hover:border-white/20 text-white/80 hover:text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300"
              >
                <X className="w-5 h-5" />
                Try Again
              </motion.button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6">
                <summary className="text-sm text-white/60 cursor-pointer mb-2 font-medium hover:text-white transition-colors">
                  Error Details (Development Only)
                </summary>
                <motion.pre
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 text-xs glass-panel bg-white/5 border border-white/10 p-4 rounded-xl overflow-auto max-h-60 text-white/70 font-mono"
                >
                  {this.state.error?.toString()}
                  {'\n'}
                  {this.state.error?.stack}
                </motion.pre>
              </details>
            )}
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
