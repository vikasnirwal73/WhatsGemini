import React, { useEffect, useState, useCallback } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { AI, LS_INITIAL_MESSAGES, YOU } from "../utils/constants";

interface InitialMessage {
  role: string;
  message: string;
}

const InitialMessages = () => {
  // Safely retrieve saved messages from localStorage
  const getSavedMessages = (): InitialMessage[] => {
    try {
      const saved = localStorage.getItem(LS_INITIAL_MESSAGES);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Error parsing initial messages from localStorage:", error);
      return [];
    }
  };

  const [initialMessages, setInitialMessages] = useState<InitialMessage[]>(getSavedMessages);

  // Save messages to localStorage on state change
  useEffect(() => {
    const nonEmptyMessages = initialMessages.filter((msg) => msg.message.trim() !== "");
    if (nonEmptyMessages.length && nonEmptyMessages[0].role !== YOU) {
      setInitialMessages((prevMessages) => [
        { ...prevMessages[0], role: YOU },
        ...prevMessages.slice(1),
      ]);
    }
    localStorage.setItem(LS_INITIAL_MESSAGES, JSON.stringify(nonEmptyMessages));
  }, [initialMessages]);

  // Handle input change
  const handleChange = useCallback((value: string, idx: number, key: keyof InitialMessage) => {
    setInitialMessages((prevMessages) =>
      prevMessages.map((msg, i) => (i === idx ? { ...msg, [key]: value } : msg))
    );
  }, []);

  // Add a new message
  const handleAddMessage = useCallback(() => {
    setInitialMessages((prevMessages) => [
      ...prevMessages,
      {
        role: prevMessages.length % 2 === 0 ? YOU : AI,
        message: "",
      },
    ]);
  }, []);

  // Delete a message
  const handleDeleteMessage = useCallback((idx: number) => {
    setInitialMessages((prevMessages) => prevMessages.filter((_, i) => i !== idx));
  }, []);

  return (
    <div className="p-3">
      <label className="block font-semibold text-black dark:text-white mb-5">
        {initialMessages.length === 0 ? "Add a predefined system message" : "Predefined System Messages (For new chats only)"}
      </label>
      {initialMessages.map((msg, idx) => (
        <div
          key={idx}
          className="mb-5 shadow-sm rounded-2xl bg-panel-light dark:bg-panel-dark border border-gray-200 dark:border-gray-800 flex flex-col gap-4 relative"
        >
          <select
            value={msg.role}
            onChange={(e) => handleChange(e.target.value, idx, "role")}
            className="w-full p-3 bg-app-light dark:bg-app-dark text-black dark:text-white rounded-xl border border-transparent focus:border-primary outline-none transition-all"
          >
            <option value={YOU}>You</option>
            <option value={AI}>Model</option>
          </select>
          <textarea
            value={msg.message}
            onChange={(e) => handleChange(e.target.value, idx, "message")}
            placeholder="Enter a message that will be sent as the first message in any new chat..."
            className="w-full p-3 bg-app-light dark:bg-slate-900/50 text-black dark:text-white rounded-xl border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none transition-all resize-y min-h-[80px]"
          />
          {initialMessages.length > 1 && (
            <button
              onClick={() => handleDeleteMessage(idx)}
              className="absolute -top-4 right-2 flex items-center justify-center bg-red-500 text-white hover:bg-red-600 w-8 h-8 rounded-full shadow-md transition-opacity hover:opacity-100 opacity-80 border-2 border-white dark:border-gray-800"
            >
              <FaTrash size={14} />
            </button>
          )}
        </div>
      ))}
      <button
        onClick={handleAddMessage}
        className="mx-auto mt-4 flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full shadow-md hover:bg-primary-hover transition w-max"
      >
        <FaPlus /> Add Message
      </button>
    </div>
  );
};

export default InitialMessages;
