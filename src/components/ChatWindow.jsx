import React, { useRef, useEffect, useCallback, useMemo, useState } from "react";
import { FaRedo } from "react-icons/fa";
import { AI, LS_INITIAL_MESSAGES, YOU } from "../utils/constants";

const ChatWindow = ({ messages = [], onRegenerate, aiLoading }) => {
  const chatEndRef = useRef(null);
  const [typingDots, setTypingDots] = useState(".");
  // Safely retrieve saved initial messages
  const getInitialMessages = () => {
    try {
      return JSON.parse(localStorage.getItem(LS_INITIAL_MESSAGES)) || [];
    } catch (error) {
      console.error("Error parsing initial messages from localStorage:", error);
      return [];
    }
  };

  const savedMessages = useMemo(() => getInitialMessages(), []);

  // Determine the starting index for rendering messages
  const startIndex = savedMessages.length > 0 ? savedMessages.length + 2 : 2;
  const filteredMessages = useMemo(() => messages.slice(startIndex) || [], [messages, startIndex]);

  // Scroll to the latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (aiLoading) {
      const interval = setInterval(() => {
        setTypingDots((prev) => (prev.length < 3 ? prev + "." : "."));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [aiLoading]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiLoading]);

  // Memoized function to handle regeneration
  const handleRegenerate = useCallback(
    (index) => {
      if (onRegenerate) {
        onRegenerate(index + startIndex);
      }
    },
    [onRegenerate, startIndex]
  );

  const italicize = (str) => {
  return str
    .replace(/\*(.*?)\*/g, '<em class="text-gray-500 dark:text-gray-400">$1</em>')
    .replace(/\((.*?)\)/g, '<em class="text-gray-500 dark:text-gray-400">$1</em>');
};

  

  return (
    <div className="flex-1 p-4 overflow-auto bg-app-light dark:bg-app-dark relative z-1">
      {filteredMessages.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center">No messages yet.</p>
      ) : (
        filteredMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === YOU ? "justify-end" : "justify-start"} mb-4`}>
            <div
              className={`relative max-w-[90%] md:max-w-[75%] p-3 px-5 text-lg rounded-3xl shadow-sm ${
                msg.role === YOU
                  ? "bg-bubble-sent-light dark:bg-bubble-sent-dark text-white"
                  : "pr-8 bg-bubble-received-light dark:bg-bubble-received-dark text-gray-900 dark:text-white"
              }`}
            >
              <p dangerouslySetInnerHTML={{__html: italicize(msg.txt)}}></p>
              {msg.role === AI && (
                <button
                  onClick={() => handleRegenerate(i)}
                  className="absolute bottom-1 right-2 p-1 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition"
                  title="Regenerate Response"
                >
                  <FaRedo size={12} />
                </button>
              )}
            </div>
          </div>
        ))
      )}
      {aiLoading && (
        <div className="flex justify-start absolute bottom-1">
          <div className="text-sm text-gray dark:text-white italic">typing{typingDots}</div>
        </div>
      )}
      <div ref={chatEndRef} />
    </div>
  );
};

export default ChatWindow;
