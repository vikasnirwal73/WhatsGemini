import React, { useState, useCallback, useRef } from "react";
import { FaPaperPlane, FaStop, FaPlus } from "react-icons/fa";
import { cn } from "../utils/cn";

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  onStop?: () => void;
  tokenCount?: number;
  costEstimate?: number;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend, disabled = false, onStop, tokenCount = 0, costEstimate = 0 }) => {
  const [text, setText] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  // Memoized function to handle message sending
  const handleSend = useCallback(() => {
    if (disabled) return;
    const trimmedText = text.trim();
    if (!trimmedText) return;

    onSend(trimmedText);
    setText("");
  }, [text, onSend, disabled]);

  // Scroll input into view when focused (helps with mobile keyboards)
  const handleFocus = useCallback(() => {
    setTimeout(() => {
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }, []);

  const canSend = Boolean(text.trim() && !disabled);

  return (
    <div className="flex flex-col gap-2">
      {tokenCount > 0 && (
        <div className="flex justify-center text-xs text-gray-500 dark:text-gray-400 font-mono">
          <span>~ {tokenCount.toLocaleString()} tokens context ({costEstimate > 0.0001 ? `$${costEstimate.toFixed(4)}` : '< $0.0001'} est.)</span>
        </div>
      )}
      <div className="flex items-center gap-3 bg-slate-900/60 dark:bg-slate-800/60 backdrop-blur-md border border-gray-300 dark:border-slate-600/50 rounded-full p-2 px-4 shadow-xl">
        <button className="text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 p-2 transition">
          <FaPlus size={18} />
        </button>

        <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={disabled ? "Waiting for response..." : "Type a message..."}
        className="flex-1 px-2 py-3 bg-transparent text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 outline-none transition-colors disabled:opacity-50"
        style={{ fontSize: 'var(--chat-font-size, 16px)' }}
        disabled={disabled}
        onFocus={handleFocus}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        aria-label="Message input"
        aria-busy={disabled}
      />

      {disabled && onStop ? (
        <button
          onClick={onStop}
          className="p-3 rounded-full bg-red-500/80 hover:bg-red-500 text-white transition shadow-md transform hover:scale-105"
          title="Stop Generating"
          aria-label="Stop Generating"
        >
          <FaStop size={14} />
        </button>
      ) : (
        <button
          onClick={handleSend}
          className={cn(
            "p-3 rounded-full transition shadow-md relative overflow-hidden group",
            canSend
              ? "text-slate-800 dark:text-white"
              : "text-gray-400 cursor-not-allowed"
          )}
          disabled={!canSend}
          title="Send Message"
          aria-label="Send Message"
        >
          {canSend && <div className="absolute inset-0 bg-sparkle-gradient opacity-20 group-hover:opacity-40 transition" />}
          <FaPaperPlane size={16} className={cn("relative z-10", canSend ? "ml-0.5 text-indigo-500 dark:text-indigo-400" : "")} />
        </button>
      )}
    </div>
    </div>
  );
};

export default MessageInput;
