import React, { useRef, useEffect, useCallback, useMemo, useState } from "react";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { FaRedo, FaEdit, FaCheck, FaTimes, FaEllipsisV, FaCopy, FaArrowDown } from "react-icons/fa";
import { AI, YOU, LS_INITIAL_MESSAGES } from "../utils/constants";
import { Message } from "../types";
import { cn } from "../utils/cn";
import { DisplayImage } from "./DisplayImage";

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
          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
          em: ({node, ...props}) => <em className={cn("italic", isUser ? 'text-white/80' : 'text-gray-500 dark:text-gray-400')} {...props} />,
          // eslint-disable-next-line jsx-a11y/anchor-has-content
          a: ({node, ...props}) => <a className={cn(isUser ? 'text-white underline' : 'text-blue-500 hover:underline')} target="_blank" rel="noopener noreferrer" {...props} aria-hidden="true" />,
          ul: ({node, ...props}) => <ul className="list-disc ml-5 mb-2" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal ml-5 mb-2" {...props} />,
          li: ({node, ...props}) => <li className="mb-1" {...props} />,
          code: CodeBlock,
          blockquote: ({node, ...props}) => <blockquote className={cn("border-l-4 pl-4 py-1 my-2 italic", isUser ? 'border-white/50' : 'border-gray-300')} {...props} />,
          table: ({node, ...props}) => <div className="overflow-x-auto my-2"><table className={cn("min-w-full divide-y border", isUser ? 'divide-white/20 border-white/20' : 'divide-gray-200 dark:divide-gray-700 border-gray-200 dark:border-gray-700')} {...props} /></div>,
          th: ({node, ...props}) => <th className={cn("px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border-b", isUser ? 'bg-white/10 border-white/20 text-white' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-300')} {...props} />,
          td: ({node, ...props}) => <td className={cn("px-3 py-2 whitespace-nowrap text-sm border-b", isUser ? 'border-white/20 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300')} {...props} />,
        }}
      >
        {safeText}
      </ReactMarkdown>
    </div>
  );
});
MarkdownRenderer.displayName = "MarkdownRenderer";

// Message Menu Component
const MessageMenu = ({ isOpen, onClose, children }: { isOpen: boolean, onClose: () => void, children: React.ReactNode, isUserMessage?: boolean }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute top-8 right-0 z-50 min-w-[140px] py-1 rounded-lg shadow-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
    >
      {children}
    </div>
  );
};

const MenuItem = ({ icon: Icon, label, onClick, disabled, danger }: { icon: any, label: string, onClick: () => void, disabled?: boolean, danger?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-2 text-sm transition",
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700',
      danger ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'
    )}
  >
    <Icon size={14} />
    <span>{label}</span>
  </button>
);

