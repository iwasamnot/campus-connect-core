import { useState, useEffect, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
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
// Use window.__firebaseDb to avoid import/export issues in production builds
const db = typeof window !== 'undefined' && window.__firebaseDb 
  ? window.__firebaseDb 
  : null;
import { 
  Activity, 
  MessageSquare, 
  Users, 
  Bell, 
  TrendingUp, 
  Clock
} from 'lucide-react';
import { SkeletonLoader, CardSkeleton } from './SkeletonLoader';
import { FadeIn, StaggerContainer, StaggerItem } from './AnimatedComponents';

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
          if (error.code === 'failed-precondition' || error.code === 'resource-exhausted') {
            console.warn('Index missing for messages query. Using fallback with client-side filtering.');
            try {
              const fallbackQuery = query(
                collection(db, 'messages'),
                where('userId', '==', user.uid)
              );
              const fallbackSnapshot = await getDocs(fallbackQuery);
              messagesToday = fallbackSnapshot.docs.filter(doc => {
                const msg = doc.data();
                const msgTime = msg.timestamp?.toDate?.() || new Date(msg.timestamp || 0);
                return msgTime >= todayStart;
              }).length;
            } catch (fallbackError) {
              console.warn('Fallback query also failed, setting to 0:', fallbackError.message);
              messagesToday = 0;
            }
          } else {
            console.warn('Unexpected error in today query:', error.message);
            messagesToday = 0;
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
          if (error.code === 'failed-precondition' || error.code === 'resource-exhausted') {
            console.warn('Index missing for messages query. Using fallback with client-side filtering.');
            try {
              const fallbackQuery = query(
                collection(db, 'messages'),
                where('userId', '==', user.uid)
              );
              const fallbackSnapshot = await getDocs(fallbackQuery);
              messagesThisWeek = fallbackSnapshot.docs.filter(doc => {
                const msg = doc.data();
                const msgTime = msg.timestamp?.toDate?.() || new Date(msg.timestamp || 0);
                return msgTime >= weekStart;
              }).length;
            } catch (fallbackError) {
              console.warn('Fallback query also failed, setting to 0:', fallbackError.message);
              messagesThisWeek = 0;
            }
          } else {
            console.warn('Unexpected error in week query:', error.message);
            messagesThisWeek = 0;
          }
        }

        setActivityStats({
          messagesToday,
          messagesThisWeek,
          activeGroups: 0,
          unreadNotifications: 0
        });
      } catch (error) {
        if (error.code !== 'failed-precondition' && error.code !== 'resource-exhausted') {
          console.error('Error calculating stats:', error);
        } else {
          console.warn('Index missing for activity stats. Some features may be limited.');
        }
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
      <FadeIn delay={0.1}>
        <div 
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4"
          style={{
            paddingTop: `max(1rem, env(safe-area-inset-top, 0px) + 0.5rem)`,
            position: 'relative',
            zIndex: 10
          }}
        >
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white text-glow flex items-center gap-2">
              <div className="p-2 glass-panel border border-white/10 rounded-xl">
                <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400" />
              </div>
              <span>Activity Dashboard</span>
            </h1>
            <p className="text-xs sm:text-sm text-white/60 mt-1">
              Your recent activity and platform insights
            </p>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300 hover:border-white/20 [color-scheme:dark]"
          >
            <option value="all" className="bg-[#1a1a1a] text-white">All Activity</option>
            <option value="messages" className="bg-[#1a1a1a] text-white">Messages</option>
            <option value="mentions" className="bg-[#1a1a1a] text-white">Mentions</option>
          </select>
        </div>
      </FadeIn>

      {/* Stats Cards */}
      <StaggerContainer staggerDelay={0.1} initialDelay={0.2}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StaggerItem>
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              className="glass-panel border border-white/10 rounded-[2rem] shadow-xl p-6 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60 font-medium">Messages Today</p>
                  <p className="text-3xl font-bold text-white mt-2 text-glow">
                    {activityStats.messagesToday}
                  </p>
                </div>
                <div className="p-3 glass-panel bg-indigo-600/20 border border-indigo-500/30 rounded-xl">
                  <MessageSquare className="w-8 h-8 text-indigo-400" />
                </div>
              </div>
            </motion.div>
          </StaggerItem>

          <StaggerItem>
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              className="glass-panel border border-white/10 rounded-[2rem] shadow-xl p-6 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60 font-medium">This Week</p>
                  <p className="text-3xl font-bold text-white mt-2 text-glow">
                    {activityStats.messagesThisWeek}
                  </p>
                </div>
                <div className="p-3 glass-panel bg-green-600/20 border border-green-500/30 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
              </div>
            </motion.div>
          </StaggerItem>

          <StaggerItem>
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              className="glass-panel border border-white/10 rounded-[2rem] shadow-xl p-6 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60 font-medium">Active Groups</p>
                  <p className="text-3xl font-bold text-white mt-2 text-glow">
                    {activityStats.activeGroups}
                  </p>
                </div>
                <div className="p-3 glass-panel bg-purple-600/20 border border-purple-500/30 rounded-xl">
                  <Users className="w-8 h-8 text-purple-400" />
                </div>
              </div>
            </motion.div>
          </StaggerItem>

          <StaggerItem>
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              className="glass-panel border border-white/10 rounded-[2rem] shadow-xl p-6 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60 font-medium">Notifications</p>
                  <p className="text-3xl font-bold text-white mt-2 text-glow">
                    {activityStats.unreadNotifications}
                  </p>
                </div>
                <div className="p-3 glass-panel bg-yellow-600/20 border border-yellow-500/30 rounded-xl">
                  <Bell className="w-8 h-8 text-yellow-400" />
                </div>
              </div>
            </motion.div>
          </StaggerItem>
        </div>
      </StaggerContainer>

      {/* Recent Activity */}
      <FadeIn delay={0.3}>
        <div className="glass-panel border border-white/10 rounded-[2rem] shadow-xl p-6 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-white text-glow mb-4 flex items-center gap-2">
            <div className="p-1.5 glass-panel border border-white/10 rounded-lg">
              <Clock className="w-5 h-5 text-indigo-400" />
            </div>
            Recent Activity
          </h2>
          <div className="space-y-3">
            {filteredActivity.length === 0 ? (
              <div className="text-center py-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-block p-4 glass-panel border border-white/10 rounded-2xl mb-4"
                >
                  <Activity className="w-16 h-16 text-white/40 mx-auto" />
                </motion.div>
                <p className="text-white/60 font-medium">
                  No recent activity
                </p>
              </div>
            ) : (
              filteredActivity.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 4, scale: 1.01 }}
                  className="flex items-start gap-3 p-3 glass-panel border border-white/10 rounded-xl hover:border-white/20 transition-all"
                >
                  <div className="w-10 h-10 rounded-full glass-panel bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                    {item.mentions?.includes(user?.uid) ? (
                      <Bell className="w-5 h-5 text-indigo-400" />
                    ) : (
                      <MessageSquare className="w-5 h-5 text-indigo-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white">
                        {item.userName || 'Unknown'}
                      </span>
                      {item.mentions?.includes(user?.uid) && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="px-2 py-0.5 text-xs glass-panel bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 rounded-full font-medium"
                        >
                          Mentioned you
                        </motion.span>
                      )}
                    </div>
                    <p className="text-sm text-white/70 line-clamp-2 leading-relaxed">
                      {item.displayText || item.text || ''}
                    </p>
                    <p className="text-xs text-white/50 mt-1">
                      {formatTime(item.timestamp)}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </FadeIn>
    </div>
  );
});

ActivityDashboard.displayName = 'ActivityDashboard';

export default ActivityDashboard;
