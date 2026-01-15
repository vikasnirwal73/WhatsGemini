import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCharacters, addCharacter, deleteCharacter, updateCharacter } from "../features/characterSlice";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaTrash, FaEdit, FaTimes } from "react-icons/fa";


const CharacterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const characters = useSelector((state) => state.character.characters);
  const loading = useSelector((state) => state.character.loading);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [editCharacter, setEditCharacter] = useState(null); 

  useEffect(() => {
    dispatch(fetchCharacters());
  }, [dispatch]);

  const handerSetEditCharacter = () => {
    setEditCharacter(null);
    setName("");
    setDescription("");
    setPrompt("");
  } 

  const handleCreateCharacter = () => {
    if (!name || !prompt) {
      alert("Character name and prompt are required.");
      return;
    }

    dispatch(addCharacter({ name, description, prompt }));
    setName("");
    setDescription("");
    setPrompt("");
  };

  const handleDeleteCharacter = (id) => {
    if (window.confirm("Are you sure you want to delete this character and their chats?")) {
      dispatch(deleteCharacter(id));
    }
  };

  const handleEditCharacter = (char) => {
    setEditCharacter(char);
    setName(char.name);
    setDescription(char.description);
    setPrompt(char.prompt);
  };

  const handleSaveEdit = () => {
    if (!name || !prompt) {
      alert("Character name and prompt are required.");
      return;
    }

    dispatch(updateCharacter({ id: editCharacter.id, name, description, prompt }));
    setEditCharacter(null);
    setName("");
    setDescription("");
    setPrompt("");
  };

  const truncateText = (text, maxLength = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
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
    <div className="w-full h-screen flex flex-col p-6 bg-app-light dark:bg-app-dark overflow-auto">
      {/* Back Button */}
      <button
        onClick={goBackOrHome}
        className="mb-4 flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full shadow-md hover:bg-primary-hover transition w-max"
      >
        <FaArrowLeft size={16} />
        <span>Back</span>
      </button>

      <h2 className="text-2xl font-bold mb-4 text-center text-primary dark:text-white">
        {editCharacter ? "Edit Character" : "Create a Character"}
      </h2>

      {/* Character Form */}
      <div className="w-full max-w-3xl mx-auto p-5 bg-panel-light dark:bg-panel-dark shadow-lg rounded-2xl">
        <input
          type="text"
          placeholder="Character Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 bg-app-light dark:bg-app-dark text-black dark:text-white rounded-xl border border-transparent focus:border-primary outline-none mb-3"
        />
        <textarea
          placeholder="Description (Optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-3 bg-app-light dark:bg-app-dark text-black dark:text-white rounded-xl border border-transparent focus:border-primary outline-none mb-3"
        />
        <textarea
          placeholder="Character Prompt (Personality, Style, etc.)"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full p-3 bg-app-light dark:bg-app-dark text-black dark:text-white rounded-xl border border-transparent focus:border-primary outline-none mb-3"
        />
        <div className="flex gap-3">
          <button
            onClick={editCharacter ? handleSaveEdit : handleCreateCharacter}
            className="flex-1 bg-primary text-white px-4 py-2 rounded-full shadow-md hover:bg-primary-hover transition"
            disabled={loading}
          >
            {loading ? "Saving..." : editCharacter ? "Save Changes" : "Create Character"}
          </button>
          {editCharacter && (
            <button
              onClick={() => handerSetEditCharacter(null)}
              className="bg-gray-400 text-white px-4 py-2 rounded-full shadow-md hover:bg-gray-500 transition"
            >
              <FaTimes size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Saved Characters */}
      <h3 className="text-xl font-bold mt-6 text-center text-primary dark:text-white">
        Saved Characters
      </h3>
      <div className="w-full max-w-3xl mx-auto mt-4 mb-20">
        {loading ? (
          <p className="text-gray-500 dark:text-gray-400 text-center">Loading...</p>
        ) : characters.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center">No characters created yet.</p>
        ) : (
          characters.map((char) => (
            <div
              key={char.id}
              className="p-4 border border-gray-200 dark:border-gray-800 mb-3 rounded-xl flex justify-between items-center bg-panel-light dark:bg-panel-dark shadow-sm"
            >
              <div>
                <h4 className="font-semibold text-lg text-black dark:text-white">{char.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 nowrap">{truncateText(char.description)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditCharacter(char)}
                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
                  title="Edit Character"
                >
                  <FaEdit size={16} />
                </button>
                <button
                  onClick={() => handleDeleteCharacter(char.id)}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                  title="Delete Character"
                >
                  <FaTrash size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CharacterPage;
