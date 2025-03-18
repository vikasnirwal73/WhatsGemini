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
    <div className="p-3 flex items-center bg-[#f0f2f5] dark:bg-[#202c33] border-t border-gray-300 dark:border-gray-700">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 mr-3 px-2.5 py-1.5 bg-white dark:bg-[#2a3942] text-black dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 outline-none text-lg"
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
        className={`p-2.5 rounded-full transition ${
          text.trim()
            ? "bg-[#25D366] hover:bg-[#1db954]"
            : "bg-gray-400 cursor-not-allowed"
        } text-white`}
        disabled={!text.trim()}
        title="Send Message"
        aria-label="Send Message"
      >
        <FaPaperPlane size={18} />
      </button>
    </div>
  );
};

export default MessageInput;
