import React, { useState, useCallback, useRef } from "react";
import { FaPaperPlane, FaStop, FaCog, FaImage } from "react-icons/fa";
import { cn } from "../utils/cn";
import ToggleSwitch from "./ToggleSwitch";
import ImageSettingsModal from "./ImageSettingsModal";

interface MessageInputProps {
  onSend: (text: string, isImageRequest?: boolean) => void;
  disabled?: boolean;
  onStop?: () => void;
  tokenCount?: number;
  costEstimate?: number;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend, disabled = false, onStop, tokenCount = 0, costEstimate = 0 }) => {
  const [text, setText] = useState("");
  const [isImageRequest, setIsImageRequest] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Memoized function to handle message sending
  const handleSend = useCallback(() => {
    if (disabled) return;
    const trimmedText = text.trim();
    if (!trimmedText) return;

    onSend(trimmedText, isImageRequest);
    setText("");
    setIsImageRequest(false); // Disable/uncheck it afterward
  }, [text, isImageRequest, onSend, disabled]);

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
        <div className="flex justify-center text-xs text-ink-muted font-mono">
          <span>~ {tokenCount.toLocaleString()} tokens last turn ({costEstimate > 0.0001 ? `$${costEstimate.toFixed(4)}` : '< $0.0001'} est.)</span>
        </div>
      )}
      <div className="flex items-center gap-2 bg-panel2/95 backdrop-blur-md border border-line rounded-full p-1.5 pl-3 shadow-xl">
        <div className="flex items-center gap-1">
          <ToggleSwitch
            checked={isImageRequest}
            onChange={setIsImageRequest}
            disabled={disabled}
            title="Request image generation"
            label={<FaImage size={16} title="Image Generation" className="text-ink-muted mr-1" />}
          />
          <button
             onClick={() => setIsSettingsModalOpen(true)}
             className="p-2.5 text-ink-muted hover:text-ink transition rounded-full hover:bg-app"
             title="Image Generation Settings"
             aria-label="Image Generation Settings"
          >
             <FaCog size={14} />
          </button>
        </div>

        <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={disabled ? "Waiting for response..." : "Type a message..."}
        className="flex-1 px-2 py-3 bg-transparent text-ink placeholder-ink-muted outline-none transition-colors disabled:opacity-50"
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
          className="w-11 h-11 flex-shrink-0 rounded-full bg-red-500 hover:bg-red-600 text-white transition shadow-md transform hover:scale-105 flex items-center justify-center"
          title="Stop Generating"
          aria-label="Stop Generating"
        >
          <FaStop size={14} />
        </button>
      ) : (
        <button
          onClick={handleSend}
          className={cn(
            "w-11 h-11 flex-shrink-0 rounded-full transition shadow-md flex items-center justify-center",
            canSend
              ? "bg-primary hover:bg-primary-hover text-white transform hover:scale-105"
              : "bg-app text-ink-muted cursor-not-allowed"
          )}
          disabled={!canSend}
          title="Send Message"
          aria-label="Send Message"
        >
          <FaPaperPlane size={16} className={canSend ? "ml-0.5" : ""} />
        </button>
      )}
      </div>

      <ImageSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
};

export default MessageInput;
