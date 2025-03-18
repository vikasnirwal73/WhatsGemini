import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchChats, deleteChat, addChat } from "../features/chatSlice";
import { fetchCharacters } from "../features/characterSlice";
import { Link, useNavigate } from "react-router-dom";
import { FaBars, FaTrash, FaUser } from "react-icons/fa";

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

  return (
    <>
      {/* Mobile Sidebar Toggle */}
      <button
        className="md:hidden fixed top-3 left-4 z-50 bg-[#008069] p-2 rounded-full text-white shadow-md hover:bg-[#026e58] transition"
        onClick={() => setIsOpen(true)}
        title="Open Menu"
        aria-label="Open Sidebar"
      >
        <FaBars size={20} />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed z-50 top-0 left-0 w-72 h-full bg-[#ffffff] dark:bg-[#202c33] shadow-md 
          transform ${isOpen ? "translate-x-0" : "-translate-x-full"} transition-transform md:translate-x-0 md:relative`}
        aria-label="Sidebar"
      >
        <div className="p-4 h-full flex flex-col overflow-y-auto">
          <CharacterList characters={filteredCharacters} onCharacterClick={handleCharacterClick} />
          <ChatList chats={chats} onDeleteChat={handleDeleteChat} setIsOpen={setIsOpen} />
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
      <h3 className="text-lg font-semibold text-[#008069] dark:text-[#25D366] mb-2">Contacts</h3>
      {characters.map((char) => (
        <div
          key={char.id}
          className="flex items-center gap-2 p-3 my-1 rounded-lg cursor-pointer 
            hover:bg-gray-100 dark:hover:bg-[#2a3942] transition"
          onClick={() => onCharacterClick(char.id, char.name)}
          title={`Start chat with ${char.name}`}
          aria-label={`Chat with ${char.name}`}
        >
          <FaUser className="text-[#008069] dark:text-[#25D366]" size={18} />
          <span className="text-black dark:text-white">{char.name}</span>
        </div>
      ))}
    </>
  );
};

const ChatList = ({ chats, onDeleteChat, setIsOpen }) => {
  if (!chats.length) return null;
  return (
    <>
      <h3 className="text-lg font-semibold text-[#008069] dark:text-[#25D366] mt-5">Chats</h3>
      <div className="flex-1">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className="flex justify-between items-center p-3 my-1 rounded-lg cursor-pointer 
              hover:bg-gray-100 dark:hover:bg-[#2a3942] transition"
          >
            <Link to={`/chat/${chat.id}`} className="flex-1 text-black dark:text-white text-md truncate" onClick={() => { setIsOpen(false) }}>
              {chat.title}
            </Link>
            <button
              onClick={() => onDeleteChat(chat.id)}
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
              title="Delete Chat"
              aria-label={`Delete chat with ${chat.title}`}
            >
              <FaTrash size={16} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
};

export default Sidebar;