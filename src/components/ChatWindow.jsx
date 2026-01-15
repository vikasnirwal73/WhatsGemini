import React, { useRef, useEffect, useCallback, useMemo, useState } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FaRedo } from "react-icons/fa";
import { AI, YOU } from "../utils/constants";

const ChatWindow = ({ messages = [], onRegenerate, aiLoading }) => {
  const chatEndRef = useRef(null);
  const [typingDots, setTypingDots] = useState(".");
  
  // Determine the starting index for rendering messages
  const startIndex = useMemo(() => {
    // Find the index of the character initialization prompt
    const charPromptIndex = messages.findIndex(
      (m) =>
        m.role === YOU &&
        m.txt &&
        m.txt.startsWith("Role play as, Character Name:")
    );

    if (charPromptIndex !== -1) {
      return charPromptIndex + 2;
    }
    
    // Fallback: If no character prompt found, return 0 to show all messages
    // This handles imported chats or chats without character context better than guessing
    return 0;
  }, [messages]);

  const filteredMessages = useMemo(() => messages.slice(startIndex) || [], [messages, startIndex]);

  // Scroll to the latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (aiLoading) {
      const interval = setInterval(() => {
        setTypingDots((prev) => (prev.length < 3 ? prev + "." : "."));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [aiLoading]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiLoading]);

  // Memoized function to handle regeneration
  const handleRegenerate = useCallback(
    (index) => {
      if (onRegenerate) {
        onRegenerate(index + startIndex);
      }
    },
    [onRegenerate, startIndex]
  );

  return (
    <div className="flex-1 p-4 overflow-auto bg-app-light dark:bg-app-dark relative z-1 h-full">
      {filteredMessages.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center">No messages yet.</p>
      ) : (
        filteredMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === YOU ? "justify-end" : "justify-start"} mb-4`}>
            <div
              className={`relative max-w-[90%] md:max-w-[75%] p-3 px-5 text-base rounded shadow-md ${
                msg.role === YOU
                  ? "bg-bubble-sent-light dark:bg-bubble-sent-dark text-white"
                  : "pr-8 bg-bubble-received-light dark:bg-bubble-received-dark text-gray-900 dark:text-white"
              }`}
            >
              <div className="markdown-content text-left break-words">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                    em: ({node, ...props}) => <em className={`italic ${msg.role === YOU ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`} {...props} />,
                    a: ({node, ...props}) => <a className={`${msg.role === YOU ? 'text-white underline' : 'text-blue-500 hover:underline'}`} target="_blank" rel="noopener noreferrer" {...props} aria-hidden="true" />,
                    ul: ({node, ...props}) => <ul className="list-disc ml-5 mb-2" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal ml-5 mb-2" {...props} />,
                    li: ({node, ...props}) => <li className="mb-1" {...props} />,
                    code: ({node, inline, className, children, ...props}) => {
                      return inline ? (
                        <code className="bg-black/10 dark:bg-white/10 rounded px-1 py-0.5 text-sm" {...props}>
                          {children}
                        </code>
                      ) : (
                        <pre className="bg-black/10 dark:bg-white/10 p-3 rounded-md overflow-x-auto my-2 text-sm">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      );
                    },
                    blockquote: ({node, ...props}) => <blockquote className={`border-l-4 ${msg.role === YOU ? 'border-white/50' : 'border-gray-300'} pl-4 py-1 my-2 italic`} {...props} />,
                    table: ({node, ...props}) => <div className="overflow-x-auto my-2"><table className={`min-w-full divide-y ${msg.role === YOU ? 'divide-white/20 border-white/20' : 'divide-gray-200 dark:divide-gray-700 border-gray-200 dark:border-gray-700'} border`} {...props} /></div>,
                    th: ({node, ...props}) => <th className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border-b ${msg.role === YOU ? 'bg-white/10 border-white/20 text-white' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-300'}`} {...props} />,
                    td: ({node, ...props}) => <td className={`px-3 py-2 whitespace-nowrap text-sm border-b ${msg.role === YOU ? 'border-white/20 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`} {...props} />,
                  }}
                >
                  {msg.txt}
                </ReactMarkdown>
              </div>
              {msg.role === AI && (
                <button
                  onClick={() => handleRegenerate(i)}
                  className="absolute bottom-1 right-2 p-1 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition"
                  title="Regenerate Response"
                >
                  <FaRedo size={12} />
                </button>
              )}
            </div>
          </div>
        ))
      )}
      {aiLoading && (
        <div className="flex justify-start">
          <div className="text-sm text-gray dark:text-white italic">typing{typingDots}</div>
        </div>
      )}
      <div ref={chatEndRef} />
    </div>
  );
};

export default ChatWindow;
