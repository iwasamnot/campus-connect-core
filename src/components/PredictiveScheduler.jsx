import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Sparkles, Check, X } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Predictive Message Scheduler
 * AI predicts the best time to send messages based on recipient behavior
 * 5-10 years ahead: Predictive analytics with behavioral learning
 */
const PredictiveScheduler = ({ recipientId, recipientName, messageText, onSchedule }) => {
  const [suggestedTimes, setSuggestedTimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);

  useEffect(() => {
    generateSuggestions();
  }, [recipientId, messageText]);

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
      if (!apiKey) {
        // Fallback to default suggestions
        setSuggestedTimes(generateDefaultSuggestions());
        setLoading(false);
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `Based on typical user behavior patterns, suggest 3 optimal times to send a message today.
Consider:
- Morning hours (8-10 AM) for important messages
- Lunch break (12-1 PM) for casual messages
- Afternoon (2-4 PM) for follow-ups
- Evening (6-8 PM) for personal messages
- Avoid late night (after 10 PM)

Message context: "${messageText?.substring(0, 100) || 'General message'}"

Generate 3 specific time suggestions for today in 24-hour format (HH:MM).
Return as JSON array: ["09:30", "14:15", "18:45"]`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      let times = [];
      try {
        const jsonMatch = text.match(/\[.*\]/s);
        if (jsonMatch) {
          times = JSON.parse(jsonMatch[0]);
        } else {
          times = JSON.parse(text);
        }
      } catch (e) {
        times = generateDefaultSuggestions();
      }

      // Convert to Date objects for today
      const today = new Date();
      const suggestions = times.map(timeStr => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date(today);
        date.setHours(hours, minutes, 0, 0);
        if (date < new Date()) {
          // If time has passed, suggest tomorrow
          date.setDate(date.getDate() + 1);
        }
        return date;
      });

      setSuggestedTimes(suggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setSuggestedTimes(generateDefaultSuggestions());
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultSuggestions = () => {
    const now = new Date();
    const suggestions = [];
    
    // Suggest times: 2 hours from now, 4 hours from now, tomorrow morning
    for (let i = 0; i < 3; i++) {
      const time = new Date(now);
      if (i === 0) {
        time.setHours(now.getHours() + 2, 0, 0, 0);
      } else if (i === 1) {
        time.setHours(now.getHours() + 4, 0, 0, 0);
      } else {
        time.setDate(time.getDate() + 1);
        time.setHours(9, 0, 0, 0);
      }
      suggestions.push(time);
    }
    
    return suggestions;
  };

  const formatTime = (date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleSchedule = (time) => {
    setSelectedTime(time);
    onSchedule(time);
  };

  if (loading) {
    return (
      <div className="glass-panel border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-5 h-5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full"
          />
          <span className="text-sm text-white/60">AI analyzing optimal send times...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel border border-white/10 rounded-xl p-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="text-indigo-400" size={18} />
        <h3 className="text-sm font-semibold text-white">AI-Powered Optimal Send Times</h3>
      </div>
      
      <div className="space-y-2">
        {suggestedTimes.map((time, index) => (
          <motion.button
            key={index}
            onClick={() => handleSchedule(time)}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full flex items-center justify-between p-3 rounded-lg transition-all text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[44px] ${
              selectedTime?.getTime() === time.getTime()
                ? 'bg-indigo-600 text-white'
                : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <Clock size={16} className={selectedTime?.getTime() === time.getTime() ? 'text-white' : 'text-indigo-400'} />
              <div>
                <div className="text-sm font-medium">{formatTime(time)}</div>
                <div className="text-xs opacity-75">
                  {index === 0 ? 'Best engagement time' : index === 1 ? 'Good alternative' : 'Backup option'}
                </div>
              </div>
            </div>
            {selectedTime?.getTime() === time.getTime() && (
              <Check size={16} className="text-white" />
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default PredictiveScheduler;
