import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaDownload, FaUpload, FaInfoCircle, FaChevronDown, FaChevronUp } from "react-icons/fa";
import InitialMessages from "../components/InitialMessages";
import { ToastContainer, ToastData } from "../components/Toast";
import { getApiKey } from "../utils/apiKeyManager";
import {
  DEFAULT_CHAT_LENGTH,
  DEFAULT_OUTPUT_TOKENS,
  DEFAULT_SAFETY_SETTINGS,
  DEFAULT_TEMPRATURE,
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
  IMAGE_RESOLUTIONS,
  DEFAULT_IMAGE_RESOLUTION,
  LS_IMAGE_MODEL,
  DEFAULT_IMAGE_MODEL,
  LS_IMAGE_GEN_PROMPT,
  DEFAULT_IMAGE_GEN_PROMPT,
  LS_USE_SD_WEBUI,
  LS_SD_WEBUI_API_URL,
  DEFAULT_SD_WEBUI_API_URL,
  LS_SD_WEBUI_BATCH_SIZE,
  DEFAULT_SD_WEBUI_BATCH_SIZE,
  LS_SD_WEBUI_REF_MODE,
  DEFAULT_SD_WEBUI_REF_MODE,
  LS_SD_WEBUI_DENOISING,
  DEFAULT_SD_WEBUI_DENOISING,
  LS_SD_WEBUI_CONTROLNET_MODEL,
  DEFAULT_SD_WEBUI_CONTROLNET_MODEL,
  LS_SD_WEBUI_MODELS,
  LS_SD_WEBUI_MODEL,
  DEFAULT_SD_WEBUI_MODEL,
  models,
  LS_COMPRESS_THRESHOLD,
  DEFAULT_COMPRESS_THRESHOLD,
} from "../utils/constants";
import { AISafetySettings, UserProfile } from "../types";
import { dbService } from "../services/dbService";

