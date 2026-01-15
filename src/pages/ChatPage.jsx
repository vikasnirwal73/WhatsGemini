import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchChatById, fetchChats, addMessage, updateMessages } from "../features/chatSlice";
import { fetchCharacterById } from "../features/characterSlice";
import { generateAIResponse } from "../features/aiSlice";
import ChatWindow from "../components/ChatWindow";
import MessageInput from "../components/MessageInput";
import { FaArrowLeft, FaUser, FaDownload } from "react-icons/fa";
import { AI, MODEL, USER, YOU } from "../utils/constants";

const ChatPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const chats = useSelector((state) => state.chat.chats);
  const aiLoading = useSelector((state) => state.ai.loading);
  
  const [messages, setMessages] = useState([]);
  const [character, setCharacter] = useState("");
  const [error, setError] = useState(null);

  // Memoize chatIdNum to avoid redundant conversions
  const chatIdNum = useMemo(() => (chatId ? Number(chatId) : null), [chatId]);

  useEffect(() => {
    if (!chatIdNum) return;

    const fetchData = async () => {
      try {
        await dispatch(fetchChatById(chatIdNum)).unwrap();
        await dispatch(fetchChats()).unwrap();
      } catch (err) {
        console.error("Error fetching chat data:", err);
        setError("Failed to load chat. Please try again.");
      }
    };

    fetchData();
  }, [dispatch, chatIdNum]);

  useEffect(() => {
    if (chatIdNum && chats?.length) {
      const currentChat = chats.find((chat) => chat.id === chatIdNum);
      if (currentChat) {
        setMessages(currentChat.content);
        setCharacter(currentChat.title);
      }
    }
  }, [chatIdNum, chats]);

  useEffect(() => {
    if (messages.length > 0 && messages[0]?.characterId) {
      dispatch(fetchCharacterById(messages[0].characterId));
    }
  }, [dispatch, messages]);

  const createChatHistory = (msgs) =>
    msgs.map((msg) => ({
      role: msg.role === YOU ? USER : MODEL,
      parts: [{ text: msg.txt }],
    }));

  const handleSend = async (text) => {
    if (!text.trim() || !chatIdNum) return;

    setError(null);

    try {
      const resultAction = await dispatch(addMessage({ chatId: chatIdNum, role: YOU, text }));
      const updatedMessages = resultAction.payload || [];

      const chatHistory = createChatHistory(updatedMessages);
      const aiResponse = await dispatch(generateAIResponse({ prompt: text, history: chatHistory }));

      if (aiResponse.payload) {
        await dispatch(addMessage({ chatId: chatIdNum, role: AI, text: aiResponse.payload }));
      }

      dispatch(fetchChats());
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please try again.");
    }
  };

  const handleEditMessage = async (index, newText) => {
    if (!newText.trim() || !chatIdNum) return;

    setError(null);

    try {
      // Truncate messages up to (but not including) the edited message
      const truncatedMessages = messages.slice(0, index);
      await dispatch(updateMessages({ chatId: chatIdNum, newMessages: truncatedMessages }));

      // Add the edited message
      const resultAction = await dispatch(addMessage({ chatId: chatIdNum, role: YOU, text: newText }));
      const updatedMessages = resultAction.payload || [];

      // Generate new AI response
      const chatHistory = createChatHistory(updatedMessages);
      const aiResponse = await dispatch(generateAIResponse({ prompt: newText, history: chatHistory }));

      if (aiResponse.payload) {
        await dispatch(addMessage({ chatId: chatIdNum, role: AI, text: aiResponse.payload }));
      }

      dispatch(fetchChats());
    } catch (err) {
      console.error("Error editing message:", err);
      setError("Failed to edit message. Please try again.");
    }
  };

  const handleRegenerate = async (index) => {
    if (index < 0 || index >= messages.length || !chatIdNum) return;

    setError(null);

    try {
      const updatedMessages = messages.slice(0, index);
      await dispatch(updateMessages({ chatId: chatIdNum, newMessages: updatedMessages }));

      if (!updatedMessages.length || updatedMessages[updatedMessages.length - 1].role !== YOU) {
        console.warn("Cannot regenerate without a user message.");
        return;
      }

      const lastUserMessage = updatedMessages[updatedMessages.length - 1].txt;
      const chatHistory = createChatHistory(updatedMessages);
      const aiResponse = await dispatch(generateAIResponse({ prompt: lastUserMessage, history: chatHistory }));

      if (aiResponse.payload) {
        await dispatch(addMessage({ chatId: chatIdNum, role: AI, text: aiResponse.payload }));
      }

      dispatch(fetchChats());
    } catch (err) {
      console.error("Error regenerating response:", err);
      setError("Failed to regenerate response. Please try again.");
    }
  };

  const handleExport = () => {
    if (!chatIdNum || !chats) return;
    const currentChat = chats.find((c) => c.id === chatIdNum);
    if (!currentChat) return;
    
    const { id, ...exportData } = currentChat;
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat_${currentChat.title || "export"}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const goBackOrHome = () => {
    const idx = window.history.state?.idx;
    if (typeof idx === 'number' && idx > 0) {
      navigate(-1);
    } else {
      navigate('/', { replace: true });
    }
  };
  

  return (
    <div className="flex flex-col w-full h-dvh-minus-header chat-container bg-app-light dark:bg-app-dark">
      {/* Chat Header */}
      <ChatHeader character={character} onBack={goBackOrHome} onExport={handleExport} />

      {/* Error Message */}
      {error && <p className="text-red-500 text-center p-2">{error}</p>}

      {/* Chat Messages */}
      <div className="flex-1 overflow-auto">
        <ChatWindow messages={messages} onRegenerate={handleRegenerate} onEdit={handleEditMessage} aiLoading={aiLoading} />
      </div>

      {/* Message Input */}
      <MessageInput onSend={handleSend} disabled={aiLoading} />
    </div>
  );
};


const ChatHeader = ({ character, onBack, onExport }) => (
  <div className="flex items-center justify-between p-3 bg-panel-light dark:bg-panel-dark text-black dark:text-white border-b border-gray-200 dark:border-gray-800 shadow-sm z-10">
    <div className="flex items-center">
      <button
        onClick={onBack}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-300"
        title="Back"
      >
        <FaArrowLeft size={18} />
      </button>
      <div className="flex items-center gap-3 ml-3">
        <FaUser size={28} className="text-white" />
        <h2 className="text-lg font-semibold">{character || "Chat"}</h2>
      </div>
    </div>
    <button
      onClick={onExport}
      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-300"
      title="Export Chat"
    >
      <FaDownload size={18} />
    </button>
  </div>
);

export default ChatPage;
