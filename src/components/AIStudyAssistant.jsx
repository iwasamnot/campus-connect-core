/**
 * AI Study Assistant Component
 * Provides intelligent study help, homework assistance, and learning support
 * v14.0.0 Feature
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, BookOpen, Lightbulb, HelpCircle, Send, Sparkles, X, Book, GraduationCap, Clock, TrendingUp } from 'lucide-react';
import { callAI } from '../utils/aiProvider';
import { useToast } from '../context/ToastContext';

const AIStudyAssistant = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('assistant'); // assistant, study-tips, homework-help
  const { success, error: showError } = useToast();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const handleSend = async (customQuery = null) => {
    const question = customQuery || query.trim();
    if (!question || loading) return;

    const userMessage = { role: 'user', content: question, timestamp: new Date() };
    setConversation(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      let systemPrompt = 'You are a helpful AI study assistant for university students. Provide clear, educational, and supportive responses.';
      
      if (activeTab === 'study-tips') {
        systemPrompt = 'You are an expert study coach. Provide practical study tips, time management advice, and learning strategies.';
      } else if (activeTab === 'homework-help') {
        systemPrompt = 'You are a tutor that helps students understand concepts and solve problems. Guide them to solutions rather than giving direct answers.';
      }

      const prompt = `${question}\n\nProvide a helpful, educational response.`;
      
      const response = await callAI(prompt, {
        systemPrompt,
        maxTokens: 1000,
        temperature: 0.7
      });

      const aiMessage = { role: 'assistant', content: response, timestamp: new Date() };
      setConversation(prev => [...prev, aiMessage]);
      success('Study assistant responded!');
    } catch (err) {
      console.error('Error getting study help:', err);
      showError('Failed to get response. Please try again.');
      setConversation(prev => prev.slice(0, -1)); // Remove user message on error
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = {
    'assistant': [
      { icon: BookOpen, text: 'Explain this concept', query: 'Can you explain this concept in simple terms?' },
      { icon: HelpCircle, text: 'Study schedule', query: 'How should I organize my study schedule?' },
      { icon: Lightbulb, text: 'Learning tips', query: 'What are effective learning strategies?' }
    ],
    'study-tips': [
      { icon: Clock, text: 'Time management', query: 'How can I better manage my study time?' },
      { icon: Brain, text: 'Memory techniques', query: 'What memory techniques work best for exams?' },
      { icon: TrendingUp, text: 'Productivity', query: 'How can I be more productive while studying?' }
    ],
    'homework-help': [
      { icon: Book, text: 'Problem solving', query: 'Can you help me understand how to approach this problem?' },
      { icon: GraduationCap, text: 'Course help', query: 'I need help with my course material' },
      { icon: HelpCircle, text: 'Concept clarification', query: 'Can you clarify this concept for me?' }
    ]
  };

  return (
    <div className="h-full min-h-0 flex flex-col bg-transparent relative overflow-hidden">
      {/* Header */}
      <div className="glass-panel border-b border-white/10 px-4 md:px-6 py-3 md:py-4 flex-shrink-0 rounded-t-[2rem]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-600/30 to-purple-600/30 rounded-xl">
              <Brain className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-white text-glow">AI Study Assistant</h2>
              <p className="text-xs text-white/60">Get help with studies and homework</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { id: 'assistant', label: 'Assistant', icon: Brain },
            { id: 'study-tips', label: 'Study Tips', icon: Lightbulb },
            { id: 'homework-help', label: 'Homework', icon: BookOpen }
          ].map(tab => (
            <motion.button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setConversation([]);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Quick Questions */}
      {conversation.length === 0 && (
        <div className="px-4 md:px-6 py-4 space-y-2">
          <p className="text-sm text-white/60 mb-3">Quick questions:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {quickQuestions[activeTab].map((q, idx) => (
              <motion.button
                key={idx}
                onClick={() => handleSend(q.query)}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="p-3 glass-panel border border-white/10 rounded-xl text-left hover:bg-white/10 transition-all"
              >
                <q.icon className="w-4 h-4 text-indigo-400 mb-2" />
                <p className="text-sm font-medium text-white">{q.text}</p>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4 min-h-0">
        {conversation.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                className="w-16 h-16 mx-auto mb-4 glass-panel border border-white/10 rounded-full flex items-center justify-center"
              >
                <Brain className="w-8 h-8 text-indigo-400" />
              </motion.div>
              <p className="text-white/60 text-sm">Ask me anything about your studies!</p>
            </div>
          </div>
        )}

        <AnimatePresence>
          {conversation.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl p-3 ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'glass-panel border border-white/10 text-white'
                }`}
              >
                <div className="flex items-start gap-2">
                  {msg.role === 'assistant' && (
                    <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="glass-panel border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full"
                />
                <span className="text-sm text-white/60">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/10 px-4 md:px-6 py-3 flex-shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about your studies..."
            className="flex-1 px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
            disabled={loading}
          />
          <motion.button
            onClick={() => handleSend()}
            disabled={!query.trim() || loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-lg"
          >
            <Send size={18} />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default AIStudyAssistant;
