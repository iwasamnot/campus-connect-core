import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  addDoc,
  serverTimestamp,
  getDocs,
  getDoc,
  limit
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Ban, AlertTriangle, Trash2, Filter, Download, Search, Calendar, User, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import Logo from './Logo';

const AdminDashboard = () => {
  const { user, userRole } = useAuth();
  const { success, error: showError } = useToast();
  const [allMessages, setAllMessages] = useState([]);
  const [reports, setReports] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [showOnlyToxic, setShowOnlyToxic] = useState(false);
  const [banning, setBanning] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterUser, setFilterUser] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showReports, setShowReports] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deletedMessageIds, setDeletedMessageIds] = useState(new Set()); // Track deleted messages
  const messagesPerPage = 50;

  // Log audit action
  const logAuditAction = async (action, details) => {
    try {
      await addDoc(collection(db, 'auditLogs'), {
        action,
        details,
        performedBy: user.uid,
        performedByEmail: user.email,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  };

  // Fetch all messages with error handling (limited to prevent quota exhaustion)
  useEffect(() => {
    let mounted = true;
    
    const q = query(
      collection(db, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(100) // Limit to 100 most recent messages to prevent quota exhaustion
    );

    const unsubscribe = onSnapshot(
      q, 
      {
        includeMetadataChanges: false // Don't include metadata changes to reduce noise
      },
      (snapshot) => {
        if (!mounted) return;
        
        try {
          // Handle document changes properly (including deletions)
          // snapshot.docs only contains existing documents, so deleted ones are automatically excluded
          const messagesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Filter out any null or undefined messages (shouldn't happen, but safety check)
          // Also filter out messages we know were deleted (defense in depth)
          const validMessages = messagesData.filter(msg => 
            msg && 
            msg.id && 
            !deletedMessageIds.has(msg.id) // Exclude deleted messages
          );
          
          console.log('AdminDashboard: Received snapshot with', validMessages.length, 'messages');
          console.log('AdminDashboard: Snapshot metadata:', {
            hasPendingWrites: snapshot.metadata.hasPendingWrites,
            fromCache: snapshot.metadata.fromCache,
            deletedCount: deletedMessageIds.size
          });
          
          // Always update with server snapshots, but filter cache snapshots if we have deleted messages
          if (!snapshot.metadata.fromCache) {
            // Server snapshot - always trust it
            setAllMessages(validMessages);
          } else if (deletedMessageIds.size === 0) {
            // Cache snapshot but no deleted messages - safe to use
            setAllMessages(validMessages);
          } else {
            // Cache snapshot with deleted messages - filter them out
            console.log('AdminDashboard: Filtering cache snapshot to exclude', deletedMessageIds.size, 'deleted messages');
            setAllMessages(validMessages);
          }
          setLoading(false);
        } catch (error) {
          console.error('Error processing messages:', error);
          showError('Error loading messages. Please refresh the page.');
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error fetching messages:', error);
        let errorMessage = 'Failed to load messages. Please check your connection and refresh.';
        
        if (error.code === 'resource-exhausted') {
          errorMessage = 'Firestore quota exceeded. Please try again later or contact support.';
        } else if (error.code === 'unavailable') {
          errorMessage = 'Firestore service is temporarily unavailable. Please try again later.';
        }
        
        showError(errorMessage);
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [deletedMessageIds]); // Include deletedMessageIds to filter them out

  // Fetch reports with error handling (limited to prevent quota exhaustion)
  useEffect(() => {
    let mounted = true;
    
    const q = query(
      collection(db, 'reports'),
      orderBy('timestamp', 'desc'),
      limit(50) // Limit to 50 most recent reports
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!mounted) return;
        
        try {
          const reportsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setReports(reportsData);
        } catch (error) {
          console.error('Error processing reports:', error);
        }
      },
      (error) => {
        console.error('Error fetching reports:', error);
        if (error.code === 'resource-exhausted') {
          console.warn('Firestore quota exceeded. Reports may not load.');
        }
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Fetch audit logs with error handling (limited to prevent quota exhaustion)
  useEffect(() => {
    let mounted = true;
    
    const q = query(
      collection(db, 'auditLogs'),
      orderBy('timestamp', 'desc'),
      limit(50) // Limit to 50 most recent audit logs
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!mounted) return;
        
        try {
          const logsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setAuditLogs(logsData);
        } catch (error) {
          console.error('Error processing audit logs:', error);
        }
      },
      (error) => {
        console.error('Error fetching audit logs:', error);
        if (error.code === 'resource-exhausted') {
          console.warn('Firestore quota exceeded. Audit logs may not load.');
        }
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Filter and sort messages (memoized for performance)
  const filteredMessages = useMemo(() => {
    if (!allMessages || allMessages.length === 0) return [];
    
    let filtered = [...allMessages];

    // Filter by toxic status
    if (showOnlyToxic) {
      filtered = filtered.filter(msg => msg.toxic === true);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(msg => 
        msg.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by user
    if (filterUser) {
      filtered = filtered.filter(msg => 
        msg.userEmail?.toLowerCase().includes(filterUser.toLowerCase()) ||
        msg.userName?.toLowerCase().includes(filterUser.toLowerCase())
      );
    }

    // Filter by date
    if (filterDate) {
      const filterDateObj = new Date(filterDate);
      filtered = filtered.filter(msg => {
        const msgDate = msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp);
        return msgDate.toDateString() === filterDateObj.toDateString();
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'timestamp':
          aValue = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || 0);
          bValue = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp || 0);
          break;
        case 'user':
          aValue = a.userName || a.userEmail || '';
          bValue = b.userName || b.userEmail || '';
          break;
        case 'text':
          aValue = a.text || '';
          bValue = b.text || '';
          break;
        default:
          return 0;
      }

      if (sortBy === 'timestamp') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      } else {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
    });

    return filtered;
  }, [allMessages, showOnlyToxic, searchQuery, filterUser, filterDate, sortBy, sortOrder]);
  const totalPages = Math.ceil(filteredMessages.length / messagesPerPage);
  const paginatedMessages = filteredMessages.slice(
    (currentPage - 1) * messagesPerPage,
    currentPage * messagesPerPage
  );

  const handleBanUser = async (messageId, userId, userEmail) => {
    if (!confirm('Are you sure you want to ban this user?')) return;

    setBanning(messageId);
    try {
      await updateDoc(doc(db, 'messages', messageId), {
        userBanned: true,
        bannedAt: serverTimestamp()
      });

      await logAuditAction('ban_user', {
        messageId,
        userId,
        userEmail
      });

      success('User has been banned.');
    } catch (error) {
      console.error('Error banning user:', error);
      showError('Failed to ban user. Please try again.');
    } finally {
      setBanning(null);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) return;

    setDeleting(messageId);
    try {
      const message = allMessages.find(m => m.id === messageId);
      if (!message) {
        showError('Message not found in current view.');
        setDeleting(null);
        return;
      }

      const messageRef = doc(db, 'messages', messageId);
      
      // Verify message exists before deleting
      const messageSnap = await getDoc(messageRef);
      if (!messageSnap.exists()) {
        showError('Message not found. It may have already been deleted.');
        setDeleting(null);
        return;
      }

      console.log('AdminDashboard: Deleting message:', {
        messageId,
        userId: message.userId,
        isAI: message.isAI,
        currentUser: user.uid,
        userEmail: user.email
      });

      // Add to deleted set immediately to prevent it from reappearing
      setDeletedMessageIds(prev => new Set([...prev, messageId]));
      
      // Delete the message from Firestore
      await deleteDoc(messageRef);
      console.log('AdminDashboard: Message deleted from Firestore successfully');

      // Optimistically remove message from local state after successful deletion
      setAllMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== messageId);
        console.log('AdminDashboard: Message removed from local state. Remaining messages:', filtered.length);
        return filtered;
      });

      // Verify deletion by checking if document still exists (with retry logic)
      let verifySnap;
      let retries = 0;
      const maxRetries = 3;
      
      while (retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for Firestore to process
        verifySnap = await getDoc(messageRef);
        
        if (!verifySnap.exists()) {
          console.log('AdminDashboard: Deletion verified - message no longer exists in Firestore');
          break;
        }
        
        retries++;
        console.log(`AdminDashboard: Deletion verification attempt ${retries}/${maxRetries} - message still exists`);
      }
      
      if (verifySnap && verifySnap.exists()) {
        console.error('AdminDashboard: Message still exists after deletion after', maxRetries, 'retries!');
        // Remove from deleted set since deletion failed
        setDeletedMessageIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(messageId);
          return newSet;
        });
        // Re-add message to state if deletion failed
        setAllMessages(prev => {
          if (!prev.find(m => m.id === messageId)) {
            return [...prev, message];
          }
          return prev;
        });
        showError('Failed to delete message. It may have been recreated or permission was denied. Please check your admin permissions in Firestore.');
        setDeleting(null);
        return;
      }
      
      // Deletion successful - keep it in deleted set permanently (until page refresh)
      console.log('AdminDashboard: Message deletion confirmed and tracked');

      // Log audit action
      try {
        await logAuditAction('delete_message', {
          messageId,
          messageText: message?.text,
          userId: message?.userId,
          userEmail: message?.userEmail,
          isAI: message?.isAI || message?.userId === 'virtual-senior'
        });
      } catch (auditError) {
        console.error('Error logging audit action:', auditError);
        // Don't fail the deletion if audit logging fails
      }

      success('Message has been deleted.');
    } catch (error) {
      console.error('Error deleting message:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      // Remove from deleted set since deletion failed
      setDeletedMessageIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
      
      // Re-add message to state if it was optimistically removed
      setAllMessages(prev => {
        if (!prev.find(m => m.id === messageId)) {
          return [...prev, message];
        }
        return prev;
      });
      
      let errorMessage = 'Failed to delete message. Please try again.';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. You may not have permission to delete this message. Please check your admin role in Firestore. The user document must have role: "admin" or "admin1".';
      } else if (error.code === 'not-found') {
        errorMessage = 'Message not found. It may have already been deleted.';
      } else if (error.code === 'resource-exhausted') {
        errorMessage = 'Firestore quota exceeded. Please try again later or contact support.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Firestore service is temporarily unavailable. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showError(errorMessage);
    } finally {
      setDeleting(null);
    }
  };

  const handleResolveReport = async (reportId, status) => {
    try {
      const reportRef = doc(db, 'reports', reportId);
      await updateDoc(reportRef, {
        status,
        resolvedAt: serverTimestamp(),
        resolvedBy: user.uid,
        resolvedByEmail: user.email
      });

      await logAuditAction('resolve_report', {
        reportId,
        status
      });

      success(`Report ${status === 'resolved' ? 'resolved' : 'dismissed'}.`);
    } catch (error) {
      console.error('Error resolving report:', error);
      const errorMessage = error.code === 'permission-denied'
        ? 'Permission denied. You may not have permission to resolve this report.'
        : error.message || 'Failed to resolve report. Please try again.';
      showError(errorMessage);
    }
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'User', 'Email', 'Message', 'Toxic', 'Banned', 'Edited'];
    const rows = filteredMessages.map(msg => [
      msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleString() : 'N/A',
      msg.userName || 'N/A',
      msg.userEmail || 'N/A',
      msg.text || 'N/A',
      msg.toxic ? 'Yes' : 'No',
      msg.userBanned ? 'Yes' : 'No',
      msg.edited ? 'Yes' : 'No'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    success('Audit logs exported successfully.');
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleString();
    }
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-3 md:py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-3 md:mb-4">
          <div className="flex items-center gap-2 md:gap-3">
            <Logo size="small" showText={false} />
            <div>
              <h2 className="text-lg md:text-2xl font-bold text-black dark:text-white">Admin Dashboard</h2>
              <p className="text-xs md:text-sm text-black dark:text-white opacity-70">
                Manage messages, reports, and audit logs
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowReports(!showReports)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <AlertTriangle size={18} />
              <span className="hidden sm:inline">Reports</span>
              <span className="sm:hidden">({reports.filter(r => r.status === 'pending').length})</span>
              <span className="hidden sm:inline">({reports.filter(r => r.status === 'pending').length})</span>
            </button>
            <button
              onClick={() => setShowAuditLogs(!showAuditLogs)}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm"
            >
              <FileText size={18} />
              <span className="hidden sm:inline">Audit Logs</span>
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              placeholder="Filter by user..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowOnlyToxic(!showOnlyToxic)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                showOnlyToxic
                  ? 'bg-red-600 text-white shadow-md scale-105'
                  : 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <Filter size={18} />
              <span>Toxic Only</span>
            </button>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-4 mt-4">
          <label className="text-sm text-black dark:text-white">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="timestamp">Timestamp</option>
            <option value="user">User</option>
            <option value="text">Message</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            {sortOrder === 'asc' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          <span className="text-sm text-black dark:text-white opacity-70">
            Showing {paginatedMessages.length} of {filteredMessages.length} messages
          </span>
        </div>
      </div>

      {/* Reports Panel */}
      {showReports && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-200 dark:border-indigo-800 px-6 py-4 max-h-64 overflow-y-auto">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Pending Reports ({reports.filter(r => r.status === 'pending').length})</h3>
          <div className="space-y-2">
            {reports.filter(r => r.status === 'pending').map(report => (
              <div key={report.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-black dark:text-white">Reported by: {report.reportedByEmail}</p>
                    <p className="text-xs text-black dark:text-white opacity-80 mt-1">Reason: {report.reason}</p>
                    <p className="text-xs text-black dark:text-white opacity-70 mt-1">{formatTimestamp(report.timestamp)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResolveReport(report.id, 'resolved')}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => handleResolveReport(report.id, 'dismissed')}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {reports.filter(r => r.status === 'pending').length === 0 && (
              <p className="text-sm text-black dark:text-white opacity-70">No pending reports</p>
            )}
          </div>
        </div>
      )}

      {/* Audit Logs Panel */}
      {showAuditLogs && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-200 dark:border-indigo-800 px-6 py-4 max-h-64 overflow-y-auto">
          <h3 className="font-semibold text-black dark:text-white mb-2">Recent Audit Logs ({auditLogs.length})</h3>
          <div className="space-y-2">
            {auditLogs.slice(0, 10).map(log => (
              <div key={log.id} className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-indigo-200 dark:border-indigo-800 text-xs text-black dark:text-white">
                <span className="font-medium">{log.action}</span> by {log.performedByEmail} - {formatTimestamp(log.timestamp)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-y-auto px-3 md:px-6 py-3 md:py-4 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-black dark:text-white opacity-70 text-lg">Loading messages...</p>
            </div>
          </div>
        ) : paginatedMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <AlertTriangle className="mx-auto text-black dark:text-white opacity-50 mb-4" size={48} />
              <p className="text-black dark:text-white opacity-70 text-lg">No messages found</p>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black dark:text-white opacity-70 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black dark:text-white opacity-70 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black dark:text-white opacity-70 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black dark:text-white opacity-70 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black dark:text-white opacity-70 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedMessages.map((message) => (
                    <tr key={message.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-white opacity-70">
                        {formatTimestamp(message.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-white">
                        <div className="font-mono text-xs">
                          {message.userEmail || message.userName || message.userId?.substring(0, 12)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-xs">
                        <div className="truncate" title={message.text}>
                          {message.text}
                        </div>
                        {message.edited && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 italic">(edited)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {message.toxic && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 w-fit">
                              Toxic
                            </span>
                          )}
                          {message.userBanned ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 w-fit">
                              Banned
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 w-fit">
                              Active
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleBanUser(message.id, message.userId, message.userEmail)}
                            disabled={banning === message.id || message.userBanned}
                            className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                          >
                            <Ban size={14} />
                            <span>{message.userBanned ? 'Banned' : 'Ban'}</span>
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            disabled={deleting === message.id}
                            className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                          >
                            <Trash2 size={14} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-indigo-200 dark:bg-indigo-700 text-black dark:text-white border-2 border-indigo-300 dark:border-indigo-600 rounded-lg hover:bg-indigo-300 dark:hover:bg-indigo-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Previous
                </button>
                <span className="text-sm text-black dark:text-white font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-indigo-200 dark:bg-indigo-700 text-black dark:text-white border-2 border-indigo-300 dark:border-indigo-600 rounded-lg hover:bg-indigo-300 dark:hover:bg-indigo-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
