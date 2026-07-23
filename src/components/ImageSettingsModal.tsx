import React, { useState, useEffect, useCallback } from "react";
import { FaChevronDown } from "react-icons/fa";
import Modal from "./Modal";
import {
  LS_IMAGE_MODEL,
  DEFAULT_IMAGE_MODEL,
  LS_IMAGE_GEN_PROMPT,
  DEFAULT_IMAGE_GEN_PROMPT,
  LS_IMAGE_RESOLUTION,
  DEFAULT_IMAGE_RESOLUTION,
  IMAGE_RESOLUTIONS,
  models,
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
} from "../utils/constants";

import { useAppDispatch } from "../store/hooks";
import { 
  setImageModel as setGlobalImageModel, 
  setImageGenPrompt as setGlobalImageGenPrompt,
  setImageResolution as setGlobalImageResolution,
  setUseSdWebui as setGlobalUseSdWebui,
  setSdWebuiApiUrl as setGlobalSdWebuiApiUrl,
  setSdWebuiBatchSize as setGlobalSdWebuiBatchSize,
  setSdWebuiRefMode as setGlobalSdWebuiRefMode,
  setSdWebuiDenoising as setGlobalSdWebuiDenoising,
  setSdWebuiControlnetModel as setGlobalSdWebuiControlnetModel,
  setSdWebuiModels as setGlobalSdWebuiModels,
  setSdWebuiModel as setGlobalSdWebuiModel
} from "../features/settingsSlice";

