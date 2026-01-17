import { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Code, Link, List, Image as ImageIcon, X, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Rich Text Editor Component
 * Markdown-style formatting with preview
 */
const RichTextEditor = ({ value, onChange, placeholder = 'Type your message...', maxLength = 2000 }) => {
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  // Markdown shortcuts
  const shortcuts = {
    '**': 'bold',
    '*': 'italic',
    '`': 'code',
    '[]': 'link',
    '- ': 'list'
  };

  const insertText = (before, after = '', placeholder = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textBefore = value.substring(0, start);
    const textAfter = value.substring(end);

    const newText = textBefore + before + (selectedText || placeholder) + after + textAfter;
    onChange(newText);

    // Set cursor position
    setTimeout(() => {
      const newPosition = start + before.length + (selectedText ? selectedText.length : placeholder.length);
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
    }, 0);
  };

  const formatBold = () => insertText('**', '**', 'bold text');
  const formatItalic = () => insertText('*', '*', 'italic text');
  const formatCode = () => insertText('`', '`', 'code');
  const formatLink = () => insertText('[', '](url)', 'link text');
  const formatList = () => insertText('- ', '', 'list item');

  const parseMarkdown = (text) => {
    // Simple markdown parser
    let html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-white/10 px-1 py-0.5 rounded">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-indigo-400 hover:underline" target="_blank" rel="noopener">$1</a>')
      .replace(/^- (.*)$/gm, '<li>$1</li>')
      .replace(/\n/g, '<br />');

    // Wrap list items
    html = html.replace(/(<li>.*<\/li>)/s, '<ul class="list-disc list-inside ml-4">$1</ul>');

    return html;
  };

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="flex items-center gap-1 mb-2 p-2 glass-panel border border-white/10 rounded-lg">
        <button
          type="button"
          onClick={formatBold}
          className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
          title="Bold (Ctrl+B)"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={formatItalic}
          className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
          title="Italic (Ctrl+I)"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={formatCode}
          className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
          title="Code (Ctrl+`)"
        >
          <Code size={16} />
        </button>
        <button
          type="button"
          onClick={formatLink}
          className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
          title="Link"
        >
          <Link size={16} />
        </button>
        <button
          type="button"
          onClick={formatList}
          className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
          title="List"
        >
          <List size={16} />
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
          title="Preview"
        >
          <Eye size={16} />
        </button>
      </div>

      {/* Editor */}
      <AnimatePresence mode="wait">
        {showPreview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-[100px] p-3 glass-panel border border-white/10 rounded-lg bg-white/5"
          >
            <div
              className="prose prose-invert max-w-none text-sm text-white/90"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(value) }}
            />
          </motion.div>
        ) : (
          <motion.textarea
            key="editor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setSelection({ start: e.target.selectionStart, end: e.target.selectionEnd });
            }}
            onSelect={(e) => {
              setSelection({ start: e.target.selectionStart, end: e.target.selectionEnd });
            }}
            placeholder={placeholder}
            maxLength={maxLength}
            className="w-full min-h-[100px] p-3 glass-panel border border-white/10 rounded-lg bg-white/5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none font-mono text-sm"
          />
        )}
      </AnimatePresence>

      {/* Character count */}
      <div className="mt-1 text-xs text-white/40 text-right">
        {value.length} / {maxLength}
      </div>
    </div>
  );
};

export default RichTextEditor;
