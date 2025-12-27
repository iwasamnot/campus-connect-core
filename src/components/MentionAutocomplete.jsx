import { useState, useEffect, useRef } from 'react';
import { User } from 'lucide-react';

const MentionAutocomplete = ({ text, cursorPosition, users, onSelect }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [show, setShow] = useState(false);
  const [mentionStart, setMentionStart] = useState(-1);
  const listRef = useRef(null);

  useEffect(() => {
    if (!text || cursorPosition === null) {
      setShow(false);
      return;
    }

    // Find @ mention
    const textBeforeCursor = text.substring(0, cursorPosition);
    const match = textBeforeCursor.match(/@(\w*)$/);

    if (match) {
      const query = match[1].toLowerCase();
      const start = cursorPosition - match[0].length;
      
      setMentionStart(start);
      
      // Filter users
      const filtered = users
        .filter(user => 
          user.name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.studentEmail?.toLowerCase().includes(query)
        )
        .slice(0, 5);

      setSuggestions(filtered);
      setShow(filtered.length > 0);
      setSelectedIndex(0);
    } else {
      setShow(false);
    }
  }, [text, cursorPosition, users]);

  useEffect(() => {
    if (show && listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, show]);

  const handleSelect = (user) => {
    if (onSelect && mentionStart !== -1) {
      const textBefore = text.substring(0, mentionStart);
      const textAfter = text.substring(cursorPosition);
      const newText = `${textBefore}@${user.name} ${textAfter}`;
      onSelect(newText, mentionStart + user.name.length + 2);
    }
    setShow(false);
  };

  const handleKeyDown = (e) => {
    if (!show) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (suggestions[selectedIndex]) {
        handleSelect(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShow(false);
    }
  };

  if (!show || suggestions.length === 0) return null;

  return (
    <>
      <div
        ref={listRef}
        className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto z-50 animate-scale-in"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {suggestions.map((user, index) => (
          <button
            key={user.id}
            onClick={() => handleSelect(user)}
            className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
              index === selectedIndex
                ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
            }`}
          >
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user.name || 'Unknown User'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user.email || user.studentEmail || ''}
              </p>
            </div>
          </button>
        ))}
      </div>
      <div className="fixed inset-0 z-40" onClick={() => setShow(false)} />
    </>
  );
};

export default MentionAutocomplete;

