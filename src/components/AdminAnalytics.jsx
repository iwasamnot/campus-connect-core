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
  Download
} from 'lucide-react';
import { SkeletonLoader, CardSkeleton } from './SkeletonLoader';

const AdminAnalytics = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d, all

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
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400" />
            <span>Analytics Dashboard</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive insights into platform usage and activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Messages */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Messages</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.messages.total.toLocaleString()}
              </p>
            </div>
            <MessageSquare className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-gray-600 dark:text-gray-400">Toxic:</span>
            <span className="font-semibold text-red-600 dark:text-red-400">
              {stats.messages.toxic} ({stats.messages.toxicPercentage}%)
            </span>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.users.active.toLocaleString()}
              </p>
            </div>
            <Users className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-gray-600 dark:text-gray-400">Total:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {stats.users.total} ({stats.users.activePercentage}% active)
            </span>
          </div>
        </div>

        {/* Pending Reports */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Reports</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.activity.pending}
              </p>
            </div>
            <AlertTriangle className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-gray-600 dark:text-gray-400">Resolved:</span>
            <span className="font-semibold text-green-600 dark:text-green-400">
              {stats.activity.resolved} ({stats.activity.resolutionRate}%)
            </span>
          </div>
        </div>

        {/* Audit Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Audit Actions</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.activity.auditActions.toLocaleString()}
              </p>
            </div>
            <Activity className="w-12 h-12 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-gray-600 dark:text-gray-400">Time range:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {timeRange === 'all' ? 'All time' : `Last ${timeRange}`}
            </span>
          </div>
        </div>
      </div>

      {/* Charts and Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Daily Message Activity
          </h3>
          <div className="space-y-3">
            {stats.dailyActivity.map((day, index) => {
              const maxCount = Math.max(...stats.dailyActivity.map(d => d.count), 1);
              const percentage = (day.count / maxCount) * 100;
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-20 text-sm text-gray-600 dark:text-gray-400">
                    {day.date}
                  </div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-900 dark:text-white">
                      {day.count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Active Users */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
            Top Active Users
          </h3>
          <div className="space-y-3">
            {stats.topUsers.length > 0 ? (
              stats.topUsers.map((user, index) => (
                <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold">
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {user.count} messages
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No activity data available
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Messages with Files</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.messages.withFiles}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Messages with Reactions</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.messages.withReactions}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Pinned Messages</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.messages.pinned}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;

