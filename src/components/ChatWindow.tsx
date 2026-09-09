import React, { useRef, useEffect, useCallback, useMemo, useState } from "react";
import { FaCheck, FaTimes, FaArrowDown } from "react-icons/fa";
import { motion } from "framer-motion";
import { YOU, LS_INITIAL_MESSAGES } from "../utils/constants";
import { Message, Character, ConversationTree } from "../types";
import { getSiblingInfo } from "../features/chat/messageTree";
import { speak, stopSpeaking } from "../utils/speech";
import { stripImageContextTag } from "../features/ai/utils/imageGeneration";
import { DisplayImage } from "./DisplayImage";
import ToggleSwitch from "./ToggleSwitch";
import ChatMessage from "./chat/ChatMessage";
import { DialogRoot, DialogContent, DialogTitle, DialogClose } from "./ui/Dialog";
import { CharacterAvatar } from "./ui/CharacterAvatar";
import { Button } from "./ui/button";

interface ChatWindowProps {
  messages: Message[];
  tree?: ConversationTree;
  onSwitchBranch?: (nodeId: string) => void;
  onDeleteBranch?: (nodeId: string) => void;
  onRegenerate?: (index: number) => void;
  onEdit?: (index: number, text: string, isImageRequest?: boolean) => void;
  onSend?: (text: string, isImageRequest?: boolean) => void;
  aiLoading?: boolean;
  characterName?: string;
  character?: Character;
}

const TypingIndicator = ({ charInitials, accent }: { charInitials: string; accent?: [string, string] }) => (
  <div className="flex items-end gap-3 mb-6">
    <CharacterAvatar name={charInitials} accent={accent} size={32} className="mt-1" />
    <div className="flex items-center gap-1 px-4 py-3.5 bg-bubble-received border border-line rounded-2xl rounded-bl-[5px]">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-ink-faint"
          animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </div>
  </div>
);

