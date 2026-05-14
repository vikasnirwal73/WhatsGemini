import React, { useState, useCallback } from "react";
import { FaCopy, FaRedo, FaEdit, FaEllipsisV } from "react-icons/fa";
import { cn } from "../../utils/cn";
import { Message } from "../../types";
import { AI, YOU } from "../../utils/constants";
import MarkdownRenderer from "./MarkdownRenderer";
import { MessageMenu, MenuItem } from "./MessageMenu";
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isUser = msg.role === YOU;

  const toggleMenu = useCallback(() => setIsMenuOpen((prev) => !prev), []);
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  const handleCopy = useCallback(() => {
    onCopy(msg.txt || "");
    closeMenu();
  }, [onCopy, msg.txt, closeMenu]);

  const handleRegenerate = useCallback(() => {
    onRegenerate(msg);
    closeMenu();
  }, [onRegenerate, msg, closeMenu]);

  const handleEdit = useCallback(() => {
    onStartEdit(msg);
    closeMenu();
  }, [onStartEdit, msg, closeMenu]);

  return (
    <div className={cn("flex w-full mb-6", isUser ? "justify-end" : "justify-start")}>
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
            : "bg-slate-200 dark:bg-slate-700/60 text-gray-900 dark:text-slate-100 rounded-tl-sm border border-transparent dark:border-slate-600/50"
        )}
        style={{ fontSize: "var(--chat-font-size, 16px)" }}
      >
        <>
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

          <div className="absolute top-2 right-2">
            <button
              onClick={toggleMenu}
              className={cn(
                "p-1.5 rounded-full transition opacity-0 group-hover:opacity-100",
                isUser
                  ? "text-white/80 hover:text-white hover:bg-white/20"
                  : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white hover:bg-gray-300 dark:hover:bg-slate-600"
              )}
              title="More options"
              aria-label="Message options"
            >
              <FaEllipsisV size={12} />
            </button>
            <button
              onClick={handleEdit}
              className={cn(
                "p-1.5 rounded-full transition opacity-0 group-hover:opacity-100 ml-1",
                isUser
                  ? "text-white/80 hover:text-white hover:bg-white/20"
                  : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white hover:bg-gray-300 dark:hover:bg-slate-600"
              )}
              title="Edit message"
              aria-label="Edit message"
            >
              <FaEdit size={12} />
            </button>

            <MessageMenu isOpen={isMenuOpen} onClose={closeMenu} isUserMessage={isUser}>
              <MenuItem icon={FaCopy} label="Copy" onClick={handleCopy} />
              {msg.role === AI && (
                <MenuItem
                  icon={FaRedo}
                  label="Regenerate"
                  onClick={handleRegenerate}
                  disabled={aiLoading}
                />
              )}
              <MenuItem
                icon={FaEdit}
                label="Edit"
                onClick={handleEdit}
                disabled={aiLoading}
              />
            </MessageMenu>
          </div>

          {/* Action Row for AI Messages */}
          {!isUser && (
            <div className="flex items-center gap-4 mt-3 pt-2 text-xs text-gray-500 dark:text-slate-400">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 hover:text-gray-800 dark:hover:text-slate-200 transition"
              >
                <FaCopy size={12} /> Copy
              </button>
              <button
                onClick={handleRegenerate}
                className="flex items-center gap-1.5 hover:text-gray-800 dark:hover:text-slate-200 transition"
              >
                <FaRedo size={12} /> Regenerate
              </button>
              <button
                onClick={handleEdit}
                className="flex items-center gap-1.5 hover:text-gray-800 dark:hover:text-slate-200 transition"
              >
                <FaEdit size={12} /> Edit
              </button>
            </div>
          )}
        </>
      </div>
    </div>
  );
});

ChatMessage.displayName = "ChatMessage";

export default ChatMessage;
