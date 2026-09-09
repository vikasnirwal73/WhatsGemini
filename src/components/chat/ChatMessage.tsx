import React, { useCallback, useMemo } from "react";
import { FaCopy, FaRedo, FaEdit, FaEllipsisV, FaChevronLeft, FaChevronRight, FaTrash, FaVolumeUp, FaStop, FaCompressArrowsAlt } from "react-icons/fa";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";
import { Message } from "../../types";
import { AI, YOU } from "../../utils/constants";
import { stripImageContextTag } from "../../features/ai/utils/imageGeneration";
import MarkdownRenderer from "./MarkdownRenderer";
import { DropdownMenu, DropdownMenuItem } from "../ui/DropdownMenu";
import { DisplayImage } from "../DisplayImage";
import { CharacterAvatar } from "../ui/CharacterAvatar";
import { isSpeechSynthesisSupported } from "../../utils/speech";

interface SiblingInfo {
  index: number;
  total: number;
  siblingIds: string[];
}

interface ChatMessageProps {
  msg: Message;
  charInitials: string;
  accent?: [string, string];
  aiLoading: boolean;
  onCopy: (text: string) => void;
  onRegenerate: (msg: Message) => void;
  onStartEdit: (msg: Message) => void;
  setFullscreenImage: (src: string) => void;
  siblingInfo?: SiblingInfo;
  onSwitchBranch?: (nodeId: string) => void;
  onDeleteBranch?: (nodeId: string) => void;
  isSpeaking?: boolean;
  onToggleSpeak?: (msg: Message) => void;
}

