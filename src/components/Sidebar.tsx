import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchChats, deleteChat, addChat, importChat } from "../features/chatSlice";
import { fetchCharacters } from "../features/characterSlice";
import { Link, useNavigate } from "react-router-dom";
import { FaBars, FaTrash, FaFileImport, FaEdit, FaPlus, FaCog, FaSignOutAlt, FaUserPlus, FaMoon, FaSun } from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { AuthContext } from "../contexts/AuthContext";
import { ThemeContext } from "../contexts/ThemeContext";
import { useModal } from "../contexts/ModalContext";
import Modal from "./Modal";
import { DARK } from "../utils/constants";
import { Chat, Character } from "../types";
import { cn } from "../utils/cn";

const getInitials = (name?: string) => {
  if (!name || !name.trim()) return "?";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
};

const CharacterAvatar = ({ name, size = 32 }: { name?: string; size?: number }) => (
  <div
    className="rounded-full bg-gemini-logo flex items-center justify-center flex-shrink-0 text-white font-semibold shadow-sm"
    style={{ width: size, height: size, fontSize: size * 0.4 }}
  >
    {getInitials(name)}
  </div>
);

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
          "fixed z-50 top-0 left-0 w-[300px] h-full bg-app shadow-md border-r border-line flex flex-col transition-transform transform md:relative md:translate-x-0",
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
              <span className="text-xl font-bold tracking-tight text-ink">
                whatsgemini
              </span>
            </Link>
            <button
              className="p-2 text-ink-muted hover:text-ink transition rounded-full hover:bg-panel2"
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
            className="w-full flex items-center justify-center gap-2 bg-panel2 text-ink py-3 px-4 rounded-full hover:bg-line/60 transition shadow-sm font-medium"
          >
            <FaPlus size={12} />
            <span>New Chat</span>
          </button>
        </div>

        <div className="px-3 flex-1 flex flex-col overflow-y-auto">
          <ChatList chats={chats} characters={characters} onDeleteChat={handleDeleteChat} setIsOpen={setIsOpen} />
        </div>

        <div className="p-4 border-t border-line flex flex-col gap-2">
            <Link
                to="/characters"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-3 text-ink py-2 px-4 rounded-lg hover:bg-panel2 transition"
            >
                <FaUserPlus size={16} />
                <span className="font-medium text-sm">Characters</span>
            </Link>
            <button
                onClick={handleImportClick}
                className="w-full flex items-center gap-3 text-ink py-2 px-4 rounded-lg hover:bg-panel2 transition"
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
                className="w-full flex items-center gap-3 text-ink py-2 px-4 rounded-lg hover:bg-panel2 transition"
            >
                <FaCog size={16} />
                <span className="font-medium text-sm">Settings</span>
            </Link>

            <div className="flex items-center gap-2 mt-2">
              <button
                  onClick={toggleTheme}
                  className="flex-1 flex items-center justify-center gap-2 text-ink py-2 px-4 rounded-lg hover:bg-panel2 transition bg-panel2/60"
                  title="Toggle Theme"
              >
                  {isDarkMode ? <FaSun size={14} /> : <FaMoon size={14} />}
              </button>
              <button
                  onClick={logout}
                  className="flex-1 flex items-center justify-center gap-2 text-ink py-2 px-4 rounded-lg hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition bg-panel2/60"
                  title="Logout"
              >
                  <FaSignOutAlt size={14} />
              </button>
            </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black z-40 md:hidden"
            onClick={() => setIsOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      {/* New Chat Modal */}
      <Modal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        title="Select a Character"
      >
        {characters.length === 0 ? (
          <p className="text-ink-muted text-center py-4">No characters available.</p>
        ) : (
          characters.map((char: Character) => (
            <button
              key={char.id}
              onClick={() => {
                setIsNewChatModalOpen(false);
                handleCharacterClick(char.id, char.name);
              }}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-panel2 text-left transition"
            >
              <CharacterAvatar name={char.name} size={40} />
              <div>
                <h3 className="font-medium text-ink">{char.name}</h3>
                {char.description && (
                  <p className="text-xs text-ink-muted line-clamp-1">{char.description}</p>
                )}
              </div>
            </button>
          ))
        )}
      </Modal>
    </>
  );
};

const ChatList = ({ chats, characters, onDeleteChat, setIsOpen }: { chats: Chat[], characters: Character[], onDeleteChat: (id: number) => void, setIsOpen: (val: boolean) => void }) => {
  return (
    <div className="flex-1 flex flex-col gap-1">
      {chats.map((chat) => {
        const character = characters.find((c) => c.id === chat.characterId);

        return (
          <Link to={`/chat/${chat.id}`}
            key={chat.id}
            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer group hover:bg-panel2 transition"
          >
            <CharacterAvatar name={character?.name || chat.title} size={32} />
            <div className="flex-1 flex flex-col overflow-hidden" onClick={() => { setIsOpen(false) }}>
              <div className="flex justify-between items-center w-full">
                <span className="text-ink font-medium text-sm truncate">{chat.title}</span>
              </div>
              {character?.description && (
                <span className="text-xs text-ink-muted truncate">{character.description}</span>
              )}
            </div>
            <button
              onClick={(e) => { e.preventDefault(); onDeleteChat(chat.id); }}
              className="p-1.5 text-ink-muted/60 hover:text-red-500 hover:bg-red-500/10 transition rounded-lg flex-shrink-0"
              title="Delete Chat"
              aria-label={`Delete chat with ${chat.title}`}
            >
              <FaTrash size={12} />
            </button>
          </Link>
        );
      })}
    </div>
  );
};

export default Sidebar;
