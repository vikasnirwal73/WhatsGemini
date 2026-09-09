import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { FaCheck, FaCopy } from 'react-icons/fa';
import { cn } from '../../utils/cn';

// CodeBlock Component to handle syntax highlighting and copying
const CodeBlock = ({ node, className, children, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : '';
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!match) {
    return (
      <code className="bg-black/10 dark:bg-white/10 rounded px-1.5 py-0.5 text-sm font-mono" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-4 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-1.5 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 font-mono">
        <span>{lang || 'text'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          title="Copy code"
        >
          {copied ? <FaCheck size={12} /> : <FaCopy size={12} />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus as any}
        language={lang}
        PreTag="div"
        customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
        className="bg-[#1E1E1E] text-sm overflow-x-auto"
        {...props}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
};

// Markdown Renderer memoized to prevent re-renders of old messages
const MarkdownRenderer = React.memo(({ msgText, isUser }: { msgText: string | any; isUser: boolean }) => {
  const safeText = typeof msgText === 'string' ? msgText : (typeof msgText?.text === 'string' ? msgText.text : JSON.stringify(msgText));
  return (
    <div className="markdown-content text-left break-words min-w-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
          em: ({ node, ...props }) => <em className={cn("italic", isUser ? 'text-bubble-sentFg/80' : 'text-muted-foreground')} {...props} />,
          // eslint-disable-next-line jsx-a11y/anchor-has-content
          a: ({ node, ...props }) => <a className={cn(isUser ? 'text-bubble-sentFg underline' : 'text-primary hover:underline')} target="_blank" rel="noopener noreferrer" {...props} aria-hidden="true" />,
          ul: ({ node, ...props }) => <ul className="list-disc ml-5 mb-2" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal ml-5 mb-2" {...props} />,
          li: ({ node, ...props }) => <li className="mb-1" {...props} />,
          code: CodeBlock,
          blockquote: ({ node, ...props }) => <blockquote className={cn("border-l-4 pl-4 py-1 my-2 italic", isUser ? 'border-bubble-sentFg/50' : 'border-border')} {...props} />,
          table: ({ node, ...props }) => <div className="overflow-x-auto my-2"><table className={cn("min-w-full divide-y border", isUser ? 'divide-bubble-sentFg/20 border-bubble-sentFg/20' : 'divide-border border-border')} {...props} /></div>,
          th: ({ node, ...props }) => <th className={cn("px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border-b", isUser ? 'bg-black/5 border-bubble-sentFg/20 text-bubble-sentFg' : 'bg-muted border-border text-muted-foreground')} {...props} />,
          td: ({ node, ...props }) => <td className={cn("px-3 py-2 whitespace-nowrap text-sm border-b", isUser ? 'border-bubble-sentFg/20 text-bubble-sentFg' : 'border-border text-muted-foreground')} {...props} />,
        }}
      >
        {safeText}
      </ReactMarkdown>
    </div>
  );
});
MarkdownRenderer.displayName = "MarkdownRenderer";

export default MarkdownRenderer;
