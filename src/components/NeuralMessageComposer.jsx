/**
 * Neural Message Composer
 * AI predicts and writes entire messages based on context
 * v16.0.0 Futuristic Feature
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, Send, Zap, Lightbulb, X, Copy, Check } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { callAI } from '../utils/aiProvider';

const NeuralMessageComposer = ({ contextMessages = [], recipient = null, onSend, onClose }) => {
  const { success } = useToast();
  const [isPredicting, setIsPredicting] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [predictionMode, setPredictionMode] = useState('contextual'); // contextual, emotional, concise, professional
  const [isGenerating, setIsGenerating] = useState(false);
  const inputRef = useRef(null);

  // Generate AI message suggestions
  const generateSuggestions = async () => {
    if (contextMessages.length === 0 && !recipient) {
      return;
    }

    setIsGenerating(true);
    try {
      // Analyze context
      const recentMessages = contextMessages.slice(-5);
      const contextText = recentMessages
        .map(m => `${m.senderName || 'User'}: ${m.text || ''}`)
        .join('\n');

      const modePrompts = {
        contextual: 'Write a message that naturally continues this conversation. Match the tone and style.',
        emotional: 'Write an empathetic message that shows understanding and emotional intelligence.',
        concise: 'Write a brief, clear message (max 50 words). Get to the point quickly.',
        professional: 'Write a formal, professional message suitable for academic or work communication.'
      };

      const prompt = `${modePrompts[predictionMode]}

Recent conversation:
${contextText}

${recipient ? `Responding to: ${recipient}` : ''}

Generate 3 different message options, numbered 1-3. Each should be unique in tone but relevant to the context.`;

      const response = await callAI(prompt, {
        systemPrompt: 'You are a neural message composer. Generate natural, contextually appropriate messages.',
        temperature: 0.8
      });

      // Parse suggestions (extract numbered options)
      const lines = response.split('\n').filter(l => l.trim());
      const parsedSuggestions = [];

      lines.forEach((line, i) => {
        const clean = line.replace(/^\d+[\.\)]\s*/, '').trim();
        if (clean.length > 10 && clean.length < 500) {
          parsedSuggestions.push({
            id: i,
            text: clean,
            confidence: 0.9 - (i * 0.1),
            mode: predictionMode
          });
        }
      });

      // If parsing failed, split by paragraphs
      if (parsedSuggestions.length === 0) {
        const paragraphs = response.split('\n\n').filter(p => p.trim().length > 10);
        paragraphs.slice(0, 3).forEach((para, i) => {
          parsedSuggestions.push({
            id: i,
            text: para.trim(),
            confidence: 0.9 - (i * 0.1),
            mode: predictionMode
          });
        });
      }

      setSuggestions(parsedSuggestions.slice(0, 3));
      success('Message suggestions generated!');
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate on mode change
  useEffect(() => {
    if (contextMessages.length > 0 || recipient) {
      generateSuggestions();
    }
  }, [predictionMode]);

  const handleUseSuggestion = (suggestion) => {
    setSelectedSuggestion(suggestion);
    if (onSend) {
      onSend(suggestion.text);
    }
    if (onClose) {
      onClose();
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    success('Copied to clipboard!');
  };

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
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white">Neural Message Composer</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Mode Selector */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-white/60 text-sm">Mode:</span>
        {['contextual', 'emotional', 'concise', 'professional'].map((mode) => (
          <button
            key={mode}
            onClick={() => setPredictionMode(mode)}
            disabled={isGenerating}
            className={`px-3 py-1 rounded-lg text-sm capitalize transition-all ${
              predictionMode === mode
                ? 'bg-cyan-600 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-50'
            }`}
          >
            {mode}
          </button>
        ))}
        <button
          onClick={generateSuggestions}
          disabled={isGenerating}
          className="ml-auto px-3 py-1 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 disabled:opacity-50 text-white rounded-lg text-sm flex items-center gap-1.5"
        >
          {isGenerating ? (
            <>
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles size={14} />
              Regenerate
            </>
          )}
        </button>
      </div>

      {/* Suggestions */}
      <AnimatePresence>
        {suggestions.length > 0 ? (
          <div className="space-y-3">
            {suggestions.map((suggestion, idx) => (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: idx * 0.1 }}
                className="relative group"
              >
                <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all">
                  {/* Confidence indicator */}
                  <div className="flex-shrink-0 pt-1">
                    <div className="w-2 h-2 rounded-full bg-cyan-400" style={{ opacity: suggestion.confidence }} />
                  </div>

                  {/* Message text */}
                  <div className="flex-1">
                    <p className="text-white/90 leading-relaxed">{suggestion.text}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-cyan-400/60 capitalize">{suggestion.mode}</span>
                      <span className="text-xs text-white/40">
                        {Math.round(suggestion.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopy(suggestion.text)}
                      className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
                      title="Copy"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => handleUseSuggestion(suggestion)}
                      className="p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white"
                      title="Use this message"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Lightbulb className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">
              {contextMessages.length === 0 
                ? 'Start a conversation to get AI message suggestions'
                : 'Click "Regenerate" to create message suggestions'}
            </p>
          </div>
        )}
      </AnimatePresence>

      {/* Info */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-xs text-white/40 flex items-center gap-1.5">
          <Zap size={12} />
          AI analyzes conversation context to predict the perfect message
        </p>
      </div>
    </motion.div>
  );
};

export default NeuralMessageComposer;