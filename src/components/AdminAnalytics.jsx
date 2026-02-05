import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  query, 
  onSnapshot,
  getDocs,
  limit
} from 'firebase/firestore';
// Use window.__firebaseDb to avoid import/export issues in production builds
const db = typeof window !== 'undefined' && window.__firebaseDb 
  ? window.__firebaseDb 
  : null;
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  AlertTriangle, 
  Clock,
  Activity,
  FileText,
  Calendar,
  Download,
  Search,
  Brain,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { SkeletonLoader, CardSkeleton } from './SkeletonLoader';

const AdminAnalytics = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d, all
  
  // Smart query states
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [showSmartQuery, setShowSmartQuery] = useState(false);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch messages
        const messagesQuery = query(
          collection(db, 'messages'),
          limit(1000) // Limit for analytics
        );
        const messagesSnapshot = await getDocs(messagesQuery);
        const messagesData = messagesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMessages(messagesData);

        // Fetch users
        const usersQuery = query(
          collection(db, 'users'),
          limit(500)
        );
        const usersSnapshot = await getDocs(usersQuery);
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);

        // Fetch reports
        const reportsQuery = query(
          collection(db, 'reports'),
          limit(500)
        );
        const reportsSnapshot = await getDocs(reportsQuery);
        const reportsData = reportsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setReports(reportsData);

        // Fetch audit logs
        const auditQuery = query(
          collection(db, 'auditLogs'),
          limit(500)
        );
        const auditSnapshot = await getDocs(auditQuery);
        const auditData = auditSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAuditLogs(auditData);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter data by time range
  const filteredData = useMemo(() => {
    const now = Date.now();
    let cutoffTime = 0;

    switch (timeRange) {
      case '7d':
        cutoffTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case '30d':
        cutoffTime = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case '90d':
        cutoffTime = now - 90 * 24 * 60 * 60 * 1000;
        break;
      default:
        cutoffTime = 0;
    }

    const filterByTime = (item) => {
      if (!item.timestamp) return false;
      const timestamp = item.timestamp?.toDate?.() || new Date(item.timestamp);
      return timestamp.getTime() >= cutoffTime;
    };

    return {
      messages: messages.filter(filterByTime),
      reports: reports.filter(filterByTime),
      auditLogs: auditLogs.filter(filterByTime),
    };
  }, [messages, reports, auditLogs, timeRange]);

  // Handle smart query
  const handleSmartQuery = async () => {
    if (!query.trim()) return;
    
    setQueryLoading(true);
    setQueryResult(null);
    
    try {
      // Import the smart admin queries dynamically
      const { askAdminQuery } = await import('../utils/smartAdminQueries');
      const result = await askAdminQuery(query, user?.uid);
      setQueryResult(result);
    } catch (error) {
      console.error('Error processing smart query:', error);
      setQueryResult({
        answer: "I'm having trouble processing that query. Please try rephrasing it.",
        error: error.message
      });
    } finally {
      setQueryLoading(false);
    }
  };

  // Sample queries for suggestions
  const sampleQueries = [
    "Which users were online between 2 jan to 5 jan?",
    "How many messages were sent last week?",
    "Show me most active users this month",
    "What are the peak activity hours?",
    "How many new users registered in January?",
    "Compare message volume this week vs last week"
  ];

  // Calculate statistics
  const stats = useMemo(() => {
    const { messages: filteredMessages, reports: filteredReports, auditLogs: filteredAuditLogs } = filteredData;

    // Message statistics
    const totalMessages = filteredMessages.length;
    const toxicMessages = filteredMessages.filter(m => m.isToxic || m.toxicityScore > 0.5).length;
    const messagesWithFiles = filteredMessages.filter(m => m.fileUrl || m.fileName).length;
    const messagesWithReactions = filteredMessages.filter(m => m.reactions && Object.keys(m.reactions).length > 0).length;
    const pinnedMessages = filteredMessages.filter(m => m.pinned).length;

    // User statistics
    const totalUsers = users.length;
    const activeUsers = users.filter(u => {
      const lastSeen = u.lastSeen?.toDate?.() || new Date(u.lastSeen || 0);
      const daysSinceActive = (Date.now() - lastSeen.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceActive <= 30;
    }).length;
    const verifiedUsers = users.filter(u => u.emailVerified).length;
    const adminUsers = users.filter(u => u.role === 'admin' || u.role === 'admin1').length;

    // Activity statistics
    const totalReports = filteredReports.length;
    const resolvedReports = filteredReports.filter(r => r.resolved).length;
    const pendingReports = totalReports - resolvedReports;
    const totalAuditActions = filteredAuditLogs.length;

    // Daily message activity (last 7 days)
    const dailyActivity = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const count = filteredMessages.filter(m => {
        const msgDate = m.timestamp?.toDate?.() || new Date(m.timestamp || 0);
        return msgDate >= date && msgDate < nextDay;
      }).length;

      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count
      };
    });

    // Top active users
    const userMessageCounts = {};
    filteredMessages.forEach(m => {
      userMessageCounts[m.userId] = (userMessageCounts[m.userId] || 0) + 1;
    });
    const topUsers = Object.entries(userMessageCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([userId, count]) => {
        const user = users.find(u => u.id === userId);
        return {
          userId,
          name: user?.name || user?.email || 'Unknown',
          count
        };
      });

    return {
      messages: {
        total: totalMessages,
        toxic: toxicMessages,
        withFiles: messagesWithFiles,
        withReactions: messagesWithReactions,
        pinned: pinnedMessages,
        toxicPercentage: totalMessages > 0 ? ((toxicMessages / totalMessages) * 100).toFixed(1) : 0
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        verified: verifiedUsers,
        admins: adminUsers,
        activePercentage: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0
      },
      activity: {
        reports: totalReports,
        resolved: resolvedReports,
        pending: pendingReports,
        auditActions: totalAuditActions,
        resolutionRate: totalReports > 0 ? ((resolvedReports / totalReports) * 100).toFixed(1) : 0
      },
      dailyActivity,
      topUsers
    };
  }, [filteredData, users]);

  // Export analytics data
  const exportData = () => {
    const data = {
      generatedAt: new Date().toISOString(),
      timeRange,
      statistics: stats,
      summary: {
        totalMessages: stats.messages.total,
        totalUsers: stats.users.total,
        totalReports: stats.activity.reports,
        activeUsers: stats.users.active
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${timeRange}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    <div className="p-4 md:p-6 space-y-6 bg-transparent">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel border border-white/10 rounded-[2rem] p-4 md:p-6 backdrop-blur-xl mb-6"
        style={{
          paddingTop: `max(1rem, env(safe-area-inset-top, 0px) + 0.5rem)`,
          position: 'relative',
          zIndex: 10
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white text-glow flex items-center gap-2">
              <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400" />
              <span>Analytics Dashboard</span>
            </h1>
            <p className="text-xs sm:text-sm text-white/60 mt-1">
              Comprehensive insights into platform usage and activity
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-white/10 rounded-xl glass-panel bg-white/5 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300 hover:border-white/20 [color-scheme:dark]"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSmartQuery(!showSmartQuery)}
              className={`px-4 py-2 rounded-xl glass-panel backdrop-blur-sm border transition-all duration-300 flex items-center gap-2 ${
                showSmartQuery 
                  ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300' 
                  : 'bg-white/5 border-white/10 text-white hover:border-white/20'
              }`}
            >
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">Smart Query</span>
            </motion.button>
            <motion.button
              onClick={exportData}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              <Download className="w-4 h-4" />
              Export
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Messages */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="glass-panel border border-white/10 rounded-[2rem] shadow-xl p-6 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Total Messages</p>
              <p className="text-3xl font-bold text-white mt-2 text-glow">
                {stats.messages.total.toLocaleString()}
              </p>
            </div>
            <MessageSquare className="w-12 h-12 text-indigo-400" />
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-white/60">Toxic:</span>
            <span className="font-semibold text-red-400">
              {stats.messages.toxic} ({stats.messages.toxicPercentage}%)
            </span>
          </div>
        </motion.div>

        {/* Active Users */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="glass-panel border border-white/10 rounded-[2rem] shadow-xl p-6 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Active Users</p>
              <p className="text-3xl font-bold text-white mt-2 text-glow">
                {stats.users.active.toLocaleString()}
              </p>
            </div>
            <Users className="w-12 h-12 text-green-400" />
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-white/60">Total:</span>
            <span className="font-semibold text-white">
              {stats.users.total} ({stats.users.activePercentage}% active)
            </span>
          </div>
        </motion.div>

        {/* Pending Reports */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="glass-panel border border-white/10 rounded-[2rem] shadow-xl p-6 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Pending Reports</p>
              <p className="text-3xl font-bold text-white mt-2 text-glow">
                {stats.activity.pending}
              </p>
            </div>
            <AlertTriangle className="w-12 h-12 text-yellow-400" />
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-white/60">Resolved:</span>
            <span className="font-semibold text-green-400">
              {stats.activity.resolved} ({stats.activity.resolutionRate}%)
            </span>
          </div>
        </motion.div>

        {/* Audit Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="glass-panel border border-white/10 rounded-[2rem] shadow-xl p-6 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Audit Actions</p>
              <p className="text-3xl font-bold text-white mt-2 text-glow">
                {stats.activity.auditActions.toLocaleString()}
              </p>
            </div>
            <Activity className="w-12 h-12 text-purple-400" />
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-white/60">Time range:</span>
            <span className="font-semibold text-white">
              {timeRange === 'all' ? 'All time' : `Last ${timeRange}`}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Smart Query Interface */}
      {showSmartQuery && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel border border-white/10 rounded-[2rem] shadow-xl p-6 backdrop-blur-xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-semibold text-white text-glow">
              Smart Query Assistant
            </h3>
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>
          
          {/* Query Input */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSmartQuery()}
                placeholder="Ask anything about your data... e.g., 'Which users were online between 2 jan to 5 jan?'"
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSmartQuery}
                disabled={queryLoading || !query.trim()}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white rounded-xl font-medium transition-all flex items-center gap-2"
              >
                {queryLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Ask
              </motion.button>
            </div>

            {/* Sample Queries */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-white/60">Try:</span>
              {sampleQueries.map((sampleQ, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setQuery(sampleQ)}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-lg text-sm transition-all"
                >
                  {sampleQ}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Query Result */}
          {queryResult && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-white/5 border border-white/10 rounded-xl"
            >
              <div className="prose prose-invert max-w-none">
                <div 
                  className="text-white/90 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ 
                    __html: queryResult.answer.replace(/\n/g, '<br />') 
                  }}
                />
              </div>
              
              {queryResult.data && (
                <details className="mt-4">
                  <summary className="text-sm text-white/60 cursor-pointer hover:text-white/80">
                    View raw data
                  </summary>
                  <pre className="mt-2 text-xs text-white/40 overflow-x-auto">
                    {JSON.stringify(queryResult.data, null, 2)}
                  </pre>
                </details>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Charts and Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-panel border border-white/10 rounded-[2rem] shadow-xl p-6 backdrop-blur-xl"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 text-glow">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            Daily Message Activity
          </h3>
          <div className="space-y-3">
            {stats.dailyActivity.map((day, index) => {
              const maxCount = Math.max(...stats.dailyActivity.map(d => d.count), 1);
              const percentage = (day.count / maxCount) * 100;
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-20 text-sm text-white/60">
                    {day.date}
                  </div>
                  <div className="flex-1 bg-white/10 rounded-full h-6 relative overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                      className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                      {day.count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Top Active Users */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-panel border border-white/10 rounded-[2rem] shadow-xl p-6 backdrop-blur-xl"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 text-glow">
            <Users className="w-5 h-5 text-green-400" />
            Top Active Users
          </h3>
          <div className="space-y-3">
            {stats.topUsers.length > 0 ? (
              stats.topUsers.map((user, index) => (
                <motion.div 
                  key={user.userId} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  whileHover={{ x: 4, scale: 1.02 }}
                  className="flex items-center justify-between p-3 glass-panel bg-white/5 border border-white/10 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full glass-panel bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-semibold">
                      {index + 1}
                    </div>
                    <span className="font-medium text-white">
                      {user.name}
                    </span>
                  </div>
                  <span className="text-sm text-white/60">
                    {user.count} messages
                  </span>
                </motion.div>
              ))
            ) : (
              <p className="text-white/60 text-center py-4">
                No activity data available
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="glass-panel border border-white/10 rounded-[2rem] shadow-xl p-6 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-medium text-white/60">Messages with Files</span>
          </div>
          <p className="text-2xl font-bold text-white text-glow">
            {stats.messages.withFiles}
          </p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="glass-panel border border-white/10 rounded-[2rem] shadow-xl p-6 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-medium text-white/60">Messages with Reactions</span>
          </div>
          <p className="text-2xl font-bold text-white text-glow">
            {stats.messages.withReactions}
          </p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="glass-panel border border-white/10 rounded-[2rem] shadow-xl p-6 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-orange-400" />
            <span className="text-sm font-medium text-white/60">Pinned Messages</span>
          </div>
          <p className="text-2xl font-bold text-white text-glow">
            {stats.messages.pinned}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminAnalytics;

