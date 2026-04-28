import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchChatById, fetchChats, addMessage, updateMessages } from "../features/chatSlice";
import { fetchCharacterById } from "../features/characterSlice";
import { generateAIResponse, calculateTokenCount } from "../features/aiSlice";
import ChatWindow from "../components/ChatWindow";
import MessageInput from "../components/MessageInput";
import { FaInfoCircle } from "react-icons/fa";
import { AI, MODEL, USER, YOU, LS_USER_PROFILE } from "../utils/constants";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { Message, UserProfile } from "../types";

const ChatPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const chats = useAppSelector((state) => state.chat.chats);
  const characters = useAppSelector((state) => state.character.characters);
  const aiLoading = useAppSelector((state) => state.ai.loading);
  const aiTokenCount = useAppSelector((state) => state.ai.tokenCount);
  const aiCostEstimate = useAppSelector((state) => state.ai.costEstimate);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [character, setCharacter] = useState("");
  // const [characterData, setCharacterData] = useState<Character | null>(null);
  const [error, setError] = useState<string | null>(null);
  const aiPromiseRef = useRef<any>(null);

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

  const currentChat = useMemo(() => chats.find((chat) => chat.id === chatIdNum), [chats, chatIdNum]);

  useEffect(() => {
    if (currentChat) {
      setMessages(currentChat.content);
      setCharacter(currentChat.title);
    }
  }, [currentChat]);

  const createChatHistory = useCallback((msgs: Message[]) =>
    msgs.map((msg) => ({
      role: msg.role === YOU ? USER : MODEL,
      parts: [{ text: msg.txt }],
    })), []);

  const getSystemInstruction = useCallback(() => {
    const charId = currentChat?.characterId;
    if (!charId) return undefined;
    
    const characterInfo = characters.find(c => c.id === charId);
    if (!characterInfo) return undefined;

    let roleplayPrompt = `Role play as, Character Name: ${characterInfo.name}.\nCharacter description: ${characterInfo.description}.\nExample dialogue: ${characterInfo.prompt}`;
            
    try {
      const userProfileRaw = localStorage.getItem(LS_USER_PROFILE);
      if (userProfileRaw) {
        const userProfile: UserProfile = JSON.parse(userProfileRaw);
        const userNameStr = userProfile.name ? `User's Name: ${userProfile.name}.` : "";
        const userBioStr = userProfile.bio ? `User's Bio/Details: ${userProfile.bio}.` : "";
        if (userNameStr || userBioStr) {
          roleplayPrompt += `\n\nAbout the User you are talking to:\n${userNameStr} ${userBioStr}`;
        }
      }
      if (characterInfo.relationship) {
        roleplayPrompt += `\nYour relationship with the user: ${characterInfo.relationship}`;
      }
    } catch (e) {
      console.error("Error parsing user profile for context:", e);
    }
    
    return roleplayPrompt;
  }, [currentChat, characters]);

  useEffect(() => {
    if (messages.length > 0) {
      if (currentChat?.characterId) {
        dispatch(fetchCharacterById(currentChat.characterId as number));
      }
      
      // Calculate token count for the current chat context
      const chatHistory = createChatHistory(messages);
      const systemInstruction = getSystemInstruction();
      dispatch(calculateTokenCount({ history: chatHistory, systemInstruction }));
    }
  }, [dispatch, messages, createChatHistory, getSystemInstruction, currentChat]);

  const handleSend = async (text: string) => {
    if (!text.trim() || !chatIdNum) return;

    setError(null);

    try {
      const resultAction = await dispatch(addMessage({ chatId: chatIdNum, role: YOU, text }));
      const updatedMessages = resultAction.payload as Message[] || [];

      const chatHistory = createChatHistory(updatedMessages);
      const systemInstruction = getSystemInstruction();
      aiPromiseRef.current = dispatch(generateAIResponse({ prompt: text, history: chatHistory, systemInstruction }));
      const aiResponse = await aiPromiseRef.current;
      aiPromiseRef.current = null;

      if (aiResponse.payload) {
        await dispatch(addMessage({ chatId: chatIdNum, role: AI, text: aiResponse.payload as string }));
      }

      dispatch(fetchChats());
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please try again.");
    }
  };

  const handleEditMessage = async (index: number, newText: string) => {
    if (!newText.trim() || !chatIdNum) return;

    setError(null);

    try {
      // Truncate messages up to (but not including) the edited message
      const truncatedMessages = messages.slice(0, index);
      await dispatch(updateMessages({ chatId: chatIdNum, newMessages: truncatedMessages }));

      // Add the edited message
      const resultAction = await dispatch(addMessage({ chatId: chatIdNum, role: YOU, text: newText }));
      const updatedMessages = resultAction.payload as Message[] || [];

      // Generate new AI response
      const chatHistory = createChatHistory(updatedMessages);
      const systemInstruction = getSystemInstruction();
      aiPromiseRef.current = dispatch(generateAIResponse({ prompt: newText, history: chatHistory, systemInstruction }));
      const aiResponse = await aiPromiseRef.current;
      aiPromiseRef.current = null;

      if (aiResponse.payload) {
        await dispatch(addMessage({ chatId: chatIdNum, role: AI, text: aiResponse.payload as string }));
      }

      dispatch(fetchChats());
    } catch (err) {
      console.error("Error editing message:", err);
      setError("Failed to edit message. Please try again.");
    }
  };

  const handleRegenerate = async (index: number) => {
    if (index < 0 || index >= messages.length || !chatIdNum) return;

    setError(null);

    try {
      const updatedMessages = messages.slice(0, index);
      await dispatch(updateMessages({ chatId: chatIdNum, newMessages: updatedMessages }));

      if (!updatedMessages.length || updatedMessages[updatedMessages.length - 1].role !== YOU) {
        console.warn("Cannot regenerate without a user message.");
        return;
      }

      const lastUserMessage = updatedMessages[updatedMessages.length - 1].txt || "";
      const chatHistory = createChatHistory(updatedMessages);
      const systemInstruction = getSystemInstruction();
      aiPromiseRef.current = dispatch(generateAIResponse({ prompt: lastUserMessage, history: chatHistory, systemInstruction }));
      const aiResponse = await aiPromiseRef.current;
      aiPromiseRef.current = null;

      if (aiResponse.payload) {
        await dispatch(addMessage({ chatId: chatIdNum, role: AI, text: aiResponse.payload as string }));
      }

      dispatch(fetchChats());
    } catch (err) {
      console.error("Error regenerating response:", err);
      setError("Failed to regenerate response. Please try again.");
    }
  };

  const handleInfoClick = () => {
    navigate("/settings");
  };

  const handleStopGenerating = () => {
    if (aiPromiseRef.current) {
      aiPromiseRef.current.abort();
      aiPromiseRef.current = null;
    }
  };
  
  return (
    <div className="flex flex-col w-full h-screen bg-app-light dark:bg-app-dark relative">
      {/* Chat Header */}
      <ChatHeader onInfoClick={handleInfoClick} />

      {/* Error Message */}
      {error && <p className="text-red-500 text-center p-2 absolute top-16 w-full z-20">{error}</p>}

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden relative">
        <ChatWindow characterName={character} messages={messages} onRegenerate={handleRegenerate} onEdit={handleEditMessage} aiLoading={aiLoading} onSend={handleSend} />
      </div>

      {/* Message Input Floating */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-4xl px-4 z-20">
        <MessageInput onSend={handleSend} disabled={aiLoading} onStop={handleStopGenerating} tokenCount={aiTokenCount} costEstimate={aiCostEstimate} />
      </div>
    </div>
  );
};

const ChatHeader = ({ onInfoClick }: { onInfoClick: () => void }) => (
  <div className="flex items-center justify-between px-8 py-5 bg-transparent text-gray-900 dark:text-slate-100 z-10">
    <h2 className="text-2xl font-medium tracking-wide">Chat</h2>
    <button
      onClick={onInfoClick}
      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 transition text-gray-500 dark:text-slate-400 dark:hover:text-slate-200"
      title="Gemini Context"
    >
      <FaInfoCircle size={22} />
    </button>
  </div>
);

export default ChatPage;