const ChatWindow: React.FC<ChatWindowProps> = ({ messages = [], tree, onSwitchBranch, onDeleteBranch, onRegenerate, onEdit, onSend, aiLoading, characterName, character }) => {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editIsImageRequest, setEditIsImageRequest] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      setIsScrolledUp(scrollHeight - scrollTop - clientHeight > 100);
    }
  }, []);

  // scrollTop isn't re-clamped when the container shrinks (mobile keyboard
  // opening, browser chrome show/hide, orientation change) - it silently
  // falls short of the new bottom, letting old messages peek out from under
  // the floating composer. Snap back to bottom whenever that happens, but
  // only if the user hadn't deliberately scrolled up to read history.
  const isScrolledUpRef = useRef(isScrolledUp);
  isScrolledUpRef.current = isScrolledUp;

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (!isScrolledUpRef.current) {
        el.scrollTop = el.scrollHeight;
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
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

  const handleToggleSpeak = useCallback((msg: Message) => {
    if (!msg.id) return;
    if (speakingMessageId === msg.id) {
      stopSpeaking();
      setSpeakingMessageId(null);
      return;
    }
    const id = msg.id;
    speak(stripImageContextTag(msg.txt || ""), character?.voiceURI, () => {
      setSpeakingMessageId((current) => (current === id ? null : current));
    });
    setSpeakingMessageId(id);
  }, [speakingMessageId, character?.voiceURI]);

  // If the message currently being read aloud disappears from the active
  // path (chat switch, edit, regenerate, branch-delete), stop instead of
  // reading a message that's no longer even shown.
  useEffect(() => {
    if (speakingMessageId && !messages.some((m) => m.id === speakingMessageId)) {
      stopSpeaking();
      setSpeakingMessageId(null);
    }
  }, [messages, speakingMessageId]);

  useEffect(() => () => stopSpeaking(), []);

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
      className="flex-1 p-4 overflow-auto bg-chat relative z-1 h-full w-full max-w-4xl mx-auto pb-32"
      ref={scrollContainerRef}
      onScroll={handleScroll}
    >
      {filteredMessages.length === 0 ? (
        <div className="flex flex-col items-center h-full w-full px-4 pt-10">
          <div className="flex flex-col items-center text-center gap-3 w-full max-w-[440px] px-5 py-8 bg-panel border border-line rounded-2xl shadow-sm">
            <CharacterAvatar name={charInitials} accent={character?.accent} size={64} className="text-2xl" />
            <div>
              <div className="text-[19px] font-bold tracking-tight text-ink">{characterName || "New Conversation"}</div>
              {character?.relationship && (
                <div className="text-[13px] text-primary font-medium mt-0.5">{character.relationship}</div>
              )}
            </div>
            <p className="text-[13.5px] leading-relaxed text-ink-muted">
              {character?.description || "Send a message to get started."}
            </p>
          </div>
        </div>
      ) : (
        filteredMessages.map((msg, i) => {
          const siblingInfo = tree && msg.id ? getSiblingInfo(tree, msg.id) : undefined;
          return (
            <ChatMessage
              key={msg.id || i}
              msg={msg}
              charInitials={charInitials}
              accent={character?.accent}
              aiLoading={aiLoading || false}
              onCopy={handleCopyMessage}
              onRegenerate={handleRegenerate}
              onStartEdit={startEdit}
              setFullscreenImage={setFullscreenImage}
              siblingInfo={siblingInfo && siblingInfo.total > 1 ? siblingInfo : undefined}
              onSwitchBranch={onSwitchBranch}
              onDeleteBranch={onDeleteBranch}
              isSpeaking={Boolean(msg.id) && speakingMessageId === msg.id}
              onToggleSpeak={handleToggleSpeak}
            />
          );
        })
      )}
      {aiLoading && <TypingIndicator charInitials={charInitials} accent={character?.accent} />}
      <div ref={chatEndRef} />
      {isScrolledUp && (
        <Button
          onClick={() => {
            setIsScrolledUp(false);
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
          size="icon"
          className="fixed bottom-24 right-6 z-50 h-11 w-11 rounded-full shadow-lg hover:scale-105 opacity-80 hover:opacity-100"
          title="Scroll to bottom"
          aria-label="Scroll to bottom"
        >
          <FaArrowDown size={16} />
        </Button>
      )}

      {/* Full Screen Edit Modal */}
      <DialogRoot open={editingIndex !== null} onOpenChange={(open) => !open && cancelEdit()}>
        <DialogContent size="lg" className="h-[80vh] md:h-[70vh]">
          <div className="flex items-center justify-between p-4 border-b border-line flex-shrink-0">
            <DialogTitle asChild>
              <h3 className="text-lg font-semibold text-ink">Edit Message</h3>
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-auto w-auto p-2 -m-2 rounded-full text-ink-muted hover:bg-app hover:text-ink">
                <FaTimes size={18} />
              </Button>
            </DialogClose>
          </div>

          <div className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col">
            <textarea
              ref={(el) => { if (el) el.focus() }}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="flex-1 w-full p-4 rounded-xl border border-line bg-app text-ink focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none text-base disabled:opacity-50"
              placeholder="Type your message here..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  saveEdit();
                }
              }}
            />
            <div className="mt-2 text-xs text-ink-muted flex flex-col sm:flex-row sm:justify-between gap-1">
              <span>Markdown is supported.</span>
              <span className="hidden sm:inline"><kbd className="bg-panel2 px-1.5 py-0.5 rounded">Enter</kbd> to save, <kbd className="bg-panel2 px-1.5 py-0.5 rounded">Shift+Enter</kbd> for new line, <kbd className="bg-panel2 px-1.5 py-0.5 rounded">Esc</kbd> to cancel</span>
            </div>
          </div>

          <div className="p-4 border-t border-line flex flex-col sm:flex-row justify-between gap-3 bg-app items-stretch sm:items-center flex-shrink-0">
            <ToggleSwitch
              checked={editIsImageRequest}
              onChange={setEditIsImageRequest}
              title="Request image generation"
              label="Generate Image"
            />

            <div className="flex gap-3">
              <Button
                onClick={cancelEdit}
                variant="ghost"
                className="flex-1 sm:flex-none h-auto px-5 py-2.5 rounded-xl font-medium text-ink-muted hover:bg-panel2"
              >
                Cancel
              </Button>
              <Button
                onClick={saveEdit}
                disabled={!editText.trim()}
                className="flex-1 sm:flex-none h-auto px-5 py-2.5 rounded-xl font-medium shadow-sm"
              >
                <FaCheck size={14} />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </DialogRoot>

      {/* Fullscreen Image Modal */}
      <DialogRoot open={fullscreenImage !== null} onOpenChange={(open) => !open && setFullscreenImage(null)}>
        <DialogContent size="full" className="!bg-transparent !border-none !shadow-none flex items-center justify-center">
          <DialogTitle asChild>
            <span className="sr-only">Fullscreen image</span>
          </DialogTitle>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 h-auto w-auto p-3 rounded-full text-white/70 hover:bg-black/80 hover:text-white bg-black/50 z-10"
              title="Close"
            >
              <FaTimes size={20} />
            </Button>
          </DialogClose>
          {fullscreenImage && (
            <DisplayImage
              srcContext={fullscreenImage}
              alt="Fullscreen"
              className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          )}
        </DialogContent>
      </DialogRoot>
    </div>
  );
};

export default ChatWindow;