interface ChatWindowProps {
  messages: Message[];
  onRegenerate?: (index: number) => void;
  onEdit?: (index: number, text: string, isImageRequest?: boolean) => void;
  onSend?: (text: string, isImageRequest?: boolean) => void;
  aiLoading?: boolean;
  characterName?: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages = [], onRegenerate, onEdit, onSend, aiLoading, characterName }) => {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [typingDots, setTypingDots] = useState(".");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editIsImageRequest, setEditIsImageRequest] = useState(false);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      setIsScrolledUp(scrollHeight - scrollTop - clientHeight > 100);
    }
  }, []);
  
  const startIndex = useMemo(() => {
    let index = 0;
    
    const charPromptIndex = messages.findIndex(
      (m) =>
        m.role === YOU &&
        m.txt &&
        m.txt.startsWith("Role play as, Character Name:")
    );
    if (charPromptIndex !== -1) {
      index = Math.max(index, charPromptIndex + 2);
    }
    
    // Hide the [SYSTEM DIRECTIVE] summary message added during compression
    const sysDirIndex = messages.findIndex(
      (m) =>
        m.role === YOU &&
        m.txt &&
        m.txt.startsWith("[SYSTEM DIRECTIVE]:")
    );
    if (sysDirIndex !== -1) {
      index = Math.max(index, sysDirIndex + 2);
    }

    return index;
  }, [messages]);

  const filteredMessages = useMemo(() => {
    let sliced = messages.slice(startIndex) || [];
    
    // Hide explicitly flagged system setup messages
    sliced = sliced.filter(m => !m.isSystem);

    // Additionally hide backward compatibility pre-populated InitialMessages
    // if they weren't explicitly flagged (e.g. from an older app state)
    try {
      const savedMessages = JSON.parse(localStorage.getItem(LS_INITIAL_MESSAGES) || "[]") as any[];
      let hiddenCount = 0;
      for (let i = 0; i < savedMessages.length && i < sliced.length; i++) {
        if (sliced[i].role === savedMessages[i].role && sliced[i].txt?.trim() === savedMessages[i].message?.trim()) {
          hiddenCount++;
        } else {
          break;
        }
      }
      if (hiddenCount > 0) {
        sliced = sliced.slice(hiddenCount);
      }
    } catch (err) {
      console.warn("Failed to parse initial messages for filtering", err);
    }
    
    return sliced;
  }, [messages, startIndex]);

  useEffect(() => {
    setEditingIndex(null);
    setEditText("");
  }, [messages]);

  const prevMessagesLengthRef = useRef(messages.length);

  useEffect(() => {
    if (!isScrolledUp) {
      // Determine if we should smooth scroll or jump instantly
      // Jump instantly if loading a new chat (length jumps significantly or goes from 0 to N)
      const diff = Math.abs(messages.length - prevMessagesLengthRef.current);
      const isInstant = prevMessagesLengthRef.current === 0 || diff > 1;
      
      chatEndRef.current?.scrollIntoView({ behavior: isInstant ? "auto" : "smooth" });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, aiLoading, isScrolledUp]);

  useEffect(() => {
    if (aiLoading) {
      const interval = setInterval(() => {
        setTypingDots((prev) => (prev.length < 3 ? prev + "." : "."));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [aiLoading]);

  const handleRegenerate = useCallback(
    (msg: Message) => {
      if (onRegenerate) {
        const originalIndex = messages.indexOf(msg);
        if (originalIndex !== -1) {
          onRegenerate(originalIndex);
        }
      }
    },
    [onRegenerate, messages]
  );

  const startEdit = useCallback((msg: Message) => {
    const originalIndex = messages.indexOf(msg);
    if (originalIndex !== -1) {
      setEditingIndex(originalIndex);
      setEditText(msg.txt || "");
      setEditIsImageRequest(msg.isImageRequest || false);
    }
  }, [messages]);

  const cancelEdit = useCallback(() => {
    setEditingIndex(null);
    setEditText("");
    setEditIsImageRequest(false);
  }, []);

  const saveEdit = useCallback(() => {
    if (editText.trim() && onEdit && editingIndex !== null) {
      onEdit(editingIndex, editText.trim(), editIsImageRequest);
      setEditingIndex(null);
      setEditText("");
      setEditIsImageRequest(false);
    }
  }, [editText, editIsImageRequest, editingIndex, onEdit]);

  const toggleMenu = useCallback((index: number) => {
    setOpenMenuIndex(prev => prev === index ? null : index);
  }, []);

  const closeMenu = useCallback(() => {
    setOpenMenuIndex(null);
  }, []);

  const copyMessage = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    closeMenu();
  }, [closeMenu]);

  const getInitials = (name?: string) => {
    if (!name || name === "New Chat" || name.trim() === "Chat") return "G";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return "G";
  };
  const charInitials = getInitials(characterName);

  return (
    <div 
      className="flex-1 p-4 overflow-auto bg-transparent relative z-1 h-full w-full max-w-4xl mx-auto pb-32"
      ref={scrollContainerRef}
      onScroll={handleScroll}
    >
      {filteredMessages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full w-full px-4 -mt-20">
          <div className="w-20 h-20 rounded-full bg-gemini-logo flex items-center justify-center shadow-2xl mb-8">
            <span className="text-white font-bold text-4xl">{charInitials}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-medium text-slate-900 dark:text-slate-100 mb-10">New Conversation</h2>
          
          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
            {[
              "Draft a blog post about AI ethics",
              "Explain complex code simply",
              "Generate image ideas for branding",
              "Debug a Python script"
            ].map((prompt) => (
              <button
                key={prompt}
                onClick={() => onSend && onSend(prompt)}
                className="bg-panel-light dark:bg-panel-dark hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 py-4 px-6 rounded-xl text-left transition shadow-sm font-medium"
              >
                {prompt}
              </button>
            ))}
          </div> */}
        </div>
      ) : (
        filteredMessages.map((msg, i) => {
          const isUser = msg.role === YOU;

          return (
            <div key={i} className={cn("flex w-full mb-6", isUser ? "justify-end" : "justify-start")}>
              {/* AI Avatar */}
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-gemini-logo flex items-center justify-center flex-shrink-0 mt-1 mr-3 shadow-md">
                  <span className="text-white font-bold text-sm">{charInitials}</span>
                </div>
              )}

              <div
                className={cn(
                  "relative p-4 rounded-3xl max-w-[85%] md:max-w-[70%] shadow-sm min-w-0 group",
                  isUser 
                    ? "bg-primary text-white rounded-tr-sm" 
                    : "bg-slate-200 dark:bg-slate-700/60 text-gray-900 dark:text-slate-100 rounded-tl-sm border border-transparent dark:border-slate-600/50"
                )}
                style={{ fontSize: 'var(--chat-font-size, 16px)' }}
              >
                  <>
                    <MarkdownRenderer msgText={msg.txt || ""} isUser={isUser} />
                    {msg.images && msg.images.map((imgSrc, idx) => (
                      <DisplayImage key={idx} srcContext={imgSrc} alt="Generated" className="mt-2 max-w-full rounded-lg shadow-sm border border-white/20 dark:border-slate-700" />
                    ))}
                    <div className="absolute top-2 right-2">
                      <button
                        onClick={() => toggleMenu(i)}
                        className={cn(
                          "p-1.5 rounded-full transition opacity-0 group-hover:opacity-100",
                          isUser ? 'text-white/80 hover:text-white hover:bg-white/20' : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white hover:bg-gray-300 dark:hover:bg-slate-600'
                        )}
                        title="More options"
                        aria-label="Message options"
                      >
                        <FaEllipsisV size={12} />
                      </button>
                      <button
                        onClick={() => startEdit(msg)}
                        className={cn(
                          "p-1.5 rounded-full transition opacity-0 group-hover:opacity-100 ml-1",
                          isUser ? 'text-white/80 hover:text-white hover:bg-white/20' : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white hover:bg-gray-300 dark:hover:bg-slate-600'
                        )}
                        title="Edit message"
                        aria-label="Edit message"
                      >
                        <FaEdit size={12} />
                      </button>
                      <MessageMenu isOpen={openMenuIndex === i} onClose={closeMenu} isUserMessage={isUser}>
                        <MenuItem icon={FaCopy} label="Copy" onClick={() => copyMessage(msg.txt || "")} />
                        {msg.role === AI && (
                          <MenuItem icon={FaRedo} label="Regenerate" onClick={() => { handleRegenerate(msg); closeMenu(); }} disabled={aiLoading} />
                        )}
                        <MenuItem icon={FaEdit} label="Edit" onClick={() => { startEdit(msg); closeMenu(); }} disabled={aiLoading} />
                      </MessageMenu>
                    </div>
                    {/* Action Row for AI Messages */}
                    {!isUser && (
                      <div className="flex items-center gap-4 mt-3 pt-2 text-xs text-gray-500 dark:text-slate-400">
                        <button onClick={() => copyMessage(msg.txt || "")} className="flex items-center gap-1.5 hover:text-gray-800 dark:hover:text-slate-200 transition">
                          <FaCopy size={12} /> Copy
                        </button>
                        <button onClick={() => handleRegenerate(msg)} className="flex items-center gap-1.5 hover:text-gray-800 dark:hover:text-slate-200 transition">
                          <FaRedo size={12} /> Regenerate
                        </button>
                        <button onClick={() => startEdit(msg)} className="flex items-center gap-1.5 hover:text-gray-800 dark:hover:text-slate-200 transition">
                          <FaEdit size={12} /> Edit
                        </button>
                      </div>
                    )}
                  </>
              </div>
            </div>
          );
        })
      )}
      {aiLoading && (
        <div className="flex justify-start">
          <div className="text-sm text-gray dark:text-white italic">typing{typingDots}</div>
        </div>
      )}
      <div ref={chatEndRef} />
      {isScrolledUp && (
        <button
          onClick={() => {
            setIsScrolledUp(false);
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
          className="fixed bottom-24 right-6 z-50 p-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary-hover transition transform hover:scale-105 flex items-center justify-center opacity-80 hover:opacity-100"
          title="Scroll to bottom"
          aria-label="Scroll to bottom"
        >
          <FaArrowDown size={16} />
        </button>
      )}

      {/* Full Screen Edit Modal */}
      {editingIndex !== null && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col h-[80vh] md:h-[70vh] border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Edit Message</h3>
              <button 
                onClick={cancelEdit}
                className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                <FaTimes size={18} />
              </button>
            </div>
            
            <div className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col">
              <textarea
                ref={(el) => { if (el) el.focus() }}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="flex-1 w-full p-4 rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none text-base disabled:opacity-50"
                placeholder="Type your message here..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    saveEdit();
                  }
                  if (e.key === "Escape") {
                    cancelEdit();
                  }
                }}
              />
              <div className="mt-2 text-xs text-gray-500 dark:text-slate-400 flex justify-between">
                <span>Markdown is supported.</span>
                <span><kbd className="bg-gray-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">Enter</kbd> to save, <kbd className="bg-gray-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">Shift+Enter</kbd> for new line, <kbd className="bg-gray-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">Esc</kbd> to cancel</span>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-slate-800 flex justify-between gap-3 bg-gray-50 dark:bg-slate-900/50 rounded-b-2xl items-center">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200 transition select-none">
                <input
                  type="checkbox"
                  checked={editIsImageRequest}
                  onChange={(e) => setEditIsImageRequest(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 bg-transparent"
                  title="Request image generation"
                />
                <span>Generate Image</span>
              </label>

              <div className="flex gap-3">
                <button 
                  onClick={cancelEdit}
                  className="px-5 py-2.5 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveEdit}
                  disabled={!editText.trim()}
                  className="px-5 py-2.5 rounded-xl font-medium bg-primary text-white hover:bg-primary-hover transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                >
                  <FaCheck size={14} />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
