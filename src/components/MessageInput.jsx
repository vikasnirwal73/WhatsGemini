import React, { useState, useCallback } from "react";
import { FaPaperPlane } from "react-icons/fa";

const MessageInput = ({ onSend }) => {
  const [text, setText] = useState("");

  // Memoized function to handle message sending
  const handleSend = useCallback(() => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    onSend(trimmedText);
    setText("");
  }, [text, onSend]);

  return (
    <div className="p-3 flex items-center bg-panel-light dark:bg-panel-dark border-t border-gray-200 dark:border-gray-800">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 mr-3 px-4 py-3 bg-app-light dark:bg-app-dark text-black dark:text-white rounded-full border border-transparent focus:border-primary outline-none text-base transition-colors"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        aria-label="Message input"
      />

      <button
        onClick={handleSend}
        className={`p-3 rounded-full transition shadow-md ${
          text.trim()
            ? "bg-primary hover:bg-primary-hover text-white transform hover:scale-105"
            : "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
        }`}
        disabled={!text.trim()}
        title="Send Message"
        aria-label="Send Message"
      >
        <FaPaperPlane size={16} className={text.trim() ? "ml-0.5" : ""} />
      </button>
    </div>
  );
};

export default MessageInput;
