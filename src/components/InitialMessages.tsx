import React, { useEffect, useState, useCallback } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { AI, LS_INITIAL_MESSAGES, YOU } from "../utils/constants";
import { Select, TextArea } from "./ui/FormControls";

interface InitialMessage {
  role: string;
  message: string;
}

interface InitialMessagesProps {
  onSave?: () => void;
}

const InitialMessages: React.FC<InitialMessagesProps> = ({ onSave }) => {
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
  const isFirstRender = React.useRef(true);

  // Save messages to localStorage on state change
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const nonEmptyMessages = initialMessages.filter((msg) => msg.message.trim() !== "");
    if (nonEmptyMessages.length && nonEmptyMessages[0].role !== YOU) {
      setInitialMessages((prevMessages) => [
        { ...prevMessages[0], role: YOU },
        ...prevMessages.slice(1),
      ]);
      return; // Re-run effect after state update
    }
    
    const timeoutId = setTimeout(() => {
      localStorage.setItem(LS_INITIAL_MESSAGES, JSON.stringify(nonEmptyMessages));
      if (onSave) onSave();
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [initialMessages, onSave]);

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
    <div>
      <label className="block font-semibold text-foreground mb-5">
        {initialMessages.length === 0 ? "Add a predefined system message" : "Predefined System Messages"}
      </label>
      {initialMessages.map((msg, idx) => (
        <div
          key={idx}
          className="mb-5 p-3 shadow-sm rounded-2xl bg-card border border-border flex flex-col gap-2 relative"
        >
          <Select
            value={msg.role}
            onChange={(e) => handleChange(e.target.value, idx, "role")}
          >
            <option value={YOU}>You</option>
            <option value={AI}>Model</option>
          </Select>
          <TextArea
            value={msg.message}
            onChange={(e) => handleChange(e.target.value, idx, "message")}
            placeholder="Enter a message that will be sent as the first message in any new chat..."
          />
          {initialMessages.length > 1 && (
            <button
              onClick={() => handleDeleteMessage(idx)}
              className="absolute -top-4 right-2 flex items-center justify-center bg-red-500 text-white hover:bg-red-600 w-8 h-8 rounded-full shadow-md transition hover:opacity-100 opacity-90 border-2 border-card"
            >
              <FaTrash size={14} />
            </button>
          )}
        </div>
      ))}
      <button
        onClick={handleAddMessage}
        className="mx-auto mt-4 flex items-center gap-2 bg-primary text-onAccent px-4 py-2 rounded-full shadow-md hover:bg-primary-hover transition w-max"
      >
        <FaPlus /> Add Message
      </button>
    </div>
  );
};

export default InitialMessages;
