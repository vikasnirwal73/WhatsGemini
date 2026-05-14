import React from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { IMAGE_RESOLUTIONS } from '../../utils/constants';

interface ImageGenerationSettingsProps {
  useSdWebui: boolean;
  setUseSdWebui: (use: boolean) => void;
  sdWebuiApiUrl: string;
  setSdWebuiApiUrl: (url: string) => void;
  sdWebuiBatchSize: number;
  setSdWebuiBatchSize: (size: number) => void;
  fetchSdModels: () => void;
  sdWebuiModel: string;
  setSdWebuiModel: (model: string) => void;
  sdWebuiModels: { title: string; model_name: string }[];
  sdWebuiRefMode: string;
  setSdWebuiRefMode: (mode: string) => void;
  sdWebuiDenoising: number;
  setSdWebuiDenoising: (denoising: number) => void;
  sdWebuiControlnetModel: string;
  setSdWebuiControlnetModel: (model: string) => void;
  imageModel: string;
  setImageModel: (model: string) => void;
  imageModelList: { value: string; label: string }[];
  imageGenPrompt: string;
  setImageGenPrompt: (prompt: string) => void;
  imageResolution: string;
  setImageResolution: (res: string) => void;
  imageSaveDirName: string;
  handleSelectDirectory: () => void;
  LS_SD_WEBUI_MODEL: string;
}

const ImageGenerationSettings: React.FC<ImageGenerationSettingsProps> = ({
  useSdWebui,
  setUseSdWebui,
  sdWebuiApiUrl,
  setSdWebuiApiUrl,
  sdWebuiBatchSize,
  setSdWebuiBatchSize,
  fetchSdModels,
  sdWebuiModel,
  setSdWebuiModel,
  sdWebuiModels,
  sdWebuiRefMode,
  setSdWebuiRefMode,
  sdWebuiDenoising,
  setSdWebuiDenoising,
  sdWebuiControlnetModel,
  setSdWebuiControlnetModel,
  imageModel,
  setImageModel,
  imageModelList,
  imageGenPrompt,
  setImageGenPrompt,
  imageResolution,
  setImageResolution,
  imageSaveDirName,
  handleSelectDirectory,
  LS_SD_WEBUI_MODEL,
}) => {
  return (
    <>
      <div className="mb-4">
        <label className="flex items-center space-x-3 cursor-pointer mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Use Local/Remote SD WebUI Forge
          </span>
          <div
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              useSdWebui ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-slate-700'
            }`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={useSdWebui}
              onChange={(e) => setUseSdWebui(e.target.checked)}
            />
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                useSdWebui ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
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
            <button
              type="button"
              onClick={fetchSdModels}
              className="text-xs text-indigo-500 hover:text-indigo-400"
            >
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
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
              <FaChevronDown size={12} className="text-gray-500 dark:text-gray-400" />
            </div>
          </div>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Reference Image Mode
          </label>
          <p className="text-xs text-gray-500 mb-2">
            How to use the character's appearance images
          </p>
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

          {sdWebuiRefMode === 'reactor' && (
            <div className="mb-4">
              <p className="text-xs text-indigo-500 font-medium mb-1">
                ReActor requires the "sd-webui-reactor-sfw" extension installed in Forge.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This passes the character image natively to inswapper to perform a highly accurate
                post-process face swap over the generated subject.
              </p>
            </div>
          )}

          {sdWebuiRefMode === 'img2img' && (
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
                  background: `linear-gradient(to right, #a78bfa, #fb923c, #38bdf8) 0% 0% / ${
                    (sdWebuiDenoising / 1) * 100
                  }% 100% no-repeat, #334155`,
                }}
              />
            </div>
          )}

          {sdWebuiRefMode === 'controlnet' && (
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
              <p className="text-xs text-gray-500 mt-1">
                Make sure this model is installed in your Forge/WebUI.
              </p>
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
              {imageModelList.map((model) => (
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
      <p className="text-xs text-gray-500 mb-2">
        Used as the base instruction whenever an image is requested.
      </p>
      <textarea
        value={imageGenPrompt}
        onChange={(e) => setImageGenPrompt(e.target.value)}
        placeholder="e.g. Create a high quality, detailed image..."
        className="w-full p-3 bg-app-light dark:bg-slate-900/50 text-black dark:text-white rounded-xl border border-transparent dark:border-slate-700 focus:border-indigo-500 outline-none transition-all resize-y min-h-[80px]"
      />

      <div className="mb-4 mt-6">
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
              <option key={res} value={res}>
                {res}
              </option>
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
          <span className="text-black dark:text-white text-sm truncate pr-2">
            {imageSaveDirName}
          </span>
          <button
            onClick={handleSelectDirectory}
            className="px-3 py-1.5 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 transition whitespace-nowrap"
          >
            Select Folder
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Note: Browsers may prompt you to re-approve write permissions to this folder when resuming
          the app.
        </p>
      </div>
    </>
  );
};

export default ImageGenerationSettings;
