import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { FaPaperPlane, FaStop, FaCog, FaImage, FaTimes, FaMicrophone } from "react-icons/fa";
import { cn } from "../utils/cn";
import { Button } from "./ui/button";
import ImageSettingsModal from "./ImageSettingsModal";
import { isSpeechRecognitionSupported, createSpeechRecognition } from "../utils/speech";

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
  const [isListening, setIsListening] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  // Text already in the box before this dictation session started, and the
  // finalized (non-interim) speech recognized so far in it - rebuilt into
  // `text` on every result event so live partial transcripts just update in
  // place instead of needing a separate ghost-text overlay.
  const baseTextRef = useRef("");
  const finalTranscriptRef = useRef("");
  const micSupported = useMemo(() => isSpeechRecognitionSupported(), []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const startListening = useCallback(() => {
    const recognition = createSpeechRecognition();
    if (!recognition) return;

    baseTextRef.current = text;
    finalTranscriptRef.current = "";

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += transcript + " ";
        } else {
          interim += transcript;
        }
      }
      const base = baseTextRef.current;
      const joinedBase = base && !base.endsWith(" ") ? base + " " : base;
      setText((joinedBase + finalTranscriptRef.current + interim).trimStart());
    };
    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [text]);

  const toggleListening = useCallback(() => {
    if (disabled) return;
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [disabled, isListening, startListening, stopListening]);

  // Stop dictation if the composer unmounts mid-session (e.g. navigating away).
  useEffect(() => () => recognitionRef.current?.stop(), []);

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

    if (isListening) stopListening();
    onSend(trimmedText, isImageRequest);
    setText("");
    setIsImageRequest(false); // Disable/uncheck it afterward
  }, [text, isImageRequest, onSend, disabled, isListening, stopListening]);

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
          <span className="flex-1 text-[12.5px] text-foreground font-medium">
            Image generation on — a picture will be created alongside the reply.
          </span>
          <Button
            onClick={() => setIsImageRequest(false)}
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground flex-shrink-0"
            aria-label="Turn off image generation"
          >
            <FaTimes size={11} />
          </Button>
        </div>
      )}

      {isListening && (
        <div className="flex items-center gap-2.5 px-3 py-2 bg-red-500/10 border border-red-500/50 rounded-xl">
          <span className="relative flex-shrink-0 w-2.5 h-2.5">
            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
            <span className="absolute inset-0 rounded-full bg-red-500" />
          </span>
          <span className="flex-1 text-[12.5px] text-foreground font-medium">
            Listening… speak, then tap the mic to stop.
          </span>
          <Button
            onClick={stopListening}
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground flex-shrink-0"
            aria-label="Stop listening"
          >
            <FaTimes size={11} />
          </Button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <Button
          onClick={() => setIsImageRequest((v) => !v)}
          disabled={disabled}
          variant="ghost"
          title="Request an image with this message"
          aria-label="Request an image with this message"
          aria-pressed={isImageRequest}
          className={cn(
            "h-11 w-11 flex-shrink-0 rounded-[13px] border",
            isImageRequest
              ? "border-primary bg-primary/10 text-primary hover:bg-primary/10"
              : "border-border bg-muted text-ink-faint hover:border-primary hover:bg-muted hover:text-foreground"
          )}
        >
          <FaImage size={15} />
        </Button>

        {micSupported && (
          <Button
            onClick={toggleListening}
            disabled={disabled}
            variant="ghost"
            title={isListening ? "Stop dictation" : "Dictate a message"}
            aria-label={isListening ? "Stop dictation" : "Dictate a message"}
            aria-pressed={isListening}
            className={cn(
              "h-11 w-11 flex-shrink-0 rounded-[13px] border",
              isListening
                ? "border-red-500 bg-red-500/10 text-red-500 hover:bg-red-500/10"
                : "border-border bg-muted text-ink-faint hover:border-primary hover:bg-muted hover:text-foreground"
            )}
          >
            <FaMicrophone size={15} />
          </Button>
        )}

        <Button
          onClick={() => setIsSettingsModalOpen(true)}
          variant="ghost"
          title="Image Generation Settings"
          aria-label="Image Generation Settings"
          className="h-11 w-11 flex-shrink-0 rounded-[13px] border border-border bg-muted text-ink-faint hover:border-primary hover:bg-muted hover:text-foreground"
        >
          <FaCog size={14} />
        </Button>

        <div className="flex-1 flex items-center gap-2 bg-muted border border-border rounded-[18px] min-h-[44px] pl-4 pr-1.5 py-0.5 shadow-sm">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={1}
            placeholder={disabled ? "Waiting for response..." : characterName ? `Message ${characterName}…` : "Type a message..."}
            className="flex-1 px-0 py-1 leading-[22px] bg-transparent text-foreground placeholder-ink-faint outline-none transition-colors resize-none disabled:opacity-50"
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
            <Button
              onClick={onStop}
              variant="destructive"
              size="icon"
              className="h-9 w-9 flex-shrink-0 rounded-xl shadow-md hover:scale-105"
              title="Stop Generating"
              aria-label="Stop Generating"
            >
              <FaStop size={13} />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 flex-shrink-0 rounded-xl shadow-md",
                canSend
                  ? "bg-gemini-logo text-onAccent hover:scale-105 hover:brightness-105"
                  : "bg-accent text-ink-faint cursor-not-allowed hover:bg-accent"
              )}
              disabled={!canSend}
              title="Send Message"
              aria-label="Send Message"
            >
              <FaPaperPlane size={14} className={canSend ? "ml-0.5" : ""} />
            </Button>
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
