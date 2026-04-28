import React, { useEffect, useState, useCallback } from "react";
import { fetchChats, deleteChat, addChat } from "../features/chatSlice";
import { fetchCharacters } from "../features/characterSlice";
import { Link, useNavigate } from "react-router-dom";
import { FaBars, FaTrash, FaUser, FaFileImport, FaEdit, FaPlus, FaCog, FaSignOutAlt, FaLightbulb, FaUserPlus, FaMoon, FaSun } from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { AuthContext } from "../contexts/AuthContext";
import { ThemeContext } from "../contexts/ThemeContext";
import { useModal } from "../contexts/ModalContext";
import Modal from "./Modal";
import { DARK } from "../utils/constants";
import { Chat, Character } from "../types";
import { cn } from "../utils/cn";

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { logout } = React.useContext(AuthContext);
  const { toggleTheme, theme } = React.useContext(ThemeContext);
  const { showConfirm } = useModal();

  const isDarkMode = theme === DARK;

  const chats = useAppSelector((state) => state.chat.chats);
  const characters = useAppSelector((state) => state.character.characters);
  const [isOpen, setIsOpen] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchChats());
    dispatch(fetchCharacters());
  }, [dispatch]);

  const handleDeleteChat = useCallback(async (chatId: number) => {
    const confirmed = await showConfirm("Delete Chat", "Are you sure you want to delete this chat?");
    if (confirmed) {
      dispatch(deleteChat(chatId));
      navigate("/");
      setIsOpen(false);
    }
  }, [dispatch, navigate, showConfirm]);

  const handleCharacterClick = useCallback(async (characterId: number, characterName: string) => {
    const existingChat = chats.find((chat: Chat) => chat.characterId === characterId);
    if (existingChat) {
      navigate(`/chat/${existingChat.id}`);
    } else {
      const result = await dispatch(addChat({ title: characterName, characterId }));
      if (result.payload && (result.payload as Chat).id) {
        navigate(`/chat/${(result.payload as Chat).id}`);
      }
    }
    setIsOpen(false);
  }, [chats, dispatch, navigate]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const chatData = JSON.parse(e.target?.result as string);
        const { importChat } = await import("../features/chatSlice");
        const result = await dispatch(importChat(chatData)).unwrap();
        if (result && result.id) {
            navigate(`/chat/${result.id}`);
            setIsOpen(false);
        }
      } catch (error) {
        console.error("Failed to import chat:", error);
        alert("Failed to import chat. Invalid file.");
      }
    };
    reader.readAsText(file);
    event.target.value = ''; 
  };

  return (
    <>
      {/* Mobile Sidebar Toggle */}
      <button
        className="md:hidden fixed top-3 left-4 z-50 bg-primary p-2 rounded-full text-white shadow-md hover:bg-primary-hover transition"
        onClick={() => setIsOpen(true)}
        title="Open Menu"
        aria-label="Open Sidebar"
      >
        <FaBars size={20} />
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed z-50 top-0 left-0 w-[300px] h-full bg-app-light dark:bg-app-dark shadow-md border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform transform md:relative md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Sidebar"
      >
        <div className="p-5 flex flex-col gap-5">
          {/* Logo Header */}
          <div className="flex items-center justify-between">
            <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center gap-3 transition hover:opacity-80">
              <div className="w-8 h-8 rounded-full bg-gemini-logo flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                whatsgemini
              </span>
            </Link>
            <button 
              className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition"
              title="Compose"
              onClick={() => setIsNewChatModalOpen(true)}
            >
              <FaEdit size={16} />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => {
               setIsNewChatModalOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 bg-gray-200 dark:bg-slate-800 text-gray-800 dark:text-gray-200 py-3 px-4 rounded-full hover:bg-gray-300 dark:hover:bg-slate-700 transition shadow-sm font-medium"
          >
            <FaPlus size={12} />
            <span>New Chat</span>
          </button>
        </div>

        <div className="px-3 flex-1 flex flex-col overflow-y-auto">
          <ChatList chats={chats} onDeleteChat={handleDeleteChat} setIsOpen={setIsOpen} />
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-2">
            <Link
                to="/characters"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-3 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition"
            >
                <FaUserPlus size={16} />
                <span className="font-medium text-sm">Characters</span>
            </Link>
            <button
                onClick={handleImportClick}
                className="w-full flex items-center gap-3 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition"
            >
                <FaFileImport size={16} />
                <span className="font-medium text-sm">Import Chat</span>
            </button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                style={{ display: "none" }}
            />
            <Link
                to="/settings"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-3 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition"
            >
                <FaCog size={16} />
                <span className="font-medium text-sm">Settings</span>
            </Link>
            
            <div className="flex items-center gap-2 mt-2">
              <button
                  onClick={toggleTheme}
                  className="flex-1 flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition bg-gray-50 dark:bg-slate-800/50"
                  title="Toggle Theme"
              >
                  {isDarkMode ? <FaSun size={14} /> : <FaMoon size={14} />}
              </button>
              <button
                  onClick={logout}
                  className="flex-1 flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition bg-gray-50 dark:bg-slate-800/50"
                  title="Logout"
              >
                  <FaSignOutAlt size={14} />
              </button>
            </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black opacity-50 z-40 md:hidden" onClick={() => setIsOpen(false)}></div>}

      {/* New Chat Modal */}
      <Modal 
        isOpen={isNewChatModalOpen} 
        onClose={() => setIsNewChatModalOpen(false)} 
        title="Select a Character"
      >
        {characters.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No characters available.</p>
        ) : (
          characters.map((char: Character) => (
            <button
              key={char.id}
              onClick={() => {
                setIsNewChatModalOpen(false);
                handleCharacterClick(char.id, char.name);
              }}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-left transition"
            >
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                <FaUser />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">{char.name}</h3>
                {char.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{char.description}</p>
                )}
              </div>
            </button>
          ))
        )}
      </Modal>
    </>
  );
};

const ChatList = ({ chats, onDeleteChat, setIsOpen }: { chats: Chat[], onDeleteChat: (id: number) => void, setIsOpen: (val: boolean) => void }) => {
  return (
    <div className="flex-1 flex flex-col gap-1">
      {chats.map((chat, i) => {
        // Just alternating icons for mockup feel
        const isProject = i % 2 === 0;
        const Icon = isProject ? FaLightbulb : FaUser;
        const iconColor = isProject ? 'bg-indigo-500' : 'bg-slate-500';

        return (
          <div
            key={chat.id}
            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer group hover:bg-gray-200 dark:hover:bg-slate-800 transition"
          >
            <div className={`w-8 h-8 rounded-full ${iconColor} flex items-center justify-center flex-shrink-0 text-white shadow-sm`}>
              <Icon size={14} />
            </div>
            <Link to={`/chat/${chat.id}`} className="flex-1 flex flex-col overflow-hidden" onClick={() => { setIsOpen(false) }}>
              <div className="flex justify-between items-center w-full">
                <span className="text-gray-900 dark:text-slate-200 font-medium text-sm truncate">{chat.title}</span>
                <span className="text-xs text-gray-500 dark:text-slate-500 ml-2 flex-shrink-0">
                  {i < 10 ? `0${i+5}:59` : `1${i-10}:23`}
                </span>
              </div>
            </Link>
            <button
              onClick={() => onDeleteChat(chat.id)}
              className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition absolute right-4 bg-slate-800 rounded shadow-md"
              title="Delete Chat"
              aria-label={`Delete chat with ${chat.title}`}
            >
              <FaTrash size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Sidebar;
