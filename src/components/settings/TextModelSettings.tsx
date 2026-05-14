import React from 'react';
import { FaChevronDown } from 'react-icons/fa';

interface TextModelSettingsProps {
  temperature: number;
  setTemperature: (temp: number) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  modelList: { value: string; label: string }[];
  maxOutputTokens: number;
  setMaxOutputTokens: (tokens: number) => void;
  compressThreshold: number;
  setCompressThreshold: (threshold: number) => void;
}

const TextModelSettings: React.FC<TextModelSettingsProps> = ({
  temperature,
  setTemperature,
  selectedModel,
  setSelectedModel,
  modelList,
  maxOutputTokens,
  setMaxOutputTokens,
  compressThreshold,
  setCompressThreshold,
}) => {
  return (
    <>
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
            background: `linear-gradient(to right, #a78bfa, #fb923c, #38bdf8) 0% 0% / ${(temperature / 1) * 100}% 100% no-repeat, #334155`,
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
          {modelList.map((model) => (
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
        Max Output Tokens
      </label>
      <input
        type="number"
        value={maxOutputTokens}
        onChange={(e) => setMaxOutputTokens(Number(e.target.value))}
        className="w-full p-3 bg-app-light dark:bg-slate-900/50 text-black dark:text-white rounded-xl border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none transition-all mb-6"
        min="1"
      />

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
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          If history length exceeds this, older messages will be summarized to save tokens. (0 means disabled)
        </p>
      </div>
    </>
  );
};

export default TextModelSettings;
