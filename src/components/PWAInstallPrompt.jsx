import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const { success, error: showError } = useToast();

  useEffect(() => {
    // ✅ FIX: Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://')) {
      return; // Already installed
    }

    // ✅ FIX: Check if user has already dismissed the prompt (check BEFORE adding listener)
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        return; // Don't show if dismissed within 7 days
      }
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      // ✅ FIX: Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        success('App installed successfully!');
        // Clear dismissal so they can see it again if needed
        localStorage.removeItem('pwa-install-dismissed');
      } else {
        console.log('User dismissed the install prompt');
        // Store dismissal timestamp
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
      }
    } catch (error) {
      console.error('Error showing install prompt:', error);
      showError('Failed to show install prompt. Please try again.');
    } finally {
      // Clear the deferredPrompt
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    // ✅ FIX: Store dismissal with timestamp (removed duplicate code)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          key="pwa-prompt"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
          style={{
            bottom: `max(1rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))`,
            left: `max(1rem, calc(env(safe-area-inset-left, 0px) + 1rem))`,
            right: `max(1rem, calc(env(safe-area-inset-right, 0px) + 1rem))`,
            maxWidth: 'calc(100vw - 2rem)'
          }}
        >
          <div className="glass-panel backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-shrink-0">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg"
                >
                  <Download className="w-6 h-6 text-white" />
                </motion.div>
              </div>
              <div className="flex-1 text-center sm:text-left min-w-0">
                <h3 className="font-semibold text-white text-sm text-glow">
                  Install CampusConnect
                </h3>
                <p className="text-xs text-white/60 mt-1 font-light">
                  Add to home screen for quick access
                </p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <motion.button
                  onClick={handleInstall}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl min-h-[44px]"
                >
                  Install
                </motion.button>
                <motion.button
                  onClick={handleDismiss}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2.5 text-white/70 hover:text-white glass-panel border border-white/10 rounded-xl hover:border-white/20 transition-all duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Dismiss"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
