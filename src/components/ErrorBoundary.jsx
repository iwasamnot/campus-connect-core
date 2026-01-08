import React, { Component } from 'react';
import { AlertTriangle } from 'lucide-react';
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full">
            <div className="flex items-center justify-center mb-4">
              <Logo size="small" showText={false} className="mb-2" />
            </div>
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="text-red-600 dark:text-red-400" size={48} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 text-center">
              Something went wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  // Force a small delay to allow state to reset
                  setTimeout(() => window.location.reload(), 100);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Refresh Page
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                }}
                className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6">
                <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto max-h-60">
                  {this.state.error?.toString()}
                  {'\n'}
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

