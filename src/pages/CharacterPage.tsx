import React, { useState, useEffect, useRef } from "react";
import { fetchCharacters, addCharacter, deleteCharacter, updateCharacter } from "../features/characterSlice";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaTrash, FaEdit, FaTimes, FaDownload, FaUpload, FaCopy, FaImages } from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { Character } from "../types";
import { useModal } from "../contexts/ModalContext";
import { dbService } from "../services/dbService";
import { DisplayImage } from "../components/DisplayImage";
import { TextInput, TextArea } from "../components/ui/FormControls";
import { CharacterAvatar } from "../components/ui/CharacterAvatar";

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

    dispatch(updateCharacter({ id: editCharacter.id, name, description, prompt, relationship, appearance, appearanceImages, avatar, gallery: editCharacter.gallery }));
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
    <div className="w-full h-screen flex justify-center bg-app overflow-auto p-4 md:p-8">
      <div className="w-full max-w-2xl bg-transparent">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-line">
          <div className="flex items-center gap-3">
            <button
              onClick={goBackOrHome}
              className="p-2 rounded-full hover:bg-panel2 transition text-ink-muted"
              title="Back"
            >
              <FaArrowLeft size={16} />
            </button>
            <h2 className="text-xl font-medium tracking-wide text-ink">
              {editCharacter ? "Edit Character" : "Create a Character"}
            </h2>
          </div>
        </div>

      {/* Character Form */}
      <div className="bg-panel rounded-2xl p-5 mb-8 shadow-sm border border-line">
        <TextInput
          type="text"
          placeholder="Character Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-4"
        />
        <TextArea
          placeholder="Description (Optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mb-4 resize-none"
        />
        <TextInput
          type="text"
          placeholder="Relationship with User (e.g. Best Friend, Enemy) (Optional)"
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          className="mb-4"
        />
        <TextArea
          placeholder="Character Appearance/Looks (e.g. Blonde hair, wears a red jacket) (Optional)"
          value={appearance}
          onChange={(e) => setAppearance(e.target.value)}
          className="mb-4 resize-none"
        />

        <div className="mb-4">
          <label className="block text-sm text-ink font-medium mb-2">Character Reference Images</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {appearanceImages.map((src, idx) => (
              <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-line bg-panel2">
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
              className="w-20 h-20 flex flex-col justify-center items-center rounded-lg border-2 border-dashed border-line text-ink-muted hover:text-primary hover:border-primary transition-colors"
            >
              <FaUpload size={16} />
              <span className="text-[10px] mt-1 text-center font-medium">Add Image</span>
            </button>
          </div>
          <p className="text-xs text-ink-muted">Provided to image-capable models to keep generated appearance consistent.</p>
          <input
            type="file"
            ref={imageInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            multiple
            style={{ display: "none" }}
          />
        </div>

        <TextArea
          placeholder="Character Prompt (Personality, Style, etc.)"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="mb-4 resize-none min-h-[120px]"
        />
        <div className="flex gap-3">
          <button
            onClick={editCharacter ? handleSaveEdit : handleCreateCharacter}
            className="flex-1 bg-primary text-white px-4 py-3 rounded-xl hover:bg-primary-hover transition font-medium"
            disabled={loading}
          >
            {loading ? "Saving..." : editCharacter ? "Save Changes" : "Create Character"}
          </button>
          {!editCharacter && (
            <button
              onClick={handleImportClick}
              className="bg-panel2 text-ink px-4 py-3 rounded-xl hover:bg-line transition flex items-center justify-center gap-2 font-medium"
              title="Import Character from JSON"
            >
              <FaUpload size={14} />
              <span className="hidden sm:inline">Import</span>
            </button>
          )}
          {editCharacter && (
            <button
              onClick={() => handerSetEditCharacter()}
              className="bg-panel2 text-ink px-4 py-3 rounded-xl hover:bg-line transition"
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
      <h3 className="text-xl font-medium mb-4 text-ink">
        Saved Characters
      </h3>
      <div className="w-full pb-20">
        {loading ? (
          <p className="text-ink-muted">Loading...</p>
        ) : characters.length === 0 ? (
          <p className="text-ink-muted">No characters created yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {characters.map((char) => (
              <div
                key={char.id}
                className="p-5 border border-line rounded-2xl flex flex-col justify-between bg-panel shadow-sm gap-4"
              >
                <div className="flex items-start gap-3">
                  <CharacterAvatar name={char.name} size={40} />
                  <div className="min-w-0">
                    <h4 className="font-medium text-lg text-ink mb-1 truncate">{char.name}</h4>
                    {char.relationship && <p className="text-xs font-semibold text-secondary mb-1">Relationship: {char.relationship}</p>}
                    <p className="text-sm text-ink-muted line-clamp-2">{truncateText(char.description)}</p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-2 pt-4 border-t border-line">
                  <button
                    onClick={() => navigate(`/characters/${char.id}/gallery`)}
                    className="p-2 text-ink-muted hover:text-primary hover:bg-panel2 rounded-lg transition"
                    title="View Gallery"
                  >
                    <FaImages size={14} />
                  </button>
                  <button
                    onClick={() => handleExportCharacter(char)}
                    className="p-2 text-ink-muted hover:text-ink hover:bg-panel2 rounded-lg transition"
                    title="Export Character"
                  >
                    <FaDownload size={14} />
                  </button>
                  <button
                    onClick={() => handleDuplicateCharacter(char)}
                    className="p-2 text-ink-muted hover:text-secondary hover:bg-panel2 rounded-lg transition"
                    title="Duplicate Character"
                  >
                    <FaCopy size={14} />
                  </button>
                  <button
                    onClick={() => handleEditCharacter(char)}
                    className="p-2 text-ink-muted hover:text-primary hover:bg-panel2 rounded-lg transition"
                    title="Edit Character"
                  >
                    <FaEdit size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteCharacter(char.id)}
                    className="p-2 text-ink-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
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
