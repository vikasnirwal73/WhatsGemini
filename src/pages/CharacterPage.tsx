import React, { useState, useEffect, useRef } from "react";
import { fetchCharacters, addCharacter, deleteCharacter, updateCharacter } from "../features/characterSlice";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaTrash, FaEdit, FaTimes, FaDownload, FaUpload, FaCopy } from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { Character } from "../types";
import { useModal } from "../contexts/ModalContext";
import { dbService } from "../services/dbService";
import { DisplayImage } from "../components/DisplayImage";

const CharacterPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const characters = useAppSelector((state) => state.character.characters);
  const loading = useAppSelector((state) => state.character.loading);
  const { showConfirm } = useModal();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [relationship, setRelationship] = useState("");
  const [appearance, setAppearance] = useState("");
  const [appearanceImages, setAppearanceImages] = useState<string[]>([]);
  const [avatar, setAvatar] = useState("");
  const [editCharacter, setEditCharacter] = useState<Character | null>(null); 

  useEffect(() => {
    dispatch(fetchCharacters());
  }, [dispatch]);

  const handerSetEditCharacter = () => {
    setEditCharacter(null);
    setName("");
    setDescription("");
    setPrompt("");
    setRelationship("");
    setAppearance("");
    setAppearanceImages([]);
    setAvatar("");
  } 

  const handleCreateCharacter = () => {
    if (!name || !prompt) {
      alert("Character name and prompt are required.");
      return;
    }

    dispatch(addCharacter({ name, description, prompt, relationship, appearance, appearanceImages, avatar }));
    setName("");
    setDescription("");
    setPrompt("");
    setRelationship("");
    setAppearance("");
    setAppearanceImages([]);
    setAvatar("");
  };

  const handleDeleteCharacter = async (id: number) => {
    const confirmed = await showConfirm("Delete Character", "Are you sure you want to delete this character and their chats?");
    if (confirmed) {
      dispatch(deleteCharacter(id));
    }
  };

  const handleEditCharacter = (char: Character) => {
    setEditCharacter(char);
    setName(char.name);
    setDescription(char.description);
    setPrompt(char.prompt);
    setRelationship(char.relationship || "");
    setAppearance(char.appearance || "");
    setAppearanceImages(char.appearanceImages || []);
    // Ensure avatar is handled if added later to Character type, ignoring for now if missing
    // setAvatar(char.avatar || "");
  };

  const handleDuplicateCharacter = (char: Character) => {
    setEditCharacter(null);
    setName(`${char.name} (Copy)`);
    setDescription(char.description);
    setPrompt(char.prompt);
    setRelationship(char.relationship || "");
    setAppearance(char.appearance || "");
    setAppearanceImages(char.appearanceImages || []);
    // setAvatar(char.avatar || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveEdit = () => {
    if (!name || !prompt || !editCharacter) {
      alert("Character name and prompt are required.");
      return;
    }

    dispatch(updateCharacter({ id: editCharacter.id, name, description, prompt, relationship, appearance, appearanceImages, avatar }));
    setEditCharacter(null);
    setName("");
    setDescription("");
    setPrompt("");
    setRelationship("");
    setAppearance("");
    setAppearanceImages([]);
    setAvatar("");
  };

  const handleExportCharacter = (char: Character) => {
    const dataToExport = {
      name: char.name,
      description: char.description,
      prompt: char.prompt,
      relationship: char.relationship || "",
      appearance: char.appearance || "",
      appearanceImages: char.appearanceImages || [],
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
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
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
            relationship: parsed.relationship || "",
            appearance: parsed.appearance || "",
            appearanceImages: parsed.appearanceImages || [],
          })
        );

        alert("Character imported successfully!");
      } catch (err) {
        console.error("Import error:", err);
        alert("Failed to import character. Invalid JSON file.");
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      const dirHandle = await dbService.getSetting("image_save_directory");
      if (!dirHandle) {
         alert("Please select an Image Save Directory in Settings first to use file persistence.");
         return;
      }

      const newImageRefs: string[] = [];
      
      for (const file of Array.from(files)) {
         const ext = file.name.split('.').pop() || 'png';
         const filename = `char_ref_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${ext}`;
         
         const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
         const writable = await fileHandle.createWritable();
         await writable.write(file);
         await writable.close();
         
         newImageRefs.push(`local:${filename}`);
      }

      setAppearanceImages((prev) => [...prev, ...newImageRefs]);
    } catch (err: any) {
      console.error("Error saving image files to directory:", err);
      if (err.name === 'NotAllowedError') {
         alert("Permission to write to directory was denied. Please re-select the directory in Settings.");
      } else {
         alert("Failed to save image files to the local directory.");
      }
    }
    
    event.target.value = ''; // Reset input
  };

  const removeAppearanceImage = (index: number) => {
    setAppearanceImages(prev => prev.filter((_, i) => i !== index));
  };

  const truncateText = (text: string, maxLength = 100) => {
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
    <div className="w-full h-screen flex justify-center bg-app-light dark:bg-app-dark overflow-auto p-4 md:p-8">
      <div className="w-full max-w-2xl bg-transparent">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={goBackOrHome}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 transition text-gray-500 dark:text-slate-400"
              title="Back"
            >
              <FaArrowLeft size={16} />
            </button>
            <h2 className="text-xl font-medium tracking-wide text-gray-900 dark:text-slate-100">
              {editCharacter ? "Edit Character" : "Create a Character"}
            </h2>
          </div>
        </div>

      {/* Character Form */}
      <div className="bg-panel-light dark:bg-panel-dark rounded-2xl p-5 mb-8 shadow-sm border border-gray-100 dark:border-slate-700/50">
        <input
          type="text"
          placeholder="Character Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 bg-app-light dark:bg-slate-900/50 text-black dark:text-white rounded-xl border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none mb-4 transition-all"
        />
        <textarea
          placeholder="Description (Optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-3 bg-app-light dark:bg-slate-900/50 text-black dark:text-white rounded-xl border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none mb-4 transition-all resize-none min-h-[80px]"
        />
        <input
          type="text"
          placeholder="Relationship with User (e.g. Best Friend, Enemy) (Optional)"
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          className="w-full p-3 bg-app-light dark:bg-slate-900/50 text-black dark:text-white rounded-xl border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none mb-4 transition-all"
        />
        <textarea
          placeholder="Character Appearance/Looks (e.g. Blonde hair, wears a red jacket) (Optional)"
          value={appearance}
          onChange={(e) => setAppearance(e.target.value)}
          className="w-full p-3 bg-app-light dark:bg-slate-900/50 text-black dark:text-white rounded-xl border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none mb-4 transition-all resize-none min-h-[80px]"
        />
        
        <div className="mb-4">
          <label className="block text-sm text-gray-700 dark:text-gray-300 font-medium mb-2">Character Reference Images</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {appearanceImages.map((src, idx) => (
              <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-300 dark:border-slate-600 bg-slate-800">
                <DisplayImage srcContext={src} alt="Appearance Reference" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeAppearanceImage(idx)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <FaTimes size={10} />
                </button>
              </div>
            ))}
            <button
              onClick={() => imageInputRef.current?.click()}
              className="w-20 h-20 flex flex-col justify-center items-center rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 hover:text-indigo-500 hover:border-indigo-500 transition-colors"
            >
              <FaUpload size={16} />
              <span className="text-[10px] mt-1 text-center font-medium">Add Image</span>
            </button>
          </div>
          <p className="text-xs text-gray-500">Provided to image-capable models to keep generated appearance consistent.</p>
          <input
            type="file"
            ref={imageInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            multiple
            style={{ display: "none" }}
          />
        </div>

        <textarea
          placeholder="Character Prompt (Personality, Style, etc.)"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full p-3 bg-app-light dark:bg-slate-900/50 text-black dark:text-white rounded-xl border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none mb-4 transition-all resize-none min-h-[120px]"
        />
        <div className="flex gap-3">
          <button
            onClick={editCharacter ? handleSaveEdit : handleCreateCharacter}
            className="flex-1 bg-indigo-500 text-white px-4 py-3 rounded-xl hover:bg-indigo-600 transition font-medium"
            disabled={loading}
          >
            {loading ? "Saving..." : editCharacter ? "Save Changes" : "Create Character"}
          </button>
          {!editCharacter && (
            <button
              onClick={handleImportClick}
              className="bg-slate-700 text-white px-4 py-3 rounded-xl hover:bg-slate-600 transition flex items-center justify-center gap-2 font-medium"
              title="Import Character from JSON"
            >
              <FaUpload size={14} />
              <span className="hidden sm:inline">Import</span>
            </button>
          )}
          {editCharacter && (
            <button
              onClick={() => handerSetEditCharacter()}
              className="bg-slate-700 text-white px-4 py-3 rounded-xl hover:bg-slate-600 transition"
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
      <h3 className="text-xl font-medium mb-4 text-gray-900 dark:text-slate-100">
        Saved Characters
      </h3>
      <div className="w-full pb-20">
        {loading ? (
          <p className="text-gray-500 dark:text-slate-500">Loading...</p>
        ) : characters.length === 0 ? (
          <p className="text-gray-500 dark:text-slate-500">No characters created yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {characters.map((char) => (
              <div
                key={char.id}
                className="p-5 border border-gray-100 dark:border-slate-700/50 rounded-2xl flex flex-col justify-between bg-panel-light dark:bg-panel-dark shadow-sm gap-4"
              >
                <div>
                  <h4 className="font-medium text-lg text-gray-900 dark:text-white mb-1">{char.name}</h4>
                  {char.relationship && <p className="text-xs font-semibold text-indigo-500 mb-1">Relationship: {char.relationship}</p>}
                  <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2">{truncateText(char.description)}</p>
                </div>
                <div className="flex gap-2 justify-end mt-2 pt-4 border-t border-gray-100 dark:border-slate-800">
                  <button
                    onClick={() => handleExportCharacter(char)}
                    className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition"
                    title="Export Character"
                  >
                    <FaDownload size={14} />
                  </button>
                  <button
                    onClick={() => handleDuplicateCharacter(char)}
                    className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition"
                    title="Duplicate Character"
                  >
                    <FaCopy size={14} />
                  </button>
                  <button
                    onClick={() => handleEditCharacter(char)}
                    className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                    title="Edit Character"
                  >
                    <FaEdit size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteCharacter(char.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                    title="Delete Character"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default CharacterPage;
