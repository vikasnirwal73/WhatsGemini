import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { FaArrowLeft, FaFileImport } from "react-icons/fa";
import InitialMessages from "../components/InitialMessages";
import { importChat } from "../features/chatSlice";
import {
  DEFAULT_CHAT_LENGTH,
  DEFAULT_OUTPUT_TOKENS,
  DEFAULT_SAFETY_SETTINGS,
  DEFAULT_TEMPRATURE,
  harmThresholds,
  LS_AI_MODEL,
  LS_MAX_CHAT_LENGTH,
  LS_MAX_OUTPUT_TOKENS,
  LS_SAFETY_SETTINGS,
  LS_TEMPRATURE,
  models,
} from "../utils/constants";

const SettingsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
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

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const chatData = JSON.parse(e.target.result);
        const result = await dispatch(importChat(chatData)).unwrap();
        if (result && result.id) {
          setSuccess("Chat imported successfully!");
          setTimeout(() => setSuccess(null), 2000);
          // Optional: Navigate to chat if you want, but explicitly asked to move button here, so maybe stay on settings?
          // The previous behavior was to navigate. I will keep it as staying on settings or maybe navigate.
          // The user said "restore the chat on another browser", which implies importing. 
          // Usually when importing a chat, you want to see it. 
          // However, context is Settings Page. 
          // I'll show success message. If they want to see, they can go back. 
          // Actually, let's navigate to it, it is a nicer UX.
          navigate(`/chat/${result.id}`); 
        }
      } catch (error) {
        console.error("Failed to import chat:", error);
        setError("Failed to import chat. Invalid file.");
        setTimeout(() => setError(null), 3000);
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
        <InitialMessages />

         {/* Import Chat */}
         <h3 className="font-semibold mb-2 mt-6 text-black dark:text-white">Data Management</h3>
         <div className="mb-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".json"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 w-full p-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            <FaFileImport size={16} />
            <span className="font-medium">Import Chat</span>
          </button>
          <p className="text-xs text-center text-gray-500 mt-2">Upload a previously exported chat JSON file.</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
