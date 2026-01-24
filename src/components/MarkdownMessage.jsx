import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Shared Markdown Message Component
 * Renders markdown content consistently across all components
 * Used for AI messages and any message that contains markdown
 */
const MarkdownMessage = ({ content, className = '' }) => {
  if (!content || typeof content !== 'string') {
    return null;
  }

  return (
    <div className={`text-sm text-white/90 prose prose-invert prose-sm max-w-none ${className}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom styling for markdown elements to match dark theme
          h1: ({node, ...props}) => <h1 className="text-xl font-bold text-indigo-300 mt-4 mb-2" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-lg font-bold text-indigo-300 mt-3 mb-2" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-base font-bold text-indigo-300 mt-2 mb-1" {...props} />,
          strong: ({node, ...props}) => <strong className="font-bold text-indigo-300" {...props} />,
          p: ({node, ...props}) => <p className="my-1 break-words" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc ml-4 my-2 space-y-1" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal ml-4 my-2 space-y-1" {...props} />,
          li: ({node, ...props}) => <li className="my-0.5 break-words" {...props} />,
          code: ({node, inline, ...props}) => 
            inline ? (
              <code className="bg-white/10 px-1 py-0.5 rounded text-indigo-300 text-xs" {...props} />
            ) : (
              <code className="block bg-white/5 p-2 rounded my-2 overflow-x-auto text-xs" {...props} />
            ),
          pre: ({node, ...props}) => <pre className="bg-white/5 p-2 rounded my-2 overflow-x-auto" {...props} />,
          a: ({node, ...props}) => <a className="text-indigo-400 hover:text-indigo-300 underline" target="_blank" rel="noopener noreferrer" {...props} />,
          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-500 pl-4 my-2 italic text-white/80" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownMessage;
