import React, { useState, useEffect, useRef, useMemo } from "react";
import { fetchCharacters, addCharacter, deleteCharacter, updateCharacter } from "../features/characterSlice";
import { addChat } from "../features/chatSlice";
import { useNavigate } from "react-router-dom";
import { FaTrash, FaEdit, FaTimes, FaDownload, FaUpload, FaCopy, FaImages, FaPlus, FaComment, FaEllipsisV, FaPlay, FaSearch } from "react-icons/fa";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../components/ui/dropdown-menu";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { Character, Chat } from "../types";
import { useModal } from "../contexts/ModalContext";
import { dbService } from "../services/dbService";
import { DisplayImage } from "../components/DisplayImage";
import { TextInput, TextArea, Select, FieldLabel, Slider } from "../components/ui/FormControls";
import { CharacterAvatar } from "../components/ui/CharacterAvatar";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import ToggleSwitch from "../components/ToggleSwitch";
import Header from "../components/Header";
import { CHARACTER_SWATCHES, MEMORY_EXTRACTION_INTERVAL, SAMPLE_CHARACTER, DEFAULT_AUTO_SELFIE_FREQUENCY } from "../utils/constants";
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
  const [autoSelfieEnabled, setAutoSelfieEnabled] = useState(false);
  const [autoSelfieFrequency, setAutoSelfieFrequency] = useState(DEFAULT_AUTO_SELFIE_FREQUENCY);
  const [editCharacter, setEditCharacter] = useState<Character | null>(null);
  const [gallerySearch, setGallerySearch] = useState("");

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
    setAutoSelfieEnabled(false);
    setAutoSelfieFrequency(DEFAULT_AUTO_SELFIE_FREQUENCY);
  }

  const handleCreateCharacter = () => {
    if (!name || !prompt) {
      alert("Character name and prompt are required.");
      return;
    }

    dispatch(addCharacter({ name, description, prompt, relationship, appearance, appearanceImages, avatar, accent: CHARACTER_SWATCHES[accentIndex], voiceURI: voiceURI || undefined, autoSelfie: { enabled: autoSelfieEnabled, frequency: autoSelfieFrequency } }));
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
    setAutoSelfieEnabled(char.autoSelfie?.enabled || false);
    setAutoSelfieFrequency(char.autoSelfie?.frequency ?? DEFAULT_AUTO_SELFIE_FREQUENCY);
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
    setAutoSelfieEnabled(char.autoSelfie?.enabled || false);
    setAutoSelfieFrequency(char.autoSelfie?.frequency ?? DEFAULT_AUTO_SELFIE_FREQUENCY);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveEdit = () => {
    if (!name || !prompt || !editCharacter) {
      alert("Character name and prompt are required.");
      return;
    }

    dispatch(updateCharacter({ id: editCharacter.id, name, description, prompt, relationship, appearance, appearanceImages, avatar, accent: CHARACTER_SWATCHES[accentIndex], voiceURI: voiceURI || undefined, gallery: editCharacter.gallery, autoSelfie: { enabled: autoSelfieEnabled, frequency: autoSelfieFrequency } }));
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
      autoSelfie: char.autoSelfie,
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
            autoSelfie: parsed.autoSelfie,
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

  const filteredCharacters = useMemo(() => {
    const q = gallerySearch.trim().toLowerCase();
    if (!q) return characters;
    return characters.filter(
      (c) => c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
    );
  }, [characters, gallerySearch]);

  const accent = CHARACTER_SWATCHES[accentIndex];

  return (
    <div className="w-full h-screen flex flex-col bg-background">
      <Header title="Characters" onBack={goBackOrHome} />
      <div className="flex-1 overflow-auto p-4 md:p-8">
      <div className="w-full max-w-[1180px] mx-auto flex flex-col gap-10">

        {/* Create / Edit character */}
        <div>
          <div className="mb-5 flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-gemini-logo flex items-center justify-center text-onAccent flex-shrink-0">
              {editCharacter ? <FaEdit size={14} /> : <FaPlus size={14} />}
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-foreground">{editCharacter ? "Edit character" : "New character"}</h2>
              <p className="text-xs text-subtle">{editCharacter ? "Update who Gemini becomes" : "Define who Gemini becomes"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-6 items-start">

            {/* Persistent left rail: portrait + accent/voice/auto-selfie */}
            <div className="flex flex-col gap-4 lg:sticky lg:top-0">
              <Card className="overflow-hidden">
                <div
                  className="relative aspect-[3/4] flex items-center justify-center"
                  style={!appearanceImages[0] ? { background: `linear-gradient(135deg, ${accent[0]}26, ${accent[1]}26)` } : undefined}
                >
                  {appearanceImages[0] ? (
                    <DisplayImage srcContext={appearanceImages[0]} alt="Portrait" className="w-full h-full object-cover" />
                  ) : (
                    <CharacterAvatar name={name || "?"} accent={accent} size={96} />
                  )}
                </div>
              </Card>

              <Card className="p-4 flex flex-col gap-4">
                <div>
                  <label className="block text-[11.5px] text-muted-foreground mb-1.5">Accent</label>
                  <div className="flex gap-[7px]">
                    {CHARACTER_SWATCHES.map((sw, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setAccentIndex(i)}
                        title="Choose accent color"
                        aria-label={`Accent color ${i + 1}`}
                        className="w-[26px] h-[26px] rounded-full flex-shrink-0 transition transform hover:scale-110"
                        style={{
                          background: `linear-gradient(135deg, ${sw[0]}, ${sw[1]})`,
                          boxShadow: accentIndex === i ? `0 0 0 2px rgb(var(--card)), 0 0 0 4px ${sw[0]}` : undefined,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {isSpeechSynthesisSupported() && (
                  <>
                    <div className="h-px bg-border" />
                    <div>
                      <FieldLabel hint="Used to read this character's replies aloud with the speak button in chat.">Voice (optional)</FieldLabel>
                      <div className="flex gap-2">
                        <Select value={voiceURI} onChange={(e) => setVoiceURI(e.target.value)} className="flex-1">
                          <option value="">Browser default</option>
                          {voices.map((v) => (
                            <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
                          ))}
                        </Select>
                        <Button
                          type="button"
                          variant="panel"
                          onClick={() => speak(`Hi, I'm ${name || "your character"}.`, voiceURI || undefined)}
                          disabled={voices.length === 0}
                          className="w-11 h-11 flex-shrink-0 border border-border hover:border-primary hover:text-primary"
                          title="Preview voice"
                          aria-label="Preview voice"
                        >
                          <FaPlay size={12} />
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                <div className="h-px bg-border" />

                <div>
                  <ToggleSwitch
                    checked={autoSelfieEnabled}
                    onChange={setAutoSelfieEnabled}
                    label="Sends selfies on their own"
                    title="Let this character spontaneously attach a selfie-style picture to their replies, without you asking for one."
                  />
                  {autoSelfieEnabled && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-2">
                        <span>Frequency</span>
                        <span className="font-mono">{autoSelfieFrequency}%</span>
                      </div>
                      <Slider value={autoSelfieFrequency} min={5} max={100} step={5} onChange={setAutoSelfieFrequency} />
                      <p className="text-xs text-subtle mt-1.5">Chance each of their replies includes a spontaneous selfie - lower saves AI credits.</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Grouped field cards */}
            <div className="flex flex-col gap-4">
              <Card className="p-5 flex flex-col gap-3">
                <h3 className="font-semibold text-[15px] text-foreground">Identity</h3>
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
              </Card>

              <Card className="p-5 flex flex-col gap-3">
                <h3 className="font-semibold text-[15px] text-foreground">Appearance</h3>
                <TextArea
                  placeholder="Character Appearance/Looks (e.g. Blonde hair, wears a red jacket) (Optional)"
                  value={appearance}
                  onChange={(e) => setAppearance(e.target.value)}
                  className="resize-none"
                />
                <div>
                  <label className="block text-sm text-foreground font-medium mb-2">Reference Images</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {appearanceImages.map((src, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border bg-muted">
                        <DisplayImage srcContext={src} alt="Appearance Reference" className="w-full h-full object-cover" />
                        <Button
                          onClick={() => removeAppearanceImage(idx)}
                          variant="destructive"
                          className="absolute top-1 right-1 h-auto w-auto rounded-full p-1"
                        >
                          <FaTimes size={10} />
                        </Button>
                      </div>
                    ))}
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="w-20 h-20 flex flex-col justify-center items-center rounded-lg border-2 border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                    >
                      <FaUpload size={16} />
                      <span className="text-[10px] mt-1 text-center font-medium">Add Image</span>
                    </button>
                  </div>
                  <p className="text-xs text-subtle">Provided to image-capable models to keep generated appearance consistent.</p>
                  <input
                    type="file"
                    ref={imageInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    multiple
                    style={{ display: "none" }}
                  />
                </div>
              </Card>

              <Card className="p-5 flex flex-col gap-3">
                <h3 className="font-semibold text-[15px] text-foreground">Personality</h3>
                <TextArea
                  placeholder="Character Prompt (Personality, Style, etc.)"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="resize-none min-h-[120px]"
                />
              </Card>

              {editCharacter && (
                <Card className="p-5 flex flex-col gap-3">
                  <h3 className="font-semibold text-[15px] text-foreground">
                    Memory {editCharacter.memory && editCharacter.memory.length > 0 && (
                      <span className="text-subtle font-normal text-xs">({editCharacter.memory.length} facts remembered)</span>
                    )}
                  </h3>
                  {editCharacter.memory && editCharacter.memory.length > 0 ? (
                    <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                      {editCharacter.memory.map((fact, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground bg-muted border border-border rounded-lg px-2.5 py-2">
                          <span className="flex-1">{fact}</span>
                          <Button
                            onClick={() => handleRemoveMemoryFact(idx)}
                            variant="ghost"
                            className="h-auto w-auto p-0 text-subtle hover:bg-transparent hover:text-destructive flex-shrink-0"
                            title="Forget this fact"
                            aria-label="Forget this fact"
                          >
                            <FaTimes size={10} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-subtle">No facts remembered yet.</p>
                  )}
                  <p className="text-xs text-subtle">Automatically learned from your conversations, every {MEMORY_EXTRACTION_INTERVAL} messages or so.</p>
                </Card>
              )}

              <div className="sticky bottom-0 pt-6 pb-1 bg-gradient-to-t from-background via-background to-transparent flex gap-3 justify-end">
                {!editCharacter && (
                  <Button
                    onClick={handleImportClick}
                    variant="panel"
                    className="h-auto px-4 py-2.5 border border-border hover:border-primary font-medium"
                    title="Import Character from JSON"
                  >
                    <FaUpload size={14} />
                    <span className="hidden sm:inline">Import</span>
                  </Button>
                )}
                {editCharacter && (
                  <Button
                    onClick={resetForm}
                    variant="panel"
                    className="h-auto px-4 py-2.5 border border-border hover:border-primary font-medium"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={editCharacter ? handleSaveEdit : handleCreateCharacter}
                  variant="default"
                  className="h-auto px-5 py-2.5 font-semibold"
                  disabled={loading}
                >
                  {loading ? "Saving..." : editCharacter ? "Save Changes" : "Create Character"}
                </Button>
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
        </div>

        {/* Saved Characters */}
        <div>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Your cast</h2>
              <p className="text-xs text-subtle mt-0.5">
                {loading ? "Loading..." : `${characters.length} character${characters.length === 1 ? "" : "s"}`}
              </p>
            </div>
            {characters.length > 0 && (
              <div className="relative w-full max-w-[220px]">
                <FaSearch size={12} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={gallerySearch}
                  onChange={(e) => setGallerySearch(e.target.value)}
                  placeholder="Search characters"
                  aria-label="Search characters"
                  className="pl-8 text-[12.5px]"
                />
              </div>
            )}
          </div>
          {!loading && characters.length === 0 ? (
            <Card className="p-6 text-center flex flex-col items-center gap-3">
              <p className="text-muted-foreground">No characters created yet.</p>
              <p className="text-sm text-muted-foreground">Fill out the form to build your own, or jump straight into a chat with a ready-made one.</p>
              <Button
                onClick={handleTrySampleCharacter}
                variant="default"
                className="h-auto px-4 py-2.5 font-semibold text-sm"
              >
                Try a sample character
              </Button>
            </Card>
          ) : filteredCharacters.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground text-sm">No characters match "{gallerySearch}".</Card>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
              {filteredCharacters.map((char) => {
                const charAccent = char.accent ?? CHARACTER_SWATCHES[0];
                return (
                <Card
                  key={char.id}
                  className="relative overflow-hidden rounded-xl border hover:border-primary/40 transition shadow-soft flex flex-col justify-end"
                  style={{ aspectRatio: "3 / 3.9" }}
                >
                  <div className="absolute inset-0">
                    {char.appearanceImages?.[0] ? (
                      <DisplayImage srcContext={char.appearanceImages[0]} alt={char.name} className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${charAccent[0]}26, ${charAccent[1]}26)` }}
                      >
                        <CharacterAvatar name={char.name} accent={char.accent} size={72} />
                      </div>
                    )}
                  </div>
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(180deg, transparent 20%, rgb(var(--background) / 0.7) 55%, rgb(var(--background) / 0.98) 100%)" }}
                  />
                  <div
                    className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full"
                    style={{ background: charAccent[0], boxShadow: `0 0 0 3px rgb(var(--background) / 0.6), 0 0 14px ${charAccent[0]}` }}
                  />
                  <div className="relative flex flex-col gap-1.5 p-4">
                    {char.relationship && (
                      <Badge variant="outline" className="self-start max-w-full truncate border-primary/20 bg-primary/10 font-medium text-primary text-[11px]">
                        {char.relationship}
                      </Badge>
                    )}
                    <h4 className="font-semibold text-lg text-foreground truncate leading-tight">{char.name}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {truncateText(char.description, 140)}
                    </p>
                    <div className="flex gap-1.5 mt-2">
                      <Button
                        onClick={() => handleChatWithCharacter(char)}
                        variant="default"
                        className="flex-1 h-9 text-xs font-semibold"
                      >
                        <FaComment size={11} /> Chat
                      </Button>
                      <Button
                        onClick={() => handleEditCharacter(char)}
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 bg-card/70 hover:border-primary hover:text-primary"
                        title="Edit Character"
                      >
                        <FaEdit size={13} />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 bg-card/70 hover:bg-hover hover:text-foreground"
                            title="More options"
                            aria-label="More options"
                          >
                            <FaEllipsisV size={13} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => navigate(`/characters/${char.id}/gallery`)}>
                            <FaImages className="mr-2 h-4 w-4" />
                            <span>View Gallery</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleExportCharacter(char)}>
                            <FaDownload className="mr-2 h-4 w-4" />
                            <span>Export</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleDuplicateCharacter(char)}>
                            <FaCopy className="mr-2 h-4 w-4" />
                            <span>Duplicate</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => handleDeleteCharacter(char.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <FaTrash className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Card>
              )})}
            </div>
          )}
        </div>

      </div>
      </div>
    </div>
  );
};

export default CharacterPage;
