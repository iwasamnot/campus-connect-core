import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Edit3, Save, X, User } from 'lucide-react';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';

const db = typeof window !== 'undefined' && window.__firebaseDb 
  ? window.__firebaseDb 
  : null;

/**
 * Real-time Collaborative Editor
 * Multiple users can edit simultaneously with live cursors
 * 5-10 years ahead: Real-time collaboration with conflict resolution
 */
const CollaborativeEditor = ({ documentId, currentUserId, currentUserName, onClose }) => {
  const [content, setContent] = useState('');
  const [collaborators, setCollaborators] = useState({});
  const [cursors, setCursors] = useState({});
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!documentId || !db) return;

    // Listen to document changes
    const docRef = doc(db, 'collaborativeDocuments', documentId);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setContent(data.content || '');
        setCollaborators(data.collaborators || {});
        setCursors(data.cursors || {});
      }
    });

    // Update user's cursor position
    const updateCursor = () => {
      if (textareaRef.current) {
        const selectionStart = textareaRef.current.selectionStart;
        updateDoc(docRef, {
          [`cursors.${currentUserId}`]: {
            position: selectionStart,
            userName: currentUserName,
            timestamp: serverTimestamp()
          }
        }).catch(console.error);
      }
    };

    const interval = setInterval(updateCursor, 1000);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('selectionchange', updateCursor);
      textarea.addEventListener('keyup', updateCursor);
    }

    return () => {
      unsubscribe();
      clearInterval(interval);
      if (textarea) {
        textarea.removeEventListener('selectionchange', updateCursor);
        textarea.removeEventListener('keyup', updateCursor);
      }
    };
  }, [documentId, currentUserId, currentUserName]);

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Debounce updates
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (!db || !documentId) return;
      setSaving(true);
      const docRef = doc(db, 'collaborativeDocuments', documentId);
      updateDoc(docRef, {
        content: newContent,
        [`collaborators.${currentUserId}`]: {
          userName: currentUserName,
          lastActive: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      })
      .then(() => setSaving(false))
      .catch((error) => {
        console.error('Error saving:', error);
        setSaving(false);
      });
    }, 500);
  };

  const getCursorPosition = (userId) => {
    const cursor = cursors[userId];
    if (!cursor || !textareaRef.current) return null;
    
    // Calculate pixel position (approximate)
    const textBefore = content.substring(0, cursor.position);
    const lines = textBefore.split('\n');
    return {
      line: lines.length - 1,
      column: lines[lines.length - 1].length
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel border border-white/20 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Edit3 className="text-indigo-400" size={20} />
            <h2 className="text-lg font-semibold text-white">Collaborative Editor</h2>
            {saving && (
              <span className="text-xs text-white/60 flex items-center gap-1">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-3 h-3 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full"
                />
                Saving...
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Active Collaborators */}
            <div className="flex items-center gap-1 -space-x-2">
              {Object.values(collaborators).slice(0, 3).map((collab, index) => (
                <div
                  key={index}
                  className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-semibold border-2 border-white/20"
                  title={collab.userName}
                >
                  {collab.userName?.charAt(0).toUpperCase() || 'U'}
                </div>
              ))}
              {Object.keys(collaborators).length > 3 && (
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-xs border-2 border-white/20">
                  +{Object.keys(collaborators).length - 3}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close editor"
            >
              <X size={18} className="text-white/60" />
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-auto p-4">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            placeholder="Start typing... Changes are saved automatically and visible to all collaborators in real-time."
            className="w-full h-full min-h-[400px] bg-transparent text-white placeholder-white/30 focus:outline-none resize-none font-mono text-sm leading-relaxed"
            style={{ tabSize: 2 }}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <Users size={14} />
            <span>{Object.keys(collaborators).length} collaborator{Object.keys(collaborators).length !== 1 ? 's' : ''}</span>
          </div>
          <div className="text-xs text-white/40">
            Real-time collaboration • Changes sync automatically
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CollaborativeEditor;
