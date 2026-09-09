import React, { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchChats, deleteChat, addChat, importChat, updateChatPinned } from "../features/chatSlice";
import { fetchCharacters } from "../features/characterSlice";
import { Link, useNavigate } from "react-router-dom";
import { FaTrash, FaFileImport, FaPlus, FaSearch, FaThumbtack } from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useModal } from "../contexts/ModalContext";
import { useSidebar } from "../contexts/SidebarContext";
import Modal from "./Modal";
import { Chat, Character } from "../types";
import { cn } from "../utils/cn";
import { CharacterAvatar } from "./ui/CharacterAvatar";
import { Button } from "./ui/button";
import Logo from "./ui/Logo";
import { stripLeakedBase64 } from "../features/ai/utils/apiUtils";

const formatChatTime = (timestamp?: number) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const isToday = date.toDateString() === new Date().toDateString();
  return isToday
    ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString([], { month: "short", day: "numeric" });
};

// The snippet row is a single-line CSS `truncate` (clipped by rendered pixel
// width, not character count), so the match has to land near the start of the
// snippet string or it gets clipped away before it's ever visible. Keep the
// leading context short; the trailing context can be long since it just gets
// truncated off harmlessly.
const SNIPPET_BEFORE = 14;
const SNIPPET_AFTER = 60;
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Highlights every case-insensitive occurrence of `query` inside `text`.
const HighlightedText = ({ text, query }: { text: string; query: string }) => {
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-primary/25 text-foreground rounded-sm">{part}</mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
};

// Finds the first message whose text contains `query` (case-insensitive) and
// returns a short window of context around the match, WhatsApp-search style.
const findMessageSnippet = (chat: Chat, query: string): string | undefined => {
  const q = query.toLowerCase();
  for (const msg of chat.content || []) {
    const text = stripLeakedBase64(msg.txt || "").trim();
    if (!text) continue;
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) continue;
    const start = Math.max(0, idx - SNIPPET_BEFORE);
    const end = Math.min(text.length, idx + q.length + SNIPPET_AFTER);
    return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
  }
  return undefined;
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

  const handleTogglePin = useCallback((chatId: number, pinned: boolean) => {
    dispatch(updateChatPinned({ chatId, pinned: !pinned }));
  }, [dispatch]);

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
    const q = search.trim();
    if (!q) return chats.map((chat) => ({ chat, snippet: undefined as string | undefined }));

    const lowerQ = q.toLowerCase();
    const results: { chat: Chat; snippet?: string }[] = [];
    for (const chat of chats) {
      const character = characters.find((c) => c.id === chat.characterId);
      const titleMatches = chat.title.toLowerCase().includes(lowerQ) || Boolean(character?.name.toLowerCase().includes(lowerQ));
      const snippet = titleMatches ? undefined : findMessageSnippet(chat, q);
      if (titleMatches || snippet) {
        results.push({ chat, snippet });
      }
    }
    return results;
  }, [chats, characters, search]);

  const pinnedItems = useMemo(() => filteredChats.filter((i) => i.chat.pinned), [filteredChats]);
  const unpinnedItems = useMemo(() => filteredChats.filter((i) => !i.chat.pinned), [filteredChats]);

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed z-50 top-0 left-0 w-[300px] h-full bg-card border-r border-border flex flex-col transition-transform transform md:relative md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Sidebar"
      >
        {/* Logo header - h-[60px] to match Header.tsx so the border-b seam lines up */}
        <div className="h-[60px] px-4 flex items-center gap-[11px] border-b border-border flex-shrink-0">
          <Logo size={36} className="shadow-lg shadow-primary/30 rounded-[11px] flex-shrink-0" />
          <div className="leading-tight flex-1 min-w-0">
            <div className="font-bold text-[15.5px] tracking-tight text-foreground">WhatsGemini</div>
            <div className="text-[11px] text-ink-faint font-medium">Gemini characters</div>
          </div>
        </div>

        {/* New chat / Import */}
        <div className="px-3.5 pt-3 pb-2.5 flex flex-col gap-2 flex-shrink-0">
          <Button
            onClick={() => setIsNewChatModalOpen(true)}
            variant="gradient"
            className="w-full h-auto py-[11px] rounded-[11px] text-[13.5px] font-semibold"
          >
            <FaPlus size={12} />
            <span>New chat</span>
          </Button>
          <Button
            onClick={handleImportClick}
            variant="panel"
            className="w-full h-auto py-2.5 rounded-[11px] border border-border text-muted-foreground text-[13px] font-medium hover:border-primary hover:text-foreground"
          >
            <FaFileImport size={13} />
            <span>Import chat</span>
          </Button>
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
          <div className="flex items-center gap-2 bg-muted border border-border rounded-[10px] px-[11px] py-[9px]">
            <FaSearch size={12} className="text-ink-faint flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats and messages"
              aria-label="Search chats and messages"
              className="flex-1 min-w-0 bg-transparent text-[12.5px] text-foreground placeholder-ink-faint outline-none"
            />
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2.5">
          {search.trim() && filteredChats.length === 0 ? (
            <p className="text-center text-ink-faint text-[12.5px] px-3 py-6">No chats or messages match "{search.trim()}".</p>
          ) : (
            <>
              {pinnedItems.length > 0 && (
                <>
                  <div className="text-[10.5px] font-semibold tracking-[0.09em] uppercase text-ink-faint px-2 pt-2 pb-1.5">
                    Pinned
                  </div>
                  <ChatList items={pinnedItems} characters={characters} onDeleteChat={handleDeleteChat} onTogglePin={handleTogglePin} onNavigate={close} query={search.trim()} />
                </>
              )}
              {unpinnedItems.length > 0 && (
                <>
                  <div className="text-[10.5px] font-semibold tracking-[0.09em] uppercase text-ink-faint px-2 pt-2 pb-1.5">
                    {pinnedItems.length > 0 ? "Other chats" : "Recent"}
                  </div>
                  <ChatList items={unpinnedItems} characters={characters} onDeleteChat={handleDeleteChat} onTogglePin={handleTogglePin} onNavigate={close} query={search.trim()} />
                </>
              )}
            </>
          )}
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
          <p className="text-muted-foreground text-center py-4">No characters available.</p>
        ) : (
          characters.map((char: Character) => (
            <Button
              key={char.id}
              onClick={() => {
                setIsNewChatModalOpen(false);
                handleCharacterClick(char.id, char.name);
              }}
              variant="ghost"
              className="w-full h-auto justify-start gap-3 p-3 rounded-xl text-left font-normal"
            >
              <CharacterAvatar name={char.name} accent={char.accent} size={40} />
              <div>
                <h3 className="font-medium text-foreground">{char.name}</h3>
                {char.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{char.description}</p>
                )}
              </div>
            </Button>
          ))
        )}
      </Modal>
    </>
  );
};