interface ImageSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImageSettingsModal: React.FC<ImageSettingsModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const [imageModelList, setImageModelList] = useState<{value: string, label: string}[]>(() => {
    const list = models
      .filter((m: string) => /gemini-(2|3)|imagen/i.test(m))
      .map((m: string) => ({ value: m, label: m }));
    return list;
  });

  const [imageModel, setImageModel] = useState(() => localStorage.getItem(LS_IMAGE_MODEL) || DEFAULT_IMAGE_MODEL);
  const [imageGenPrompt, setImageGenPrompt] = useState(() => localStorage.getItem(LS_IMAGE_GEN_PROMPT) || DEFAULT_IMAGE_GEN_PROMPT);
  const [imageResolution, setImageResolution] = useState<string>(() => localStorage.getItem(LS_IMAGE_RESOLUTION) || DEFAULT_IMAGE_RESOLUTION);
  const [useSdWebui, setUseSdWebui] = useState<boolean>(() => localStorage.getItem(LS_USE_SD_WEBUI) === "true");
  const [sdWebuiApiUrl, setSdWebuiApiUrl] = useState<string>(() => localStorage.getItem(LS_SD_WEBUI_API_URL) || DEFAULT_SD_WEBUI_API_URL);
  const [sdWebuiBatchSize, setSdWebuiBatchSize] = useState<number>(() => parseInt(localStorage.getItem(LS_SD_WEBUI_BATCH_SIZE) || "1", 10) || DEFAULT_SD_WEBUI_BATCH_SIZE);
  const [sdWebuiRefMode, setSdWebuiRefMode] = useState<string>(() => localStorage.getItem(LS_SD_WEBUI_REF_MODE) || DEFAULT_SD_WEBUI_REF_MODE);
  const [sdWebuiDenoising, setSdWebuiDenoising] = useState<number>(() => parseFloat(localStorage.getItem(LS_SD_WEBUI_DENOISING) || String(DEFAULT_SD_WEBUI_DENOISING)));
  const [sdWebuiControlnetModel, setSdWebuiControlnetModel] = useState<string>(() => localStorage.getItem(LS_SD_WEBUI_CONTROLNET_MODEL) || DEFAULT_SD_WEBUI_CONTROLNET_MODEL);
  const [sdWebuiModels, setSdWebuiModels] = useState<{title: string, model_name: string}[]>(() => {
    const stored = localStorage.getItem(LS_SD_WEBUI_MODELS);
    return stored ? JSON.parse(stored) : [];
  });
  const [sdWebuiModel, setSdWebuiModel] = useState<string>(() => localStorage.getItem(LS_SD_WEBUI_MODEL) || DEFAULT_SD_WEBUI_MODEL);

  const fetchSdModels = useCallback(async () => {
    try {
      const response = await fetch(`${sdWebuiApiUrl.replace(/\/$/, "")}/sdapi/v1/sd-models`);
      if (!response.ok) throw new Error("Failed to fetch SD models");
      const data = await response.json();
      const mappedModels = data.map((m: any) => ({title: m.title, model_name: m.model_name}));
      setSdWebuiModels(mappedModels);
      localStorage.setItem(LS_SD_WEBUI_MODELS, JSON.stringify(mappedModels));
      dispatch(setGlobalSdWebuiModels(mappedModels));
      
      if (!sdWebuiModel || !mappedModels.find((m: any) => m.title === sdWebuiModel)) {
         setSdWebuiModel(mappedModels[0].title);
         localStorage.setItem(LS_SD_WEBUI_MODEL, mappedModels[0].title);
         dispatch(setGlobalSdWebuiModel(mappedModels[0].title));
      }
    } catch (error) {
      console.error("Error fetching SD models:", error);
    }
  }, [sdWebuiApiUrl, sdWebuiModel]);

  useEffect(() => {
    const stored = localStorage.getItem(LS_IMAGE_MODEL);
    if (stored && !imageModelList.find(m => m.value === stored)) {
      setImageModelList(prev => [...prev, { value: stored, label: stored }]);
    }
  }, [imageModelList]);

  useEffect(() => {
    if (useSdWebui && sdWebuiApiUrl) {
      fetchSdModels();
    }
  }, [useSdWebui, sdWebuiApiUrl, fetchSdModels]);

  useEffect(() => {
    if (isOpen) {
      localStorage.setItem(LS_IMAGE_MODEL, imageModel);
      dispatch(setGlobalImageModel(imageModel));
      localStorage.setItem(LS_IMAGE_GEN_PROMPT, imageGenPrompt);
      dispatch(setGlobalImageGenPrompt(imageGenPrompt));
      localStorage.setItem(LS_IMAGE_RESOLUTION, imageResolution);
      dispatch(setGlobalImageResolution(imageResolution));
      localStorage.setItem(LS_USE_SD_WEBUI, String(useSdWebui));
      dispatch(setGlobalUseSdWebui(useSdWebui));
      localStorage.setItem(LS_SD_WEBUI_API_URL, sdWebuiApiUrl);
      dispatch(setGlobalSdWebuiApiUrl(sdWebuiApiUrl));
      localStorage.setItem(LS_SD_WEBUI_BATCH_SIZE, String(sdWebuiBatchSize));
      dispatch(setGlobalSdWebuiBatchSize(sdWebuiBatchSize));
      localStorage.setItem(LS_SD_WEBUI_REF_MODE, sdWebuiRefMode);
      dispatch(setGlobalSdWebuiRefMode(sdWebuiRefMode));
      localStorage.setItem(LS_SD_WEBUI_DENOISING, String(sdWebuiDenoising));
      dispatch(setGlobalSdWebuiDenoising(sdWebuiDenoising));
      localStorage.setItem(LS_SD_WEBUI_CONTROLNET_MODEL, sdWebuiControlnetModel);
      dispatch(setGlobalSdWebuiControlnetModel(sdWebuiControlnetModel));
      localStorage.setItem(LS_SD_WEBUI_MODEL, sdWebuiModel);
      dispatch(setGlobalSdWebuiModel(sdWebuiModel));
    }
  }, [imageModel, imageGenPrompt, imageResolution, useSdWebui, sdWebuiApiUrl, sdWebuiBatchSize, sdWebuiRefMode, sdWebuiDenoising, sdWebuiControlnetModel, sdWebuiModel, isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Image Generation Settings">
      <div className="flex flex-col gap-4 text-left p-1">
        <label className="flex items-center space-x-3 cursor-pointer">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Use Local/Remote SD WebUI Forge
          </span>
          <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useSdWebui ? "bg-indigo-500" : "bg-gray-300 dark:bg-slate-700"}`}>
            <input
              type="checkbox"
              className="sr-only"
              checked={useSdWebui}
              onChange={(e) => setUseSdWebui(e.target.checked)}
            />
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useSdWebui ? "translate-x-6" : "translate-x-1"}`} />
          </div>
        </label>

        {useSdWebui ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                SD WebUI Forge API URL
              </label>
              <input
                type="text"
                value={sdWebuiApiUrl}
                onChange={(e) => setSdWebuiApiUrl(e.target.value)}
                placeholder="http://127.0.0.1:7860"
                className="w-full p-2 bg-gray-100 dark:bg-slate-800 text-black dark:text-white rounded-lg border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Batch Size (Number of Images)
              </label>
              <input
                type="number"
                min="1"
                max="8"
                value={sdWebuiBatchSize}
                onChange={(e) => setSdWebuiBatchSize(parseInt(e.target.value, 10))}
                className="w-full p-2 bg-gray-100 dark:bg-slate-800 text-black dark:text-white rounded-lg border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  SD Model
                </label>
                <button type="button" onClick={fetchSdModels} className="text-xs text-indigo-500 hover:text-indigo-400">
                  Refresh Models
                </button>
              </div>
              <div className="relative">
                <select
                  value={sdWebuiModel}
                  onChange={(e) => {
                    setSdWebuiModel(e.target.value);
                    localStorage.setItem(LS_SD_WEBUI_MODEL, e.target.value);
                    dispatch(setGlobalSdWebuiModel(e.target.value));
                  }}
                  className="w-full p-2 pr-8 bg-gray-100 dark:bg-slate-800 text-black dark:text-white rounded-lg border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">Default (From SD WebUI)</option>
                  {sdWebuiModels.map((m) => (
                    <option key={m.title} value={m.title}>
                      {m.model_name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <FaChevronDown size={10} className="text-gray-500 dark:text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reference Image Mode
              </label>
              <div className="relative">
                <select
                  value={sdWebuiRefMode}
                  onChange={(e) => setSdWebuiRefMode(e.target.value)}
                  className="w-full p-2 pr-8 bg-gray-100 dark:bg-slate-800 text-black dark:text-white rounded-lg border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="none">None (Text to Image only)</option>
                  <option value="img2img">img2img API</option>
                  <option value="controlnet">ControlNet (Alwayson Scripts)</option>
                  <option value="reactor">Face Swap (ReActor Extension)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <FaChevronDown size={10} className="text-gray-500 dark:text-gray-400" />
                </div>
              </div>
            </div>

            {sdWebuiRefMode === "img2img" && (
              <div>
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
                    background: `linear-gradient(to right, #6366f1, #8b5cf6) 0% 0% / ${(sdWebuiDenoising / 1) * 100}% 100% no-repeat, #e2e8f0` 
                  }}
                />
              </div>
            )}

            {sdWebuiRefMode === "controlnet" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ControlNet Model Name
                </label>
                <input
                  type="text"
                  value={sdWebuiControlnetModel}
                  onChange={(e) => setSdWebuiControlnetModel(e.target.value)}
                  placeholder="e.g. ip-adapter_sd15"
                  className="w-full p-2 bg-gray-100 dark:bg-slate-800 text-black dark:text-white rounded-lg border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            )}
          </>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Image Generation Model
            </label>
            <div className="relative">
              <select
                value={imageModel}
                onChange={(e) => setImageModel(e.target.value)}
                className="w-full p-2 pr-8 bg-gray-100 dark:bg-slate-800 text-black dark:text-white rounded-lg border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
              >
                {imageModelList.map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <FaChevronDown size={10} className="text-gray-500 dark:text-gray-400" />
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Base Prompt
          </label>
          <textarea
            value={imageGenPrompt}
            onChange={(e) => setImageGenPrompt(e.target.value)}
            placeholder="e.g. Create a high quality, detailed image..."
            className="w-full p-2 bg-gray-100 dark:bg-slate-800 text-black dark:text-white rounded-lg border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none transition-all resize-y min-h-[60px]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Processing Resolution
          </label>
          <div className="relative">
            <select
              value={imageResolution}
              onChange={(e) => setImageResolution(e.target.value)}
              className="w-full p-2 pr-8 bg-gray-100 dark:bg-slate-800 text-black dark:text-white rounded-lg border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
            >
              {IMAGE_RESOLUTIONS.map((res) => (
                <option key={res} value={res}>{res}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <FaChevronDown size={10} className="text-gray-500 dark:text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ImageSettingsModal;