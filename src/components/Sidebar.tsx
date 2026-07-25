import React, { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchChats, deleteChat, addChat, importChat } from "../features/chatSlice";
import { fetchCharacters } from "../features/characterSlice";
import { Link, useNavigate } from "react-router-dom";
import { FaTrash, FaFileImport, FaPlus, FaSearch } from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useModal } from "../contexts/ModalContext";
import { useSidebar } from "../contexts/SidebarContext";
import Modal from "./Modal";
import { Chat, Character } from "../types";
import { cn } from "../utils/cn";
import { CharacterAvatar } from "./ui/CharacterAvatar";
import Logo from "./ui/Logo";

const formatChatTime = (timestamp?: number) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const isToday = date.toDateString() === new Date().toDateString();
  return isToday
    ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showConfirm } = useModal();
  const { isOpen, close } = useSidebar();

  const chats = useAppSelector((state) => state.chat.chats);
  const characters = useAppSelector((state) => state.character.characters);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchChats());
    dispatch(fetchCharacters());
  }, [dispatch]);

  const handleDeleteChat = useCallback(async (chatId: number) => {
    const confirmed = await showConfirm("Delete Chat", "Are you sure you want to delete this chat?");
    if (confirmed) {
      dispatch(deleteChat(chatId));
      navigate("/");
      close();
    }
  }, [dispatch, navigate, showConfirm, close]);

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
    close();
  }, [chats, dispatch, navigate, close]);

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
          close();
        }
      } catch (error) {
        console.error("Failed to import chat:", error);
        alert("Failed to import chat. Invalid file.");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const filteredChats = useMemo(() => {
    if (!search.trim()) return chats;
    const q = search.trim().toLowerCase();
    return chats.filter((chat) => {
      const character = characters.find((c) => c.id === chat.characterId);
      return chat.title.toLowerCase().includes(q) || character?.name.toLowerCase().includes(q);
    });
  }, [chats, characters, search]);

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed z-50 top-0 left-0 w-[300px] h-full bg-panel border-r border-line flex flex-col transition-transform transform md:relative md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Sidebar"
      >
        {/* Logo header - h-[60px] to match Header.tsx so the border-b seam lines up */}
        <div className="h-[60px] px-4 flex items-center gap-[11px] border-b border-line flex-shrink-0">
          <Logo size={36} className="shadow-lg shadow-primary/30 rounded-[11px] flex-shrink-0" />
          <div className="leading-tight flex-1 min-w-0">
            <div className="font-bold text-[15.5px] tracking-tight text-ink">WhatsGemini</div>
            <div className="text-[11px] text-ink-faint font-medium">Gemini characters</div>
          </div>
        </div>

        {/* New chat / Import */}
        <div className="px-3.5 pt-3 pb-2.5 flex flex-col gap-2 flex-shrink-0">
          <button
            onClick={() => setIsNewChatModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-[11px] rounded-[11px] bg-gemini-logo text-onAccent text-[13.5px] font-semibold shadow-lg shadow-primary/25 hover:brightness-105 transition"
          >
            <FaPlus size={12} />
            <span>New chat</span>
          </button>
          <button
            onClick={handleImportClick}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[11px] border border-line bg-panel2 text-ink-muted text-[13px] font-medium hover:border-primary hover:text-ink transition"
          >
            <FaFileImport size={13} />
            <span>Import chat</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            style={{ display: "none" }}
          />
        </div>

        {/* Search */}
        <div className="px-3.5 pb-2.5 flex-shrink-0">
          <div className="flex items-center gap-2 bg-panel2 border border-line rounded-[10px] px-[11px] py-[9px]">
            <FaSearch size={12} className="text-ink-faint flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations"
              aria-label="Search conversations"
              className="flex-1 min-w-0 bg-transparent text-[12.5px] text-ink placeholder-ink-faint outline-none"
            />
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2.5">
          <div className="text-[10.5px] font-semibold tracking-[0.09em] uppercase text-ink-faint px-2 pt-2 pb-1.5">
            Recent
          </div>
          <ChatList chats={filteredChats} characters={characters} onDeleteChat={handleDeleteChat} onNavigate={close} />
        </div>
      </aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black z-40 md:hidden"
            onClick={close}
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
              <CharacterAvatar name={char.name} accent={char.accent} size={40} />
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

const ChatList = ({ chats, characters, onDeleteChat, onNavigate }: { chats: Chat[], characters: Character[], onDeleteChat: (id: number) => void, onNavigate: () => void }) => {
  return (
    <div className="flex-1 flex flex-col gap-0.5">
      {chats.map((chat) => {
        const character = characters.find((c) => c.id === chat.characterId);

        return (
          <Link
            to={`/chat/${chat.id}`}
            key={chat.id}
            onClick={onNavigate}
            className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer group hover:bg-hover transition"
          >
            <CharacterAvatar name={character?.name || chat.title} accent={character?.accent} size={34} />
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="flex-1 min-w-0 text-ink font-semibold text-[13.5px] truncate">{chat.title}</span>
                <span className="text-[10.5px] text-ink-faint flex-shrink-0">{formatChatTime(chat.timestamp)}</span>
              </div>
              {character?.description && (
                <span className="text-xs text-ink-muted truncate">{character.description}</span>
              )}
            </div>
            <button
              onClick={(e) => { e.preventDefault(); onDeleteChat(chat.id); }}
              className="p-1.5 text-ink-faint hover:text-red-500 hover:bg-red-500/10 transition rounded-lg flex-shrink-0"
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
