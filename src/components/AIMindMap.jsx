/**
 * AI Mind-Map Generator
 * Generates visual mind maps from conversations using AI
 * v16.0.0 Futuristic Feature
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, Network, TrendingUp, Sparkles, X, Download, Maximize2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { callAI } from '../utils/aiProvider';

const AIMindMap = ({ messages = [], onClose }) => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [centralTopic, setCentralTopic] = useState('');
  const [theme, setTheme] = useState('neural'); // neural, quantum, cosmic
  const canvasRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [animationSpeed, setAnimationSpeed] = useState(1);

  // Generate mind map from messages
  const generateMindMap = async () => {
    if (!messages || messages.length === 0) {
      showError('No messages to analyze');
      return;
    }

    setIsGenerating(true);
    try {
      // Extract conversation text
      const conversationText = messages
        .map(m => `${m.senderName || 'User'}: ${m.text || ''}`)
        .join('\n')
        .slice(0, 5000); // Limit for AI processing

      // AI prompt to generate mind map structure
      const prompt = `Analyze this conversation and generate a mind map structure in JSON format. 
Extract:
1. Central topic/theme
2. Main branches (key topics, max 5)
3. Sub-branches for each main branch (max 3 each)
4. Keywords and important concepts
5. Connections between concepts

Return JSON with this structure:
{
  "centralTopic": "string",
  "nodes": [
    {"id": "1", "label": "topic", "level": 0, "x": 0, "y": 0, "category": "main"},
    {"id": "2", "label": "subtopic", "level": 1, "x": 100, "y": 100, "category": "sub"}
  ],
  "connections": [
    {"from": "1", "to": "2", "strength": 0.8}
  ]
}

Conversation:
${conversationText}`;

      const response = await callAI(prompt, {
        systemPrompt: 'You are a mind map generator. Always return valid JSON only, no markdown formatting.',
        temperature: 0.7
      });

      // Parse AI response (handle markdown code blocks)
      let jsonStr = response.trim();
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
      }

      const mindMapData = JSON.parse(jsonStr);
      
      // Calculate positions for nodes
      const layoutNodes = calculateLayout(mindMapData);
      setNodes(layoutNodes);
      setConnections(mindMapData.connections || []);
      setCentralTopic(mindMapData.centralTopic || 'Conversation Mind Map');
      
      success('Mind map generated successfully!');
    } catch (error) {
      console.error('Error generating mind map:', error);
      showError('Failed to generate mind map. Using fallback visualization.');
      
      // Fallback: simple keyword extraction
      generateFallbackMindMap(messages);
    } finally {
      setIsGenerating(false);
    }
  };

  // Fallback mind map from keywords
  const generateFallbackMindMap = (msgs) => {
    const words = msgs
      .flatMap(m => (m.text || '').toLowerCase().split(/\s+/))
      .filter(w => w.length > 4)
      .reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {});

    const topWords = Object.entries(words)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const fallbackNodes = [
      { id: 'center', label: 'Topics', level: 0, x: 400, y: 300, category: 'central', size: 60 }
    ];

    topWords.forEach(([word, count], i) => {
      const angle = (i / topWords.length) * Math.PI * 2;
      const radius = 200;
      fallbackNodes.push({
        id: `node-${i}`,
        label: word,
        level: 1,
        x: 400 + Math.cos(angle) * radius,
        y: 300 + Math.sin(angle) * radius,
        category: 'keyword',
        size: 30 + count * 5
      });
    });

    setNodes(fallbackNodes);
    setConnections(
      topWords.map((_, i) => ({
        from: 'center',
        to: `node-${i}`,
        strength: 0.6
      }))
    );
    setCentralTopic('Key Topics');
  };

  // Calculate circular layout for nodes
  const calculateLayout = (data) => {
    const centerNode = {
      id: 'center',
      label: data.centralTopic,
      level: 0,
      x: 400,
      y: 300,
      category: 'central',
      size: 70
    };

    const mainNodes = data.nodes.filter(n => n.level === 0 || n.category === 'main').slice(0, 5);
    const mainNodesLayout = mainNodes.map((node, i) => {
      const angle = (i / mainNodes.length) * Math.PI * 2;
      const radius = 250;
      return {
        ...node,
        x: 400 + Math.cos(angle) * radius,
        y: 300 + Math.sin(angle) * radius,
        size: 50
      };
    });

    // Sub-nodes around main nodes
    const subNodes = [];
    mainNodesLayout.forEach((mainNode, mainIdx) => {
      const relatedSubs = data.nodes.filter(
        n => n.level === 1 && Math.random() < 0.6
      ).slice(0, 3);

      relatedSubs.forEach((sub, subIdx) => {
        const angle = (mainIdx / mainNodes.length) * Math.PI * 2;
        const subAngle = angle + (subIdx - 1) * 0.4;
        const radius = 150;
        subNodes.push({
          ...sub,
          x: mainNode.x + Math.cos(subAngle) * radius,
          y: mainNode.y + Math.sin(subAngle) * radius,
          size: 35
        });
      });
    });

    return [centerNode, ...mainNodesLayout, ...subNodes];
  };

  // Draw mind map on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 600;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      connections.forEach(conn => {
        const fromNode = nodes.find(n => n.id === conn.from);
        const toNode = nodes.find(n => n.id === conn.to);
        if (!fromNode || !toNode) return;

        // Animated connection
        const time = Date.now() * 0.001 * animationSpeed;
        const alpha = 0.3 + Math.sin(time + conn.from.charCodeAt(0)) * 0.2;

        ctx.strokeStyle = theme === 'neural' 
          ? `rgba(139, 92, 246, ${alpha})`
          : theme === 'quantum'
          ? `rgba(34, 211, 238, ${alpha})`
          : `rgba(236, 72, 153, ${alpha})`;
        ctx.lineWidth = 2 * (conn.strength || 0.5);
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Particle effect along connection
        const progress = (Math.sin(time * 2) + 1) / 2;
        const px = fromNode.x + (toNode.x - fromNode.x) * progress;
        const py = fromNode.y + (toNode.y - fromNode.y) * progress;
        ctx.fillStyle = theme === 'neural' ? '#8B5CF6' : theme === 'quantum' ? '#22D3EE' : '#EC4899';
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw nodes
      nodes.forEach(node => {
        const time = Date.now() * 0.001 * animationSpeed;
        const pulse = 1 + Math.sin(time + node.id.charCodeAt(0)) * 0.1;

        // Outer glow
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, node.size * pulse
        );
        
        if (theme === 'neural') {
          gradient.addColorStop(0, 'rgba(139, 92, 246, 0.8)');
          gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
        } else if (theme === 'quantum') {
          gradient.addColorStop(0, 'rgba(34, 211, 238, 0.8)');
          gradient.addColorStop(1, 'rgba(34, 211, 238, 0)');
        } else {
          gradient.addColorStop(0, 'rgba(236, 72, 153, 0.8)');
          gradient.addColorStop(1, 'rgba(236, 72, 153, 0)');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size * pulse * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Node circle
        ctx.fillStyle = node.category === 'central' 
          ? (theme === 'neural' ? '#8B5CF6' : theme === 'quantum' ? '#22D3EE' : '#EC4899')
          : 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Node border
        ctx.strokeStyle = theme === 'neural' ? '#8B5CF6' : theme === 'quantum' ? '#22D3EE' : '#EC4899';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Node label
        ctx.fillStyle = '#fff';
        ctx.font = `${node.category === 'central' ? '16' : '12'}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const maxWidth = node.size * 2;
        const words = node.label.split(' ');
        let line = '';
        let y = node.y + node.size + 20;
        
        words.forEach((word, i) => {
          const testLine = line + word + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && i > 0) {
            ctx.fillText(line, node.x, y);
            line = word + ' ';
            y += 16;
          } else {
            line = testLine;
          }
        });
        ctx.fillText(line, node.x, y);
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [nodes, connections, theme, animationSpeed]);

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `mind-map-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
    success('Mind map exported!');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="relative w-full max-w-4xl h-[90vh] glass-panel border border-white/20 rounded-3xl p-6 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">AI Mind Map Generator</h2>
              <p className="text-white/60 text-sm">Visual representation of conversation flow</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
              title="Export"
            >
              <Download size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <button
            onClick={generateMindMap}
            disabled={isGenerating || messages.length === 0}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap size={18} />
                Generate Mind Map
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-white/60 text-sm">Theme:</span>
            {['neural', 'quantum', 'cosmic'].map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-3 py-1 rounded-lg text-sm capitalize transition-all ${
                  theme === t
                    ? 'bg-purple-600 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-white/60 text-sm">Speed:</span>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.5"
              value={animationSpeed}
              onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
              className="w-24"
            />
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-transparent rounded-2xl overflow-hidden border border-white/10">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            onClick={(e) => {
              const rect = canvasRef.current?.getBoundingClientRect();
              if (!rect) return;
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              
              // Check if clicked on a node
              const clickedNode = nodes.find(node => {
                const dist = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
                return dist < node.size * 2;
              });
              
              if (clickedNode) {
                setSelectedNode(clickedNode);
              }
            }}
          />
          
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Network className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/40">Click "Generate Mind Map" to visualize the conversation</p>
              </div>
            </div>
          )}

          {/* Selected node info */}
          <AnimatePresence>
            {selectedNode && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-4 left-4 glass-panel border border-white/20 rounded-xl p-4 max-w-xs"
              >
                <h3 className="text-white font-semibold mb-1">{selectedNode.label}</h3>
                <p className="text-white/60 text-sm">Level: {selectedNode.level}</p>
                <p className="text-white/60 text-sm">Category: {selectedNode.category}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AIMindMap;