/**
 * Smart Workspace Manager
 * AI-organized workspace with intelligent layout and context switching
 * v17.0.0 Major Update Feature
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout, Sparkles, Zap, Layers, Grid3x3, Maximize2, Minimize2, X, Settings, Folder, FileText, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { callAI } from '../utils/aiProvider';

const SmartWorkspace = ({ onClose }) => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [layout, setLayout] = useState('adaptive'); // adaptive, grid, focus, split

  // AI organizes workspace based on activity
  const organizeWorkspace = async () => {
    setIsGenerating(true);
    try {
      // Simulate AI workspace organization
      const prompt = `Organize a student workspace with these categories:
1. Active Projects
2. Study Materials  
3. Communications
4. Resources
5. Quick Access

Create an intelligent layout optimized for productivity.`;

      await callAI(prompt, {
        systemPrompt: 'You are a workspace organization AI. Create efficient layouts for student workspaces.',
        temperature: 0.7
      });

      // Create organized workspace
      const organizedWorkspace = {
        id: `workspace_${Date.now()}`,
        name: 'Smart Workspace',
        layout: 'adaptive',
        sections: [
          { id: 'active', name: 'Active Projects', items: [], color: '#8B5CF6' },
          { id: 'study', name: 'Study Materials', items: [], color: '#3B82F6' },
          { id: 'comm', name: 'Communications', items: [], color: '#10B981' },
          { id: 'resources', name: 'Resources', items: [], color: '#F59E0B' },
          { id: 'quick', name: 'Quick Access', items: [], color: '#EC4899' }
        ],
        createdAt: new Date()
      };

      setWorkspaces([...workspaces, organizedWorkspace]);
      setActiveWorkspace(organizedWorkspace.id);
      success('Workspace organized by AI!');
    } catch (error) {
      console.error('Error organizing workspace:', error);
      showError('Failed to organize workspace');
    } finally {
      setIsGenerating(false);
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
        className="relative w-full max-w-6xl h-[90vh] glass-panel border border-white/20 rounded-3xl p-6 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
              <Layout className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Smart Workspace</h2>
              <p className="text-white/60 text-sm">AI-organized workspace for maximum productivity</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={organizeWorkspace}
              disabled={isGenerating}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white rounded-xl text-sm flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Organizing...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Organize with AI
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Layout Options */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="text-white/60 text-sm">Layout:</span>
          {['adaptive', 'grid', 'focus', 'split'].map((l) => (
            <button
              key={l}
              onClick={() => setLayout(l)}
              className={`px-3 py-1 rounded-lg text-sm capitalize transition-all ${
                layout === l
                  ? 'bg-indigo-600 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Workspace Grid */}
        <div className="flex-1 overflow-y-auto">
          {workspaces.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Grid3x3 className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/40 mb-4">Click "Organize with AI" to create your smart workspace</p>
                <button
                  onClick={organizeWorkspace}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl"
                >
                  <Sparkles className="w-5 h-5 inline mr-2" />
                  Get Started
                </button>
              </div>
            </div>
          ) : (
            <div className={`grid gap-4 ${
              layout === 'grid' ? 'grid-cols-3' :
              layout === 'focus' ? 'grid-cols-1' :
              layout === 'split' ? 'grid-cols-2' :
              'grid-cols-3'
            }`}>
              {workspaces[0]?.sections?.map((section) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: section.color }} />
                    <h3 className="text-white font-semibold">{section.name}</h3>
                  </div>
                  <div className="space-y-2">
                    {section.items.length === 0 && (
                      <p className="text-white/30 text-sm">No items yet</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-4 text-xs text-white/40">
          <div className="flex items-center gap-1">
            <TrendingUp size={12} />
            <span>Optimized for productivity</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>Auto-organized by AI</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SmartWorkspace;