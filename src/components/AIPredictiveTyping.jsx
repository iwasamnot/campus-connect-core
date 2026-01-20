/**
 * AI Predictive Typing Component
 * Provides intelligent autocomplete suggestions as user types
 * 5-10 years ahead: Context-aware, learns from conversation patterns
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowUp, ArrowDown } from 'lucide-react';
import { callAI } from '../utils/aiProvider';

const AIPredictiveTyping = ({ 
  inputRef, 
  value, 
  onChange, 
  conversationHistory = [],
  disabled = false 
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);

  // Economy mode: completely disable cloud AI predictive typing to save quota.
  // This component will currently not call any external APIs.
  const generateSuggestions = useCallback(async (text) => {
    // In economy mode, we don't generate AI suggestions at all.
    setSuggestions([]);
    setShowSuggestions(false);
    setLoading(false);
  }, [conversationHistory, disabled]);

  // Debounced suggestion generation
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      generateSuggestions(value);
    }, 500); // Wait 500ms after typing stops

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, generateSuggestions]);

  // Keyboard navigation
  useEffect(() => {
    if (!showSuggestions || suggestions.length === 0) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Tab' && selectedIndex >= 0) {
        e.preventDefault();
        applySuggestion(suggestions[selectedIndex]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSuggestions, suggestions, selectedIndex]);

  const applySuggestion = (suggestion) => {
    if (!suggestion || !inputRef.current) return;
    
    // onChange is passed as a direct value function in ChatArea
    if (typeof onChange === 'function') {
      onChange(suggestion);
    }
    setShowSuggestions(false);
    
    // Focus input after applying
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(suggestion.length, suggestion.length);
      }
    }, 0);
  };

  if (!showSuggestions || suggestions.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute bottom-full left-0 right-0 mb-2 glass-panel border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
      >
        <div className="p-2 space-y-1">
          <div className="flex items-center gap-2 px-3 py-1 text-xs text-white/60 border-b border-white/10">
            <Sparkles size={12} />
            <span>AI Predictions (Tab to accept)</span>
          </div>
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={index}
              onClick={() => applySuggestion(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                index === selectedIndex
                  ? 'bg-indigo-600/80 text-white'
                  : 'bg-white/5 text-white/80 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="flex-1">{suggestion}</span>
                {index === selectedIndex && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-xs opacity-60"
                  >
                    <ArrowUp size={12} />
                  </motion.div>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIPredictiveTyping;
