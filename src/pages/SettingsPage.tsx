import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaDownload, FaUpload, FaGlobe, FaPython, FaGoogle, FaInfoCircle, FaChevronDown, FaChevronUp } from "react-icons/fa";
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
  models,
} from "../utils/constants";
import { AISafetySettings, UserProfile } from "../types";

const SettingsPage = () => {
  const navigate = useNavigate();
  const [initialMessagesKey, setInitialMessagesKey] = useState(0);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [customModel, setCustomModel] = useState(() => {
    const stored = localStorage.getItem(LS_AI_MODEL);
    return stored && !models.includes(stored) ? stored : "";
  });

  const [modelList, setModelList] = useState<{value: string, label: string}[]>(models.map((m: string) => ({ value: m, label: m })));

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
        }
      } catch (error) {
        console.error("Error fetching models:", error);
      }
    };

    fetchModels();
  }, []);

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
    return stored && models.includes(stored) ? stored : models[0];
  });
  const [maxOutputTokens, setMaxOutputTokens] = useState<number>(
    getStoredValue(LS_MAX_OUTPUT_TOKENS, DEFAULT_OUTPUT_TOKENS)
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
        const modelToStore = customModel.trim() || selectedModel;
        localStorage.setItem(LS_AI_MODEL, modelToStore);
        localStorage.setItem(LS_MAX_OUTPUT_TOKENS, JSON.stringify(maxOutputTokens));
        localStorage.setItem(LS_TEMPRATURE, JSON.stringify(temperature));
        localStorage.setItem(LS_SAFETY_SETTINGS, JSON.stringify(safetySettings));
        localStorage.setItem(LS_MAX_CHAT_LENGTH, JSON.stringify(maxChatLength));
        localStorage.setItem(LS_FONT_SIZE, fontSize);
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
  }, [customModel, selectedModel, maxOutputTokens, temperature, safetySettings, maxChatLength, fontSize, userProfile, roastMessages, addToast]);
  
  const handleSafetyChange = useCallback((category: keyof AISafetySettings, value: string) => {
    setSafetySettings((prev) => ({ ...prev, [category]: value }));
  }, []);

  const settingsFileInputRef = useRef<HTMLInputElement>(null);

  const handleExportSettings = () => {
    const settings = {
      [LS_AI_MODEL]: customModel.trim() || selectedModel,
      [LS_MAX_OUTPUT_TOKENS]: maxOutputTokens,
      [LS_TEMPRATURE]: temperature,
      [LS_SAFETY_SETTINGS]: safetySettings,
      [LS_MAX_CHAT_LENGTH]: maxChatLength,
      [LS_FONT_SIZE]: fontSize,
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
                setCustomModel("");
            } else {
                 setCustomModel(model);
            }
        }
        if (settings[LS_MAX_OUTPUT_TOKENS]) setMaxOutputTokens(settings[LS_MAX_OUTPUT_TOKENS]);
        if (settings[LS_TEMPRATURE]) setTemperature(settings[LS_TEMPRATURE]);
        if (settings[LS_SAFETY_SETTINGS]) setSafetySettings(settings[LS_SAFETY_SETTINGS]);
        if (settings[LS_MAX_CHAT_LENGTH]) setMaxChatLength(settings[LS_MAX_CHAT_LENGTH]);
        if (settings[LS_FONT_SIZE]) {
            setFontSize(settings[LS_FONT_SIZE]);
            document.documentElement.style.setProperty('--chat-font-size', settings[LS_FONT_SIZE]);
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
    <div className="w-full h-screen flex justify-center bg-app-light dark:bg-app-dark overflow-auto p-4 md:p-8">
      <div className="w-full max-w-md bg-transparent">
        
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

          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full p-3 bg-app-light dark:bg-slate-900/50 text-black dark:text-white rounded-xl border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none transition-all appearance-none"
          >
            {modelList.map((model: {value: string, label: string}) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
        </div>

        {/* Active Plugins Card (UI Mockup) */}
        <div className="bg-panel-light dark:bg-panel-dark rounded-2xl p-5 mb-4 shadow-sm border border-gray-100 dark:border-slate-700/50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Active Plugins</h3>
            <FaInfoCircle className="text-gray-400 dark:text-slate-500" size={14} title="Coming Soon!" />
          </div>

          <div className="flex flex-col gap-4">
            {[
              { label: "Web Search", icon: FaGlobe },
              { label: "Python Interpreter", icon: FaPython },
              { label: "Google Workspace connection", icon: FaGoogle },
            ].map(({ label, icon: Icon }, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gemini-logo flex items-center justify-center shadow-sm">
                    <Icon size={14} className="text-white" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-slate-200">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-slate-400">ON</span>
                  <div className="w-10 h-5 rounded-full flex items-center px-1 cursor-pointer bg-indigo-500">
                    <div className="w-4 h-4 rounded-full bg-white translate-x-4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Advanced Settings Accordion */}
        <div className="bg-panel-light dark:bg-panel-dark rounded-2xl p-5 mb-10 shadow-sm border border-gray-100 dark:border-slate-700/50">
          <button 
            className="w-full flex justify-between items-center text-lg font-medium text-gray-900 dark:text-white"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <span>Advanced Settings</span>
            {showAdvanced ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
          </button>
          
          {showAdvanced && (
            <div className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4 border-b border-gray-200 dark:border-gray-800 pb-6 mb-2">
                 <button
                    onClick={handleExportSettings}
                    className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-hover transition flex items-center justify-center gap-2"
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
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          <strong>Using Model:</strong> {customModel.trim() || selectedModel}
        </p>
        <label className="block font-semibold mb-2 text-black dark:text-white">
          Custom AI Model Name (optional)
        </label>
        <input
          type="text"
          placeholder="Enter custom model name"
          value={customModel}
          onChange={(e) => setCustomModel(e.target.value)}
          className="w-full p-3 bg-app-light dark:bg-app-dark text-black dark:text-white rounded-xl border border-transparent focus:border-primary outline-none mb-4 transition-all"
        />

        <label className="block font-semibold mb-2 text-black dark:text-white">
          Or Select AI Model
        </label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full p-3 bg-app-light dark:bg-app-dark text-black dark:text-white rounded-xl border border-transparent focus:border-primary outline-none mb-4 transition-all"
        >
          {modelList.map((model: {value: string, label: string}) => (
            <option key={model.value} value={model.value}>
              {model.label}
            </option>
          ))}
        </select>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          <strong>Selected Model:</strong>{" "}
          {customModel.trim() || selectedModel}
        </p>

        {/* Max Output Tokens */}
        <label className="block font-semibold mb-2 text-black dark:text-white">
          Max Output Tokens
        </label>
        <input
          type="number"
          value={maxOutputTokens}
          onChange={(e) => setMaxOutputTokens(Number(e.target.value))}
          className="w-full p-3 bg-app-light dark:bg-app-dark text-black dark:text-white rounded-xl border border-transparent focus:border-primary outline-none mb-4 transition-all"
          min="1"
        />

        {/* Max chat length */}
        <label className="block font-semibold mb-2 text-black dark:text-white">
          Max Chat Length (old messages will be deleted, 0 for unlimited length)
        </label>
        <input
          type="number"
          value={maxChatLength}
          onChange={(e) => setMaxChatLength(Number(e.target.value))}
          className="w-full p-3 bg-app-light dark:bg-app-dark text-black dark:text-white rounded-xl border border-transparent focus:border-primary outline-none mb-4 transition-all"
          min="1"
        />

        {/* Temperature */}
        <label className="block font-semibold mb-2 text-black dark:text-white">
          Temperature (Creativity Level)
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={temperature}
          onChange={(e) => setTemperature(Number(e.target.value))}
          className="w-full mb-2"
        />
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          Current: {temperature}
        </p>

        {/* Safety Settings */}
        <h3 className="font-semibold mb-2 text-black dark:text-white">Safety Settings</h3>
        {safetyCategories.map((category) => (
          <div key={category} className="mb-2">
            <label className="block text-black dark:text-white capitalize mb-1">
              Block {category.replace("_", " ")}
            </label>
            <select
              value={safetySettings[category]}
              onChange={(e) => handleSafetyChange(category, e.target.value)}
              className="w-full mb-2 p-2 bg-app-light dark:bg-app-dark text-black dark:text-white rounded-xl border border-transparent focus:border-primary outline-none transition-all"
            >
              {harmThresholds.map(({ label, value }: {label: string, value: string}) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Font Size */}
        <label className="block font-semibold mt-4 mb-2 text-black dark:text-white">
          Chat Font Size
        </label>
        <select
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value)}
          className="w-full p-3 bg-app-light dark:bg-app-dark text-black dark:text-white rounded-xl border border-transparent focus:border-primary outline-none mb-4 transition-all"
        >
          <option value="14px">Small</option>
          <option value="16px">Medium (Default)</option>
          <option value="18px">Large</option>
          <option value="20px">Extra Large</option>
        </select>

              {/* Initial Chat Message */}
              <div className="mt-4 border-t border-gray-200 dark:border-gray-800 pt-4">
                <InitialMessages key={initialMessagesKey} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
