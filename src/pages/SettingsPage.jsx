import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { FaArrowLeft, FaDownload, FaUpload } from "react-icons/fa";
import InitialMessages from "../components/InitialMessages";
import { importChat } from "../features/chatSlice";
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
  models,
} from "../utils/constants";

const SettingsPage = () => {
  const navigate = useNavigate();
  const [initialMessagesKey, setInitialMessagesKey] = useState(0);
  const dispatch = useDispatch();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [customModel, setCustomModel] = useState(() => {
    const stored = localStorage.getItem(LS_AI_MODEL);
    return stored && !models.includes(stored) ? stored : "";
  });
  const getStoredValue = (key, defaultValue) => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [selectedModel, setSelectedModel] = useState(() => {
    const stored = localStorage.getItem(LS_AI_MODEL);
    return stored && models.includes(stored) ? stored : models[0];
  });
  const [maxOutputTokens, setMaxOutputTokens] = useState(
    getStoredValue(LS_MAX_OUTPUT_TOKENS, DEFAULT_OUTPUT_TOKENS)
  );
  const [maxChatLength, setMaxChatLength] = useState(
    getStoredValue(LS_MAX_CHAT_LENGTH, DEFAULT_CHAT_LENGTH)
  );
  const [temperature, setTemperature] = useState(
    getStoredValue(LS_TEMPRATURE, DEFAULT_TEMPRATURE)
  );
  const [safetySettings, setSafetySettings] = useState(
    getStoredValue(LS_SAFETY_SETTINGS, DEFAULT_SAFETY_SETTINGS)
  );

  useEffect(() => {
    try {
      const modelToStore = customModel.trim() || selectedModel;
      localStorage.setItem(LS_AI_MODEL, modelToStore);
      localStorage.setItem(LS_MAX_OUTPUT_TOKENS, JSON.stringify(maxOutputTokens));
      localStorage.setItem(LS_TEMPRATURE, JSON.stringify(temperature));
      localStorage.setItem(LS_SAFETY_SETTINGS, JSON.stringify(safetySettings));
      localStorage.setItem(LS_MAX_CHAT_LENGTH, JSON.stringify(maxChatLength));
      setSuccess("Settings saved successfully.");
    } catch (err) {
      console.error("Error saving settings:", err);
      setError("Failed to save settings. Please try again.");
    } finally {
      setTimeout(() => setSuccess(null), 2000);
    }
  }, [customModel, selectedModel, maxOutputTokens, temperature, safetySettings, maxChatLength]);
  
  const handleSafetyChange = useCallback((category, value) => {
    setSafetySettings((prev) => ({ ...prev, [category]: value }));
  }, []);

  const settingsFileInputRef = useRef(null);

  const handleExportSettings = () => {
    const settings = {
      [LS_AI_MODEL]: customModel.trim() || selectedModel,
      [LS_MAX_OUTPUT_TOKENS]: maxOutputTokens,
      [LS_TEMPRATURE]: temperature,
      [LS_SAFETY_SETTINGS]: safetySettings,
      [LS_MAX_CHAT_LENGTH]: maxChatLength,
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
    settingsFileInputRef.current.click();
  };

  const handleSettingsFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target.result);
        
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
        if (settings[LS_INITIAL_MESSAGES]) {
            localStorage.setItem(LS_INITIAL_MESSAGES, JSON.stringify(settings[LS_INITIAL_MESSAGES]));
            setInitialMessagesKey(prev => prev + 1);
        }

        setSuccess("Settings imported successfully!");
      } catch (err) {
        console.error("Import error:", err);
        setError("Failed to import settings. Invalid JSON file.");
      }
    };
    reader.readAsText(file);
    event.target.value = null; 
  };



  const safetyCategories = useMemo(
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
        Settings
      </h2>
      <p className="text-center text-primary dark:text-white mb-4 text-sm">
        Changes are saved automatically.
      </p>

      {/* Display success or error message */}
      {error && <p className="text-red-500 text-center mb-3">{error}</p>}
      {success && <p className="text-green-500 text-center mb-3">{success}</p>}

      <div className="w-full max-w-3xl mx-auto p-6 bg-panel-light dark:bg-panel-dark shadow-lg rounded-2xl mb-20">
            <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800 pb-6 mb-6">
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
          {models.map((model) => (
            <option key={model} value={model}>
              {model}
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
              {harmThresholds.map(({ label, value }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Initial Chat Message */}
        <InitialMessages key={initialMessagesKey} />
      </div>
    </div>
  );
};

export default SettingsPage;