const SettingsPage = () => {
  const navigate = useNavigate();
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
    const list = models
      .filter((m: string) => /gemini-(2|3)|imagen/i.test(m))
      .map((m: string) => ({ value: m, label: m }));
    const stored = localStorage.getItem(LS_IMAGE_MODEL);
    if (stored && !list.find(m => m.value === stored)) {
      list.push({ value: stored, label: stored });
    }
    return list;
  });

  useEffect(() => {
    const fetchModels = async () => {
      const apiKey = getApiKey();
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
          const validImageModels = validModels.filter((m: {value: string}) => /gemini-(2|3)|imagen/i.test(m.value));
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
      setSdWebuiModels(mappedModels);
      localStorage.setItem(LS_SD_WEBUI_MODELS, JSON.stringify(mappedModels));
      
      // Select the first one if current is not in the list or empty
      if (mappedModels.length > 0) {
        if (!sdWebuiModel || !mappedModels.find((m: any) => m.title === sdWebuiModel)) {
           setSdWebuiModel(mappedModels[0].title);
           localStorage.setItem(LS_SD_WEBUI_MODEL, mappedModels[0].title);
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

  const getStoredValue = <T,>(key: string, defaultValue: T): T => {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [selectedModel, setSelectedModel] = useState(() => {
    const stored = localStorage.getItem(LS_AI_MODEL);
    return stored ? stored : models[0];
  });
  
  const [imageModel, setImageModel] = useState(() => {
    return localStorage.getItem(LS_IMAGE_MODEL) || DEFAULT_IMAGE_MODEL;
  });

  const [imageGenPrompt, setImageGenPrompt] = useState(() => {
    return localStorage.getItem(LS_IMAGE_GEN_PROMPT) || DEFAULT_IMAGE_GEN_PROMPT;
  });

  const [useSdWebui, setUseSdWebui] = useState<boolean>(() => {
    return localStorage.getItem(LS_USE_SD_WEBUI) === "true";
  });

  const [sdWebuiApiUrl, setSdWebuiApiUrl] = useState<string>(() => {
    return localStorage.getItem(LS_SD_WEBUI_API_URL) || DEFAULT_SD_WEBUI_API_URL;
  });

  const [sdWebuiBatchSize, setSdWebuiBatchSize] = useState<number>(() => {
    return parseInt(localStorage.getItem(LS_SD_WEBUI_BATCH_SIZE) || "1", 10) || DEFAULT_SD_WEBUI_BATCH_SIZE;
  });

  const [sdWebuiRefMode, setSdWebuiRefMode] = useState<string>(() => {
    return localStorage.getItem(LS_SD_WEBUI_REF_MODE) || DEFAULT_SD_WEBUI_REF_MODE;
  });

  const [sdWebuiDenoising, setSdWebuiDenoising] = useState<number>(() => {
    return parseFloat(localStorage.getItem(LS_SD_WEBUI_DENOISING) || String(DEFAULT_SD_WEBUI_DENOISING));
  });

  const [sdWebuiControlnetModel, setSdWebuiControlnetModel] = useState<string>(() => {
    return localStorage.getItem(LS_SD_WEBUI_CONTROLNET_MODEL) || DEFAULT_SD_WEBUI_CONTROLNET_MODEL;
  });

  const [sdWebuiModels, setSdWebuiModels] = useState<{title: string, model_name: string}[]>(() => {
    const stored = localStorage.getItem(LS_SD_WEBUI_MODELS);
    return stored ? JSON.parse(stored) : [];
  });

  const [sdWebuiModel, setSdWebuiModel] = useState<string>(() => {
    return localStorage.getItem(LS_SD_WEBUI_MODEL) || DEFAULT_SD_WEBUI_MODEL;
  });

  const [maxOutputTokens, setMaxOutputTokens] = useState<number>(
    getStoredValue(LS_MAX_OUTPUT_TOKENS, DEFAULT_OUTPUT_TOKENS)
  );
  const [compressThreshold, setCompressThreshold] = useState<number>(
    getStoredValue(LS_COMPRESS_THRESHOLD, DEFAULT_COMPRESS_THRESHOLD)
  );
  const [maxChatLength, setMaxChatLength] = useState<number>(
    getStoredValue(LS_MAX_CHAT_LENGTH, DEFAULT_CHAT_LENGTH)
  );
  const [temperature, setTemperature] = useState<number>(
    getStoredValue(LS_TEMPRATURE, DEFAULT_TEMPRATURE)
  );
  const [safetySettings, setSafetySettings] = useState<AISafetySettings>(
    getStoredValue(LS_SAFETY_SETTINGS, DEFAULT_SAFETY_SETTINGS as unknown as AISafetySettings)
  );
  const [fontSize, setFontSize] = useState<string>(
    localStorage.getItem(LS_FONT_SIZE) || "16px"
  );
  
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    return getStoredValue<UserProfile>(LS_USER_PROFILE, { name: "", bio: "" });
  });
  
  const [imageResolution, setImageResolution] = useState<string>(() => {
    return localStorage.getItem(LS_IMAGE_RESOLUTION) || DEFAULT_IMAGE_RESOLUTION;
  });

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

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add a toast notification
  const addToast = useCallback((message: string, type: "success" | "error" = "success", duration = 5000) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  // Remove a toast by id
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce the save operation
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(LS_AI_MODEL, selectedModel);
        localStorage.setItem(LS_IMAGE_MODEL, imageModel);
        localStorage.setItem(LS_IMAGE_GEN_PROMPT, imageGenPrompt);
        localStorage.setItem(LS_USE_SD_WEBUI, String(useSdWebui));
        localStorage.setItem(LS_SD_WEBUI_API_URL, sdWebuiApiUrl);
        localStorage.setItem(LS_SD_WEBUI_BATCH_SIZE, String(sdWebuiBatchSize));
        localStorage.setItem(LS_SD_WEBUI_REF_MODE, sdWebuiRefMode);
        localStorage.setItem(LS_SD_WEBUI_DENOISING, String(sdWebuiDenoising));
        localStorage.setItem(LS_SD_WEBUI_CONTROLNET_MODEL, sdWebuiControlnetModel);
        localStorage.setItem(LS_MAX_OUTPUT_TOKENS, JSON.stringify(maxOutputTokens));
        localStorage.setItem(LS_COMPRESS_THRESHOLD, JSON.stringify(compressThreshold));
        localStorage.setItem(LS_TEMPRATURE, JSON.stringify(temperature));
        localStorage.setItem(LS_SAFETY_SETTINGS, JSON.stringify(safetySettings));
        localStorage.setItem(LS_MAX_CHAT_LENGTH, JSON.stringify(maxChatLength));
        localStorage.setItem(LS_FONT_SIZE, fontSize);
        localStorage.setItem(LS_IMAGE_RESOLUTION, imageResolution);
        localStorage.setItem(LS_USER_PROFILE, JSON.stringify(userProfile));
        document.documentElement.style.setProperty('--chat-font-size', fontSize);
        
        // Pick a random roast message
        const randomRoast = roastMessages[Math.floor(Math.random() * roastMessages.length)];
        addToast(randomRoast, "success");
      } catch (err) {
        console.error("Error saving settings:", err);
        addToast("Failed to save settings. Please try again.", "error");
      }
    }, 1000); // 1 second debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [selectedModel, imageModel, imageGenPrompt, useSdWebui, sdWebuiApiUrl, sdWebuiBatchSize, sdWebuiRefMode, sdWebuiDenoising, sdWebuiControlnetModel, maxOutputTokens, compressThreshold, temperature, safetySettings, maxChatLength, fontSize, imageResolution, userProfile, roastMessages, addToast]);
  
  const handleSafetyChange = useCallback((category: keyof AISafetySettings, value: string) => {
    setSafetySettings((prev) => ({ ...prev, [category]: value }));
  }, []);

  const handleInitialMessagesSave = useCallback(() => {
    const randomRoast = roastMessages[Math.floor(Math.random() * roastMessages.length)];
    addToast(randomRoast, "success");
  }, [addToast, roastMessages]);

  const settingsFileInputRef = useRef<HTMLInputElement>(null);

  const handleExportSettings = () => {
    const settings = {
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
    };
    
    const jsonString = JSON.stringify(settings, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `whatsgemini_settings.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportSettingsClick = () => {
    settingsFileInputRef.current?.click();
  };

  const handleSettingsFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string);
        
        if (settings[LS_AI_MODEL]) {
            const model = settings[LS_AI_MODEL];
            if (models.includes(model)) {
                setSelectedModel(model);
            } else {
                // If it's a custom model from old settings, just keep it, or fallback
                setSelectedModel(model);
                setModelList(prev => {
                  if (!prev.find(m => m.value === model)) {
                     return [...prev, { value: model, label: model }];
                  }
                  return prev;
                });
            }
        }
        if (settings[LS_MAX_OUTPUT_TOKENS]) setMaxOutputTokens(settings[LS_MAX_OUTPUT_TOKENS]);
        if (settings[LS_COMPRESS_THRESHOLD]) setCompressThreshold(settings[LS_COMPRESS_THRESHOLD]);
        if (settings[LS_TEMPRATURE]) setTemperature(settings[LS_TEMPRATURE]);
        if (settings[LS_SAFETY_SETTINGS]) setSafetySettings(settings[LS_SAFETY_SETTINGS]);
        if (settings[LS_MAX_CHAT_LENGTH]) setMaxChatLength(settings[LS_MAX_CHAT_LENGTH]);
        if (settings[LS_FONT_SIZE]) {
            setFontSize(settings[LS_FONT_SIZE]);
            document.documentElement.style.setProperty('--chat-font-size', settings[LS_FONT_SIZE]);
        }
        if (settings[LS_IMAGE_RESOLUTION]) {
            setImageResolution(settings[LS_IMAGE_RESOLUTION]);
        }
        if (settings[LS_USER_PROFILE]) {
            setUserProfile(settings[LS_USER_PROFILE]);
        }
        if (settings[LS_INITIAL_MESSAGES]) {
            localStorage.setItem(LS_INITIAL_MESSAGES, JSON.stringify(settings[LS_INITIAL_MESSAGES]));
            setInitialMessagesKey(prev => prev + 1);
        }

        addToast("Settings imported successfully!", "success");
      } catch (err) {
        console.error("Import error:", err);
        addToast("Failed to import settings. Invalid JSON file.", "error");
      }
    };
    reader.readAsText(file);
    event.target.value = ''; 
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

  return (
    <div className="w-full h-screen flex justify-center bg-app-light dark:bg-app-dark overflow-auto p-4 md:p-4">
      <div className="w-full max-w-[32rem] bg-transparent">
        
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
              Gemini Context
            </h2>
          </div>
          <FaInfoCircle className="text-gray-400 dark:text-slate-500" size={18} />
        </div>

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />

        {/* User Profile Card */}
        <div className="bg-panel-light dark:bg-panel-dark rounded-2xl p-5 mb-4 shadow-sm border border-gray-100 dark:border-slate-700/50">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">User Profile</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Name</label>
            <input
              type="text"
              placeholder="How should characters address you?"
              value={userProfile.name}
              onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
              className="w-full p-3 bg-app-light dark:bg-slate-900/50 text-black dark:text-white rounded-xl border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">About You (Bio/Preferences)</label>
            <textarea
              placeholder="Tell characters a bit about yourself (e.g., your hobbies, communication style)..."
              value={userProfile.bio}
              onChange={(e) => setUserProfile({ ...userProfile, bio: e.target.value })}
              className="w-full p-3 bg-app-light dark:bg-slate-900/50 text-black dark:text-white rounded-xl border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none transition-all resize-y min-h-[80px]"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            This information is shared with characters to personalize conversations.
          </p>
        </div>

        {/* Model Settings Card */}
        <div className="bg-panel-light dark:bg-panel-dark rounded-2xl p-5 mb-4 shadow-sm border border-gray-100 dark:border-slate-700/50">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Model Settings</h3>
          
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-500 dark:text-slate-400 mb-2">
              <span>Creativity</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              style={{ 
                background: `linear-gradient(to right, #a78bfa, #fb923c, #38bdf8) 0% 0% / ${(temperature / 1) * 100}% 100% no-repeat, #334155` 
              }}
            />
            <div className="flex justify-between text-xs text-gray-400 dark:text-slate-500 mt-2">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Text Generation Model
          </label>
          <div className="relative mb-6">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full p-3 pr-10 bg-app-light dark:bg-slate-900/50 text-black dark:text-white rounded-xl border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
            >
              {modelList.map((model: {value: string, label: string}) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
              <FaChevronDown size={12} className="text-gray-500 dark:text-gray-400" />
            </div>
          </div>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Auto-Compress History Threshold
          </label>
          <div className="mb-2">
            <input
              type="number"
              min="0"
              value={compressThreshold}
              onChange={(e) => setCompressThreshold(Number(e.target.value))}
              placeholder="0 to disable"
              className="w-full p-3 bg-app-light dark:bg-slate-900/50 text-black dark:text-white rounded-xl border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none transition-all"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">If history length exceeds this, older messages will be summarized to save tokens. (0 means disabled)</p>
        </div>

        {/* Advanced Settings Accordion */}
        <div className="bg-panel-light dark:bg-panel-dark rounded-2xl px-5 py-3 mb-10 shadow-sm border border-gray-100 dark:border-slate-700/50 mt-4">
          <button 
            className="w-full flex justify-between items-center text-lg font-medium text-gray-900 dark:text-white"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <span>Advanced Settings</span>
            {showAdvanced ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
          </button>
          
          {showAdvanced && (
            <div className="mt-6 flex flex-col">
              <div className="flex flex-col sm:flex-row gap-4 border-b border-gray-200 dark:border-gray-800 pb-6 mb-2">
                 <button
                    onClick={handleExportSettings}
                    className="flex-1 bg-indigo-500 text-white py-2 px-4 rounded-lg hover:bg-indigo-600 transition flex items-center justify-center gap-2"
                 >
                    <FaDownload /> Export Settings
                 </button>
                 <button
                    onClick={handleImportSettingsClick}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-2"
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

        {/* AI Model Selection */}
        <div className="mb-4">
          <label className="flex items-center space-x-3 cursor-pointer mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Use Local/Remote SD WebUI Forge
            </span>
            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useSdWebui ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-slate-700'}`}>
              <input
                type="checkbox"
                className="sr-only"
                checked={useSdWebui}
                onChange={(e) => setUseSdWebui(e.target.checked)}
              />
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useSdWebui ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
          </label>
        </div>

        {useSdWebui ? (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              SD WebUI Forge API URL
            </label>
            <input
              type="text"
              value={sdWebuiApiUrl}
              onChange={(e) => setSdWebuiApiUrl(e.target.value)}
              placeholder="http://127.0.0.1:7860"
              className="w-full p-3 bg-app-light dark:bg-slate-900/50 text-black dark:text-white rounded-xl border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none transition-all mb-4"
            />
            
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Batch Size (Number of Images)
            </label>
            <input
              type="number"
              min="1"
              max="8"
              value={sdWebuiBatchSize}
              onChange={(e) => setSdWebuiBatchSize(parseInt(e.target.value, 10))}
              className="w-full p-3 bg-app-light dark:bg-slate-900/50 text-black dark:text-white rounded-xl border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none transition-all mb-4"
            />

            <div className="flex justify-between items-center mb-1">
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                 SD Model
               </label>
               <button type="button" onClick={fetchSdModels} className="text-xs text-indigo-500 hover:text-indigo-400">
                 Refresh Models
               </button>
            </div>
            <div className="relative mb-4">
              <select
                value={sdWebuiModel}
                onChange={(e) => {
                  setSdWebuiModel(e.target.value);
                  localStorage.setItem(LS_SD_WEBUI_MODEL, e.target.value);
                }}
                className="w-full p-3 pr-10 bg-app-light dark:bg-slate-900/50 text-black dark:text-white rounded-xl border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">Default (From SD WebUI)</option>
                {sdWebuiModels.map((m) => (
                  <option key={m.title} value={m.title}>
                    {m.model_name}
                  </option>
                ))}
              </select>
            </div>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reference Image Mode
            </label>
            <p className="text-xs text-gray-500 mb-2">How to use the character's appearance images</p>
            <div className="relative mb-4">
              <select
                value={sdWebuiRefMode}
                onChange={(e) => setSdWebuiRefMode(e.target.value)}
                className="w-full p-3 pr-10 bg-app-light dark:bg-slate-900/50 text-black dark:text-white rounded-xl border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="none">None (Text to Image only)</option>
                <option value="img2img">img2img API</option>
                <option value="controlnet">ControlNet (Alwayson Scripts)</option>
                <option value="reactor">Face Swap (ReActor Extension)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                <FaChevronDown size={12} className="text-gray-500 dark:text-gray-400" />
              </div>
            </div>

            {sdWebuiRefMode === "reactor" && (
              <div className="mb-4">
                <p className="text-xs text-indigo-500 font-medium mb-1">
                  ReActor requires the "sd-webui-reactor-sfw" extension installed in Forge.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This passes the character image natively to inswapper to perform a highly accurate post-process face swap over the generated subject.
                </p>
              </div>
            )}

            {sdWebuiRefMode === "img2img" && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-500 dark:text-slate-400 mb-2">
                  <span>Denoising Strength: {sdWebuiDenoising}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={sdWebuiDenoising}
                  onChange={(e) => setSdWebuiDenoising(Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  style={{ 
                    background: `linear-gradient(to right, #a78bfa, #fb923c, #38bdf8) 0% 0% / ${(sdWebuiDenoising / 1) * 100}% 100% no-repeat, #334155` 
                  }}
                />
              </div>
            )}

            {sdWebuiRefMode === "controlnet" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ControlNet Model Name
                </label>
                <input
                  type="text"
                  value={sdWebuiControlnetModel}
                  onChange={(e) => setSdWebuiControlnetModel(e.target.value)}
                  placeholder="e.g. ip-adapter_sd15"
                  className="w-full p-3 bg-app-light dark:bg-slate-900/50 text-black dark:text-white rounded-xl border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">Make sure this model is installed in your Forge/WebUI.</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Image Generation Model
            </label>
            <p className="text-xs text-gray-500 mb-2">Used when "send pic" or similar is queried.</p>
            <div className="relative mb-4">
              <select
                value={imageModel}
                onChange={(e) => setImageModel(e.target.value)}
                className="w-full p-3 pr-10 bg-app-light dark:bg-slate-900/50 text-black dark:text-white rounded-xl border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
              >
                {imageModelList.map((model: {value: string, label: string}) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                <FaChevronDown size={12} className="text-gray-500 dark:text-gray-400" />
              </div>
            </div>
          </>
        )}
        
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-4 mb-1">
          Image Generation Base Prompt
        </label>
        <p className="text-xs text-gray-500 mb-2">Used as the base instruction whenever an image is requested.</p>
        <textarea
          value={imageGenPrompt}
          onChange={(e) => setImageGenPrompt(e.target.value)}
          placeholder="e.g. Create a high quality, detailed image..."
          className="w-full p-3 bg-app-light dark:bg-slate-900/50 text-black dark:text-white rounded-xl border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none transition-all resize-y min-h-[80px]"
        />

        {/* Max Output Tokens */}
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-4 mb-1">
          Max Output Tokens
        </label>
        <input
          type="number"
          value={maxOutputTokens}
          onChange={(e) => setMaxOutputTokens(Number(e.target.value))}
          className="w-full p-3 bg-app-light dark:bg-slate-900/50 text-black dark:text-white rounded-xl border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none transition-all"
          min="1"
        />

        {/* Max chat length */}
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-4 mb-1">
          Max Chat Length (0 for unlimited)
        </label>
        <input
          type="number"
          value={maxChatLength}
          onChange={(e) => setMaxChatLength(Number(e.target.value))}
          className="w-full p-3 bg-app-light dark:bg-slate-900/50 text-black dark:text-white rounded-xl border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none transition-all"
          min="1"
        />
        {/* Image Generation Settings */}
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-4">Image Generation</h3>
        <div className="mb-4 mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Default Image Resolution
          </label>
          <div className="relative mb-4">
            <select
              value={imageResolution}
              onChange={(e) => setImageResolution(e.target.value)}
              className="w-full p-3 pr-10 bg-app-light dark:bg-slate-900/50 text-black dark:text-white rounded-xl border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
            >
              {IMAGE_RESOLUTIONS.map((res) => (
                <option key={res} value={res}>{res}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
              <FaChevronDown size={12} className="text-gray-500 dark:text-gray-400" />
            </div>
          </div>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Save Generated Images To:
          </label>
          <div className="flex items-center justify-between bg-app-light dark:bg-slate-900/50 p-3 rounded-xl border border-transparent dark:border-slate-700 mb-2">
            <span className="text-black dark:text-white text-sm truncate pr-2">{imageSaveDirName}</span>
            <button 
              onClick={handleSelectDirectory}
              className="px-3 py-1.5 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 transition whitespace-nowrap"
            >
              Select Folder
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Note: Browsers may prompt you to re-approve write permissions to this folder when resuming the app.
          </p>
        </div>

        {/* Safety Settings */}
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-4">Safety Settings</h3>
        {safetyCategories.map((category) => (
          <div key={category} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize mb-1">
              Block {category.replace("_", " ")}
            </label>
            <div className="relative mb-2">
              <select
                value={safetySettings[category]}
                onChange={(e) => handleSafetyChange(category, e.target.value)}
                className="w-full p-3 pr-10 bg-app-light dark:bg-slate-900/50 text-black dark:text-white rounded-xl border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
              >
                {harmThresholds.map(({ label, value }: {label: string, value: string}) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                <FaChevronDown size={12} className="text-gray-500 dark:text-gray-400" />
              </div>
            </div>
          </div>
        ))}

        {/* Font Size */}
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-6 mb-1">
          Chat Font Size
        </label>
        <div className="relative mb-4">
          <select
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            className="w-full p-3 pr-10 bg-app-light dark:bg-slate-900/50 text-black dark:text-white rounded-xl border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="14px">Small</option>
            <option value="16px">Medium (Default)</option>
            <option value="18px">Large</option>
            <option value="20px">Extra Large</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
            <FaChevronDown size={12} className="text-gray-500 dark:text-gray-400" />
          </div>
        </div>

              {/* Initial Chat Message */}
              <div className="mt-4 border-t border-gray-200 dark:border-gray-800 pt-4">
                <InitialMessages 
                  key={initialMessagesKey} 
                  onSave={handleInitialMessagesSave}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default SettingsPage;
