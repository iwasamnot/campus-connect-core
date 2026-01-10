import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Filter, Calendar, User, MessageSquare, FileText } from 'lucide-react';
import { FadeIn } from './AnimatedComponents';
// Use window globals to avoid import/export issues
const debounce = typeof window !== 'undefined' && window.__debounce 
  ? window.__debounce 
  : (fn, delay) => fn; // Fallback: return function as-is

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <FadeIn delay={0.1}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="glass-panel shadow-2xl border border-white/10 rounded-[2rem] max-w-4xl w-full max-h-[90vh] flex flex-col backdrop-blur-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Fluid.so aesthetic */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 glass-panel border border-white/10 rounded-xl">
                <Search className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white text-glow">
                  Advanced Search
                </h2>
                <p className="text-sm text-white/60 mt-0.5">
                  Search messages, users, and content
                </p>
              </div>
              {filteredResults.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-3 py-1 text-sm glass-panel bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 rounded-full font-medium"
                >
                  {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
                </motion.span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => setShowFilters(!showFilters)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2.5 rounded-xl transition-all ${
                  showFilters
                    ? 'glass-panel bg-indigo-600/20 border border-indigo-500/50 text-indigo-300'
                    : 'glass-panel border border-white/10 text-white/70 hover:text-white hover:border-white/20'
                }`}
                title="Toggle filters"
              >
                <Filter className="w-5 h-5" />
              </motion.button>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.05, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                className="p-2.5 glass-panel border border-white/10 rounded-xl text-white/70 hover:text-white hover:border-white/20 transition-all"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Search Input - Fluid.so aesthetic */}
          <div className="p-6 border-b border-white/10">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-indigo-400 transition-colors" />
              <label htmlFor="advanced-search-query" className="sr-only">Search messages, users, or content</label>
              <input
                type="text"
                id="advanced-search-query"
                name="search-query"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Search messages, users, or content..."
                className="w-full pl-12 pr-10 py-3 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300 hover:border-white/20"
                autoFocus
              />
              {query && (
                <motion.button
                  onClick={() => setQuery('')}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>

          {/* Filters - Fluid.so aesthetic */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden border-b border-white/10 bg-white/5 backdrop-blur-sm"
              >
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* User Filter */}
                  <div>
                    <label htmlFor="search-filter-user" className="block text-sm font-semibold text-white/90 mb-2 flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-400" />
                      User
                    </label>
                    <select
                      id="search-filter-user"
                      name="filter-user"
                      value={filters.user}
                      onChange={(e) => setFilters({ ...filters, user: e.target.value })}
                      className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300 hover:border-white/20"
                    >
                      <option value="" className="bg-[#1a1a1a] text-white">All Users</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id} className="bg-[#1a1a1a] text-white">
                          {user.name || user.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date From */}
                  <div>
                    <label htmlFor="search-filter-date-from" className="block text-sm font-semibold text-white/90 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-400" />
                      From Date
                    </label>
                    <input
                      type="date"
                      id="search-filter-date-from"
                      name="filter-date-from"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                      className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300 hover:border-white/20 [color-scheme:dark]"
                    />
                  </div>

                  {/* Date To */}
                  <div>
                    <label htmlFor="search-filter-date-to" className="block text-sm font-semibold text-white/90 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-400" />
                      To Date
                    </label>
                    <input
                      type="date"
                      id="search-filter-date-to"
                      name="filter-date-to"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                      className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300 hover:border-white/20 [color-scheme:dark]"
                    />
                  </div>

                  {/* Checkboxes */}
                  <div className="space-y-3 md:col-span-2 lg:col-span-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <label htmlFor="search-filter-has-files" className="flex items-center gap-3 p-3 glass-panel border border-white/10 rounded-xl cursor-pointer hover:border-white/20 transition-all group">
                        <input
                          type="checkbox"
                          id="search-filter-has-files"
                          name="filter-has-files"
                          checked={filters.hasFiles}
                          onChange={(e) => setFilters({ ...filters, hasFiles: e.target.checked })}
                          className="rounded border-white/20 bg-white/5 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                        />
                        <FileText className="w-4 h-4 text-white/60 group-hover:text-indigo-400 transition-colors" />
                        <span className="text-sm text-white/80 font-medium">Has Files</span>
                      </label>
                      <label htmlFor="search-filter-has-reactions" className="flex items-center gap-3 p-3 glass-panel border border-white/10 rounded-xl cursor-pointer hover:border-white/20 transition-all group">
                        <input
                          type="checkbox"
                          id="search-filter-has-reactions"
                          name="filter-has-reactions"
                          checked={filters.hasReactions}
                          onChange={(e) => setFilters({ ...filters, hasReactions: e.target.checked })}
                          className="rounded border-white/20 bg-white/5 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                        />
                        <MessageSquare className="w-4 h-4 text-white/60 group-hover:text-indigo-400 transition-colors" />
                        <span className="text-sm text-white/80 font-medium">Has Reactions</span>
                      </label>
                      <label htmlFor="search-filter-is-pinned" className="flex items-center gap-3 p-3 glass-panel border border-white/10 rounded-xl cursor-pointer hover:border-white/20 transition-all group">
                        <input
                          type="checkbox"
                          id="search-filter-is-pinned"
                          name="filter-is-pinned"
                          checked={filters.isPinned}
                          onChange={(e) => setFilters({ ...filters, isPinned: e.target.checked })}
                          className="rounded border-white/20 bg-white/5 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                        />
                        <span className="text-sm text-white/80 font-medium">Pinned Only</span>
                      </label>
                    </div>
                    {(filters.user || filters.dateFrom || filters.dateTo || filters.hasFiles || filters.hasReactions || filters.isPinned) && (
                      <motion.button
                        onClick={clearFilters}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-4 py-2 text-sm text-indigo-300 hover:text-indigo-200 glass-panel border border-indigo-500/30 rounded-xl transition-all font-medium"
                      >
                        Clear All Filters
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results - Fluid.so aesthetic */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredResults.length === 0 ? (
              <div className="text-center py-12">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-block p-4 glass-panel border border-white/10 rounded-2xl mb-4"
                >
                  <Search className="w-12 h-12 text-white/40 mx-auto" />
                </motion.div>
                <p className="text-white/60 font-medium">
                  {query || Object.values(filters).some(v => v) 
                    ? 'No messages found matching your search criteria.'
                    : 'Start typing to search messages...'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredResults.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    whileHover={{ y: -2, scale: 1.01 }}
                    onClick={() => {
                      if (onSelectMessage) onSelectMessage(message);
                      onClose();
                    }}
                    className="p-4 glass-panel border border-white/10 rounded-xl hover:border-white/20 cursor-pointer transition-all group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                          {message.userName || 'Unknown User'}
                        </span>
                        <span className="text-xs text-white/50">
                          {formatDate(message.timestamp)}
                        </span>
                      </div>
                      {message.pinned && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="px-2 py-1 text-xs glass-panel bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 rounded-lg font-medium"
                        >
                          Pinned
                        </motion.span>
                      )}
                    </div>
                    <p className="text-white/70 line-clamp-2 group-hover:text-white/90 transition-colors">
                      {message.text || message.displayText || ''}
                    </p>
                    {message.fileName && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-indigo-400">
                        <FileText className="w-4 h-4" />
                        <span className="font-medium">{message.fileName}</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </FadeIn>
    </div>
  );
};

export default AdvancedSearch;
