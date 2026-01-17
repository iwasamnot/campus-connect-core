/**
 * Contextual Actions Component
 * Provides smart action suggestions based on message content
 * 5-10 years ahead: AI-powered context understanding
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  MapPin, 
  Link as LinkIcon, 
  FileText, 
  Phone, 
  Mail, 
  UserPlus,
  Tag,
  Bookmark,
  Share2,
  Sparkles
} from 'lucide-react';
import { callAI } from '../utils/aiProvider';

const ContextualActions = ({ message, onAction, user }) => {
  const [suggestedActions, setSuggestedActions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!message?.text && !message?.displayText) return;
    
    analyzeMessage(message);
  }, [message]);

  const analyzeMessage = useCallback(async (msg) => {
    const text = msg.text || msg.displayText || '';
    if (!text || text.length < 10) return;

    setLoading(true);
    try {
      const prompt = `Analyze this message and suggest relevant actions the user might want to take. 

Message: "${text}"

Consider actions like:
- Create calendar event (if mentions date/time/meeting)
- Open location (if mentions address/place)
- Extract link (if contains URL)
- Save to notes (if contains important info)
- Call contact (if mentions phone/call)
- Email contact (if mentions email)
- Add to contacts (if mentions person name)
- Tag/categorize (if contains topic/keyword)
- Bookmark/save (if contains reference)
- Share (if contains shareable content)

Return ONLY a JSON array of action objects, max 4 actions. Each action should have: { type: "action_type", label: "Human readable label", icon: "icon_name" }

Example: [{"type": "calendar", "label": "Create event", "icon": "calendar"}, {"type": "bookmark", "label": "Save message", "icon": "bookmark"}]

If no relevant actions, return empty array: []`;

      const response = await callAI(prompt, {
        systemPrompt: 'You are a helpful AI that suggests relevant actions based on message content.',
        maxTokens: 200,
        temperature: 0.7,
      });

      let actions = [];
      try {
        const jsonMatch = response.match(/\[.*\]/s);
        if (jsonMatch) {
          actions = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        // Fallback: extract actions manually
        if (text.toLowerCase().includes('meeting') || text.toLowerCase().includes('schedule')) {
          actions.push({ type: 'calendar', label: 'Create event', icon: 'calendar' });
        }
        if (text.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/)) {
          actions.push({ type: 'phone', label: 'Call number', icon: 'phone' });
        }
        if (text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)) {
          actions.push({ type: 'email', label: 'Email contact', icon: 'mail' });
        }
      }

      setSuggestedActions(actions.slice(0, 4));
    } catch (error) {
      console.error('Error analyzing message:', error);
      setSuggestedActions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const iconMap = {
    calendar: Calendar,
    map: MapPin,
    link: LinkIcon,
    file: FileText,
    phone: Phone,
    email: Mail,
    contact: UserPlus,
    tag: Tag,
    bookmark: Bookmark,
    share: Share2,
  };

  const handleAction = (action) => {
    onAction?.(action, message);
  };

  if (loading || suggestedActions.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute bottom-full left-0 mb-2 glass-panel border border-white/10 rounded-xl p-2 shadow-xl z-50"
      >
        <div className="flex items-center gap-2 mb-2 px-2 text-xs text-white/60">
          <Sparkles size={12} />
          <span>Suggested Actions</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {suggestedActions.map((action, index) => {
            const Icon = iconMap[action.icon] || Sparkles;
            return (
              <motion.button
                key={index}
                onClick={() => handleAction(action)}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-indigo-600/80 text-white text-xs rounded-lg transition-all border border-white/10 hover:border-indigo-500/50"
              >
                <Icon size={12} />
                <span>{action.label}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ContextualActions;
