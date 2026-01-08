import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MessageSquare, Plus, X, Edit2, Trash2 } from 'lucide-react';
// Use window.__firebaseDb to avoid import/export issues
const db = typeof window !== 'undefined' && window.__firebaseDb 
  ? window.__firebaseDb 
  : null;
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

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
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <MessageSquare size={24} />
              Quick Replies
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowCreate(true);
                  setEditing(null);
                  setTemplateName('');
                  setTemplateText('');
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus size={18} />
                New Template
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {showCreate ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Meeting Reminder"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  maxLength={50}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Text *
                </label>
                <textarea
                  value={templateText}
                  onChange={(e) => setTemplateText(e.target.value)}
                  placeholder="Enter your message template..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  maxLength={500}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCreate(false);
                    setEditing(null);
                    setTemplateName('');
                    setTemplateText('');
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                >
                  {editing ? 'Update' : 'Create'} Template
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">No templates yet</p>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                  >
                    Create Your First Template
                  </button>
                </div>
              ) : (
                templates.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-800 dark:text-white">
                        {template.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(template)}
                          className="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                          aria-label="Edit template"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          aria-label="Delete template"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 whitespace-pre-wrap">
                      {template.text}
                    </p>
                    <button
                      onClick={() => handleSelect(template)}
                      className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      Use Template
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickReplies;

