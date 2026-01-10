import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useToast } from '../context/ToastContext';
import { Mail, User, MessageSquare, X, Send } from 'lucide-react';
import { sanitizeEmail, sanitizeText } from '../utils/sanitize';
import Logo from './Logo';
import { FadeIn } from './AnimatedComponents';

const ContactForm = ({ onClose }) => {
  const { success, error: showError } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim() || !message.trim()) {
      showError('Please fill in all required fields.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    
    try {
      // Sanitize inputs
      const sanitizedName = sanitizeText(name);
      const sanitizedEmail = sanitizeEmail(email);
      const sanitizedSubject = subject ? sanitizeText(subject) : 'No Subject';
      const sanitizedMessage = sanitizeText(message);

      // Save to Firestore
      await addDoc(collection(db, 'contactMessages'), {
        name: sanitizedName,
        email: sanitizedEmail,
        subject: sanitizedSubject,
        message: sanitizedMessage,
        timestamp: serverTimestamp(),
        status: 'new', // 'new', 'read', 'replied', 'resolved'
        readAt: null,
        repliedAt: null,
        resolvedAt: null,
        isFromNonUser: true
      });

      success('Your message has been sent to the admin. We will get back to you soon!');
      
      // Reset form
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      
      // Close modal after a short delay
      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);
    } catch (error) {
      console.error('Error sending contact message:', error);
      showError('Failed to send message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <FadeIn delay={0.1}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="glass-panel shadow-2xl border border-white/10 rounded-[2rem] w-full max-w-lg max-h-[90vh] overflow-y-auto backdrop-blur-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Fluid.so aesthetic */}
          <div className="sticky top-0 glass-panel border-b border-white/10 px-6 py-4 flex items-center justify-between backdrop-blur-xl z-10 rounded-t-[2rem]">
            <div className="flex items-center gap-3">
              <Logo size="small" showText={false} />
              <div>
                <h2 className="text-xl font-bold text-white text-glow">Contact Admin</h2>
                <p className="text-sm text-white/60 mt-0.5">Send a message to the administrator</p>
              </div>
            </div>
            {onClose && (
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.05, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                className="p-2.5 glass-panel border border-white/10 rounded-xl text-white/70 hover:text-white hover:border-white/20 transition-all"
                aria-label="Close"
              >
                <X size={24} />
              </motion.button>
            )}
          </div>

          {/* Form - Fluid.so aesthetic */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label htmlFor="contact-name" className="block text-sm font-semibold text-white/90 mb-2.5 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" />
                Your Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="contact-name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300 hover:border-white/20"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="contact-email" className="block text-sm font-semibold text-white/90 mb-2.5 flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400" />
                Your Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                id="contact-email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300 hover:border-white/20"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="contact-subject" className="block text-sm font-semibold text-white/90 mb-2.5">
                Subject (Optional)
              </label>
              <input
                type="text"
                id="contact-subject"
                name="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter subject (optional)"
                className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300 hover:border-white/20"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="contact-message" className="block text-sm font-semibold text-white/90 mb-2.5 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                Message <span className="text-red-400">*</span>
              </label>
              <textarea
                id="contact-message"
                name="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message"
                required
                rows={6}
                className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300 hover:border-white/20 resize-none"
                disabled={loading}
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="send-button-shimmer w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:transform-none"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send size={20} />
                  <span>Send Message</span>
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </FadeIn>
    </div>
  );
};

export default ContactForm;
