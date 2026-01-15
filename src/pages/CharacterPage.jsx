import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCharacters, addCharacter, deleteCharacter, updateCharacter } from "../features/characterSlice";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaTrash, FaEdit, FaTimes, FaDownload, FaUpload } from "react-icons/fa";


const CharacterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
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

  const handleExportCharacter = (char) => {
    const dataToExport = {
      name: char.name,
      description: char.description,
      prompt: char.prompt,
    };

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${char.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_character.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const parsed = JSON.parse(content);

        if (!parsed.name || !parsed.prompt) {
          alert("Invalid character file: Missing name or prompt.");
          return;
        }

        dispatch(
          addCharacter({
            name: parsed.name,
            description: parsed.description || "",
            prompt: parsed.prompt,
          })
        );

        alert("Character imported successfully!");
      } catch (err) {
        console.error("Import error:", err);
        alert("Failed to import character. Invalid JSON file.");
      }
    };
    reader.readAsText(file);
    event.target.value = null; // Reset input
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
          {!editCharacter && (
            <button
              onClick={handleImportClick}
              className="bg-green-600 text-white px-4 py-2 rounded-full shadow-md hover:bg-green-700 transition flex items-center justify-center gap-2"
              title="Import Character from JSON"
            >
              <FaUpload size={16} />
              <span className="hidden sm:inline">Import</span>
            </button>
          )}
          {editCharacter && (
            <button
              onClick={() => handerSetEditCharacter(null)}
              className="bg-gray-400 text-white px-4 py-2 rounded-full shadow-md hover:bg-gray-500 transition"
            >
              <FaTimes size={16} />
            </button>
          )}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          style={{ display: "none" }}
        />
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
                  onClick={() => handleExportCharacter(char)}
                  className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition"
                  title="Export Character"
                >
                  <FaDownload size={16} />
                </button>
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
