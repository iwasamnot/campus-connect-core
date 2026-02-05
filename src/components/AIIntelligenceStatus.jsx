/**
 * AI Intelligence Status Display
 * Shows the advanced AI capabilities and current state
 */

import { motion } from 'framer-motion';
import { 
  Brain, 
  Sparkles, 
  Heart, 
  BookOpen, 
  Zap, 
  Target,
  Activity,
  Lightbulb,
  MessageCircle,
  TrendingUp,
  Eye,
  Cpu
} from 'lucide-react';

export const AIIntelligenceStatus = ({ metadata, isVisible }) => {
  if (!metadata || !isVisible) return null;

  const getStatusColor = (confidence) => {
    if (confidence > 0.8) return 'text-green-400';
    if (confidence > 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getEmotionIcon = (emotion) => {
    const emotionIcons = {
      joy: '😊',
      sadness: '😢',
      anger: '😠',
      fear: '😨',
      surprise: '😮',
      disgust: '😒',
      neutral: '😐'
    };
    return emotionIcons[emotion] || '😐';
  };

  const getIntentIcon = (intent) => {
    const intentIcons = {
      question: '❓',
      statement: '💬',
      request: '🤝',
      emotional_share: '💝'
    };
    return intentIcons[intent] || '💬';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 p-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl"
    >
      <div className="flex items-center gap-2 mb-2">
        <Brain className="w-4 h-4 text-indigo-400" />
        <span className="text-xs font-semibold text-indigo-300">AI Intelligence Active</span>
        <div className={`w-2 h-2 rounded-full ${getStatusColor(metadata.confidence)} animate-pulse`} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {/* Emotional Intelligence */}
        <div className="flex items-center gap-2">
          <Heart className="w-3 h-3 text-pink-400" />
          <div>
            <div className="text-gray-400">Emotion</div>
            <div className="flex items-center gap-1">
              <span>{getEmotionIcon(metadata.emotions?.primary)}</span>
              <span className="text-white capitalize">{metadata.emotions?.primary}</span>
            </div>
          </div>
        </div>

        {/* Intent Recognition */}
        <div className="flex items-center gap-2">
          <Target className="w-3 h-3 text-blue-400" />
          <div>
            <div className="text-gray-400">Intent</div>
            <div className="flex items-center gap-1">
              <span>{getIntentIcon(metadata.intent?.type)}</span>
              <span className="text-white capitalize">{metadata.intent?.type}</span>
            </div>
          </div>
        </div>

        {/* Knowledge Sources */}
        <div className="flex items-center gap-2">
          <BookOpen className="w-3 h-3 text-green-400" />
          <div>
            <div className="text-gray-400">Sources</div>
            <div className="text-white">{metadata.sources?.length || 0} used</div>
          </div>
        </div>

        {/* Confidence Level */}
        <div className="flex items-center gap-2">
          <Activity className="w-3 h-3 text-yellow-400" />
          <div>
            <div className="text-gray-400">Confidence</div>
            <div className={`font-semibold ${getStatusColor(metadata.confidence)}`}>
              {Math.round((metadata.confidence || 0) * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Enhancement Indicators */}
      {metadata.enhancements > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 pt-2 border-t border-white/10"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-yellow-400" />
            <span className="text-xs text-yellow-300">
              Enhanced with {metadata.enhancements} AI improvements
            </span>
          </div>
        </motion.div>
      )}

      {/* Personality Type */}
      {metadata.personality && (
        <div className="mt-2 flex items-center gap-2">
          <Cpu className="w-3 h-3 text-purple-400" />
          <span className="text-xs text-purple-300">
            Personality: {metadata.personality}
          </span>
        </div>
      )}
    </motion.div>
  );
};

/**
 * AI Thinking Animation
 * Shows when AI is processing with intelligent features
 */
export const AIThinkingAnimation = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2 p-2 bg-white/5 rounded-lg"
    >
      <div className="flex gap-1">
        {[Brain, Heart, Lightbulb, Zap].map((Icon, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: index * 0.2,
              ease: "easeInOut"
            }}
          >
            <Icon className="w-3 h-3 text-indigo-400" />
          </motion.div>
        ))}
      </div>
      <span className="text-xs text-indigo-300">AI thinking...</span>
    </motion.div>
  );
};

/**
 * AI Feature Showcase
 * Displays available AI capabilities
 */
export const AIFeatureShowcase = () => {
  const features = [
    { icon: Brain, name: 'Emotional Intelligence', desc: 'Understands and responds to emotions' },
    { icon: Eye, name: 'Intent Recognition', desc: 'Identifies user intent and needs' },
    { icon: BookOpen, name: 'Knowledge Graph', desc: 'Access to vast knowledge base' },
    { icon: MessageCircle, name: 'Context Awareness', desc: 'Remembers conversation history' },
    { icon: TrendingUp, name: 'Learning Engine', desc: 'Learns from every interaction' },
    { icon: Sparkles, name: 'Creative Responses', desc: 'Generates engaging and unique replies' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {features.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="p-3 bg-white/5 border border-white/10 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="p-2 bg-indigo-600/20 rounded-lg"
              >
                <Icon className="w-4 h-4 text-indigo-400" />
              </motion.div>
              <div>
                <h4 className="text-sm font-semibold text-white">{feature.name}</h4>
                <p className="text-xs text-gray-400 mt-1">{feature.desc}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
