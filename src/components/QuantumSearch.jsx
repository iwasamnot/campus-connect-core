/**
 * Quantum Search - Multiple parallel search results
 * Shows multiple search results simultaneously like quantum superposition
 * v16.0.0 Futuristic Feature
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Zap, Layers, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const QuantumSearch = ({ messages = [], onResultSelect, onClose }) => {
  const { user } = useAuth();
  const { success } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState('superposition'); // superposition, parallel, quantum

  // Quantum search - searches multiple dimensions simultaneously
  const performQuantumSearch = () => {
    if (!query.trim() || messages.length === 0) return;

    setIsSearching(true);
    
    // Simulate quantum search with multiple parallel results
    setTimeout(() => {
      const queryLower = query.toLowerCase();
      
      // Search dimension 1: Text content
      const textResults = messages
        .filter(m => (m.text || '').toLowerCase().includes(queryLower))
        .slice(0, 3)
        .map(m => ({
          id: m.id || Date.now(),
          message: m,
          dimension: 'text',
          relevance: 0.9,
          type: 'Content Match'
        }));

      // Search dimension 2: Sender
      const senderResults = messages
        .filter(m => (m.senderName || '').toLowerCase().includes(queryLower))
        .slice(0, 2)
        .map(m => ({
          id: m.id + '-sender',
          message: m,
          dimension: 'sender',
          relevance: 0.7,
          type: 'Sender Match'
        }));

      // Search dimension 3: Time-based (recent)
      const timeResults = messages
        .filter(m => {
          const text = (m.text || '').toLowerCase();
          return text.includes(queryLower.split(' ')[0]) && 
                 Date.now() - (m.timestamp?.toMillis?.() || Date.now()) < 86400000;
        })
        .slice(0, 2)
        .map(m => ({
          id: m.id + '-time',
          message: m,
          dimension: 'time',
          relevance: 0.6,
          type: 'Recent Match'
        }));

      // Search dimension 4: Semantic (keyword variations)
      const keywords = queryLower.split(' ').filter(w => w.length > 3);
      const semanticResults = messages
        .filter(m => {
          const text = (m.text || '').toLowerCase();
          return keywords.some(kw => text.includes(kw));
        })
        .slice(0, 2)
        .map(m => ({
          id: m.id + '-semantic',
          message: m,
          dimension: 'semantic',
          relevance: 0.5,
          type: 'Semantic Match'
        }));

      // Combine all dimensions (quantum superposition)
      const allResults = [...textResults, ...senderResults, ...timeResults, ...semanticResults];
      
      // Remove duplicates and sort by relevance
      const uniqueResults = allResults.reduce((acc, result) => {
        const existing = acc.find(r => r.message.id === result.message.id && r.dimension === result.dimension);
        if (!existing) {
          acc.push(result);
        }
        return acc;
      }, []).sort((a, b) => b.relevance - a.relevance).slice(0, 10);

      setResults(uniqueResults);
      setIsSearching(false);
      success(`Found ${uniqueResults.length} results across multiple dimensions`);
    }, 800); // Simulate quantum computation time
  };

  const handleResultClick = (result) => {
    if (onResultSelect) {
      onResultSelect(result.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="relative w-full max-w-4xl max-h-[90vh] glass-panel border border-white/20 rounded-3xl p-6 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Quantum Search</h2>
              <p className="text-white/60 text-sm">Multiple parallel dimensions, one result</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && performQuantumSearch()}
            placeholder="Search across multiple dimensions..."
            className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
          />
          <button
            onClick={performQuantumSearch}
            disabled={isSearching || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all"
          >
            {isSearching ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Search size={20} />
            )}
          </button>
        </div>

        {/* Results Grid - Quantum Superposition View */}
        <div className="flex-1 overflow-y-auto">
          {results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {results.map((result, idx) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleResultClick(result)}
                    className="relative group cursor-pointer"
                  >
                    <div className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 hover:border-cyan-500/50 transition-all">
                      {/* Dimension Badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                          result.dimension === 'text' ? 'bg-cyan-500/20 text-cyan-300' :
                          result.dimension === 'sender' ? 'bg-purple-500/20 text-purple-300' :
                          result.dimension === 'time' ? 'bg-green-500/20 text-green-300' :
                          'bg-pink-500/20 text-pink-300'
                        }`}>
                          {result.type}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-white/40">
                          <Sparkles size={12} />
                          {Math.round(result.relevance * 100)}%
                        </div>
                      </div>

                      {/* Message Preview */}
                      <p className="text-white/90 line-clamp-3 mb-2">
                        {result.message.text || 'No text'}
                      </p>

                      {/* Metadata */}
                      <div className="flex items-center justify-between text-xs text-white/40">
                        <span>{result.message.senderName || 'Unknown'}</span>
                        {result.message.timestamp && (
                          <span>
                            {new Date(result.message.timestamp.toMillis?.() || result.message.timestamp).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Quantum effect overlay */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/0 via-cyan-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-12">
              <Layers className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/40">
                {isSearching 
                  ? 'Searching across multiple dimensions...'
                  : 'Enter a query to search across multiple parallel dimensions'}
              </p>
            </div>
          )}
        </div>

        {/* Info */}
        {results.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-white/40">
            <Zap size={12} />
            <span>Searching across {results.length} quantum states simultaneously</span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default QuantumSearch;