const ChatList = ({ items, characters, onDeleteChat, onTogglePin, onNavigate, query }: { items: { chat: Chat; snippet?: string }[], characters: Character[], onDeleteChat: (id: number) => void, onTogglePin: (id: number, pinned: boolean) => void, onNavigate: () => void, query: string }) => {
  return (
    <div className="flex-1 flex flex-col gap-0.5">
      {items.map(({ chat, snippet }) => {
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
                <span className="flex-1 min-w-0 text-foreground font-semibold text-[13.5px] truncate">
                  <HighlightedText text={chat.title} query={query} />
                </span>
                <span className="text-[10.5px] text-ink-faint flex-shrink-0">{formatChatTime(chat.timestamp)}</span>
              </div>
              {snippet ? (
                <span className="text-xs text-muted-foreground truncate">
                  <HighlightedText text={snippet} query={query} />
                </span>
              ) : character?.description ? (
                <span className="text-xs text-muted-foreground truncate">{character.description}</span>
              ) : null}
            </div>
            <Button
              onClick={(e) => { e.preventDefault(); onTogglePin(chat.id, Boolean(chat.pinned)); }}
              variant="ghost"
              size="icon"
              className={cn(
                "h-auto w-auto p-1.5 rounded-lg flex-shrink-0",
                chat.pinned
                  ? "text-primary hover:bg-transparent"
                  : "text-ink-faint opacity-0 group-hover:opacity-100 hover:text-primary hover:bg-primary/10"
              )}
              title={chat.pinned ? "Unpin chat" : "Pin chat"}
              aria-label={chat.pinned ? `Unpin chat with ${chat.title}` : `Pin chat with ${chat.title}`}
            >
              <FaThumbtack size={12} />
            </Button>
            <Button
              onClick={(e) => { e.preventDefault(); onDeleteChat(chat.id); }}
              variant="ghost"
              size="icon"
              className="h-auto w-auto p-1.5 rounded-lg text-ink-faint hover:text-red-500 hover:bg-red-500/10 flex-shrink-0"
              title="Delete Chat"
              aria-label={`Delete chat with ${chat.title}`}
            >
              <FaTrash size={12} />
            </Button>
          </Link>
        );
      })}
    </div>
  );
};

export default Sidebar;
