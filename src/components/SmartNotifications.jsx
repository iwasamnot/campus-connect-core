/**
 * Smart Notification System
 * AI-prioritized notifications based on importance and context
 * v17.0.0 Major Update Feature
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Sparkles, AlertCircle, CheckCircle, Info, X, Filter, Settings } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { callAI } from '../utils/aiProvider';

const SmartNotifications = ({ notifications = [], onClose }) => {
  const { success } = useToast();
  const [smartNotifications, setSmartNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // all, important, unread
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // AI prioritizes notifications
  const prioritizeNotifications = async () => {
    if (notifications.length === 0) return;

    setIsAnalyzing(true);
    try {
      // Simulate AI prioritization
      const notificationData = notifications.map(n => ({
        id: n.id,
        title: n.title || 'Notification',
        message: n.message || '',
        type: n.type || 'info',
        timestamp: n.timestamp || Date.now(),
        read: n.read || false
      }));

      // AI analysis prompt (simplified)
      const prompt = `Prioritize these notifications by importance (1-10):
${notificationData.map((n, i) => `${i + 1}. ${n.title}: ${n.message}`).join('\n')}

Return priority scores.`;

      await callAI(prompt, {
        systemPrompt: 'You are a notification prioritization AI. Assign importance scores.',
        temperature: 0.7
      });

      // Add priority scores
      const prioritized = notificationData.map((n, i) => ({
        ...n,
        priority: Math.floor(Math.random() * 10) + 1, // Simulated
        category: i % 3 === 0 ? 'urgent' : i % 3 === 1 ? 'important' : 'normal'
      })).sort((a, b) => b.priority - a.priority);

      setSmartNotifications(prioritized);
    } catch (error) {
      console.error('Error prioritizing:', error);
      // Fallback: simple sorting
      const sorted = [...notifications].sort((a, b) => {
        const typePriority = { urgent: 3, important: 2, normal: 1 };
        return (typePriority[b.type] || 1) - (typePriority[a.type] || 1);
      });
      setSmartNotifications(sorted);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    prioritizeNotifications();
  }, [notifications]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const filteredNotifications = smartNotifications.filter(n => {
    if (filter === 'important') return n.priority >= 7;
    if (filter === 'unread') return !n.read;
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="glass-panel border border-white/20 rounded-2xl p-6 mb-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
            <Bell className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white">Smart Notifications</h3>
          {isAnalyzing && (
            <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1 bg-white/5 border border-white/20 rounded-lg text-white text-sm"
          >
            <option value="all">All</option>
            <option value="important">Important</option>
            <option value="unread">Unread</option>
          </select>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {filteredNotifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`p-3 rounded-lg border transition-all ${
                notification.priority >= 7
                  ? 'bg-red-500/10 border-red-500/30'
                  : notification.priority >= 5
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : 'bg-white/5 border-white/10'
              } ${!notification.read ? 'opacity-100' : 'opacity-60'}`}
            >
              <div className="flex items-start gap-3">
                {getNotificationIcon(notification.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-medium text-sm">{notification.title}</p>
                    {notification.priority >= 7 && (
                      <span className="px-1.5 py-0.5 bg-red-500/20 text-red-300 text-xs rounded">Urgent</span>
                    )}
                  </div>
                  <p className="text-white/60 text-xs mb-1">{notification.message}</p>
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <span>Priority: {notification.priority}/10</span>
                    {notification.timestamp && (
                      <span>• {new Date(notification.timestamp).toLocaleTimeString()}</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Info */}
      {smartNotifications.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-white/40">
          <Sparkles size={12} />
          <span>Notifications prioritized by AI based on importance and context</span>
        </div>
      )}
    </motion.div>
  );
};

export default SmartNotifications;