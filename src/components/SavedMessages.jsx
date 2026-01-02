import { useState, useEffect, useMemo, memo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { collection, query, where, onSnapshot, deleteDoc, doc, orderBy } from 'firebase/firestore';
// Use window.__firebaseDb to avoid import/export issues in production builds
const db = typeof window !== 'undefined' && window.__firebaseDb 
  ? window.__firebaseDb 
  : null;
import { Bookmark, Trash2, Search, X, MessageSquare } from 'lucide-react';
import { SkeletonLoader } from './SkeletonLoader';
// Use window globals to avoid import/export issues
const debounce = typeof window !== 'undefined' && window.__debounce 
  ? window.__debounce 
  : (fn, delay) => fn; // Fallback: return function as-is

const SavedMessages = memo(() => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [savedMessages, setSavedMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((value) => {
      // Search is handled by filteredMessages
    }, 300),
    []
  );

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    debouncedSearch(value);
  };

  // Fetch saved messages
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'savedMessages'),
      where('userId', '==', user.uid),
      orderBy('savedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSavedMessages(messages);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching saved messages:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'savedMessages', id));
      success('Message removed from saved');
    } catch (error) {
      console.error('Error deleting saved message:', error);
      showError('Failed to remove saved message');
    }
  };

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return savedMessages;
    const queryLower = searchQuery.toLowerCase();
    return savedMessages.filter(msg => {
      const text = (msg.messageText || '').toLowerCase();
      const author = (msg.authorName || '').toLowerCase();
      return text.includes(queryLower) || author.includes(queryLower);
    });
  }, [savedMessages, searchQuery]);

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div 
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4"
        style={{
          paddingTop: `max(1rem, env(safe-area-inset-top, 0px) + 0.5rem)`,
          position: 'relative',
          zIndex: 10
        }}
      >
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bookmark className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400" />
            <span>Saved Messages</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Your bookmarked messages for quick access
          </p>
        </div>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <label htmlFor="saved-messages-search" className="sr-only">Search saved messages</label>
          <input
            type="text"
            id="saved-messages-search"
            name="saved-messages-search"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search saved messages..."
            className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonLoader key={i} height="100px" />
            ))}
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery ? 'No saved messages match your search.' : 'No saved messages yet. Bookmark messages to save them here!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((msg) => (
              <div
                key={msg.id}
                className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {msg.authorName || 'Unknown'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(msg.savedAt)}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                      {msg.messageText || msg.displayText || ''}
                    </p>
                    {msg.originalTimestamp && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Original message: {formatDate(msg.originalTimestamp)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(msg.id)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

SavedMessages.displayName = 'SavedMessages';

export default SavedMessages;

