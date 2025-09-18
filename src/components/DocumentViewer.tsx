import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';

interface DocumentViewerProps {
  title: string;
  content: string;
  fileName?: string;
  onClose: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ title, content, fileName, onClose }) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // Determine if the content should be rendered as Markdown
  const isMarkdown = fileName?.endsWith('.md') || fileName?.endsWith('.markdown');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-viewer-title"
    >
      <div
        className="bg-app-panel rounded-xl overflow-hidden shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
  <div className="flex items-center justify-between px-4 py-3 border-b border-app-border sticky top-0 z-10 bg-app-panel rounded-t-xl">
          <h2 id="doc-viewer-title" className="text-lg font-semibold text-app-text">{title}</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-app-accent/15 text-app-accent hover:bg-app-accent/25 focus:outline-none focus:ring-2 focus:ring-app-accent"
              aria-label="Close document"
              title="Close the document"
            >
              <span className="text-base leading-none">×</span>
              <span>Close</span>
            </button>
          </div>
        </div>
        <div
          className={`overflow-y-auto p-6 flex-1 ${
            isMarkdown 
              ? 'prose prose-invert prose-blue max-w-none text-app-text' 
              : 'whitespace-pre-wrap break-words overflow-x-hidden text-app-text text-sm font-mono'
          }`}
          style={!isMarkdown ? { wordBreak: 'break-word', overflowWrap: 'break-word' } : {}}
        >
          {isMarkdown ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight, rehypeRaw]}
              components={{
                // Custom styling for different elements
                h1: ({ children }) => (
                  <h1 className="text-3xl font-bold text-app-accent mb-6 pb-2 border-b border-app-border">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-2xl font-semibold text-app-text mt-8 mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-app-accent rounded"></span>
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl font-medium text-app-text mt-6 mb-3">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-app-text leading-relaxed mb-4">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-none space-y-2 mb-4 ml-4">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-2 mb-4 ml-4 text-app-text">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="flex items-start gap-2 text-app-text">
                    <span className="text-app-accent mt-1">•</span>
                    <span>{children}</span>
                  </li>
                ),
                code: ({ children, className }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="bg-app-darker px-2 py-1 rounded text-app-accent font-mono text-sm">
                      {children}
                    </code>
                  ) : (
                    <code className={className}>{children}</code>
                  );
                },
                pre: ({ children }) => (
                  <pre className="bg-app-darker border border-app-border rounded-lg p-4 overflow-x-auto mb-4">
                    {children}
                  </pre>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-app-accent">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-app-text opacity-90">
                    {children}
                  </em>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-app-accent bg-app-darker/50 pl-4 py-2 my-4 italic">
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto mb-4">
                    <table className="min-w-full border border-app-border rounded-lg">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="bg-app-darker border-b border-app-border px-4 py-2 text-left font-semibold text-app-accent">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border-b border-app-border px-4 py-2 text-app-text">
                    {children}
                  </td>
                ),
                hr: () => (
                  <hr className="border-app-border my-8" />
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          ) : (
            content
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
