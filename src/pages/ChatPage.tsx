import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchChatById, fetchChats, addMessage, updateMessages } from "../features/chatSlice";
import { fetchCharacterById } from "../features/characterSlice";
import { generateAIResponse, compressChatHistory } from "../features/aiSlice";
import ChatWindow from "../components/ChatWindow";
import MessageInput from "../components/MessageInput";
import { FaInfoCircle, FaCompressArrowsAlt, FaDownload } from "react-icons/fa";
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
  const aiCompressing = useAppSelector((state) => state.ai.compressing);
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
        await dispatch(addMessage({ chatId: chatIdNum, role: AI, text: (aiResponse.payload as any)?.text || (aiResponse.payload as string) }));
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
        await dispatch(addMessage({ chatId: chatIdNum, role: AI, text: (aiResponse.payload as any)?.text || (aiResponse.payload as string) }));
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
        await dispatch(addMessage({ chatId: chatIdNum, role: AI, text: (aiResponse.payload as any)?.text || (aiResponse.payload as string) }));
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

  const handleCompress = async () => {
    if (messages.length <= 4 || !chatIdNum) return;

    setError(null);
    try {
      // Keep only the last 2 messages uncompressed if possible, but summarize everything before
      const cutoff = Math.max(messages.length - 2, 2);
      const msgsToCompress = messages.slice(0, cutoff);
      const historyToCompress = createChatHistory(msgsToCompress);
      const systemInstruction = getSystemInstruction();

      const summaryObj = await dispatch(compressChatHistory({ history: historyToCompress, systemInstruction })).unwrap();

      if (summaryObj) {
        const retainedMsgs = messages.slice(cutoff);
        
        // Create new memory initialization format messages
        const newMessages: Message[] = [
          { role: YOU, txt: "[SYSTEM DIRECTIVE]: I will provide you with a summary of our conversation so far. Treat this summary as the exact events that have already occurred between us. Please strictly maintain the language (e.g. Hinglish, informal English, etc.), tone, and emotional feeling indicated in the summary as we continue.\n\nSummary:\n" + summaryObj },
          { role: AI, txt: "Understood. I will remember our history and continue speaking in the exact same language, tone, and emotional state as before." },
          ...retainedMsgs
        ];

        // Ensure characterId and timestamp propagates safely if needed on the slice update
        // We do a full DB overwrite of the chat's content
        await dispatch(updateMessages({ chatId: chatIdNum, newMessages }));
        dispatch(fetchChats());
      }
    } catch (err) {
      console.error("Error compressing chat:", err);
      setError("Failed to compress conversation. It might be too short or an API error occurred.");
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
    a.download = `chat-${chatIdNum}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="flex flex-col w-full h-screen bg-app-light dark:bg-app-dark relative">
      {/* Chat Header */}
      <ChatHeader onInfoClick={handleInfoClick} onCompressClick={handleCompress} onExportClick={handleExport} isCompressing={aiCompressing} canCompress={messages.length > 4} />

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

const ChatHeader = ({ onInfoClick, onCompressClick, onExportClick, isCompressing, canCompress }: { onInfoClick: () => void, onCompressClick: () => void, onExportClick: () => void, isCompressing: boolean, canCompress: boolean }) => (
  <div className="flex items-center justify-between px-8 py-5 bg-transparent text-gray-900 dark:text-slate-100 z-10">
    <h2 className="text-2xl font-medium tracking-wide">Chat</h2>
    <div className="flex items-center gap-3">
      <button
        onClick={onExportClick}
        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 transition text-gray-500 dark:text-slate-400 dark:hover:text-slate-200"
        title="Export Chat"
      >
        <FaDownload size={18} />
      </button>
      {canCompress && (
        <button
          onClick={onCompressClick}
          disabled={isCompressing}
          className={`p-2 rounded-full transition text-gray-500 dark:text-slate-400 ${isCompressing ? 'animate-pulse opacity-50 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-slate-800 dark:hover:text-slate-200'}`}
          title="Summarize and compress older messages to save tokens."
        >
          <FaCompressArrowsAlt size={18} />
        </button>
      )}
      <button
        onClick={onInfoClick}
        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 transition text-gray-500 dark:text-slate-400 dark:hover:text-slate-200"
        title="Gemini Context"
      >
        <FaInfoCircle size={22} />
      </button>
    </div>
  </div>
);

export default ChatPage;
