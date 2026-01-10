import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  collection, 
  query, 
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
// Use window.__firebaseDb to avoid import/export issues in production builds
const db = typeof window !== 'undefined' && window.__firebaseDb 
  ? window.__firebaseDb 
  : null;
import { motion } from 'framer-motion';
import { Mail, User, MessageSquare, Trash2, CheckCircle, XCircle, Eye, Clock, Search, Filter } from 'lucide-react';
// Use window.__LogoComponent directly to avoid import/export issues
const Logo = typeof window !== 'undefined' && window.__LogoComponent 
  ? window.__LogoComponent 
  : () => <div>Logo</div>; // Fallback placeholder

const AdminContactMessages = () => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [contactMessages, setContactMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'new', 'read', 'replied', 'resolved'
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [updating, setUpdating] = useState(null);

  // Fetch contact messages
  useEffect(() => {
    if (!user || !db) return;

    const q = query(
      collection(db, 'contactMessages'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setContactMessages(messages);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching contact messages:', error);
        showError('Failed to load contact messages.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, showError]);

  // Filter and search messages
  const filteredMessages = useMemo(() => {
    return contactMessages.filter(message => {
      // Status filter
      if (statusFilter !== 'all' && message.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const searchableText = `
          ${message.name || ''} 
          ${message.email || ''} 
          ${message.subject || ''} 
          ${message.message || ''}
        `.toLowerCase();
        
        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [contactMessages, statusFilter, searchQuery]);

  // Update message status
  const updateStatus = async (messageId, newStatus) => {
    if (!db) {
      showError('Database connection not available.');
      return;
    }
    setUpdating(messageId);
    try {
      const updateData = {
        status: newStatus
      };

      if (newStatus === 'read' && !contactMessages.find(m => m.id === messageId)?.readAt) {
        updateData.readAt = serverTimestamp();
      } else if (newStatus === 'replied' && !contactMessages.find(m => m.id === messageId)?.repliedAt) {
        updateData.repliedAt = serverTimestamp();
      } else if (newStatus === 'resolved') {
        updateData.resolvedAt = serverTimestamp();
      }

      await updateDoc(doc(db, 'contactMessages', messageId), updateData);
      success(`Message marked as ${newStatus}.`);
    } catch (error) {
      console.error('Error updating message status:', error);
      showError('Failed to update message status.');
    } finally {
      setUpdating(null);
    }
  };

  // Delete message
  const deleteMessage = async (messageId) => {
    if (!db) {
      showError('Database connection not available.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    setDeleting(messageId);
    try {
      await deleteDoc(doc(db, 'contactMessages', messageId));
      success('Message deleted successfully.');
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      showError('Failed to delete message.');
    } finally {
      setDeleting(null);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleString();
    }
    return new Date(timestamp).toLocaleString();
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const styles = {
      new: 'glass-panel bg-blue-600/20 border border-blue-500/30 text-blue-300',
      read: 'glass-panel bg-yellow-600/20 border border-yellow-500/30 text-yellow-300',
      replied: 'glass-panel bg-green-600/20 border border-green-500/30 text-green-300',
      resolved: 'glass-panel bg-white/10 border border-white/10 text-white/70'
    };
    return styles[status] || styles.new;
  };

  // Get status counts
  const statusCounts = useMemo(() => {
    return {
      all: contactMessages.length,
      new: contactMessages.filter(m => m.status === 'new').length,
      read: contactMessages.filter(m => m.status === 'read').length,
      replied: contactMessages.filter(m => m.status === 'replied').length,
      resolved: contactMessages.filter(m => m.status === 'resolved').length
    };
  }, [contactMessages]);

  return (
    <div className="flex flex-col h-screen bg-transparent animate-fade-in">
      {/* Header */}
      <div 
        className="glass-panel border-b border-white/10 backdrop-blur-xl px-4 md:px-6 py-3 md:py-4 animate-slide-down-fade"
        style={{
          paddingTop: `max(0.75rem, env(safe-area-inset-top, 0px) + 0.5rem)`,
          paddingBottom: `0.75rem`,
          paddingLeft: `calc(1rem + env(safe-area-inset-left, 0px))`,
          paddingRight: `calc(1rem + env(safe-area-inset-right, 0px))`,
          position: 'relative',
          zIndex: 10
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center gap-2 md:gap-3">
            <Logo size="small" showText={false} />
            <div>
              <h2 className="text-base sm:text-lg md:text-2xl font-bold text-white text-glow">
                Contact Messages
              </h2>
              <p className="text-xs md:text-sm text-white/60">
                Messages from non-users
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="glass-panel border-b border-white/10 backdrop-blur-xl px-4 md:px-6 py-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative animate-slide-right-fade">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 transition-transform duration-300 hover:scale-110" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, subject, or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-white/10 rounded-xl glass-panel bg-white/5 backdrop-blur-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300 hover:border-white/20 focus:scale-[1.02] [color-scheme:dark]"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 flex-wrap animate-slide-left-fade">
            <Filter size={18} className="text-white/70 hover:text-white transition-transform duration-300 hover:rotate-180" />
            {['all', 'new', 'read', 'replied', 'resolved'].map((status, index) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 capitalize transform hover:scale-105 active:scale-95 stagger-item ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white animate-spring shadow-lg'
                    : 'glass-panel bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {status} {statusCounts[status] > 0 && `(${statusCounts[status]})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Messages List */}
        <div className="w-full md:w-1/2 lg:w-1/3 border-r border-white/10 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto"></div>
                <p className="mt-4 text-white/60 font-medium">Loading messages...</p>
              </div>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center">
                <Mail className="mx-auto text-white/40 mb-4" size={48} />
                <p className="text-white/60 font-medium">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'No messages found matching your filters.' 
                    : 'No contact messages yet.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  onClick={() => setSelectedMessage(message)}
                  className={`p-4 cursor-pointer glass-panel border border-white/10 hover:border-white/20 rounded-xl transition-all ${
                    selectedMessage?.id === message.id ? 'bg-indigo-600/20 border-indigo-500/30' : ''
                  } ${message.status === 'new' ? 'border-l-4 border-blue-500' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">
                        {message.name || 'Anonymous'}
                      </h3>
                      <p className="text-sm text-white/60 truncate">
                        {message.email}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(message.status)}`}>
                      {message.status}
                    </span>
                  </div>
                  {message.subject && (
                    <p className="text-sm font-medium text-white mb-1 truncate">
                      {message.subject}
                    </p>
                  )}
                  <p className="text-sm text-white/60 line-clamp-2">
                    {message.message}
                  </p>
                  <p className="text-xs text-white/50 mt-2">
                    {formatTimestamp(message.timestamp)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message Detail */}
        <div className="hidden md:flex flex-1 flex-col glass-panel border-l border-white/10 backdrop-blur-xl">
          {selectedMessage ? (
            <div className="flex-1 overflow-y-auto p-6">
              {/* Message Header */}
              <div className="mb-6 pb-6 border-b border-white/10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2 text-glow">
                      {selectedMessage.subject || 'No Subject'}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-white/60">
                      <div className="flex items-center gap-2">
                        <User size={16} />
                        <span>{selectedMessage.name || 'Anonymous'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={16} />
                        <a 
                          href={`mailto:${selectedMessage.email}`}
                          className="hover:text-indigo-400 transition-colors"
                        >
                          {selectedMessage.email}
                        </a>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusBadge(selectedMessage.status)}`}>
                    {selectedMessage.status}
                  </span>
                </div>
                <p className="text-sm text-white/60">
                  Received: {formatTimestamp(selectedMessage.timestamp)}
                </p>
                {selectedMessage.readAt && (
                  <p className="text-sm text-white/60">
                    Read: {formatTimestamp(selectedMessage.readAt)}
                  </p>
                )}
                {selectedMessage.repliedAt && (
                  <p className="text-sm text-white/60">
                    Replied: {formatTimestamp(selectedMessage.repliedAt)}
                  </p>
                )}
                {selectedMessage.resolvedAt && (
                  <p className="text-sm text-white/60">
                    Resolved: {formatTimestamp(selectedMessage.resolvedAt)}
                  </p>
                )}
              </div>

              {/* Message Body */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 text-glow">Message</h3>
                <div className="glass-panel bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-white/90 whitespace-pre-wrap leading-relaxed">
                    {selectedMessage.message}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {selectedMessage.status !== 'read' && (
                  <button
                    onClick={() => updateStatus(selectedMessage.id, 'read')}
                    disabled={updating === selectedMessage.id}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Eye size={18} />
                    Mark as Read
                  </button>
                )}
                {selectedMessage.status !== 'replied' && (
                  <button
                    onClick={() => updateStatus(selectedMessage.id, 'replied')}
                    disabled={updating === selectedMessage.id}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <CheckCircle size={18} />
                    Mark as Replied
                  </button>
                )}
                {selectedMessage.status !== 'resolved' && (
                  <button
                    onClick={() => updateStatus(selectedMessage.id, 'resolved')}
                    disabled={updating === selectedMessage.id}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <CheckCircle size={18} />
                    Mark as Resolved
                  </button>
                )}
                <button
                  onClick={() => deleteMessage(selectedMessage.id)}
                  disabled={deleting === selectedMessage.id}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 size={18} />
                  {deleting === selectedMessage.id ? 'Deleting...' : 'Delete'}
                </button>
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject || 'Contact Message'}`}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  <Mail size={18} />
                  Reply via Email
                </a>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="mx-auto text-white/40 mb-4" size={48} />
                <p className="text-white/60 font-medium">Select a message to view details</p>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Message Detail Modal */}
        {selectedMessage && (
          <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-black dark:text-white">Message Details</h2>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-6 pb-6 border-b border-white/10">
                  <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
                    {selectedMessage.subject || 'No Subject'}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <div className="flex items-center gap-2">
                      <User size={16} />
                      <span>{selectedMessage.name || 'Anonymous'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={16} />
                      <a 
                        href={`mailto:${selectedMessage.email}`}
                        className="hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        {selectedMessage.email}
                      </a>
                    </div>
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${getStatusBadge(selectedMessage.status)}`}>
                    {selectedMessage.status}
                  </span>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Received: {formatTimestamp(selectedMessage.timestamp)}
                  </p>
                </div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-black dark:text-white mb-3">Message</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      {selectedMessage.message}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {selectedMessage.status !== 'read' && (
                    <button
                      onClick={() => {
                        updateStatus(selectedMessage.id, 'read');
                        setSelectedMessage(null);
                      }}
                      disabled={updating === selectedMessage.id}
                      className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Eye size={18} />
                      Mark as Read
                    </button>
                  )}
                  {selectedMessage.status !== 'replied' && (
                    <button
                      onClick={() => {
                        updateStatus(selectedMessage.id, 'replied');
                        setSelectedMessage(null);
                      }}
                      disabled={updating === selectedMessage.id}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      <CheckCircle size={18} />
                      Mark as Replied
                    </button>
                  )}
                  {selectedMessage.status !== 'resolved' && (
                    <button
                      onClick={() => {
                        updateStatus(selectedMessage.id, 'resolved');
                        setSelectedMessage(null);
                      }}
                      disabled={updating === selectedMessage.id}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      <CheckCircle size={18} />
                      Mark as Resolved
                    </button>
                  )}
                  <button
                    onClick={() => {
                      deleteMessage(selectedMessage.id);
                      setSelectedMessage(null);
                    }}
                    disabled={deleting === selectedMessage.id}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={18} />
                    Delete
                  </button>
                  <a
                    href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject || 'Contact Message'}`}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                  >
                    <Mail size={18} />
                    Reply via Email
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminContactMessages;