const ChatMessage = React.memo(({
  msg,
  charInitials,
  accent,
  aiLoading,
  onCopy,
  onRegenerate,
  onStartEdit,
  setFullscreenImage,
  siblingInfo,
  onSwitchBranch,
  onDeleteBranch,
  isSpeaking,
  onToggleSpeak,
}: ChatMessageProps) => {
  const isUser = msg.role === YOU;
  const speechSupported = useMemo(() => isSpeechSynthesisSupported(), []);

  const handleCopy = useCallback(() => onCopy(stripImageContextTag(msg.txt || "")), [onCopy, msg.txt]);
  const handleRegenerate = useCallback(() => onRegenerate(msg), [onRegenerate, msg]);
  const handleEdit = useCallback(() => onStartEdit(msg), [onStartEdit, msg]);
  const handleDeleteBranch = useCallback(() => msg.id && onDeleteBranch?.(msg.id), [onDeleteBranch, msg.id]);
  const handleToggleSpeak = useCallback(() => onToggleSpeak?.(msg), [onToggleSpeak, msg]);

  if (msg.isCompressionSummary) {
    return (
      <motion.div
        className="flex w-full mb-6 justify-center"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className="max-w-[90%] md:max-w-[70%] rounded-2xl border border-border bg-muted px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground mb-1.5">
            <FaCompressArrowsAlt size={11} />
            Compressed history
          </div>
          <p className="text-xs text-ink-faint whitespace-pre-wrap text-left">{msg.txt}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn("flex w-full mb-6", isUser ? "justify-end" : "justify-start")}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {/* AI Avatar */}
      {!isUser && (
        <CharacterAvatar name={charInitials} accent={accent} size={32} className="mt-1 mr-3 shadow-md" />
      )}

      <div
        className={cn(
          "relative p-4 rounded-2xl max-w-[85%] md:max-w-[70%] shadow-sm min-w-0 group",
          isUser
            ? "bg-bubble-sent text-bubble-sentFg rounded-br-[5px]"
            : "bg-bubble-received text-bubble-receivedFg rounded-bl-[5px] border border-border"
        )}
        style={{ fontSize: "var(--chat-font-size, 16px)" }}
      >
        <MarkdownRenderer msgText={stripImageContextTag(msg.txt || "")} isUser={isUser} />

        {msg.images && msg.images.map((imgSrc, idx) => (
          <DisplayImage
            key={idx}
            srcContext={imgSrc}
            alt="Generated"
            onClick={() => setFullscreenImage(imgSrc)}
            className="mt-2 max-w-full rounded-lg shadow-sm border border-border cursor-zoom-in hover:opacity-90 transition-opacity"
          />
        ))}

        {siblingInfo && (
          <div className={cn("flex items-center mt-2", isUser ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "flex items-center gap-0.5 rounded-full text-[11px] font-mono font-semibold pl-1.5 pr-1 py-1",
                isUser ? "bg-black/10 text-bubble-sentFg" : "bg-muted border border-border text-muted-foreground"
              )}
              title={`${siblingInfo.total} variants of this message`}
            >
              <button
                onClick={() => siblingInfo.index > 0 && onSwitchBranch?.(siblingInfo.siblingIds[siblingInfo.index - 1])}
                disabled={siblingInfo.index === 0}
                className="p-1 rounded-full hover:bg-black/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                aria-label="Previous variant"
                title="Previous variant"
              >
                <FaChevronLeft size={9} />
              </button>
              <span className="px-0.5">{siblingInfo.index + 1}/{siblingInfo.total}</span>
              <button
                onClick={() => siblingInfo.index < siblingInfo.total - 1 && onSwitchBranch?.(siblingInfo.siblingIds[siblingInfo.index + 1])}
                disabled={siblingInfo.index === siblingInfo.total - 1}
                className="p-1 rounded-full hover:bg-black/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                aria-label="Next variant"
                title="Next variant"
              >
                <FaChevronRight size={9} />
              </button>
              {onDeleteBranch && (
                <>
                  <span className="w-px h-3 bg-current opacity-20 mx-0.5" />
                  <button
                    onClick={handleDeleteBranch}
                    disabled={aiLoading}
                    className="p-1 rounded-full hover:bg-red-500/15 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    aria-label="Delete this variant"
                    title="Delete this variant"
                  >
                    <FaTrash size={9} />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Always visible (not hover-gated) so the menu is reachable on touch devices */}
        <div className="absolute top-2 right-2">
          <DropdownMenu
            trigger={
              <button
                className={cn(
                  "p-1.5 rounded-full transition",
                  isUser
                    ? "text-bubble-sentFg/70 hover:text-bubble-sentFg hover:bg-black/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-background"
                )}
                title="More options"
                aria-label="Message options"
              >
                <FaEllipsisV size={12} />
              </button>
            }
          >
            <DropdownMenuItem icon={FaCopy} label="Copy" onClick={handleCopy} />
            {msg.role === AI && (
              <DropdownMenuItem icon={FaRedo} label="Regenerate" onClick={handleRegenerate} disabled={aiLoading} />
            )}
            {msg.role === AI && speechSupported && (
              <DropdownMenuItem icon={isSpeaking ? FaStop : FaVolumeUp} label={isSpeaking ? "Stop speaking" : "Speak"} onClick={handleToggleSpeak} />
            )}
            <DropdownMenuItem icon={FaEdit} label="Edit" onClick={handleEdit} disabled={aiLoading} />
          </DropdownMenu>
        </div>

        {/* Action Row for AI Messages */}
        {!isUser && (
          <div className="flex items-center gap-4 mt-3 pt-2 text-xs text-muted-foreground">
            <button onClick={handleCopy} className="flex items-center gap-1.5 hover:text-foreground transition">
              <FaCopy size={12} /> Copy
            </button>
            <button onClick={handleRegenerate} className="flex items-center gap-1.5 hover:text-foreground transition">
              <FaRedo size={12} /> Regenerate
            </button>
            {speechSupported && (
              <button onClick={handleToggleSpeak} className={cn("flex items-center gap-1.5 transition", isSpeaking ? "text-primary" : "hover:text-foreground")}>
                {isSpeaking ? <FaStop size={12} /> : <FaVolumeUp size={12} />} {isSpeaking ? "Stop" : "Speak"}
              </button>
            )}
            <button onClick={handleEdit} className="flex items-center gap-1.5 hover:text-foreground transition">
              <FaEdit size={12} /> Edit
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
});

ChatMessage.displayName = "ChatMessage";

export default ChatMessage;
