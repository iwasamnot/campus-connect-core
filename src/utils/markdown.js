// Simple markdown parser for message formatting
export const parseMarkdown = (text) => {
  if (!text) return '';

  let html = text
    // Bold **text** or __text__
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    // Italic *text* or _text_
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    // Code `code`
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    // Links [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-600 dark:text-indigo-400 hover:underline">$1</a>')
    // Line breaks
    .replace(/\n/g, '<br />');

  return html;
};

// Check if text contains markdown
export const hasMarkdown = (text) => {
  if (!text) return false;
  return /(\*\*|__|\*|_|`|\[.*?\]\(.*?\))/.test(text);
};

