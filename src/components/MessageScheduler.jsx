import { useState, useMemo, memo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Calendar, Clock, Send, Trash2, X, Plus } from 'lucide-react';
import { SkeletonLoader } from './SkeletonLoader';

const MessageScheduler = memo(() => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    text: '',
    scheduledTime: '',
    chatType: 'global' // global, private, group
  });
  const [loading, setLoading] = useState(true);

  // Fetch scheduled messages
  useMemo(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'scheduledMessages'),
      where('userId', '==', user.uid),
      where('sent', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setScheduledMessages(messages.sort((a, b) => {
        const aTime = a.scheduledTime?.toDate?.() || new Date(a.scheduledTime);
        const bTime = b.scheduledTime?.toDate?.() || new Date(b.scheduledTime);
        return aTime - bTime;
      }));
      setLoading(false);
    }, (error) => {
      console.error('Error fetching scheduled messages:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.text.trim() || !formData.scheduledTime) {
      showError('Please fill in all fields');
      return;
    }

    try {
      const scheduledDate = new Date(formData.scheduledTime);
      if (scheduledDate <= new Date()) {
        showError('Scheduled time must be in the future');
        return;
      }

      await addDoc(collection(db, 'scheduledMessages'), {
        userId: user.uid,
        text: formData.text,
        scheduledTime: scheduledDate,
        chatType: formData.chatType,
        sent: false,
        createdAt: serverTimestamp()
      });

      success('Message scheduled successfully!');
      setFormData({ text: '', scheduledTime: '', chatType: 'global' });
      setShowForm(false);
    } catch (error) {
      console.error('Error scheduling message:', error);
      showError('Failed to schedule message');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'scheduledMessages', id));
      success('Scheduled message deleted');
    } catch (error) {
      console.error('Error deleting scheduled message:', error);
      showError('Failed to delete scheduled message');
    }
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return date.toLocaleString();
  };

  const isUpcoming = (timestamp) => {
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return date > new Date();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div 
        className="flex items-center justify-between mb-4"
        style={{
          paddingTop: `max(1rem, env(safe-area-inset-top, 0px) + 0.5rem)`,
          position: 'relative',
          zIndex: 10
        }}
      >
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400" />
            <span>Message Scheduler</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Schedule messages to be sent at a specific time
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Schedule Message
        </button>
      </div>

      {/* Schedule Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              New Scheduled Message
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="scheduler-message-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message Text
              </label>
              <textarea
                id="scheduler-message-text"
                name="text"
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                rows={4}
                placeholder="Enter your message..."
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="scheduler-datetime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Scheduled Date & Time
                </label>
                <input
                  type="datetime-local"
                  id="scheduler-datetime"
                  name="scheduledTime"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label htmlFor="scheduler-chat-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chat Type
                </label>
                <select
                  id="scheduler-chat-type"
                  name="chatType"
                  value={formData.chatType}
                  onChange={(e) => setFormData({ ...formData, chatType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="global">Campus Chat</option>
                  <option value="private">Private Chat</option>
                  <option value="group">Group Chat</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
                Schedule Message
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ text: '', scheduledTime: '', chatType: 'global' });
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Scheduled Messages List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Scheduled Messages ({scheduledMessages.length})
        </h2>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonLoader key={i} height="80px" />
            ))}
          </div>
        ) : scheduledMessages.length === 0 ? (
          <p className="text-center py-8 text-gray-500 dark:text-gray-400">
            No scheduled messages. Schedule your first message above!
          </p>
        ) : (
          <div className="space-y-3">
            {scheduledMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-4 rounded-lg border ${
                  isUpcoming(msg.scheduledTime)
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-gray-900 dark:text-white mb-2">{msg.text}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDateTime(msg.scheduledTime)}
                      </span>
                      <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                        {msg.chatType}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(msg.id)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors ml-4"
                    title="Delete scheduled message"
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

MessageScheduler.displayName = 'MessageScheduler';

export default MessageScheduler;

