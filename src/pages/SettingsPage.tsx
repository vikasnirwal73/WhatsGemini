import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { useAppDispatch } from "../store/hooks";
import {
  setUserProfile, setSelectedModel, setImageModel, setImageGenPrompt,
  setUseSdWebui, setSdWebuiApiUrl, setSdWebuiBatchSize, setSdWebuiRefMode,
  setSdWebuiDenoising, setSdWebuiControlnetModel, setSdWebuiModels,
  setSdWebuiModel, setMaxOutputTokens, setCompressThreshold, setMaxChatLength,
  setTemperature, setSafetySettings, setFontSize, setImageResolution
} from "../features/settingsSlice";
import { FaDownload, FaUpload, FaInfoCircle, FaChevronDown, FaFileArchive, FaUser, FaMicrochip, FaImage, FaComments, FaShieldAlt, FaDatabase } from "react-icons/fa";
import Header from "../components/Header";
import InitialMessages from "../components/InitialMessages";
import { ToastContainer, ToastData } from "../components/Toast";
import UserProfileSettings from "../components/settings/UserProfileSettings";
import TextModelSettings from "../components/settings/TextModelSettings";
import ImageGenerationSettings from "../components/settings/ImageGenerationSettings";
import { getAPIKey } from "../features/ai/utils/settings";
import { useModal } from "../contexts/ModalContext";
import { fetchChats } from "../features/chatSlice";
import { fetchCharacters } from "../features/characterSlice";
import { getFullBackupZip, parseBackupFile, applyParsedBackup } from "../services/backupService";
import {
  // DEFAULT_CHAT_LENGTH,
  // DEFAULT_OUTPUT_TOKENS,
  // DEFAULT_SAFETY_SETTINGS,
  // DEFAULT_TEMPRATURE,
  harmThresholds,
  LS_AI_MODEL,
  LS_INITIAL_MESSAGES,
  LS_MAX_CHAT_LENGTH,
  LS_MAX_OUTPUT_TOKENS,
  LS_SAFETY_SETTINGS,
  LS_TEMPRATURE,
  LS_FONT_SIZE,
  LS_USER_PROFILE,
  LS_IMAGE_RESOLUTION,
  // IMAGE_RESOLUTIONS,
  // DEFAULT_IMAGE_RESOLUTION,
  LS_IMAGE_MODEL,
  // DEFAULT_IMAGE_MODEL,
  // LS_IMAGE_GEN_PROMPT,
  // DEFAULT_IMAGE_GEN_PROMPT,
  // LS_USE_SD_WEBUI,
  // LS_SD_WEBUI_API_URL,
  // DEFAULT_SD_WEBUI_API_URL,
  // LS_SD_WEBUI_BATCH_SIZE,
  // DEFAULT_SD_WEBUI_BATCH_SIZE,
  // LS_SD_WEBUI_REF_MODE,
  // DEFAULT_SD_WEBUI_REF_MODE,
  // LS_SD_WEBUI_DENOISING,
  // DEFAULT_SD_WEBUI_DENOISING,
  // LS_SD_WEBUI_CONTROLNET_MODEL,
  // DEFAULT_SD_WEBUI_CONTROLNET_MODEL,
  // LS_SD_WEBUI_MODELS,
  LS_SD_WEBUI_MODEL,
  // DEFAULT_SD_WEBUI_MODEL,
  models,
  imageModels,
  LS_COMPRESS_THRESHOLD,
  // DEFAULT_COMPRESS_THRESHOLD,
} from "../utils/constants";
import { AISafetySettings } from "../types";
import { dbService } from "../services/dbService";
import { TextInput, Select, FieldLabel } from "../components/ui/FormControls";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { showConfirm } = useModal();
  const [initialMessagesKey, setInitialMessagesKey] = useState(0);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const [modelList, setModelList] = useState<{value: string, label: string}[]>(() => {
    const list = models.map((m: string) => ({ value: m, label: m }));
    const stored = localStorage.getItem(LS_AI_MODEL);
    if (stored && !models.includes(stored)) {
      list.push({ value: stored, label: stored });
    }
    return list;
  });
  
  const [imageModelList, setImageModelList] = useState<{value: string, label: string}[]>(() => {
    const list = imageModels.map((m: string) => ({ value: m, label: m }));
    const stored = localStorage.getItem(LS_IMAGE_MODEL);
    if (stored && !list.find(m => m.value === stored)) {
      list.push({ value: stored, label: stored });
    }
    return list;
  });

  useEffect(() => {
    const fetchModels = async () => {
      const apiKey = await getAPIKey();
      if (!apiKey) return;

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        if (!response.ok) throw new Error("Failed to fetch models");
        const data = await response.json();
        
        const validModels = data.models
          .filter((model: any) => 
            model.supportedGenerationMethods && 
            model.supportedGenerationMethods.includes("generateContent")
          )
          .map((model: any) => ({
            value: model.name.replace("models/", ""),
            label: model.displayName || model.name.replace("models/", "")
          }));

        if (validModels.length > 0) {
          setModelList(validModels);
          // Every current model ID starts with "gemini-2" or "gemini-3", so that alone
          // no longer distinguishes image-capable models from text-only ones - match
          // against the known image-model allowlist instead.
          const validImageModels = validModels.filter((m: {value: string}) => imageModels.includes(m.value));
          if (validImageModels.length > 0) {
            setImageModelList(validImageModels);
          }
        }
      } catch (error) {
        console.error("Error fetching models:", error);
      }
    };

    fetchModels();
  }, []);

  const fetchSdModels = async () => {
    try {
      const response = await fetch(`${sdWebuiApiUrl.replace(/\/$/, '')}/sdapi/v1/sd-models`);
      if (!response.ok) throw new Error("Failed to fetch SD models");
      const data = await response.json();
      const mappedModels = data.map((m: any) => ({ title: m.title, model_name: m.model_name }));
      dispatch(setSdWebuiModels(mappedModels));
      
      // Select the first one if current is not in the list or empty
      if (mappedModels.length > 0) {
        if (!sdWebuiModel || !mappedModels.find((m: any) => m.title === sdWebuiModel)) {
           dispatch(setSdWebuiModel(mappedModels[0].title));
        }
      }
      
      const newToast: ToastData = {
        id: Date.now().toString(),
        message: "Successfully fetched SD models",
        type: "success",
      };
      setToasts((prev) => [...prev, newToast]);
    } catch (e: any) {
      console.error(e);
      const newToast: ToastData = {
        id: Date.now().toString(),
        message: "Failed to fetch SD models: " + e.message,
        type: "error",
      };
      setToasts((prev) => [...prev, newToast]);
    }
  };

  const dispatch = useAppDispatch();
  const settings = useSelector((state: RootState) => state.settings);

  const {
    userProfile, selectedModel, imageModel, imageGenPrompt, useSdWebui, sdWebuiApiUrl,
    sdWebuiBatchSize, sdWebuiRefMode, sdWebuiDenoising, sdWebuiControlnetModel, sdWebuiModels,
    sdWebuiModel, maxOutputTokens, compressThreshold, maxChatLength, temperature,
    safetySettings, fontSize, imageResolution
  } = settings;

  const [openSection, setOpenSection] = useState<string>("profile");

  const toggleSection = (section: string) => {
    setOpenSection(prev => prev === section ? "" : section);
  };

  const [imageSaveDirName, setImageSaveDirName] = useState<string>("Not Selected");

  useEffect(() => {
    const loadDirName = async () => {
      try {
        const handle = await dbService.getSetting("image_save_directory");
        if (handle && handle.name) {
          setImageSaveDirName(handle.name);
        }
      } catch (err) {
        console.warn("Could not load directory handle", err);
      }
    };
    loadDirName();
  }, []);

  const handleSelectDirectory = async () => {
    try {
      if (!('showDirectoryPicker' in window)) {
        addToast("Your browser does not support the File System Access API. Please configure standard downloads instead.", "error");
        return;
      }
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: "readwrite",
      });
      // Try to save to IndexedDB
      await dbService.setSetting("image_save_directory", dirHandle);
      setImageSaveDirName(dirHandle.name);
      addToast("Directory selected and saved successfully!", "success");
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Directory picker error:", err);
        addToast("Failed to select directory.", "error");
      }
    }
  };

  // Roast messages for when settings are saved
  const roastMessages = useMemo(() => [
    "Fine, I saved your precious settings. Happy now?",
    "Settings saved. You're welcome, your majesty.",
    "Wow, another setting change. Groundbreaking.",
    "Saved! Not like I had anything better to do.",
    "Settings updated. Try not to break anything.",
    "Done. You sure do love clicking things.",
    "Saved successfully. I'm so proud of you.",
    "Changes saved. You're really keeping me busy today.",
    "Got it. Any more demands, your highness?",
    "Saved! That's definitely going to fix all your problems.",
  ], []);

  // Add a toast notification
  const addToast = useCallback((message: string, type: "success" | "error" = "success", duration = 5000) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  // Remove a toast by id
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Debounced roast toast for any setting change
  const roastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevSettingsRef = useRef(settings);

  useEffect(() => {
    const hasChanged = Object.keys(settings).some(
      (key) => settings[key as keyof typeof settings] !== prevSettingsRef.current[key as keyof typeof settings]
    );

    if (hasChanged) {
      prevSettingsRef.current = settings;
      if (roastTimeoutRef.current) clearTimeout(roastTimeoutRef.current);
      
      roastTimeoutRef.current = setTimeout(() => {
        const randomRoast = roastMessages[Math.floor(Math.random() * roastMessages.length)];
        addToast(randomRoast, "success");
      }, 1000);
    }

    return () => {
      if (roastTimeoutRef.current) clearTimeout(roastTimeoutRef.current);
    };
  }, [settings, addToast, roastMessages]);

  // Redux automatically handles syncing to localStorage via store.subscribe, 
  // so we don't need the 100-line useEffect for localStorage synchronization anymore.
  
  const handleSafetyChange = useCallback((category: keyof AISafetySettings, value: string) => {
    dispatch(setSafetySettings({ ...safetySettings, [category]: value }));
  }, [dispatch, safetySettings]);

  const handleInitialMessagesSave = useCallback(() => {
    const randomRoast = roastMessages[Math.floor(Math.random() * roastMessages.length)];
    addToast(randomRoast, "success");
  }, [addToast, roastMessages]);

  const settingsFileInputRef = useRef<HTMLInputElement>(null);

  // Shared shape for both the settings-only export and the settings portion of a full backup.
  const buildSettingsExport = useCallback(() => ({
    [LS_AI_MODEL]: selectedModel,
    [LS_MAX_OUTPUT_TOKENS]: maxOutputTokens,
    [LS_COMPRESS_THRESHOLD]: compressThreshold,
    [LS_TEMPRATURE]: temperature,
    [LS_SAFETY_SETTINGS]: safetySettings,
    [LS_MAX_CHAT_LENGTH]: maxChatLength,
    [LS_FONT_SIZE]: fontSize,
    [LS_IMAGE_RESOLUTION]: imageResolution,
    [LS_USER_PROFILE]: userProfile,
    [LS_INITIAL_MESSAGES]: JSON.parse(localStorage.getItem(LS_INITIAL_MESSAGES) || "[]"),
  }), [selectedModel, maxOutputTokens, compressThreshold, temperature, safetySettings, maxChatLength, fontSize, imageResolution, userProfile]);

  const downloadJson = (data: unknown, filename: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportSettings = () => {
    downloadJson(buildSettingsExport(), "whatsgemini_settings.json");
  };

  const handleImportSettingsClick = () => {
    settingsFileInputRef.current?.click();
  };

  // Applies a previously-exported settings object (from either a settings-only
  // export or the settings portion of a full backup) to the current app state.
  const applyImportedSettings = useCallback((settings: any) => {
    if (settings[LS_AI_MODEL]) {
        const model = settings[LS_AI_MODEL];
        if (models.includes(model)) {
            dispatch(setSelectedModel(model));
        } else {
            // If it's a custom model from old settings, just keep it, or fallback
            dispatch(setSelectedModel(model));
            setModelList(prev => {
              if (!prev.find(m => m.value === model)) {
                 return [...prev, { value: model, label: model }];
              }
              return prev;
            });
        }
    }
    if (settings[LS_MAX_OUTPUT_TOKENS]) dispatch(setMaxOutputTokens(settings[LS_MAX_OUTPUT_TOKENS]));
    if (settings[LS_COMPRESS_THRESHOLD]) dispatch(setCompressThreshold(settings[LS_COMPRESS_THRESHOLD]));
    if (settings[LS_TEMPRATURE]) dispatch(setTemperature(settings[LS_TEMPRATURE]));
    if (settings[LS_SAFETY_SETTINGS]) dispatch(setSafetySettings(settings[LS_SAFETY_SETTINGS]));
    if (settings[LS_MAX_CHAT_LENGTH]) dispatch(setMaxChatLength(settings[LS_MAX_CHAT_LENGTH]));
    if (settings[LS_FONT_SIZE]) {
        dispatch(setFontSize(settings[LS_FONT_SIZE]));
        document.documentElement.style.setProperty('--chat-font-size', settings[LS_FONT_SIZE]);
    }
    if (settings[LS_IMAGE_RESOLUTION]) {
        dispatch(setImageResolution(settings[LS_IMAGE_RESOLUTION]));
    }
    if (settings[LS_USER_PROFILE]) {
        dispatch(setUserProfile(settings[LS_USER_PROFILE]));
    }
    if (settings[LS_INITIAL_MESSAGES]) {
        localStorage.setItem(LS_INITIAL_MESSAGES, JSON.stringify(settings[LS_INITIAL_MESSAGES]));
        setInitialMessagesKey(prev => prev + 1);
    }
  }, [dispatch]);

  const handleSettingsFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string);
        applyImportedSettings(settings);
        addToast("Settings imported successfully!", "success");
      } catch (err) {
        console.error("Import error:", err);
        addToast("Failed to import settings. Invalid JSON file.", "error");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const backupFileInputRef = useRef<HTMLInputElement>(null);

  const handleExportFullBackup = async () => {
    try {
      const { blob, chats, characters, imagesIncluded, imagesSkipped } = await getFullBackupZip(buildSettingsExport());
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `whatsgemini_backup_${dateStr}.zip`);

      let message = `Backed up ${chats.length} chat(s) and ${characters.length} character(s)`;
      message += imagesIncluded > 0 ? `, including ${imagesIncluded} image(s).` : ".";
      if (imagesSkipped > 0) message += ` ${imagesSkipped} local image(s) couldn't be read and were skipped.`;
      addToast(message, "success");
    } catch (err) {
      console.error("Backup export error:", err);
      addToast("Failed to create backup.", "error");
    }
  };

  const handleImportBackupClick = () => {
    backupFileInputRef.current?.click();
  };

  const handleBackupFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const parsed = await parseBackupFile(file);
      const { data, imageFilenames } = parsed;

      let confirmMessage = `This will add ${data.chats.length} chat(s) and ${data.characters.length} character(s) to your existing library (nothing will be overwritten or removed).`;
      if (imageFilenames.length > 0) confirmMessage += ` It also includes ${imageFilenames.length} local image(s).`;
      confirmMessage += " Continue?";

      const confirmed = await showConfirm("Restore Backup", confirmMessage);
      if (!confirmed) return;

      const { chatsRestored, charactersRestored, imagesRestored } = await applyParsedBackup(parsed);
      if (data.settings) applyImportedSettings(data.settings);

      dispatch(fetchChats());
      dispatch(fetchCharacters());

      let message = `Restored ${chatsRestored} chat(s) and ${charactersRestored} character(s)`;
      message += imagesRestored > 0 ? `, including ${imagesRestored} image(s).` : ".";
      addToast(message, "success");
    } catch (err) {
      console.error("Backup import error:", err);
      addToast("Failed to restore backup. Invalid file.", "error");
    }
  };

  const safetyCategories: (keyof AISafetySettings)[] = useMemo(
    () => ["harassment", "hate_speech", "sexual", "dangerous"],
    []
  );

  const goBackOrHome = () => {
    const idx = window.history.state?.idx;
    if (typeof idx === 'number' && idx > 0) {
      navigate(-1);
    } else {
      navigate('/', { replace: true });
    }
  };

  const renderAccordion = (id: string, icon: React.ReactNode, title: string, subtitle: string, children: React.ReactNode) => {
    const isOpen = openSection === id;
    return (
      <div className="bg-panel rounded-2xl mb-3 border border-line overflow-hidden transition-all duration-200">
        <button
          className="w-full flex items-center gap-[13px] p-4 text-left"
          onClick={() => toggleSection(id)}
        >
          <span className="w-[34px] h-[34px] rounded-[10px] bg-panel3 flex items-center justify-center text-primary flex-shrink-0">
            {icon}
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[14px] font-semibold text-ink">{title}</span>
            <span className="block text-xs text-ink-faint mt-0.5">{subtitle}</span>
          </span>
          <span className={`text-ink-muted transition-transform duration-200 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}>
            <FaChevronDown size={13} />
          </span>
        </button>
        {isOpen && (
          <div className="px-5 pb-5 border-t border-line pt-4">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-screen flex flex-col bg-app">
      <Header title="Settings" subtitle="Gemini connection, chat behavior, and data" onBack={goBackOrHome} />
      <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-[32rem] bg-transparent">

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight text-ink">Gemini Context</h1>
          <FaInfoCircle className="text-ink-muted" size={18} />
        </div>

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />

        {renderAccordion("profile", <FaUser size={15} />, "User Profile", "Your name and bio",
          <UserProfileSettings
            userProfile={userProfile} 
            setUserProfile={(val) => dispatch(setUserProfile(val))} 
          />
        )}

        {renderAccordion("text", <FaMicrochip size={15} />, "Text Generation Model", "Model, temperature, tokens",
          <TextModelSettings
            temperature={temperature}
            setTemperature={(val) => dispatch(setTemperature(val))}
            selectedModel={selectedModel}
            setSelectedModel={(val) => dispatch(setSelectedModel(val))}
            modelList={modelList}
            maxOutputTokens={maxOutputTokens}
            setMaxOutputTokens={(val) => dispatch(setMaxOutputTokens(val))}
            compressThreshold={compressThreshold}
            setCompressThreshold={(val) => dispatch(setCompressThreshold(val))}
          />
        )}

        {renderAccordion("image", <FaImage size={15} />, "Image Generation Settings", "Model, ratio, count",
          <ImageGenerationSettings
            useSdWebui={useSdWebui}
            setUseSdWebui={(val) => dispatch(setUseSdWebui(val))}
            sdWebuiApiUrl={sdWebuiApiUrl}
            setSdWebuiApiUrl={(val) => dispatch(setSdWebuiApiUrl(val))}
            sdWebuiBatchSize={sdWebuiBatchSize}
            setSdWebuiBatchSize={(val) => dispatch(setSdWebuiBatchSize(val))}
            fetchSdModels={fetchSdModels}
            sdWebuiModel={sdWebuiModel}
            setSdWebuiModel={(val) => dispatch(setSdWebuiModel(val))}
            sdWebuiModels={sdWebuiModels}
            sdWebuiRefMode={sdWebuiRefMode}
            setSdWebuiRefMode={(val) => dispatch(setSdWebuiRefMode(val))}
            sdWebuiDenoising={sdWebuiDenoising}
            setSdWebuiDenoising={(val) => dispatch(setSdWebuiDenoising(val))}
            sdWebuiControlnetModel={sdWebuiControlnetModel}
            setSdWebuiControlnetModel={(val) => dispatch(setSdWebuiControlnetModel(val))}
            imageModel={imageModel}
            setImageModel={(val) => dispatch(setImageModel(val))}
            imageModelList={imageModelList}
            imageGenPrompt={imageGenPrompt}
            setImageGenPrompt={(val) => dispatch(setImageGenPrompt(val))}
            imageResolution={imageResolution}
            setImageResolution={(val) => dispatch(setImageResolution(val))}
            imageSaveDirName={imageSaveDirName}
            handleSelectDirectory={handleSelectDirectory}
            LS_SD_WEBUI_MODEL={LS_SD_WEBUI_MODEL}
          />
        )}

        {renderAccordion("chat", <FaComments size={15} />, "Chat Interface Settings", "System prompt, bubbles, sending",
          <>
            <FieldLabel>Max Chat Length (0 for unlimited)</FieldLabel>
            <TextInput
              type="number"
              value={maxChatLength}
              onChange={(e) => dispatch(setMaxChatLength(Number(e.target.value)))}
              className="mb-6"
              min="1"
            />

            <FieldLabel>Chat Font Size</FieldLabel>
            <Select
              value={fontSize}
              onChange={(e) => dispatch(setFontSize(e.target.value))}
              className="mb-6"
            >
              <option value="14px">Small</option>
              <option value="16px">Medium (Default)</option>
              <option value="18px">Large</option>
              <option value="20px">Extra Large</option>
            </Select>

            <div className="border-t border-line pt-4">
              <InitialMessages
                key={initialMessagesKey}
                onSave={handleInitialMessagesSave}
              />
            </div>
          </>
        )}

        {renderAccordion("safety", <FaShieldAlt size={15} />, "Safety Settings", "Content filtering thresholds",
          <>
            {safetyCategories.map((category) => (
              <div key={category} className="mb-4">
                <FieldLabel className="capitalize">Block {category.replace("_", " ")}</FieldLabel>
                <Select
                  value={safetySettings[category]}
                  onChange={(e) => handleSafetyChange(category, e.target.value)}
                >
                  {harmThresholds.map(({ label, value }: {label: string, value: string}) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
          </>
        )}

        {renderAccordion("data", <FaDatabase size={15} />, "Data & Import/Export", "Import / export conversations",
          <>
            <p className="text-sm font-medium text-ink mb-1">Full Backup</p>
            <p className="text-xs text-ink-muted mb-3">
              All chats, characters, settings, and locally-saved images (if you've picked a save folder) in one zip - everything lives only in this browser, so it's worth keeping a copy. Restoring always adds to your existing library, never overwrites it.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
               <button
                  onClick={handleExportFullBackup}
                  className="flex-1 bg-primary text-onAccent py-2 px-4 rounded-lg hover:bg-primary-hover transition flex items-center justify-center gap-2"
               >
                  <FaFileArchive /> Export Full Backup
               </button>
               <button
                  onClick={handleImportBackupClick}
                  className="flex-1 bg-panel2 text-ink py-2 px-4 rounded-lg hover:bg-line transition flex items-center justify-center gap-2"
               >
                  <FaUpload /> Restore Backup
               </button>
               <input
                  type="file"
                  ref={backupFileInputRef}
                  onChange={handleBackupFileChange}
                  accept=".zip,.json"
                  style={{ display: "none" }}
               />
            </div>

            <p className="text-sm font-medium text-ink mb-1">Settings Only</p>
            <p className="text-xs text-ink-muted mb-3">
              Just your model/generation preferences - no chats or characters.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-2">
               <button
                  onClick={handleExportSettings}
                  className="flex-1 bg-secondary text-onSecondary py-2 px-4 rounded-lg hover:bg-secondary-hover transition flex items-center justify-center gap-2"
               >
                  <FaDownload /> Export Settings
               </button>
               <button
                  onClick={handleImportSettingsClick}
                  className="flex-1 bg-panel2 text-ink py-2 px-4 rounded-lg hover:bg-line transition flex items-center justify-center gap-2"
               >
                  <FaUpload /> Import Settings
               </button>
               <input
                  type="file"
                  ref={settingsFileInputRef}
                  onChange={handleSettingsFileChange}
                  accept=".json"
                  style={{ display: "none" }}
               />
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
};

export default SettingsPage;
