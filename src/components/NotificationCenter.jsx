import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, CheckCheck, MessageSquare, UserPlus, AlertCircle, Info } from 'lucide-react';
import { collection, query, where, onSnapshot, updateDoc, doc, orderBy, limit } from 'firebase/firestore';

const db = typeof window !== 'undefined' && window.__firebaseDb 
  ? window.__firebaseDb 
  : null;

/**
 * Modern Notification Center
 * Centralized notification management
 */
const NotificationCenter = ({ isOpen, onClose, userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId || !db) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        try {
          const notifs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setNotifications(notifs);
          setUnreadCount(notifs.filter(n => !n.read).length);
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error('Error processing notifications:', err);
          setError('Failed to load notifications');
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error fetching notifications:', error);
        setError('Failed to load notifications');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const markAsRead = async (notificationId) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: new Date()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!db) return;
    try {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(
        unread.map(n => updateDoc(doc(db, 'notifications', n.id), {
          read: true,
          readAt: new Date()
        }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message': return MessageSquare;
      case 'mention': return UserPlus;
      case 'alert': return AlertCircle;
      default: return Info;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'message': return 'text-blue-400';
      case 'mention': return 'text-purple-400';
      case 'alert': return 'text-red-400';
      default: return 'text-indigo-400';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-start justify-end pt-16 pr-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-panel border border-white/20 rounded-2xl shadow-2xl w-full max-w-md h-[calc(100vh-5rem)] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Bell size={20} className="text-indigo-400" />
              <h2 className="text-lg font-semibold text-white">Notifications</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-1 bg-indigo-600 rounded-full text-xs text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  title="Mark all as read"
                  aria-label="Mark all notifications as read"
                >
                  <CheckCheck size={18} className="text-white/60" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close notifications"
              >
                <X size={18} className="text-white/60" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mx-auto mb-4" />
                <p className="text-white/60">Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
                <p className="text-white/60">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={48} className="mx-auto text-white/20 mb-4" />
                <p className="text-white/60">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map((notif) => {
                  const Icon = getNotificationIcon(notif.type);
                  const iconColor = getNotificationColor(notif.type);

                  return (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 hover:bg-white/5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[60px] ${
                        !notif.read ? 'bg-indigo-600/10' : ''
                      }`}
                      onClick={() => {
                        if (!notif.read) markAsRead(notif.id);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          if (!notif.read) markAsRead(notif.id);
                        }
                      }}
                      aria-label={`${notif.read ? 'Read' : 'Unread'} notification: ${notif.title}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-white/5 ${iconColor}`}>
                          <Icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">{notif.title}</p>
                          <p className="text-xs text-white/60 mt-1">{notif.message}</p>
                          <p className="text-xs text-white/40 mt-2">
                            {notif.timestamp?.toDate ? 
                              new Date(notif.timestamp.toDate()).toLocaleString() :
                              'Just now'
                            }
                          </p>
                        </div>
                        {!notif.read && (
                          <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationCenter;
