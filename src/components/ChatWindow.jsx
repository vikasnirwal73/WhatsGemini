import React, { useRef, useEffect, useCallback, useMemo, useState } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FaRedo, FaEdit, FaCheck, FaTimes, FaEllipsisV, FaCopy } from "react-icons/fa";
import { AI, YOU } from "../utils/constants";

// Message Menu Component
const MessageMenu = ({ isOpen, onClose, children, isUserMessage }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
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
      className={`absolute top-8 right-0 z-50 min-w-[140px] py-1 rounded-lg shadow-lg border
        bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700`}
    >
      {children}
    </div>
  );
};

const MenuItem = ({ icon: Icon, label, onClick, disabled, danger }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
      ${danger ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'}`}
  >
    <Icon size={14} />
    <span>{label}</span>
  </button>
);

const ChatWindow = ({ messages = [], onRegenerate, onEdit, aiLoading }) => {
  const chatEndRef = useRef(null);
  const [typingDots, setTypingDots] = useState(".");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState("");
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  
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

  // Clear editing state when messages change (prevents stale edit state)
  useEffect(() => {
    setEditingIndex(null);
    setEditText("");
  }, [messages]);

  // Scroll to the latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiLoading]);

  useEffect(() => {
    if (aiLoading) {
      const interval = setInterval(() => {
        setTypingDots((prev) => (prev.length < 3 ? prev + "." : "."));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [aiLoading]);

  // Memoized function to handle regeneration
  const handleRegenerate = useCallback(
    (index) => {
      if (onRegenerate) {
        onRegenerate(index + startIndex);
      }
    },
    [onRegenerate, startIndex]
  );

  // Start editing a message
  const startEdit = useCallback((index, messageText) => {
    setEditingIndex(index);
    setEditText(messageText);
  }, []);

  // Cancel editing
  const cancelEdit = useCallback(() => {
    setEditingIndex(null);
    setEditText("");
  }, []);

  // Save edited message
  const saveEdit = useCallback(() => {
    if (editText.trim() && onEdit) {
      onEdit(editingIndex + startIndex, editText.trim());
      setEditingIndex(null);
      setEditText("");
    }
  }, [editText, editingIndex, onEdit, startIndex]);

  // Toggle menu
  const toggleMenu = useCallback((index) => {
    setOpenMenuIndex(openMenuIndex === index ? null : index);
  }, [openMenuIndex]);

  // Close menu
  const closeMenu = useCallback(() => {
    setOpenMenuIndex(null);
  }, []);

  // Copy message to clipboard
  const copyMessage = useCallback((text) => {
    navigator.clipboard.writeText(text);
    closeMenu();
  }, [closeMenu]);

  return (
    <div className="flex-1 p-4 overflow-auto bg-app-light dark:bg-app-dark relative z-1 h-full max-w-full">
      {filteredMessages.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center">No messages yet.</p>
      ) : (
        filteredMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === YOU ? "justify-end" : "justify-start"} mb-4`}>
            <div
              className={`relative p-2.5 pr-6 text-base rounded shadow-md ${
                msg.role === YOU && editingIndex === i
                  ? "w-full bg-bubble-sent-light dark:bg-bubble-sent-dark text-white"
                  : msg.role === YOU
                  ? "max-w-[90%] md:max-w-[75%] bg-bubble-sent-light dark:bg-bubble-sent-dark text-white"
                  : "max-w-[90%] md:max-w-[75%] pr-8 bg-bubble-received-light dark:bg-bubble-received-dark text-gray-900 dark:text-white"
              }`}
            >
              {/* Editable mode for user messages */}
              {msg.role === YOU && editingIndex === i ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    ref={(el) => el && el.focus()}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full min-h-[80px] p-2 bg-white/10 text-white rounded border border-white/30 focus:border-white/60 outline-none resize-y"
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
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={cancelEdit}
                      className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition"
                      title="Cancel (Esc)"
                    >
                      <FaTimes size={12} />
                    </button>
                    <button
                      onClick={saveEdit}
                      className="p-1.5 rounded bg-white/20 hover:bg-white/30 text-white transition"
                      title="Save (Enter)"
                    >
                      <FaCheck size={12} />
                    </button>
                  </div>
                </div>
              ) : (
                /* Normal message display */
                <>
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
                  {/* Three-dot menu */}
                  <div className="absolute top-1 right-1">
                    <button
                      onClick={() => toggleMenu(i)}
                      className={`p-1.5 rounded-full transition ${
                        msg.role === YOU 
                          ? 'text-white/60 hover:text-white hover:bg-white/10' 
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      title="More options"
                      aria-label="Message options"
                    >
                      <FaEllipsisV size={12} />
                    </button>
                    <MessageMenu 
                      isOpen={openMenuIndex === i} 
                      onClose={closeMenu}
                      isUserMessage={msg.role === YOU}
                    >
                      <MenuItem 
                        icon={FaCopy} 
                        label="Copy" 
                        onClick={() => copyMessage(msg.txt)} 
                      />
                      {msg.role === AI && (
                        <MenuItem 
                          icon={FaRedo} 
                          label="Regenerate" 
                          onClick={() => { handleRegenerate(i); closeMenu(); }}
                          disabled={aiLoading}
                        />
                      )}
                      {msg.role === YOU && (
                        <MenuItem 
                          icon={FaEdit} 
                          label="Edit" 
                          onClick={() => { startEdit(i, msg.txt); closeMenu(); }}
                          disabled={aiLoading}
                        />
                      )}
                    </MessageMenu>
                  </div>
                </>
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
