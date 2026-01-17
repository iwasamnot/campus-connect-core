import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Plus, X, Calendar, Clock } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Smart Task Extractor
 * Automatically extracts tasks and action items from conversations
 * 5-10 years ahead: AI-powered task management from natural language
 */
const SmartTaskExtractor = ({ messages, onTaskCreated }) => {
  const [extractedTasks, setExtractedTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    extractTasks();
  }, [messages]);

  const extractTasks = async () => {
    if (!messages || messages.length === 0) return;

    setLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
      
      if (apiKey) {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const conversationText = messages
          .slice(-20) // Last 20 messages
          .map(msg => `${msg.userName || 'User'}: ${msg.text || msg.displayText || ''}`)
          .join('\n');

        const prompt = `Extract actionable tasks and to-dos from this conversation. 
Look for:
- Action items (e.g., "I'll send you the file", "Let's schedule a meeting")
- Deadlines and time-sensitive items
- Assignments and responsibilities
- Follow-up actions

Return as JSON array of objects:
[
  {
    "task": "Task description",
    "assignee": "Person responsible (if mentioned)",
    "dueDate": "Date if mentioned, or null",
    "priority": "high|medium|low"
  }
]

Conversation:
${conversationText}

Return ONLY valid JSON array, no other text.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        
        try {
          const jsonMatch = text.match(/\[.*\]/s);
          const tasks = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
          setExtractedTasks(tasks.filter(t => t.task && t.task.length > 0));
        } catch (e) {
          setExtractedTasks(extractFallbackTasks());
        }
      } else {
        setExtractedTasks(extractFallbackTasks());
      }
    } catch (error) {
      console.error('Error extracting tasks:', error);
      setExtractedTasks(extractFallbackTasks());
    } finally {
      setLoading(false);
    }
  };

  const extractFallbackTasks = () => {
    const tasks = [];
    const keywords = ['todo', 'task', 'need to', 'should', 'must', 'deadline', 'remind', 'follow up'];
    
    messages.slice(-10).forEach(msg => {
      const text = (msg.text || msg.displayText || '').toLowerCase();
      keywords.forEach(keyword => {
        if (text.includes(keyword)) {
          const sentence = text.split(/[.!?]/).find(s => s.includes(keyword));
          if (sentence) {
            tasks.push({
              task: sentence.trim(),
              assignee: null,
              dueDate: null,
              priority: 'medium'
            });
          }
        }
      });
    });
    
    return tasks.slice(0, 5);
  };

  const handleCreateTask = (task) => {
    if (onTaskCreated) {
      onTaskCreated({
        ...task,
        id: Date.now(),
        createdAt: new Date(),
        completed: false
      });
    }
    setExtractedTasks(prev => prev.filter(t => t.task !== task.task));
  };

  if (loading && extractedTasks.length === 0) {
    return (
      <div className="glass-panel border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-2 text-sm text-white/60">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full"
          />
          <span>AI extracting tasks from conversation...</span>
        </div>
      </div>
    );
  }

  if (extractedTasks.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel border border-white/10 rounded-xl p-4 space-y-3"
    >
      <div className="flex items-center gap-2 mb-3">
        <CheckSquare className="text-indigo-400" size={18} />
        <h3 className="text-sm font-semibold text-white">Extracted Tasks</h3>
      </div>
      
      <div className="space-y-2">
        {extractedTasks.map((task, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
          >
            <div className="flex-1">
              <div className="text-sm text-white font-medium mb-1">{task.task}</div>
              <div className="flex items-center gap-3 text-xs text-white/60">
                {task.assignee && (
                  <span className="flex items-center gap-1">
                    <span>👤</span>
                    {task.assignee}
                  </span>
                )}
                {task.dueDate && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {task.dueDate}
                  </span>
                )}
                <span className={`px-2 py-0.5 rounded ${
                  task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                  task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {task.priority}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleCreateTask(task)}
                className="p-1.5 hover:bg-indigo-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                aria-label="Create task"
              >
                <Plus size={16} className="text-indigo-400" />
              </button>
              <button
                onClick={() => setExtractedTasks(prev => prev.filter((_, i) => i !== index))}
                className="p-1.5 hover:bg-red-600/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
                aria-label="Dismiss"
              >
                <X size={16} className="text-white/40" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default SmartTaskExtractor;
