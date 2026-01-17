import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY?.trim() || '';

/**
 * GIF Picker Component
 * Search and select GIFs from Giphy
 */
const GifPicker = ({ onSelect, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const searchTimeoutRef = useRef(null);

  // Load trending GIFs on mount
  useEffect(() => {
    if (!GIPHY_API_KEY) {
      setError('Giphy API key not configured');
      return;
    }

    loadTrending();
  }, []);

  const loadTrending = async () => {
    if (!GIPHY_API_KEY) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`
      );
      const data = await response.json();
      if (data.data) {
        setTrending(data.data);
        setGifs(data.data);
      }
    } catch (err) {
      console.error('Error loading trending GIFs:', err);
      setError('Failed to load GIFs');
    } finally {
      setLoading(false);
    }
  };

  const searchGifs = async (query) => {
    if (!query.trim() || !GIPHY_API_KEY) {
      setGifs(trending);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=g`
      );
      const data = await response.json();
      if (data.data) {
        setGifs(data.data);
      }
    } catch (err) {
      console.error('Error searching GIFs:', err);
      setError('Failed to search GIFs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    
    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        searchGifs(value);
      } else {
        setGifs(trending);
      }
    }, 500);
  };

  const handleSelect = (gif) => {
    onSelect({
      url: gif.images.original.url,
      type: 'image/gif',
      name: gif.title || 'GIF',
      preview: gif.images.preview_gif.url,
      provider: 'giphy'
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="glass-panel border border-white/20 rounded-2xl p-4 max-w-md w-full"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Choose a GIF</h3>
        <button
          onClick={onClose}
          className="p-1 text-white/60 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {!GIPHY_API_KEY && (
        <div className="p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg mb-4">
          <p className="text-sm text-yellow-400">
            Giphy API key not configured. Add VITE_GIPHY_API_KEY to enable GIF support.
          </p>
        </div>
      )}

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search GIFs..."
          className="w-full pl-10 pr-4 py-2 glass-panel border border-white/10 rounded-lg bg-white/5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg mb-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="animate-spin text-indigo-400" size={24} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <AnimatePresence>
              {gifs.map((gif) => (
                <motion.button
                  key={gif.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect(gif)}
                  className="relative aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-indigo-500/50 transition-all"
                >
                  <img
                    src={gif.images.preview_gif.url}
                    alt={gif.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default GifPicker;
