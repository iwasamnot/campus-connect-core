import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Globe, Database, Settings, TrendingUp, BookOpen, Zap, RefreshCw, Plus, Search, Filter, Trash2 } from 'lucide-react';
import { getAdvancedRAG } from '../utils/advancedRAGSystem';
import { getKnowledgeManager } from '../utils/knowledgeManager';
import { getWebLearning, learnFromText } from '../utils/webLearningModule';

const RAGManager = ({ userId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [learningStats, setLearningStats] = useState(null);
  const [autoLearningEnabled, setAutoLearningEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [learningUrl, setLearningUrl] = useState('');
  const [learningTopic, setLearningTopic] = useState('');
  const [learningText, setLearningText] = useState('');
  const [newKnowledge, setNewKnowledge] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('academic');
  const [categories, setCategories] = useState([]);
  const [notification, setNotification] = useState(null);

  const rag = getAdvancedRAG();
  const knowledgeManager = getKnowledgeManager();
  const webLearner = getWebLearning();

  useEffect(() => {
    loadStats();
    loadCategories();
  }, []);

  const loadStats = async () => {
    try {
      const ragStats = rag.getStats();
      const knowledgeStats = await knowledgeManager.getStats();
      const webStats = webLearner.getStats();
      const learningStats = rag.getLearningStats();

      setStats({
        rag: ragStats,
        knowledge: knowledgeStats,
        web: webStats
      });
      
      setLearningStats(learningStats);
      setAutoLearningEnabled(ragStats.autoLearningEnabled);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadCategories = async () => {
    try {
      await knowledgeManager.initializeCategories();
      setCategories(Array.from(knowledgeManager.categories.entries()));
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleAutoLearningToggle = async () => {
    try {
      rag.setAutoLearning(!autoLearningEnabled);
      setAutoLearningEnabled(!autoLearningEnabled);
      showNotification(`Auto-learning ${!autoLearningEnabled ? 'enabled' : 'disabled'}`, 'success');
      loadStats();
    } catch (error) {
      console.error('Error toggling auto-learning:', error);
      showNotification('Failed to toggle auto-learning', 'error');
    }
  };

  const handleLearnFromText = async () => {
    if (!learningText.trim()) return;

    setLoading(true);
    try {
      const result = await learnFromText(
        learningText,
        learningTopic || 'general',
        'manual'
      );
      
      if (result) {
        showNotification(`Successfully learned from text: ${result.pointsAdded} points added`, 'success');
        setLearningText('');
        setLearningTopic('');
        loadStats();
      } else {
        showNotification('Failed to learn from text', 'error');
      }
    } catch (error) {
      console.error('Text learning error:', error);
      showNotification('Text learning failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const results = await knowledgeManager.searchKnowledge(searchQuery, null, 20);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      showNotification('Search failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLearnFromUrl = async () => {
    if (!learningUrl.trim()) return;

    setLoading(true);
    try {
      const result = await webLearner.learnFromUrl(learningUrl, { 
        topic: learningTopic || 'general' 
      });
      
      if (result) {
        showNotification(`Successfully learned from ${result.title}`, 'success');
        setLearningUrl('');
        setLearningTopic('');
        loadStats();
      } else {
        showNotification('Failed to learn from URL', 'error');
      }
    } catch (error) {
      console.error('Learning error:', error);
      showNotification('Learning failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddKnowledge = async () => {
    if (!newKnowledge.trim()) return;

    setLoading(true);
    try {
      const id = await knowledgeManager.addKnowledge(
        newKnowledge,
        'manual',
        selectedCategory
      );
      
      if (id) {
        showNotification('Knowledge added successfully', 'success');
        setNewKnowledge('');
        loadStats();
      } else {
        showNotification('Failed to add knowledge', 'error');
      }
    } catch (error) {
      console.error('Add knowledge error:', error);
      showNotification('Failed to add knowledge', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFromWeb = async () => {
    setLoading(true);
    try {
      const results = await knowledgeManager.updateFromWeb();
      showNotification(`Updated from ${results.length} web sources`, 'success');
      loadStats();
    } catch (error) {
      console.error('Update error:', error);
      showNotification('Update failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    setLoading(true);
    try {
      const deletedCount = await knowledgeManager.cleanupKnowledge();
      showNotification(`Cleaned up ${deletedCount} outdated items`, 'success');
      loadStats();
    } catch (error) {
      console.error('Cleanup error:', error);
      showNotification('Cleanup failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 rounded-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <Brain className="w-8 h-8 text-indigo-400" />
            <span className="text-2xl font-bold text-white">{stats?.rag?.vectorStoreSize || 0}</span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">Vector Store</h3>
          <p className="text-sm text-gray-400">Knowledge items stored</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6 rounded-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <Database className="w-8 h-8 text-green-400" />
            <span className="text-2xl font-bold text-white">{stats?.knowledge?.totalKnowledge || 0}</span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">Knowledge Base</h3>
          <p className="text-sm text-gray-400">Total knowledge items</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-6 rounded-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <Globe className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold text-white">{stats?.web?.sourcesLearned || 0}</span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">Web Sources</h3>
          <p className="text-sm text-gray-400">Websites learned from</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-6 rounded-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <Zap className={`w-8 h-8 ${autoLearningEnabled ? 'text-yellow-400' : 'text-gray-400'}`} />
            <span className="text-2xl font-bold text-white">{learningStats?.conversationsLearned || 0}</span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">Auto-Learned</h3>
          <p className="text-sm text-gray-400">From conversations</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-6 rounded-xl"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
            <TrendingUp className="w-5 h-5 mr-2 text-yellow-400" />
            Learning Statistics
            <button
              onClick={handleAutoLearningToggle}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                autoLearningEnabled 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              {autoLearningEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Conversations Learned</span>
              <span className="text-white">{learningStats?.conversationsLearned || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Web Searches Performed</span>
              <span className="text-white">{learningStats?.webSearchesPerformed || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Knowledge Items Added</span>
              <span className="text-white">{learningStats?.knowledgeItemsAdded || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Last Activity</span>
              <span className="text-white">{learningStats?.lastLearningActivityFormatted || 'Never'}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-panel p-6 rounded-xl"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-purple-400" />
            Categories
          </h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {categories.map(([id, cat]) => (
              <div key={id} className="flex justify-between text-sm">
                <span className="text-gray-400">{cat.name}</span>
                <span className="text-white">{stats?.knowledge?.byCategory?.[id] || 0}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );

  const renderLearning = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 rounded-xl"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Globe className="w-5 h-5 mr-2 text-blue-400" />
          Learn from Web
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              URL to Learn From
            </label>
            <input
              type="url"
              value={learningUrl}
              onChange={(e) => setLearningUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Topic (Optional)
            </label>
            <input
              type="text"
              value={learningTopic}
              onChange={(e) => setLearningTopic(e.target.value)}
              placeholder="e.g., machine learning, history, etc."
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={handleLearnFromUrl}
            disabled={loading || !learningUrl.trim()}
            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            Learn from URL
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel p-6 rounded-xl"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <BookOpen className="w-5 h-5 mr-2 text-green-400" />
          Learn from Text
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Text Content
            </label>
            <textarea
              value={learningText}
              onChange={(e) => setLearningText(e.target.value)}
              placeholder="Paste any text, article, or document to learn from..."
              rows={6}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Topic (Optional)
            </label>
            <input
              type="text"
              value={learningTopic}
              onChange={(e) => setLearningTopic(e.target.value)}
              placeholder="e.g., science, technology, etc."
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={handleLearnFromText}
            disabled={loading || !learningText.trim()}
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Learn from Text
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel p-6 rounded-xl"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Plus className="w-5 h-5 mr-2 text-purple-400" />
          Add Knowledge Manually
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Knowledge Content
            </label>
            <textarea
              value={newKnowledge}
              onChange={(e) => setNewKnowledge(e.target.value)}
              placeholder="Enter important information to remember..."
              rows={4}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map(([id, cat]) => (
                <option key={id} value={id} className="bg-gray-800">
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAddKnowledge}
            disabled={loading || !newKnowledge.trim()}
            className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Add Knowledge
          </button>
        </div>
      </motion.div>
    </div>
  );

  const renderSearch = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 rounded-xl"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Search className="w-5 h-5 mr-2 text-purple-400" />
          Search Knowledge Base
        </h3>
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search for knowledge..."
              className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim()}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Search
            </button>
          </div>
        </div>
      </motion.div>

      {searchResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 rounded-xl"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Search Results</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {searchResults.map((result, index) => (
              <div key={index} className="p-3 bg-white/5 rounded-lg border border-white/10">
                <p className="text-sm text-gray-300 mb-2">{result.text}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Similarity: {(result.similarity * 100).toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(result.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 rounded-xl"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2 text-gray-400" />
          Knowledge Management
        </h3>
        <div className="space-y-4">
          <button
            onClick={handleUpdateFromWeb}
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Update from Web Sources
          </button>
          
          <button
            onClick={handleCleanup}
            disabled={loading}
            className="w-full py-2 px-4 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Clean Up Old Knowledge
          </button>

          <button
            onClick={loadStats}
            disabled={loading}
            className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh Statistics
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel p-6 rounded-xl"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Recent Web Sources</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {stats?.web?.recentSources?.map((source, index) => (
            <div key={index} className="p-2 bg-white/5 rounded text-sm">
              <p className="text-gray-300">{source.title}</p>
              <p className="text-gray-500 text-xs">{source.topic} • {source.pointsCount} points</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Brain },
    { id: 'learning', label: 'Learning', icon: Globe },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Advanced RAG System</h1>
        <p className="text-gray-400">Manage your AI's knowledge base and learning capabilities</p>
      </div>

      <div className="flex space-x-1 mb-6 bg-white/5 p-1 rounded-lg">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'learning' && renderLearning()}
          {activeTab === 'search' && renderSearch()}
          {activeTab === 'settings' && renderSettings()}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg ${
              notification.type === 'success' ? 'bg-green-600' :
              notification.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
            } text-white`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RAGManager;
