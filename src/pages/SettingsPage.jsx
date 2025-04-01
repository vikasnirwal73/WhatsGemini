import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import InitialMessages from "../components/InitialMessages";
import {
  DEFAULT_OUTPUT_TOKENS,
  DEFAULT_SAFETY_SETTINGS,
  DEFAULT_TEMPRATURE,
  harmThresholds,
  LS_AI_MODEL,
  LS_MAX_OUTPUT_TOKENS,
  LS_SAFETY_SETTINGS,
  LS_TEMPRATURE,
  models,
} from "../utils/constants";

const SettingsPage = () => {
  const navigate = useNavigate();
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
      setSuccess("Settings saved successfully.");
    } catch (err) {
      console.error("Error saving settings:", err);
      setError("Failed to save settings. Please try again.");
    } finally {
      setTimeout(() => setSuccess(null), 2000);
    }
  }, [customModel, selectedModel, maxOutputTokens, temperature, safetySettings]);
  
  const handleSafetyChange = useCallback((category, value) => {
    setSafetySettings((prev) => ({ ...prev, [category]: value }));
  }, []);

  const safetyCategories = useMemo(
    () => ["harassment", "hate_speech", "sexual", "dangerous"],
    []
  );

  return (
    <div className="w-full h-screen flex flex-col p-6 bg-[#eae6df] dark:bg-[#0d1418] overflow-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        className="mb-4 flex items-center gap-2 bg-[#008069] text-white px-4 py-2 rounded-full shadow-md hover:bg-[#026e58] transition w-max"
      >
        <FaArrowLeft size={16} />
        <span>Back</span>
      </button>

      <h2 className="text-2xl font-bold mb-4 text-center text-[#008069] dark:text-[#25D366]">
        Settings
      </h2>
      <p className="text-center text-[#008069] dark:text-[#25D366] mb-4 text-sm">
        Changes are saved automatically.
      </p>

      {/* Display success or error message */}
      {error && <p className="text-red-500 text-center mb-3">{error}</p>}
      {success && <p className="text-green-500 text-center mb-3">{success}</p>}

      <div className="w-full max-w-3xl mx-auto p-6 bg-white dark:bg-[#202c33] shadow-lg rounded-lg mb-20">
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
          className="w-full p-3 bg-[#f0f2f5] dark:bg-[#2a3942] text-black dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 outline-none mb-4"
        />

        <label className="block font-semibold mb-2 text-black dark:text-white">
          Or Select AI Model
        </label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full p-3 bg-[#f0f2f5] dark:bg-[#2a3942] text-black dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 outline-none mb-4"
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
          className="w-full p-3 bg-[#f0f2f5] dark:bg-[#2a3942] text-black dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 outline-none mb-4"
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
              className="w-full mb-2 p-2 bg-[#f0f2f5] dark:bg-[#2a3942] text-black dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 outline-none"
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
      </div>
    </div>
  );
};

export default SettingsPage;
