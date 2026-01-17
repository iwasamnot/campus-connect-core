import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, Brain, MessageSquare } from 'lucide-react';
import { callAI } from '../utils/aiProvider';

/**
 * AI Smart Replies Component
 * Generates context-aware smart replies using AI based on clicked message
 * 5-10 years ahead: Predictive, contextual, emotionally intelligent
 */
const AISmartReplies = ({ conversationHistory, selectedMessage, onSelect, userContext }) => {
  const [smartReplies, setSmartReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    generateSmartReplies();
  }, [conversationHistory, selectedMessage]);

  const generateSmartReplies = async () => {
    if (!conversationHistory || conversationHistory.length === 0) return;
    
    setLoading(true);
    try {
      // If a specific message is selected, focus on that message
      let prompt;
      if (selectedMessage) {
        const messageText = selectedMessage.text || selectedMessage.displayText || '';
        const messageSender = selectedMessage.userName || 'User';
        const messageContext = `Message from ${messageSender}: "${messageText}"`;
        
        // Include a bit of context around the selected message
        const selectedIndex = conversationHistory.findIndex(m => m.id === selectedMessage.id);
        const contextMessages = conversationHistory.slice(Math.max(0, selectedIndex - 2), selectedIndex + 3)
          .map(msg => `${msg.userName || 'User'}: ${msg.text || msg.displayText || ''}`)
          .join('\n');

        prompt = `You are generating smart reply suggestions for this specific message. Generate 3-5 contextually appropriate reply suggestions that respond directly to this message.

FOCUS MESSAGE (the one the user clicked on):
${messageContext}

Recent conversation context:
${contextMessages}

Consider:
- The specific message being replied to
- The tone and intent of the focused message
- The topic and context
- Natural, conversational responses
- Appropriate tone (friendly, professional, casual, etc.)
- Direct relevance to the focused message

Generate smart replies as a JSON array of strings. Each reply should:
- Directly respond to the focused message
- Be natural and conversational
- Be contextually relevant
- Be 5-20 words maximum
- Be varied in style (some formal, some casual)

Return ONLY a JSON array, no other text. Example: ["Thanks for the update!", "That sounds great!", "I'll check it out."]`;
      } else {
        // Fallback to general conversation analysis
        const recentMessages = conversationHistory.slice(-5).map(msg => 
          `${msg.userName || 'User'}: ${msg.text || msg.displayText || ''}`
        ).join('\n');

        prompt = `Analyze this conversation and generate 3-5 smart, contextually appropriate reply suggestions. 
Consider:
- The tone and emotion of the conversation
- The relationship between participants
- The topic being discussed
- Cultural context and appropriateness
- Natural, conversational language

Conversation:
${recentMessages}

Generate smart replies as a JSON array of strings. Each reply should be:
- Natural and conversational
- Contextually relevant
- Appropriate in tone
- 5-20 words maximum
- Varied in style (some formal, some casual)

Return ONLY a JSON array, no other text. Example: ["Thanks for the update!", "That sounds great!", "I'll check it out."]`;
      }

      const text = await callAI(prompt, {
        systemPrompt: 'You are a helpful assistant that generates natural, contextually appropriate reply suggestions.',
        maxTokens: 200,
        temperature: 0.8
      });
      
      // Parse JSON response
      let replies = [];
      try {
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = text.match(/\[.*\]/s);
        if (jsonMatch) {
          replies = JSON.parse(jsonMatch[0]);
        } else {
          replies = JSON.parse(text);
        }
      } catch (e) {
        // Fallback parsing
        replies = text.split('\n')
          .filter(line => line.trim() && !line.startsWith('```'))
          .map(line => line.replace(/^[-*]\s*/, '').replace(/["']/g, '').trim())
          .slice(0, 5);
      }

      setSmartReplies(replies.filter(r => r && r.length > 0).slice(0, 5));
    } catch (error) {
      console.error('Error generating smart replies:', error);
      setSmartReplies(generateFallbackReplies(conversationHistory));
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackReplies = (history) => {
    // Use selected message if available, otherwise use last message
    const messageToAnalyze = selectedMessage || history[history.length - 1];
    const text = (messageToAnalyze?.text || messageToAnalyze?.displayText || '').toLowerCase();
    
    const replies = [];
    
    if (text.includes('?')) {
      replies.push("I'll look into that", "Let me check", "Good question!");
    }
    if (text.includes('thank') || text.includes('thanks')) {
      replies.push("You're welcome!", "Happy to help!", "Anytime!");
    }
    if (text.includes('meeting') || text.includes('call')) {
      replies.push("Sounds good!", "I'll be there", "Looking forward to it");
    }
    if (text.includes('help') || text.includes('support')) {
      replies.push("I can help with that", "Let me assist you", "Sure thing!");
    }
    
    // Default replies
    if (replies.length === 0) {
      replies.push("Got it!", "Thanks for letting me know", "I'll get back to you", "Sounds good!");
    }
    
    return replies.slice(0, 5);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (smartReplies.length === 0) return;
      
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % smartReplies.length);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + smartReplies.length) % smartReplies.length);
      } else if (e.key === 'Enter' && smartReplies[selectedIndex]) {
        e.preventDefault();
        onSelect(smartReplies[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [smartReplies, selectedIndex, onSelect]);

  if (loading && smartReplies.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 glass-panel border border-white/10 rounded-xl">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full"
        />
        <span className="text-xs text-white/60">AI generating smart replies...</span>
      </div>
    );
  }

  if (smartReplies.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide"
    >
      <div className="flex items-center gap-1 px-2 text-xs text-white/40 whitespace-nowrap">
        <Brain size={12} />
        <span>AI Suggestions:</span>
      </div>
      <div className="flex gap-2">
        {smartReplies.map((reply, index) => (
          <motion.button
            key={index}
            onClick={() => onSelect(reply)}
            onMouseEnter={() => setSelectedIndex(index)}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[32px] ${
              index === selectedIndex
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/10'
            }`}
            aria-label={`Smart reply: ${reply}`}
          >
            <div className="flex items-center gap-1.5">
              <Sparkles size={10} className={index === selectedIndex ? 'text-white' : 'text-indigo-400'} />
              <span>{reply}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default AISmartReplies;
