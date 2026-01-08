import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useToast } from '../context/ToastContext';
import { Mail, User, MessageSquare, X, Send } from 'lucide-react';
import { sanitizeEmail, sanitizeText } from '../utils/sanitize';
import Logo from './Logo';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 modal-backdrop animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto modal-enter animate-zoom-in">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="small" showText={false} />
            <div>
              <h2 className="text-xl font-bold text-black dark:text-white">Contact Admin</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Send a message to the administrator</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X size={24} className="text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="contact-name" className="block text-sm font-medium text-black dark:text-white mb-2">
              <User className="inline mr-2" size={16} />
              Your Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="contact-name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="contact-email" className="block text-sm font-medium text-black dark:text-white mb-2">
              <Mail className="inline mr-2" size={16} />
              Your Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="contact-email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="contact-subject" className="block text-sm font-medium text-black dark:text-white mb-2">
              Subject (Optional)
            </label>
            <input
              type="text"
              id="contact-subject"
              name="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject (optional)"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="contact-message" className="block text-sm font-medium text-black dark:text-white mb-2">
              <MessageSquare className="inline mr-2" size={16} />
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              id="contact-message"
              name="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message"
              required
              rows={6}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all resize-none"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send size={20} />
                <span>Send Message</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactForm;

