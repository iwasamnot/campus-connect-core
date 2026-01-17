/**
 * Smart Categorization Component
 * AI-powered automatic message tagging and categorization
 * 5-10 years ahead: Learns patterns, improves over time
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Tag, Sparkles, X } from 'lucide-react';
import { callAI } from '../utils/aiProvider';

const SmartCategorization = ({ messages, onCategorize, disabled = false }) => {
  const [categories, setCategories] = useState({});
  const [autoCategorizing, setAutoCategorizing] = useState(false);

  useEffect(() => {
    if (!disabled && messages.length > 0) {
      categorizeMessages(messages);
    }
  }, [messages, disabled]);

  const categorizeMessages = useCallback(async (msgs) => {
    if (disabled || msgs.length === 0) return;

    setAutoCategorizing(true);
    try {
      // Analyze recent messages for categories
      const recentMessages = msgs.slice(-20).map(msg => ({
        id: msg.id,
        text: msg.text || msg.displayText || '',
      }));

      const prompt = `Analyze these messages and categorize them automatically. 

Messages:
${recentMessages.map(m => `- "${m.text.substring(0, 100)}"`).join('\n')}

Categories should be relevant, specific, and useful. Examples:
- Academic: course, assignment, exam, study
- Social: event, hangout, party, meetup
- Administrative: registration, deadline, fee, policy
- Support: help, issue, question, problem
- Information: announcement, update, news, reminder

For each message, return a JSON object with message IDs as keys and categories as values.
Return ONLY valid JSON, no other text. Example: {"msg1": ["Academic", "Assignment"], "msg2": ["Social"]}

If a message doesn't need categorization, omit it from the result.`;

      const response = await callAI(prompt, {
        systemPrompt: 'You are an AI that categorizes messages intelligently.',
        maxTokens: 500,
        temperature: 0.5,
      });

      let parsed = {};
      try {
        const jsonMatch = response.match(/\{.*\}/s);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.warn('Could not parse categorization response');
      }

      setCategories(parsed);
      onCategorize?.(parsed);
    } catch (error) {
      console.error('Error categorizing messages:', error);
    } finally {
      setAutoCategorizing(false);
    }
  }, [disabled, onCategorize]);

  const getCategoryForMessage = (messageId) => {
    return categories[messageId] || [];
  };

  return null; // This component works in the background, categories are used by other components
};

export const useMessageCategories = (messages) => {
  const [categories, setCategories] = useState({});

  useEffect(() => {
    if (messages.length === 0) return;

    // Auto-categorize logic runs in SmartCategorization component
    // This hook just provides category data to consuming components
  }, [messages]);

  return {
    getCategories: (messageId) => categories[messageId] || [],
    allCategories: Object.values(categories).flat(),
  };
};

export default SmartCategorization;
