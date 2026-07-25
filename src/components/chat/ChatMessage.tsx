import React, { useCallback } from "react";
import { FaCopy, FaRedo, FaEdit, FaEllipsisV, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";
import { Message } from "../../types";
import { AI, YOU } from "../../utils/constants";
import MarkdownRenderer from "./MarkdownRenderer";
import { DropdownMenu, DropdownMenuItem } from "../ui/DropdownMenu";
import { DisplayImage } from "../DisplayImage";
import { CharacterAvatar } from "../ui/CharacterAvatar";

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
}: ChatMessageProps) => {
  const isUser = msg.role === YOU;

  const handleCopy = useCallback(() => onCopy(msg.txt || ""), [onCopy, msg.txt]);
  const handleRegenerate = useCallback(() => onRegenerate(msg), [onRegenerate, msg]);
  const handleEdit = useCallback(() => onStartEdit(msg), [onStartEdit, msg]);

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
            : "bg-bubble-received text-bubble-receivedFg rounded-bl-[5px] border border-line"
        )}
        style={{ fontSize: "var(--chat-font-size, 16px)" }}
      >
        <MarkdownRenderer msgText={msg.txt || ""} isUser={isUser} />

        {msg.images && msg.images.map((imgSrc, idx) => (
          <DisplayImage
            key={idx}
            srcContext={imgSrc}
            alt="Generated"
            onClick={() => setFullscreenImage(imgSrc)}
            className="mt-2 max-w-full rounded-lg shadow-sm border border-line cursor-zoom-in hover:opacity-90 transition-opacity"
          />
        ))}

        {siblingInfo && (
          <div className={cn("flex items-center gap-1.5 mt-2 text-[11px] font-mono", isUser ? "text-bubble-sentFg/70 justify-end" : "text-ink-faint")}>
            <button
              onClick={() => siblingInfo.index > 0 && onSwitchBranch?.(siblingInfo.siblingIds[siblingInfo.index - 1])}
              disabled={siblingInfo.index === 0}
              className="p-0.5 rounded hover:bg-black/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
              aria-label="Previous variant"
              title="Previous variant"
            >
              <FaChevronLeft size={9} />
            </button>
            <span>{siblingInfo.index + 1}/{siblingInfo.total}</span>
            <button
              onClick={() => siblingInfo.index < siblingInfo.total - 1 && onSwitchBranch?.(siblingInfo.siblingIds[siblingInfo.index + 1])}
              disabled={siblingInfo.index === siblingInfo.total - 1}
              className="p-0.5 rounded hover:bg-black/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
              aria-label="Next variant"
              title="Next variant"
            >
              <FaChevronRight size={9} />
            </button>
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
                    : "text-ink-muted hover:text-ink hover:bg-app"
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
            <DropdownMenuItem icon={FaEdit} label="Edit" onClick={handleEdit} disabled={aiLoading} />
          </DropdownMenu>
        </div>

        {/* Action Row for AI Messages */}
        {!isUser && (
          <div className="flex items-center gap-4 mt-3 pt-2 text-xs text-ink-muted">
            <button onClick={handleCopy} className="flex items-center gap-1.5 hover:text-ink transition">
              <FaCopy size={12} /> Copy
            </button>
            <button onClick={handleRegenerate} className="flex items-center gap-1.5 hover:text-ink transition">
              <FaRedo size={12} /> Regenerate
            </button>
            <button onClick={handleEdit} className="flex items-center gap-1.5 hover:text-ink transition">
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
