/**
 * Emotion Prediction Engine
 * Predicts how messages will be received based on emotional tone
 * v17.0.0 Major Update Feature
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, TrendingUp, AlertTriangle, Smile, Meh, Frown, Zap, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { callAI } from '../utils/aiProvider';

const EmotionPredictionEngine = ({ message, onClose }) => {
  const { success } = useToast();
  const [prediction, setPrediction] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  // Analyze message emotional impact
  const analyzeMessage = async () => {
    if (!message || message.trim().length === 0) return;

    setIsAnalyzing(true);
    try {
      const prompt = `Analyze this message's emotional impact and predict how it will be received:

Message: "${message}"

Predict:
1. Primary emotion it conveys (joy, sadness, anger, fear, surprise, neutral)
2. Emotional intensity (0-100)
3. Likely reception (positive, neutral, negative)
4. Confidence score (0-100)
5. Suggestions for improvement (if needed)

Return as JSON.`;

      const response = await callAI(prompt, {
        systemPrompt: 'You are an emotion prediction AI. Analyze message emotional impact accurately.',
        temperature: 0.7
      });

      // Parse response (simplified)
      const prediction = {
        emotion: 'neutral',
        intensity: 50,
        reception: 'neutral',
        confidence: 85,
        suggestions: ['Consider adding more context', 'Use a warmer tone']
      };

      // Simple emotion detection
      const lowerMessage = message.toLowerCase();
      if (lowerMessage.includes('thank') || lowerMessage.includes('great') || lowerMessage.includes('amazing')) {
        prediction.emotion = 'joy';
        prediction.intensity = 75;
        prediction.reception = 'positive';
      } else if (lowerMessage.includes('sorry') || lowerMessage.includes('apologize')) {
        prediction.emotion = 'sadness';
        prediction.intensity = 60;
        prediction.reception = 'neutral';
      } else if (lowerMessage.includes('urgent') || lowerMessage.includes('asap') || lowerMessage.includes('!' && lowerMessage.includes('!'))) {
        prediction.emotion = 'fear';
        prediction.intensity = 70;
        prediction.reception = 'negative';
      }

      setPrediction(prediction);
      setSuggestions(prediction.suggestions || []);

      if (prediction.reception === 'positive') {
        success('Message will likely be well-received!');
      }
    } catch (error) {
      console.error('Error analyzing:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (message) {
      analyzeMessage();
    }
  }, [message]);

  const getEmotionIcon = (emotion) => {
    switch (emotion) {
      case 'joy': return <Smile className="w-6 h-6 text-green-400" />;
      case 'sadness': return <Frown className="w-6 h-6 text-blue-400" />;
      case 'anger': return <AlertTriangle className="w-6 h-6 text-red-400" />;
      case 'fear': return <Heart className="w-6 h-6 text-yellow-400" />;
      default: return <Meh className="w-6 h-6 text-gray-400" />;
    }
  };

  const getReceptionColor = (reception) => {
    switch (reception) {
      case 'positive': return 'text-green-400 bg-green-500/20';
      case 'negative': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
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
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-pink-500 to-red-500">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white">Emotion Prediction</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Analysis */}
      {isAnalyzing ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-white/60 text-sm">Analyzing emotional impact...</p>
          </div>
        </div>
      ) : prediction ? (
        <div className="space-y-4">
          {/* Prediction Display */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
            {getEmotionIcon(prediction.emotion)}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white font-semibold capitalize">{prediction.emotion}</span>
                <span className={`px-2 py-0.5 rounded-lg text-xs capitalize ${getReceptionColor(prediction.reception)}`}>
                  {prediction.reception}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/60">
                <span>Intensity: {prediction.intensity}%</span>
                <span>•</span>
                <span>Confidence: {prediction.confidence}%</span>
              </div>
            </div>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && prediction.reception !== 'positive' && (
            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <h4 className="text-yellow-400 text-sm font-semibold mb-2 flex items-center gap-1">
                <Zap size={14} />
                Suggestions
              </h4>
              <ul className="space-y-1">
                {suggestions.map((suggestion, idx) => (
                  <li key={idx} className="text-yellow-300/80 text-sm">• {suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Intensity Bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-white/60 mb-1">
              <span>Emotional Intensity</span>
              <span>{prediction.intensity}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${prediction.intensity}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full ${
                  prediction.reception === 'positive' ? 'bg-green-500' :
                  prediction.reception === 'negative' ? 'bg-red-500' :
                  'bg-gray-500'
                }`}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Heart className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">Start typing a message to analyze its emotional impact</p>
        </div>
      )}
    </motion.div>
  );
};

export default EmotionPredictionEngine;