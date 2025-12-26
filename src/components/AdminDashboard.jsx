import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Ban, AlertTriangle, Trash2, Filter } from 'lucide-react';

const AdminDashboard = () => {
  const [allMessages, setAllMessages] = useState([]);
  const [showOnlyToxic, setShowOnlyToxic] = useState(true);
  const [banning, setBanning] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // Fetch all messages
  useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllMessages(messagesData);
    });

    return () => unsubscribe();
  }, []);

  // Filter messages based on showOnlyToxic
  const toxicMessages = showOnlyToxic 
    ? allMessages.filter(msg => msg.toxic === true)
    : allMessages;

  const handleBanUser = async (messageId, userId) => {
    if (!confirm('Are you sure you want to ban this user?')) return;

    setBanning(messageId);
    try {
      // In a real app, you'd have a 'users' collection to update
      // For now, we'll just mark the message as 'userBanned: true'
      await updateDoc(doc(db, 'messages', messageId), {
        userBanned: true,
        bannedAt: new Date().toISOString()
      });
      alert('User has been banned.');
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Failed to ban user. Please try again.');
    } finally {
      setBanning(null);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) return;

    setDeleting(messageId);
    try {
      await deleteDoc(doc(db, 'messages', messageId));
      alert('Message has been deleted.');
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message. Please try again.');
    } finally {
      setDeleting(null);
    }
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
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Audit Logs</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {showOnlyToxic 
                ? 'Review and manage toxic messages flagged by AI'
                : 'View and manage all messages'}
            </p>
          </div>
          <button
            onClick={() => setShowOnlyToxic(!showOnlyToxic)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Filter size={18} />
            <span>{showOnlyToxic ? 'Show All Messages' : 'Show Only Toxic'}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {toxicMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <AlertTriangle className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={48} />
              <p className="text-gray-400 dark:text-gray-500 text-lg">
                {showOnlyToxic ? 'No toxic messages found' : 'No messages found'}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                {showOnlyToxic ? 'All messages are clean!' : 'Start the conversation!'}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Original Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Display Text
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {toxicMessages.map((message) => (
                  <tr key={message.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatTimestamp(message.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      <div className="font-mono text-xs">
                        {message.userEmail || message.userName || message.userId?.substring(0, 12)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-xs">
                      <div className="truncate" title={message.text}>
                        {message.text}
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm font-semibold ${
                      message.toxic ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {message.displayText || message.text}
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
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 w-fit">
                            Active
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleBanUser(message.id, message.userId)}
                          disabled={banning === message.id || message.userBanned}
                          className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                        >
                          <Ban size={14} />
                          <span>{message.userBanned ? 'Banned' : 'Ban'}</span>
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          disabled={deleting === message.id}
                          className="flex items-center gap-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
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
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

