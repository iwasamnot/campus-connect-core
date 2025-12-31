import { useState, useMemo } from 'react';
import { Search, X, Filter, Calendar, User, MessageSquare, FileText } from 'lucide-react';
import { debounce } from '../utils/debounce';

const AdvancedSearch = ({ messages = [], users = [], onSelectMessage, onClose }) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    user: '',
    dateFrom: '',
    dateTo: '',
    hasFiles: false,
    hasReactions: false,
    isPinned: false,
  });
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((value) => {
      // Search is handled by filteredResults
    }, 300),
    []
  );

  const handleQueryChange = (value) => {
    setQuery(value);
    debouncedSearch(value);
  };

  // Filter messages based on query and filters
  const filteredResults = useMemo(() => {
    let results = messages;

    // Text search
    if (query.trim()) {
      const searchLower = query.toLowerCase();
      results = results.filter(msg => {
        const text = (msg.text || msg.displayText || '').toLowerCase();
        const userName = (msg.userName || '').toLowerCase();
        return text.includes(searchLower) || userName.includes(searchLower);
      });
    }

    // User filter
    if (filters.user) {
      results = results.filter(msg => msg.userId === filters.user);
    }

    // Date filters
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      results = results.filter(msg => {
        const msgDate = msg.timestamp?.toDate?.() || new Date(msg.timestamp);
        return msgDate >= fromDate;
      });
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      results = results.filter(msg => {
        const msgDate = msg.timestamp?.toDate?.() || new Date(msg.timestamp);
        return msgDate <= toDate;
      });
    }

    // File filter
    if (filters.hasFiles) {
      results = results.filter(msg => msg.fileUrl || msg.fileName);
    }

    // Reactions filter
    if (filters.hasReactions) {
      results = results.filter(msg => msg.reactions && Object.keys(msg.reactions).length > 0);
    }

    // Pinned filter
    if (filters.isPinned) {
      results = results.filter(msg => msg.pinned === true);
    }

    // Sort by timestamp (newest first)
    return results.sort((a, b) => {
      const aTime = a.timestamp?.toDate?.() || new Date(a.timestamp || 0);
      const bTime = b.timestamp?.toDate?.() || new Date(b.timestamp || 0);
      return bTime - aTime;
    });
  }, [messages, query, filters]);

  const clearFilters = () => {
    setQuery('');
    setFilters({
      user: '',
      dateFrom: '',
      dateTo: '',
      hasFiles: false,
      hasReactions: false,
      isPinned: false,
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Search className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Advanced Search
            </h2>
            {filteredResults.length > 0 && (
              <span className="px-2 py-1 text-sm bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full">
                {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
              title="Toggle filters"
            >
              <Filter className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search messages, users, or content..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* User Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <User className="w-4 h-4 inline mr-1" />
                  User
                </label>
                <select
                  value={filters.user}
                  onChange={(e) => setFilters({ ...filters, user: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">All Users</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  From Date
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  To Date
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={filters.hasFiles}
                    onChange={(e) => setFilters({ ...filters, hasFiles: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  <FileText className="w-4 h-4" />
                  Has Files
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={filters.hasReactions}
                    onChange={(e) => setFilters({ ...filters, hasReactions: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  <MessageSquare className="w-4 h-4" />
                  Has Reactions
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={filters.isPinned}
                    onChange={(e) => setFilters({ ...filters, isPinned: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  Pinned Only
                </label>
              </div>
            </div>
            {(filters.user || filters.dateFrom || filters.dateTo || filters.hasFiles || filters.hasReactions || filters.isPinned) && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredResults.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {query || Object.values(filters).some(v => v) 
                  ? 'No messages found matching your search criteria.'
                  : 'Start typing to search messages...'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredResults.map((message) => (
                <div
                  key={message.id}
                  onClick={() => {
                    if (onSelectMessage) onSelectMessage(message);
                    onClose();
                  }}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {message.userName || 'Unknown User'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(message.timestamp)}
                      </span>
                    </div>
                    {message.pinned && (
                      <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
                        Pinned
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 line-clamp-2">
                    {message.text || message.displayText || ''}
                  </p>
                  {message.fileName && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
                      <FileText className="w-4 h-4" />
                      {message.fileName}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearch;

