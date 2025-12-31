import { useState, useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

const KeyboardShortcuts = () => {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    { key: 'Ctrl/Cmd + K', description: 'Open search' },
    { key: 'Ctrl/Cmd + /', description: 'Show keyboard shortcuts' },
    { key: 'Esc', description: 'Close modals/dialogs' },
    { key: 'Ctrl/Cmd + Enter', description: 'Send message' },
    { key: 'Ctrl/Cmd + B', description: 'Toggle sidebar (mobile)' },
    { key: 'Ctrl/Cmd + D', description: 'Toggle dark mode' },
    { key: '↑', description: 'Edit last message' },
    { key: 'Tab', description: 'Autocomplete mentions' },
  ];

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + / to open shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsOpen(true);
      }
      // Esc to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Keyboard className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="text-gray-700 dark:text-gray-300">
                  {shortcut.description}
                </span>
                <kbd className="px-3 py-1.5 text-sm font-semibold text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Tip:</strong> Press <kbd className="px-2 py-1 text-xs bg-white dark:bg-gray-800 rounded border">Ctrl/Cmd + /</kbd> anytime to view these shortcuts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;

