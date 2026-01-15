import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchChats, deleteChat, addChat } from "../features/chatSlice";
import { fetchCharacters } from "../features/characterSlice";
import { Link, useNavigate } from "react-router-dom";
import { FaBars, FaTrash, FaUser, FaFileImport } from "react-icons/fa";

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const chats = useSelector((state) => state.chat.chats);
  const characters = useSelector((state) => state.character.characters);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchChats());
    dispatch(fetchCharacters());
  }, [dispatch]);

  const handleDeleteChat = useCallback(async (chatId) => {
    if (window.confirm("Are you sure you want to delete this chat?")) {
      dispatch(deleteChat(chatId));
      navigate("/chat");
      setIsOpen(false);
    }
  }, [dispatch, navigate]);

  const handleCharacterClick = useCallback(async (characterId, characterName) => {
    const existingChat = chats.find((chat) => chat.characterId === characterId);
    if (existingChat) {
      navigate(`/chat/${existingChat.id}`);
    } else {
      const result = await dispatch(addChat({ title: characterName, characterId }));
      if (result.payload?.id) {
        navigate(`/chat/${result.payload.id}`);
      }
    }
    setIsOpen(false);
  }, [chats, dispatch, navigate]);

  const chatCharacterIds = new Set(chats.map(chat => chat.characterId));
  const filteredCharacters = characters.filter(character => !chatCharacterIds.has(character.id));

  const fileInputRef = React.useRef(null);

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const chatData = JSON.parse(e.target.result);
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
    event.target.value = null; 
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
        className={`fixed z-50 top-0 left-0 w-72 h-full bg-panel-light dark:bg-panel-dark shadow-md 
          transform ${isOpen ? "translate-x-0" : "-translate-x-full"} transition-transform md:translate-x-0 md:relative border-r border-gray-200 dark:border-gray-800 flex flex-col`}
        aria-label="Sidebar"
      >
        <div className="p-4 flex-1 flex flex-col overflow-y-auto">
          <CharacterList characters={filteredCharacters} onCharacterClick={handleCharacterClick} />
          <ChatList chats={chats} onDeleteChat={handleDeleteChat} setIsOpen={setIsOpen} />
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <button
                onClick={handleImportClick}
                className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
                <FaFileImport />
                <span>Import Chat</span>
            </button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                style={{ display: "none" }}
            />
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black opacity-50 z-40 md:hidden" onClick={() => setIsOpen(false)}></div>}
    </>
  );
};

const CharacterList = ({ characters, onCharacterClick }) => {
  if (!characters.length) return null;
  return (
    <>
      <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">Contacts</h3>
      {characters.map((char) => (
        <div
          key={char.id}
          className="flex items-center gap-3 p-3 my-1 rounded-xl cursor-pointer 
            hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          onClick={() => onCharacterClick(char.id, char.name)}
          title={`Start chat with ${char.name}`}
          aria-label={`Chat with ${char.name}`}
        >
          <div className="bg-primary/10 p-2 rounded-full">
            <FaUser className="text-primary" size={16} />
          </div>
          <span className="text-gray-900 dark:text-white font-medium">{char.name}</span>
        </div>
      ))}
    </>
  );
};

const ChatList = ({ chats, onDeleteChat, setIsOpen }) => {
  if (!chats.length) return null;
  return (
    <>
      <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-6 mb-3 px-2">Chats</h3>
      <div className="flex-1">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className="flex justify-between items-center my-1 rounded-xl cursor-pointer group 
              hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <Link to={`/chat/${chat.id}`} className="p-3 flex-1 text-gray-900 dark:text-white font-medium text-md truncate" onClick={() => { setIsOpen(false) }}>
              {chat.title}
            </Link>
            <button
              onClick={() => onDeleteChat(chat.id)}
              className="p-2 mr-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
              title="Delete Chat"
              aria-label={`Delete chat with ${chat.title}`}
            >
              <FaTrash size={14} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
};

export default Sidebar;