import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Network, Users, TrendingUp, MessageSquare } from 'lucide-react';

/**
 * AI-Powered Relationship Graph
 * Visualizes communication patterns and relationships
 * 5-10 years ahead: Social graph analysis with AI insights
 */
const RelationshipGraph = ({ messages, users }) => {
  const [graphData, setGraphData] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    analyzeRelationships();
  }, [messages, users]);

  const analyzeRelationships = () => {
    if (!messages || !users) return;

    // Calculate interaction frequencies
    const interactions = {};
    const userMap = {};
    
    users.forEach(user => {
      userMap[user.uid] = user;
      interactions[user.uid] = {};
    });

    messages.forEach(msg => {
      const senderId = msg.userId;
      if (!senderId) return;

      // Count interactions (replies, mentions, etc.)
      messages.forEach(otherMsg => {
        if (otherMsg.userId && otherMsg.userId !== senderId) {
          // Check if this is a reply or mention
          const text = (otherMsg.text || otherMsg.displayText || '').toLowerCase();
          const senderName = (userMap[senderId]?.name || '').toLowerCase();
          
          if (text.includes(senderName) || otherMsg.replyingTo === msg.id) {
            if (!interactions[senderId][otherMsg.userId]) {
              interactions[senderId][otherMsg.userId] = 0;
            }
            interactions[senderId][otherMsg.userId]++;
          }
        }
      });
    });

    // Calculate relationship strengths
    const relationships = [];
    Object.keys(interactions).forEach(userId1 => {
      Object.keys(interactions[userId1]).forEach(userId2 => {
        const strength = interactions[userId1][userId2];
        if (strength > 0) {
          relationships.push({
            from: userId1,
            to: userId2,
            strength: Math.min(strength / 10, 1), // Normalize to 0-1
            interactions: strength
          });
        }
      });
    });

    setGraphData({
      nodes: users.map(user => ({
        id: user.uid,
        name: user.name || user.email?.split('@')[0] || 'Unknown',
        messageCount: messages.filter(m => m.userId === user.uid).length,
        connections: relationships.filter(r => r.from === user.uid || r.to === user.uid).length
      })),
      edges: relationships
    });
  };

  const getNodeSize = (messageCount) => {
    return Math.min(Math.max(messageCount / 10, 20), 60);
  };

  const getEdgeWidth = (strength) => {
    return Math.max(strength * 3, 1);
  };

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="glass-panel border border-white/10 rounded-xl p-6 text-center">
        <Network className="mx-auto text-white/20 mb-4" size={48} />
        <p className="text-white/60">Not enough data to generate relationship graph</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel border border-white/10 rounded-xl p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <Network className="text-indigo-400" size={24} />
        <h2 className="text-xl font-bold text-white">Relationship Network</h2>
      </div>

      {/* Graph Visualization */}
      <div className="relative h-96 bg-white/5 rounded-lg overflow-hidden border border-white/10">
        <svg width="100%" height="100%" className="absolute inset-0">
          {/* Edges */}
          {graphData.edges.map((edge, index) => {
            const fromNode = graphData.nodes.find(n => n.id === edge.from);
            const toNode = graphData.nodes.find(n => n.id === edge.to);
            if (!fromNode || !toNode) return null;

            const x1 = 100 + (index % 3) * 150;
            const y1 = 100 + Math.floor(index / 3) * 100;
            const x2 = x1 + 100;
            const y2 = y1 + 50;

            return (
              <line
                key={index}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(99, 102, 241, 0.5)"
                strokeWidth={getEdgeWidth(edge.strength)}
                className="cursor-pointer hover:stroke-indigo-400"
                onClick={() => setSelectedUser(edge.from)}
              />
            );
          })}

          {/* Nodes */}
          {graphData.nodes.map((node, index) => {
            const size = getNodeSize(node.messageCount);
            const x = 50 + (index % 4) * 120;
            const y = 50 + Math.floor(index / 4) * 120;

            return (
              <g key={node.id}>
                <circle
                  cx={x}
                  cy={y}
                  r={size}
                  fill={selectedUser === node.id ? '#6366f1' : 'rgba(99, 102, 241, 0.3)'}
                  stroke={selectedUser === node.id ? '#818cf8' : 'rgba(99, 102, 241, 0.5)'}
                  strokeWidth={selectedUser === node.id ? 3 : 2}
                  className="cursor-pointer hover:fill-indigo-500 transition-all"
                  onClick={() => setSelectedUser(selectedUser === node.id ? null : node.id)}
                />
                <text
                  x={x}
                  y={y + size + 15}
                  textAnchor="middle"
                  fill="white"
                  fontSize="10"
                  className="pointer-events-none"
                >
                  {node.name.substring(0, 8)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <Users className="text-indigo-400 mb-2" size={18} />
          <div className="text-2xl font-bold text-white">{graphData.nodes.length}</div>
          <div className="text-xs text-white/60">Users</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <Network className="text-purple-400 mb-2" size={18} />
          <div className="text-2xl font-bold text-white">{graphData.edges.length}</div>
          <div className="text-xs text-white/60">Connections</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <MessageSquare className="text-green-400 mb-2" size={18} />
          <div className="text-2xl font-bold text-white">{messages.length}</div>
          <div className="text-xs text-white/60">Messages</div>
        </div>
      </div>

      {/* Selected User Details */}
      {selectedUser && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-indigo-600/20 border border-indigo-500/50 rounded-lg"
        >
          {(() => {
            const node = graphData.nodes.find(n => n.id === selectedUser);
            const connections = graphData.edges.filter(e => e.from === selectedUser || e.to === selectedUser);
            return (
              <div>
                <h3 className="text-white font-semibold mb-2">{node?.name}</h3>
                <div className="text-sm text-white/80 space-y-1">
                  <div>Messages: {node?.messageCount}</div>
                  <div>Connections: {connections.length}</div>
                  <div>Avg. Interaction Strength: {(
                    connections.reduce((sum, c) => sum + c.strength, 0) / connections.length || 0
                  ).toFixed(2)}</div>
                </div>
              </div>
            );
          })()}
        </motion.div>
      )}
    </motion.div>
  );
};

export default RelationshipGraph;
