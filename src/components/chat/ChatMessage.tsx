import React, { useCallback } from "react";
import { FaCopy, FaRedo, FaEdit, FaEllipsisV } from "react-icons/fa";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";
import { Message } from "../../types";
import { AI, YOU } from "../../utils/constants";
import MarkdownRenderer from "./MarkdownRenderer";
import { DropdownMenu, DropdownMenuItem } from "../ui/DropdownMenu";
import { DisplayImage } from "../DisplayImage";

interface ChatMessageProps {
  msg: Message;
  charInitials: string;
  aiLoading: boolean;
  onCopy: (text: string) => void;
  onRegenerate: (msg: Message) => void;
  onStartEdit: (msg: Message) => void;
  setFullscreenImage: (src: string) => void;
}

const ChatMessage = React.memo(({
  msg,
  charInitials,
  aiLoading,
  onCopy,
  onRegenerate,
  onStartEdit,
  setFullscreenImage,
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
        <div className="w-8 h-8 rounded-full bg-gemini-logo flex items-center justify-center flex-shrink-0 mt-1 mr-3 shadow-md">
          <span className="text-white font-bold text-sm">{charInitials}</span>
        </div>
      )}

      <div
        className={cn(
          "relative p-4 rounded-3xl max-w-[85%] md:max-w-[70%] shadow-sm min-w-0 group",
          isUser
            ? "bg-primary text-white rounded-tr-sm"
            : "bg-panel2 text-ink rounded-tl-sm border border-line"
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
            className="mt-2 max-w-full rounded-lg shadow-sm border border-white/20 dark:border-slate-700 cursor-zoom-in hover:opacity-90 transition-opacity"
          />
        ))}

        {/* Always visible (not hover-gated) so the menu is reachable on touch devices */}
        <div className="absolute top-2 right-2">
          <DropdownMenu
            trigger={
              <button
                className={cn(
                  "p-1.5 rounded-full transition",
                  isUser
                    ? "text-white/80 hover:text-white hover:bg-white/20"
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
