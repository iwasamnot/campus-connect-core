import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Edit3, Calendar, Brain, CheckSquare, Network, 
  Mic, X, Zap, TrendingUp, Layout, Users, Heart, Bell
} from 'lucide-react';

/**
 * Futuristic Features Menu
 * Centralized menu for all cutting-edge AI features
 */
const FuturisticFeaturesMenu = ({ 
  onFeatureSelect,
  isOpen,
  onClose 
}) => {
  const features = [
    {
      id: 'smart-replies',
      label: 'AI Smart Replies',
      description: 'Context-aware reply suggestions',
      icon: Sparkles,
      color: 'indigo',
      badge: 'NEW'
    },
    {
      id: 'collaborative',
      label: 'Collaborative Editor',
      description: 'Real-time multi-user editing',
      icon: Edit3,
      color: 'purple',
      badge: 'BETA'
    },
    {
      id: 'scheduler',
      label: 'Predictive Scheduler',
      description: 'AI-optimized send times',
      icon: Calendar,
      color: 'blue',
      badge: 'AI'
    },
    {
      id: 'emotion',
      label: 'Voice Emotion',
      description: 'Real-time emotion detection',
      icon: Mic,
      color: 'pink',
      badge: 'FUTURE'
    },
    {
      id: 'insights',
      label: 'AI Insights',
      description: 'Deep conversation analytics',
      icon: Brain,
      color: 'yellow',
      badge: 'AI'
    },
    {
      id: 'tasks',
      label: 'Task Extractor',
      description: 'Auto-extract tasks from chat',
      icon: CheckSquare,
      color: 'green',
      badge: 'AI'
    },
    {
      id: 'graph',
      label: 'Relationship Graph',
      description: 'Visualize communication patterns',
      icon: Network,
      color: 'cyan',
      badge: 'GRAPH'
    },
    {
      id: 'mindmap',
      label: 'AI Mind Map',
      description: 'Visual conversation mapping',
      icon: Brain,
      color: 'purple',
      badge: 'FUTURE'
    },
    {
      id: 'neural-composer',
      label: 'Neural Composer',
      description: 'AI writes entire messages',
      icon: Zap,
      color: 'cyan',
      badge: 'NEURAL'
    },
    {
      id: 'quantum-search',
      label: 'Quantum Search',
      description: 'Multiple parallel dimensions',
      icon: Layers,
      color: 'blue',
      badge: 'QUANTUM'
    },
    {
      id: 'smart-workspace',
      label: 'Smart Workspace',
      description: 'AI-organized workspace',
      icon: Layout,
      color: 'purple',
      badge: 'AI'
    },
    {
      id: 'ai-study-groups',
      label: 'AI Study Groups',
      description: 'Intelligent group formation',
      icon: Users,
      color: 'cyan',
      badge: 'NEW'
    },
    {
      id: 'emotion-prediction',
      label: 'Emotion Prediction',
      description: 'Predict message reception',
      icon: Heart,
      color: 'pink',
      badge: 'NEURAL'
    },
    {
      id: 'smart-notifications',
      label: 'Smart Notifications',
      description: 'AI-prioritized alerts',
      icon: Bell,
      color: 'blue',
      badge: 'SMART'
    }
  ];

  const colorClasses = {
    indigo: 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400',
    purple: 'bg-purple-600/20 border-purple-500/50 text-purple-400',
    blue: 'bg-blue-600/20 border-blue-500/50 text-blue-400',
    pink: 'bg-pink-600/20 border-pink-500/50 text-pink-400',
    yellow: 'bg-yellow-600/20 border-yellow-500/50 text-yellow-400',
    green: 'bg-green-600/20 border-green-500/50 text-green-400',
    cyan: 'bg-cyan-600/20 border-cyan-500/50 text-cyan-400'
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-panel border border-white/20 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg">
                <Zap className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Futuristic AI Features</h2>
                <p className="text-sm text-white/60">5-10 years ahead of their time</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close menu"
            >
              <X size={20} className="text-white/60" />
            </button>
          </div>

          {/* Features Grid */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.button
                    key={feature.id}
                    onClick={() => {
                      onFeatureSelect(feature.id);
                      onClose();
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-xl border ${colorClasses[feature.color]} hover:border-opacity-100 transition-all text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[120px]`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2 rounded-lg ${colorClasses[feature.color]} bg-opacity-20`}>
                        <Icon size={20} />
                      </div>
                      {feature.badge && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-white/10 rounded-full border border-white/20">
                          {feature.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-white mb-1">{feature.label}</h3>
                    <p className="text-xs text-white/70">{feature.description}</p>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 bg-white/5">
            <div className="flex items-center gap-2 text-xs text-white/60">
              <TrendingUp size={14} />
              <span>These features use advanced AI and represent the future of communication</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FuturisticFeaturesMenu;
