import { useState, useEffect, useMemo } from 'react';
import { BarChart3, MessageSquare, Clock, TrendingUp, Users, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

const db = typeof window !== 'undefined' && window.__firebaseDb 
  ? window.__firebaseDb 
  : null;

/**
 * Message Analytics Dashboard
 * Personal message statistics and insights
 */
const MessageAnalytics = ({ userId, onClose }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week'); // day, week, month, all

  useEffect(() => {
    if (!userId || !db) return;
    loadAnalytics();
  }, [userId, timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate = new Date();

      switch (timeRange) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        default:
          startDate = new Date(0); // All time
      }

      const messagesQuery = query(
        collection(db, 'messages'),
        where('userId', '==', userId),
        where('timestamp', '>=', startDate),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(messagesQuery);
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate statistics
      const totalMessages = messages.length;
      const messagesWithReactions = messages.filter(m => m.reactions && Object.keys(m.reactions).length > 0).length;
      const messagesWithFiles = messages.filter(m => m.attachment || m.fileUrl).length;
      const averageReactions = messages.reduce((sum, m) => {
        const reactions = m.reactions || {};
        return sum + Object.keys(reactions).length;
      }, 0) / (totalMessages || 1);

      // Most active time
      const hourCounts = {};
      messages.forEach(m => {
        if (m.timestamp?.toDate) {
          const hour = m.timestamp.toDate().getHours();
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }
      });
      const mostActiveHour = Object.keys(hourCounts).reduce((a, b) => 
        hourCounts[a] > hourCounts[b] ? a : b, '12'
      );

      setStats({
        totalMessages,
        messagesWithReactions,
        messagesWithFiles,
        averageReactions: averageReactions.toFixed(1),
        mostActiveHour: `${mostActiveHour}:00`,
        timeRange
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel border border-white/20 rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 size={24} className="text-indigo-400" />
          <h2 className="text-xl font-bold text-white">Message Analytics</h2>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-1.5 glass-panel border border-white/10 rounded-lg bg-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          <option value="day">Last 24 Hours</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={<MessageSquare size={20} />}
          label="Total Messages"
          value={stats.totalMessages}
          color="indigo"
        />
        <StatCard
          icon={<Heart size={20} />}
          label="With Reactions"
          value={stats.messagesWithReactions}
          color="pink"
        />
        <StatCard
          icon={<File size={20} />}
          label="With Files"
          value={stats.messagesWithFiles}
          color="blue"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Avg Reactions"
          value={stats.averageReactions}
          color="green"
        />
        <StatCard
          icon={<Clock size={20} />}
          label="Most Active"
          value={stats.mostActiveHour}
          color="yellow"
          colSpan={2}
        />
      </div>
    </motion.div>
  );
};

const StatCard = ({ icon, label, value, color, colSpan = 1 }) => {
  const colorClasses = {
    indigo: 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400',
    pink: 'bg-pink-600/20 border-pink-500/50 text-pink-400',
    blue: 'bg-blue-600/20 border-blue-500/50 text-blue-400',
    green: 'bg-green-600/20 border-green-500/50 text-green-400',
    yellow: 'bg-yellow-600/20 border-yellow-500/50 text-yellow-400'
  };

  // Map colSpan to Tailwind classes - ensures classes are included in build
  const colSpanClasses = {
    1: 'col-span-1',
    2: 'col-span-2',
    3: 'col-span-3',
    4: 'col-span-4',
  };
  const colSpanClass = colSpanClasses[colSpan] || 'col-span-1';

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={`p-4 glass-panel border rounded-xl ${colorClasses[color]} ${colSpanClass}`}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-white/60">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </motion.div>
  );
};

export default MessageAnalytics;
