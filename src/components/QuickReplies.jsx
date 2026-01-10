import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MessageSquare, Plus, X, Edit2, Trash2 } from 'lucide-react';
// Use window.__firebaseDb to avoid import/export issues
const db = typeof window !== 'undefined' && window.__firebaseDb 
  ? window.__firebaseDb 
  : null;
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { FadeIn } from './AnimatedComponents';

/**
 * Quick Replies / Message Templates Component
 * Create and use message templates
 */
const QuickReplies = ({ onSelect, onClose }) => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [templates, setTemplates] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [templateText, setTemplateText] = useState('');

  useEffect(() => {
    if (!user?.uid || !db) return;

    const q = query(
      collection(db, 'quickReplies'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const templatesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTemplates(templatesList);
    }, (error) => {
      console.error('Error fetching templates:', error);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleCreate = async () => {
    if (!templateName.trim() || !templateText.trim()) {
      showError('Please fill in both name and text');
      return;
    }

    try {
      if (editing) {
        // Update existing template
        await updateDoc(doc(db, 'quickReplies', editing.id), {
          name: templateName.trim(),
          text: templateText.trim(),
          updatedAt: serverTimestamp()
        });
        success('Template updated successfully');
      } else {
        // Create new template
        await addDoc(collection(db, 'quickReplies'), {
          userId: user.uid,
          name: templateName.trim(),
          text: templateText.trim(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        success('Template created successfully');
      }

      setShowCreate(false);
      setEditing(null);
      setTemplateName('');
      setTemplateText('');
    } catch (error) {
      console.error('Error saving template:', error);
      showError('Failed to save template');
    }
  };

  const handleDelete = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await deleteDoc(doc(db, 'quickReplies', templateId));
      success('Template deleted');
    } catch (error) {
      console.error('Error deleting template:', error);
      showError('Failed to delete template');
    }
  };

  const handleEdit = (template) => {
    setEditing(template);
    setTemplateName(template.name);
    setTemplateText(template.text);
    setShowCreate(true);
  };

  const handleSelect = (template) => {
    onSelect(template.text);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <FadeIn delay={0.1}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="glass-panel shadow-2xl border border-white/10 rounded-[2rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto backdrop-blur-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white text-glow flex items-center gap-3">
                <div className="p-2 glass-panel border border-white/10 rounded-xl">
                  <MessageSquare size={24} className="text-indigo-400" />
                </div>
                Quick Replies
              </h2>
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => {
                    setShowCreate(true);
                    setEditing(null);
                    setTemplateName('');
                    setTemplateText('');
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all duration-300 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl"
                >
                  <Plus size={18} />
                  New Template
                </motion.button>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.05, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2.5 glass-panel border border-white/10 rounded-xl text-white/70 hover:text-white hover:border-white/20 transition-all"
                  aria-label="Close"
                >
                  <X size={24} />
                </motion.button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {showCreate ? (
                <motion.div
                  key="create"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-sm font-semibold text-white/90 mb-2.5">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="e.g., Meeting Reminder"
                      className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300 hover:border-white/20"
                      maxLength={50}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white/90 mb-2.5">
                      Template Text *
                    </label>
                    <textarea
                      value={templateText}
                      onChange={(e) => setTemplateText(e.target.value)}
                      placeholder="Enter your message template..."
                      rows={4}
                      className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300 hover:border-white/20 resize-none"
                      maxLength={500}
                    />
                  </div>
                  <div className="flex gap-3">
                    <motion.button
                      onClick={() => {
                        setShowCreate(false);
                        setEditing(null);
                        setTemplateName('');
                        setTemplateText('');
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2.5 glass-panel border border-white/10 text-white/80 hover:text-white hover:border-white/20 rounded-xl transition-all duration-300 font-medium"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={handleCreate}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
                    >
                      {editing ? 'Update' : 'Create'} Template
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {templates.length === 0 ? (
                    <div className="text-center py-12">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="inline-block p-4 glass-panel border border-white/10 rounded-2xl mb-4"
                      >
                        <MessageSquare size={48} className="mx-auto text-white/40 mb-4" />
                      </motion.div>
                      <p className="text-white/60 mb-4 font-medium">No templates yet</p>
                      <motion.button
                        onClick={() => setShowCreate(true)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
                      >
                        Create Your First Template
                      </motion.button>
                    </div>
                  ) : (
                    templates.map((template, index) => (
                      <motion.div
                        key={template.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ y: -2, scale: 1.01 }}
                        className="p-4 glass-panel border border-white/10 rounded-xl hover:border-white/20 transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-white">
                            {template.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            <motion.button
                              onClick={() => handleEdit(template)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-2 text-indigo-400 hover:bg-indigo-600/20 rounded-lg transition-all"
                              aria-label="Edit template"
                            >
                              <Edit2 size={16} />
                            </motion.button>
                            <motion.button
                              onClick={() => handleDelete(template.id)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-2 text-red-400 hover:bg-red-600/20 rounded-lg transition-all"
                              aria-label="Delete template"
                            >
                              <Trash2 size={16} />
                            </motion.button>
                          </div>
                        </div>
                        <p className="text-sm text-white/70 mb-3 whitespace-pre-wrap leading-relaxed">
                          {template.text}
                        </p>
                        <motion.button
                          onClick={() => handleSelect(template)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl"
                        >
                          Use Template
                        </motion.button>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </FadeIn>
    </div>
  );
};

export default QuickReplies;
