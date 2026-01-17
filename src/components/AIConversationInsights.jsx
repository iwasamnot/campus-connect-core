import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, MessageSquare, Clock, Users, Brain, BarChart3 } from 'lucide-react';
import { callAI } from '../utils/aiProvider';

/**
 * AI Conversation Insights Dashboard
 * Provides deep analytics and insights about conversations
 * 5-10 years ahead: Predictive analytics, sentiment trends, engagement patterns
 */
const AIConversationInsights = ({ messages, participants }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sentimentTrend, setSentimentTrend] = useState([]);

  useEffect(() => {
    analyzeConversation();
  }, [messages]);

  const analyzeConversation = async () => {
    if (!messages || messages.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const conversationText = messages
        .slice(-50) // Last 50 messages
        .map(msg => `${msg.userName || 'User'}: ${msg.text || msg.displayText || ''}`)
        .join('\n');

      const prompt = `Analyze this conversation and provide insights in JSON format:
{
  "topics": ["topic1", "topic2", "topic3"],
  "sentiment": "positive|neutral|negative",
  "engagement": "high|medium|low",
  "keyPoints": ["point1", "point2", "point3"],
  "suggestions": ["suggestion1", "suggestion2"]
}

Conversation:
${conversationText}

Return ONLY valid JSON, no other text.`;

      try {
        const text = await callAI(prompt, {
          systemPrompt: 'You are a helpful assistant that analyzes conversations and provides insights.',
          maxTokens: 500,
          temperature: 0.7
        });
        
        const jsonMatch = text.match(/\{.*\}/s);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
        setInsights(parsed);
      } catch (e) {
        setInsights(generateFallbackInsights());
      }

      // Calculate sentiment trend
      const trend = calculateSentimentTrend(messages);
      setSentimentTrend(trend);
    } catch (error) {
      console.error('Error analyzing conversation:', error);
      setInsights(generateFallbackInsights());
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackInsights = () => {
    const topics = new Set();
    messages.forEach(msg => {
      const text = (msg.text || msg.displayText || '').toLowerCase();
      if (text.includes('meeting')) topics.add('Meetings');
      if (text.includes('project')) topics.add('Projects');
      if (text.includes('deadline')) topics.add('Deadlines');
      if (text.includes('help')) topics.add('Support');
    });

    return {
      topics: Array.from(topics).slice(0, 3) || ['General Discussion'],
      sentiment: 'neutral',
      engagement: messages.length > 20 ? 'high' : messages.length > 10 ? 'medium' : 'low',
      keyPoints: [
        `${messages.length} messages exchanged`,
        `${participants?.length || 1} participant${(participants?.length || 1) > 1 ? 's' : ''}`,
        'Active conversation'
      ],
      suggestions: [
        'Continue the discussion',
        'Schedule a follow-up if needed',
        'Share relevant resources'
      ]
    };
  };

  const calculateSentimentTrend = (msgs) => {
    // Simple sentiment calculation based on keywords
    const chunks = [];
    const chunkSize = Math.max(1, Math.floor(msgs.length / 5));
    
    for (let i = 0; i < msgs.length; i += chunkSize) {
      const chunk = msgs.slice(i, i + chunkSize);
      let positive = 0;
      let negative = 0;
      
      chunk.forEach(msg => {
        const text = (msg.text || msg.displayText || '').toLowerCase();
        if (text.match(/\b(great|good|awesome|excellent|love|amazing)\b/)) positive++;
        if (text.match(/\b(bad|terrible|awful|hate|disappointed)\b/)) negative++;
      });
      
      chunks.push({
        index: Math.floor(i / chunkSize),
        sentiment: positive > negative ? 1 : negative > positive ? -1 : 0
      });
    }
    
    return chunks;
  };

  if (loading) {
    return (
      <div className="glass-panel border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-6 h-6 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full"
          />
          <span className="text-white/60">AI analyzing conversation...</span>
        </div>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel border border-white/10 rounded-xl p-6 space-y-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <Brain className="text-indigo-400" size={24} />
        <h2 className="text-xl font-bold text-white">AI Conversation Insights</h2>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <MessageSquare className="text-indigo-400 mb-2" size={20} />
          <div className="text-2xl font-bold text-white">{messages.length}</div>
          <div className="text-xs text-white/60">Messages</div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <Users className="text-purple-400 mb-2" size={20} />
          <div className="text-2xl font-bold text-white">{participants?.length || 1}</div>
          <div className="text-xs text-white/60">Participants</div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <TrendingUp className="text-green-400 mb-2" size={20} />
          <div className="text-2xl font-bold text-white capitalize">{insights.engagement}</div>
          <div className="text-xs text-white/60">Engagement</div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <BarChart3 className="text-yellow-400 mb-2" size={20} />
          <div className="text-2xl font-bold text-white capitalize">{insights.sentiment}</div>
          <div className="text-xs text-white/60">Sentiment</div>
        </div>
      </div>

      {/* Topics */}
      {insights.topics && insights.topics.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white/80 mb-2">Main Topics</h3>
          <div className="flex flex-wrap gap-2">
            {insights.topics.map((topic, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-indigo-600/30 border border-indigo-500/50 rounded-lg text-sm text-white"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Key Points */}
      {insights.keyPoints && insights.keyPoints.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white/80 mb-2">Key Points</h3>
          <ul className="space-y-1">
            {insights.keyPoints.map((point, index) => (
              <li key={index} className="text-sm text-white/70 flex items-start gap-2">
                <span className="text-indigo-400 mt-1">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {insights.suggestions && insights.suggestions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white/80 mb-2">AI Suggestions</h3>
          <div className="space-y-2">
            {insights.suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="p-3 bg-indigo-600/10 border border-indigo-500/30 rounded-lg text-sm text-white/80"
              >
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sentiment Trend */}
      {sentimentTrend.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white/80 mb-2">Sentiment Trend</h3>
          <div className="flex items-end gap-1 h-20">
            {sentimentTrend.map((point, index) => (
              <motion.div
                key={index}
                initial={{ height: 0 }}
                animate={{ height: `${Math.abs(point.sentiment) * 30 + 20}px` }}
                transition={{ delay: index * 0.1 }}
                className={`flex-1 rounded-t ${
                  point.sentiment > 0 ? 'bg-green-500' : 
                  point.sentiment < 0 ? 'bg-red-500' : 
                  'bg-gray-500'
                }`}
                title={`Segment ${index + 1}: ${point.sentiment > 0 ? 'Positive' : point.sentiment < 0 ? 'Negative' : 'Neutral'}`}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AIConversationInsights;
