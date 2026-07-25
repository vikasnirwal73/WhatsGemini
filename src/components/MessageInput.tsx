import React, { useState, useCallback, useRef, useEffect } from "react";
import { FaPaperPlane, FaStop, FaCog, FaImage, FaTimes } from "react-icons/fa";
import { cn } from "../utils/cn";
import ImageSettingsModal from "./ImageSettingsModal";

interface MessageInputProps {
  onSend: (text: string, isImageRequest?: boolean) => void;
  disabled?: boolean;
  onStop?: () => void;
  tokenCount?: number;
  costEstimate?: number;
  characterName?: string;
}

const MAX_TEXTAREA_HEIGHT = 120;

const MessageInput: React.FC<MessageInputProps> = ({ onSend, disabled = false, onStop, tokenCount = 0, costEstimate = 0, characterName }) => {
  const [text, setText] = useState("");
  const [isImageRequest, setIsImageRequest] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [text, resize]);

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
        <div className="flex justify-center text-xs text-ink-faint font-mono">
          <span>~ {tokenCount.toLocaleString()} tokens last turn ({costEstimate > 0.0001 ? `$${costEstimate.toFixed(4)}` : '< $0.0001'} est.)</span>
        </div>
      )}

      {isImageRequest && (
        <div className="flex items-center gap-2.5 px-3 py-2 bg-primary/10 border border-primary rounded-xl">
          <span className="text-primary flex-shrink-0 flex"><FaImage size={13} /></span>
          <span className="flex-1 text-[12.5px] text-ink font-medium">
            Image generation on — a picture will be created alongside the reply.
          </span>
          <button
            onClick={() => setIsImageRequest(false)}
            className="w-6 h-6 rounded-md flex items-center justify-center text-ink-muted hover:bg-panel3 hover:text-ink transition flex-shrink-0"
            aria-label="Turn off image generation"
          >
            <FaTimes size={11} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          onClick={() => setIsImageRequest((v) => !v)}
          disabled={disabled}
          title="Request an image with this message"
          aria-label="Request an image with this message"
          aria-pressed={isImageRequest}
          className={cn(
            "w-11 h-11 flex-shrink-0 rounded-[13px] border flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed",
            isImageRequest
              ? "border-primary bg-primary/10 text-primary"
              : "border-line bg-panel2 text-ink-faint hover:border-primary hover:text-ink"
          )}
        >
          <FaImage size={15} />
        </button>

        <button
          onClick={() => setIsSettingsModalOpen(true)}
          title="Image Generation Settings"
          aria-label="Image Generation Settings"
          className="w-11 h-11 flex-shrink-0 rounded-[13px] border border-line bg-panel2 text-ink-faint hover:border-primary hover:text-ink transition flex items-center justify-center"
        >
          <FaCog size={14} />
        </button>

        <div className="flex-1 flex items-center gap-2 bg-panel2 border border-line rounded-[18px] min-h-[44px] pl-4 pr-1.5 py-0.5 shadow-sm">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={1}
            placeholder={disabled ? "Waiting for response..." : characterName ? `Message ${characterName}…` : "Type a message..."}
            className="flex-1 px-0 py-1 leading-[22px] bg-transparent text-ink placeholder-ink-faint outline-none transition-colors resize-none disabled:opacity-50"
            style={{ fontSize: 'var(--chat-font-size, 16px)', maxHeight: MAX_TEXTAREA_HEIGHT }}
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
              className="w-9 h-9 flex-shrink-0 rounded-xl bg-red-500 hover:bg-red-600 text-white transition shadow-md transform hover:scale-105 flex items-center justify-center"
              title="Stop Generating"
              aria-label="Stop Generating"
            >
              <FaStop size={13} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              className={cn(
                "w-9 h-9 flex-shrink-0 rounded-xl transition shadow-md flex items-center justify-center",
                canSend
                  ? "bg-gemini-logo text-onAccent transform hover:scale-105 hover:brightness-105"
                  : "bg-panel3 text-ink-faint cursor-not-allowed"
              )}
              disabled={!canSend}
              title="Send Message"
              aria-label="Send Message"
            >
              <FaPaperPlane size={14} className={canSend ? "ml-0.5" : ""} />
            </button>
          )}
        </div>
      </div>

      <ImageSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
};

export default MessageInput;
