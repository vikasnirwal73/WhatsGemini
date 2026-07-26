import React, { useState, useEffect, useRef } from "react";
import { fetchCharacters, addCharacter, deleteCharacter, updateCharacter } from "../features/characterSlice";
import { addChat } from "../features/chatSlice";
import { useNavigate } from "react-router-dom";
import { FaTrash, FaEdit, FaTimes, FaDownload, FaUpload, FaCopy, FaImages, FaPlus, FaComment, FaEllipsisV, FaPlay } from "react-icons/fa";
import { DropdownMenu, DropdownMenuItem } from "../components/ui/DropdownMenu";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { Character, Chat } from "../types";
import { useModal } from "../contexts/ModalContext";
import { dbService } from "../services/dbService";
import { DisplayImage } from "../components/DisplayImage";
import { TextInput, TextArea, Select, FieldLabel } from "../components/ui/FormControls";
import { CharacterAvatar } from "../components/ui/CharacterAvatar";
import Header from "../components/Header";
import { CHARACTER_SWATCHES, MEMORY_EXTRACTION_INTERVAL, SAMPLE_CHARACTER } from "../utils/constants";
import { isSpeechSynthesisSupported, getVoices, speak } from "../utils/speech";

const CharacterPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const characters = useAppSelector((state) => state.character.characters);
  const chats = useAppSelector((state) => state.chat.chats);
  const loading = useAppSelector((state) => state.character.loading);
  const { showConfirm } = useModal();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [relationship, setRelationship] = useState("");
  const [appearance, setAppearance] = useState("");
  const [appearanceImages, setAppearanceImages] = useState<string[]>([]);
  const [avatar, setAvatar] = useState("");
  const [accentIndex, setAccentIndex] = useState(0);
  const [voiceURI, setVoiceURI] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [editCharacter, setEditCharacter] = useState<Character | null>(null);

  useEffect(() => {
    dispatch(fetchCharacters());
  }, [dispatch]);

  useEffect(() => {
    if (!isSpeechSynthesisSupported()) return;
    getVoices().then(setVoices);
  }, []);

  const resetForm = () => {
    setEditCharacter(null);
    setName("");
    setDescription("");
    setPrompt("");
    setRelationship("");
    setAppearance("");
    setAppearanceImages([]);
    setAvatar("");
    setAccentIndex(0);
    setVoiceURI("");
  }

  const handleCreateCharacter = () => {
    if (!name || !prompt) {
      alert("Character name and prompt are required.");
      return;
    }

    dispatch(addCharacter({ name, description, prompt, relationship, appearance, appearanceImages, avatar, accent: CHARACTER_SWATCHES[accentIndex], voiceURI: voiceURI || undefined }));
    resetForm();
  };

  const handleTrySampleCharacter = async () => {
    const character = await dispatch(addCharacter(SAMPLE_CHARACTER)).unwrap();
    if (character) handleChatWithCharacter(character);
  };

  const handleDeleteCharacter = async (id: number) => {
    const confirmed = await showConfirm("Delete Character", "Are you sure you want to delete this character and their chats?");
    if (confirmed) {
      dispatch(deleteCharacter(id));
    }
  };

  const findSwatchIndex = (accent?: [string, string]) => {
    if (!accent) return 0;
    const idx = CHARACTER_SWATCHES.findIndex((s) => s[0] === accent[0] && s[1] === accent[1]);
    return idx === -1 ? 0 : idx;
  };

  const handleEditCharacter = (char: Character) => {
    setEditCharacter(char);
    setName(char.name);
    setDescription(char.description);
    setPrompt(char.prompt);
    setRelationship(char.relationship || "");
    setAppearance(char.appearance || "");
    setAppearanceImages(char.appearanceImages || []);
    setAccentIndex(findSwatchIndex(char.accent));
    setVoiceURI(char.voiceURI || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDuplicateCharacter = (char: Character) => {
    setEditCharacter(null);
    setName(`${char.name} (Copy)`);
    setDescription(char.description);
    setPrompt(char.prompt);
    setRelationship(char.relationship || "");
    setAppearance(char.appearance || "");
    setAppearanceImages(char.appearanceImages || []);
    setAccentIndex(findSwatchIndex(char.accent));
    setVoiceURI(char.voiceURI || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveEdit = () => {
    if (!name || !prompt || !editCharacter) {
      alert("Character name and prompt are required.");
      return;
    }

    dispatch(updateCharacter({ id: editCharacter.id, name, description, prompt, relationship, appearance, appearanceImages, avatar, accent: CHARACTER_SWATCHES[accentIndex], voiceURI: voiceURI || undefined, gallery: editCharacter.gallery }));
    resetForm();
  };

  const handleChatWithCharacter = async (char: Character) => {
    const existingChat = chats.find((chat: Chat) => chat.characterId === char.id);
    if (existingChat) {
      navigate(`/chat/${existingChat.id}`);
      return;
    }
    const result = await dispatch(addChat({ title: char.name, characterId: char.id }));
    if (result.payload && (result.payload as Chat).id) {
      navigate(`/chat/${(result.payload as Chat).id}`);
    }
  };

  const handleExportCharacter = (char: Character) => {
    const dataToExport = {
      name: char.name,
      description: char.description,
      prompt: char.prompt,
      relationship: char.relationship || "",
      appearance: char.appearance || "",
      appearanceImages: char.appearanceImages || [],
      accent: char.accent,
      voiceURI: char.voiceURI,
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
            accent: parsed.accent,
            voiceURI: parsed.voiceURI,
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

  const handleRemoveMemoryFact = (index: number) => {
    if (!editCharacter) return;
    const newMemory = (editCharacter.memory || []).filter((_, i) => i !== index);
    dispatch(updateCharacter({ ...editCharacter, memory: newMemory }));
    setEditCharacter({ ...editCharacter, memory: newMemory });
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
    <div className="w-full h-screen flex flex-col bg-app">
      <Header title="Characters" onBack={goBackOrHome} />
      <div className="flex-1 overflow-auto p-4 md:p-8">
      <div className="w-full max-w-[1060px] mx-auto">

        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-ink">Characters</h1>
          <p className="text-sm text-ink-muted mt-1.5">Craft a persona for Gemini to embody, or open one you've already made.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">

          {/* Create / Edit form */}
          <div className="bg-panel border border-line rounded-2xl overflow-hidden lg:sticky lg:top-0">
            <div className="px-[18px] py-4 border-b border-line flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-[9px] bg-gemini-logo flex items-center justify-center text-onAccent flex-shrink-0">
                {editCharacter ? <FaEdit size={13} /> : <FaPlus size={13} />}
              </span>
              <div className="min-w-0">
                <div className="text-[14.5px] font-bold text-ink">{editCharacter ? "Edit character" : "New character"}</div>
                <div className="text-[11.5px] text-ink-faint">{editCharacter ? "Update who Gemini becomes" : "Define who Gemini becomes"}</div>
              </div>
            </div>

            <div className="p-[18px] flex flex-col gap-[15px]">
              <div className="flex items-center gap-[13px]">
                <CharacterAvatar name={name || "?"} accent={CHARACTER_SWATCHES[accentIndex]} size={56} className="text-xl flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <label className="block text-[11.5px] text-ink-muted mb-1.5">Accent</label>
                  <div className="flex gap-[7px]">
                    {CHARACTER_SWATCHES.map((sw, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setAccentIndex(i)}
                        title="Choose accent color"
                        aria-label={`Accent color ${i + 1}`}
                        className="w-[26px] h-[26px] rounded-lg flex-shrink-0 transition transform hover:scale-110"
                        style={{
                          background: `linear-gradient(135deg, ${sw[0]}, ${sw[1]})`,
                          border: `2px solid ${accentIndex === i ? "rgb(var(--color-text-main))" : "transparent"}`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {isSpeechSynthesisSupported() && (
                <div>
                  <FieldLabel hint="Used to read this character's replies aloud with the speak button in chat.">Voice (optional)</FieldLabel>
                  <div className="flex gap-2">
                    <Select value={voiceURI} onChange={(e) => setVoiceURI(e.target.value)} className="flex-1">
                      <option value="">Browser default</option>
                      {voices.map((v) => (
                        <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
                      ))}
                    </Select>
                    <button
                      type="button"
                      onClick={() => speak(`Hi, I'm ${name || "your character"}.`, voiceURI || undefined)}
                      disabled={voices.length === 0}
                      className="w-11 h-11 flex-shrink-0 rounded-xl border border-line bg-panel2 text-ink-muted hover:border-primary hover:text-primary transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Preview voice"
                      aria-label="Preview voice"
                    >
                      <FaPlay size={12} />
                    </button>
                  </div>
                </div>
              )}

              <TextInput
                type="text"
                placeholder="Character Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <TextInput
                type="text"
                placeholder="Tagline / Relationship with User (e.g. Best Friend, Enemy)"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
              />
              <TextArea
                placeholder="Description (Optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="resize-none"
              />
              <TextArea
                placeholder="Character Appearance/Looks (e.g. Blonde hair, wears a red jacket) (Optional)"
                value={appearance}
                onChange={(e) => setAppearance(e.target.value)}
                className="resize-none"
              />

              <div>
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
                <p className="text-xs text-ink-faint">Provided to image-capable models to keep generated appearance consistent.</p>
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                />
              </div>

              {editCharacter && editCharacter.memory && editCharacter.memory.length > 0 && (
                <div>
                  <label className="block text-sm text-ink font-medium mb-2">
                    Memory <span className="text-ink-faint font-normal">({editCharacter.memory.length} facts remembered)</span>
                  </label>
                  <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {editCharacter.memory.map((fact, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-ink-muted bg-panel2 border border-line rounded-lg px-2.5 py-2">
                        <span className="flex-1">{fact}</span>
                        <button
                          onClick={() => handleRemoveMemoryFact(idx)}
                          className="text-ink-faint hover:text-red-500 transition flex-shrink-0"
                          title="Forget this fact"
                          aria-label="Forget this fact"
                        >
                          <FaTimes size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-ink-faint mt-1.5">Automatically learned from your conversations, every {MEMORY_EXTRACTION_INTERVAL} messages or so.</p>
                </div>
              )}

              <TextArea
                placeholder="Character Prompt (Personality, Style, etc.)"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="resize-none min-h-[120px]"
              />

              <div className="flex gap-3">
                <button
                  onClick={editCharacter ? handleSaveEdit : handleCreateCharacter}
                  className="flex-1 flex items-center justify-center gap-2 bg-gemini-logo text-onAccent px-4 py-3 rounded-xl hover:brightness-105 transition font-semibold shadow-lg shadow-primary/20"
                  disabled={loading}
                >
                  {loading ? "Saving..." : editCharacter ? "Save Changes" : "Create Character"}
                </button>
                {!editCharacter && (
                  <button
                    onClick={handleImportClick}
                    className="bg-panel2 border border-line text-ink px-4 py-3 rounded-xl hover:border-primary transition flex items-center justify-center gap-2 font-medium"
                    title="Import Character from JSON"
                  >
                    <FaUpload size={14} />
                    <span className="hidden sm:inline">Import</span>
                  </button>
                )}
                {editCharacter && (
                  <button
                    onClick={resetForm}
                    className="bg-panel2 border border-line text-ink px-4 py-3 rounded-xl hover:border-primary transition"
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
          </div>

          {/* Saved Characters */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="text-[12.5px] text-ink-muted">
                {loading ? "Loading..." : `${characters.length} character${characters.length === 1 ? "" : "s"}`}
              </div>
            </div>
            {!loading && characters.length === 0 ? (
              <div className="bg-panel border border-line rounded-2xl p-6 text-center flex flex-col items-center gap-3">
                <p className="text-ink-muted">No characters created yet.</p>
                <p className="text-sm text-ink-muted">Fill out the form to build your own, or jump straight into a chat with a ready-made one.</p>
                <button
                  onClick={handleTrySampleCharacter}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gemini-logo text-onAccent font-semibold text-sm shadow-lg shadow-primary/20 hover:brightness-105 transition"
                >
                  Try a sample character
                </button>
              </div>
            ) : (
              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(232px, 1fr))" }}>
                {characters.map((char) => (
                  <div
                    key={char.id}
                    className="bg-panel border border-line rounded-2xl p-[18px] flex flex-col gap-3 hover:border-primary transition"
                  >
                    <div className="flex items-start gap-3">
                      <CharacterAvatar name={char.name} accent={char.accent} size={44} />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[15px] font-bold text-ink truncate">{char.name}</h4>
                        {char.relationship && <p className="text-xs font-medium text-primary mt-0.5 truncate">{char.relationship}</p>}
                      </div>
                    </div>
                    <p className="text-[12.5px] text-ink-muted leading-relaxed line-clamp-3 flex-1">
                      {truncateText(char.description, 140)}
                    </p>
                    <div className="flex gap-2 mt-1 pt-3 border-t border-line">
                      <button
                        onClick={() => handleChatWithCharacter(char)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] bg-panel3 text-ink text-[12.5px] font-semibold hover:bg-primary hover:text-onAccent transition"
                      >
                        <FaComment size={11} /> Chat
                      </button>
                      <button
                        onClick={() => handleEditCharacter(char)}
                        className="w-9 flex items-center justify-center border border-line rounded-[10px] text-ink-muted hover:text-primary hover:border-primary transition"
                        title="Edit Character"
                      >
                        <FaEdit size={13} />
                      </button>
                      <DropdownMenu
                        trigger={
                          <button
                            className="w-9 h-9 flex items-center justify-center border border-line rounded-[10px] text-ink-muted hover:text-ink hover:bg-hover transition"
                            title="More options"
                            aria-label="More options"
                          >
                            <FaEllipsisV size={13} />
                          </button>
                        }
                      >
                        <DropdownMenuItem icon={FaImages} label="View Gallery" onClick={() => navigate(`/characters/${char.id}/gallery`)} />
                        <DropdownMenuItem icon={FaDownload} label="Export" onClick={() => handleExportCharacter(char)} />
                        <DropdownMenuItem icon={FaCopy} label="Duplicate" onClick={() => handleDuplicateCharacter(char)} />
                        <DropdownMenuItem icon={FaTrash} label="Delete" onClick={() => handleDeleteCharacter(char.id)} danger />
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
      </div>
    </div>
  );
};

export default CharacterPage;
