import { useState, useEffect, useMemo, memo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  collection, 
  query, 
  where,
  orderBy,
  onSnapshot,
  limit,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { 
  Activity, 
  MessageSquare, 
  Users, 
  Bell, 
  TrendingUp, 
  Clock, 
  Bookmark,
  Calendar,
  Zap,
  BarChart3,
  Filter
} from 'lucide-react';
import { SkeletonLoader, CardSkeleton } from './SkeletonLoader';
// Date formatting utility
const formatDistanceToNow = (date) => {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'just now';
};

const ActivityDashboard = memo(() => {
  const { user } = useAuth();
  const { success } = useToast();
  const [loading, setLoading] = useState(true);
  const [recentMessages, setRecentMessages] = useState([]);
  const [recentMentions, setRecentMentions] = useState([]);
  const [activityStats, setActivityStats] = useState({
    messagesToday: 0,
    messagesThisWeek: 0,
    activeGroups: 0,
    unreadNotifications: 0
  });
  const [filter, setFilter] = useState('all'); // all, messages, mentions, activity

  // Fetch recent messages
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecentMessages(messages);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching messages:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Fetch mentions
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'messages'),
      where('mentions', 'array-contains', user.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mentions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecentMentions(mentions);
    }, (error) => {
      if (error.code !== 'failed-precondition') {
        console.error('Error fetching mentions:', error);
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Calculate activity stats
  useEffect(() => {
    const calculateStats = async () => {
      if (!user?.uid) return;

      try {
        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const weekStart = new Date(now.setDate(now.getDate() - 7));

        // Messages today - with fallback if index is missing
        let messagesToday = 0;
        try {
          const todayQuery = query(
            collection(db, 'messages'),
            where('userId', '==', user.uid),
            where('timestamp', '>=', todayStart),
            orderBy('timestamp', 'desc')
          );
          const todaySnapshot = await getDocs(todayQuery);
          messagesToday = todaySnapshot.size;
        } catch (error) {
          if (error.code === 'failed-precondition') {
            // Index missing - use fallback query without orderBy
            console.warn('Index missing for messages query. Using fallback.');
            try {
              const fallbackQuery = query(
                collection(db, 'messages'),
                where('userId', '==', user.uid),
                where('timestamp', '>=', todayStart)
              );
              const fallbackSnapshot = await getDocs(fallbackQuery);
              messagesToday = fallbackSnapshot.size;
            } catch (fallbackError) {
              console.error('Fallback query also failed:', fallbackError);
            }
          } else {
            throw error;
          }
        }

        // Messages this week - with fallback if index is missing
        let messagesThisWeek = 0;
        try {
          const weekQuery = query(
            collection(db, 'messages'),
            where('userId', '==', user.uid),
            where('timestamp', '>=', weekStart),
            orderBy('timestamp', 'desc')
          );
          const weekSnapshot = await getDocs(weekQuery);
          messagesThisWeek = weekSnapshot.size;
        } catch (error) {
          if (error.code === 'failed-precondition') {
            // Index missing - use fallback query without orderBy
            console.warn('Index missing for messages query. Using fallback.');
            try {
              const fallbackQuery = query(
                collection(db, 'messages'),
                where('userId', '==', user.uid),
                where('timestamp', '>=', weekStart)
              );
              const fallbackSnapshot = await getDocs(fallbackQuery);
              messagesThisWeek = fallbackSnapshot.size;
            } catch (fallbackError) {
              console.error('Fallback query also failed:', fallbackError);
            }
          } else {
            throw error;
          }
        }

        setActivityStats({
          messagesToday,
          messagesThisWeek,
          activeGroups: 0,
          unreadNotifications: 0
        });
      } catch (error) {
        console.error('Error calculating stats:', error);
      }
    };

    calculateStats();
  }, [user?.uid]);

  const filteredActivity = useMemo(() => {
    switch (filter) {
      case 'messages':
        return recentMessages;
      case 'mentions':
        return recentMentions;
      default:
        return [...recentMessages, ...recentMentions]
          .sort((a, b) => {
            const aTime = a.timestamp?.toDate?.() || new Date(a.timestamp || 0);
            const bTime = b.timestamp?.toDate?.() || new Date(b.timestamp || 0);
            return bTime - aTime;
          })
          .slice(0, 10);
    }
  }, [filter, recentMessages, recentMentions]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
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
            <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400" />
            <span>Activity Dashboard</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Your recent activity and platform insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Activity</option>
            <option value="messages">Messages</option>
            <option value="mentions">Mentions</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Messages Today</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {activityStats.messagesToday}
              </p>
            </div>
            <MessageSquare className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">This Week</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {activityStats.messagesThisWeek}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Groups</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {activityStats.activeGroups}
              </p>
            </div>
            <Users className="w-12 h-12 text-purple-600 dark:text-purple-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Notifications</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {activityStats.unreadNotifications}
              </p>
            </div>
            <Bell className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Recent Activity
        </h2>
        <div className="space-y-3">
          {filteredActivity.length === 0 ? (
            <p className="text-center py-8 text-gray-500 dark:text-gray-400">
              No recent activity
            </p>
          ) : (
            filteredActivity.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
                  {item.mentions?.includes(user?.uid) ? (
                    <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  ) : (
                    <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {item.userName || 'Unknown'}
                    </span>
                    {item.mentions?.includes(user?.uid) && (
                      <span className="px-2 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full">
                        Mentioned you
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {item.displayText || item.text || ''}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatTime(item.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
});

ActivityDashboard.displayName = 'ActivityDashboard';

export default ActivityDashboard;

