import React, { useRef, useEffect, useCallback, useMemo, useState } from "react";
import { FaCheck, FaTimes, FaArrowDown } from "react-icons/fa";
import { YOU, LS_INITIAL_MESSAGES } from "../utils/constants";
import { Message } from "../types";
import { cn } from "../utils/cn";
import { DisplayImage } from "./DisplayImage";
import ToggleSwitch from "./ToggleSwitch";
import ChatMessage from "./chat/ChatMessage";

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
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
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

  const handleCopyMessage = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

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
        filteredMessages.map((msg, i) => (
          <ChatMessage
            key={i}
            msg={msg}
            charInitials={charInitials}
            aiLoading={aiLoading || false}
            onCopy={handleCopyMessage}
            onRegenerate={handleRegenerate}
            onStartEdit={startEdit}
            setFullscreenImage={setFullscreenImage}
          />
        ))
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
              <ToggleSwitch
                checked={editIsImageRequest}
                onChange={setEditIsImageRequest}
                title="Request image generation"
                label="Generate Image"
              />

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

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 p-4 cursor-zoom-out backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setFullscreenImage(null)}
        >
          <button 
            className="absolute top-4 right-4 p-3 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition z-50"
            onClick={(e) => { e.stopPropagation(); setFullscreenImage(null); }}
            title="Close"
          >
            <FaTimes size={20} />
          </button>
          <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
            <DisplayImage 
              srcContext={fullscreenImage} 
              alt="Fullscreen" 
              className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl scale-100" 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
