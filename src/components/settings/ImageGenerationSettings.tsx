import React from 'react';
import { IMAGE_RESOLUTIONS } from '../../utils/constants';
import { TextInput, TextArea, Select, FieldLabel, Slider } from '../ui/FormControls';
import ToggleSwitch from '../ToggleSwitch';

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
        <ToggleSwitch
          checked={useSdWebui}
          onChange={setUseSdWebui}
          label="Use Local/Remote SD WebUI Forge"
        />
      </div>

      {useSdWebui ? (
        <div className="mb-4">
          <FieldLabel>SD WebUI Forge API URL</FieldLabel>
          <TextInput
            type="text"
            value={sdWebuiApiUrl}
            onChange={(e) => setSdWebuiApiUrl(e.target.value)}
            placeholder="http://127.0.0.1:7860"
            className="mb-4"
          />

          <FieldLabel>Batch Size (Number of Images)</FieldLabel>
          <TextInput
            type="number"
            min="1"
            max="8"
            value={sdWebuiBatchSize}
            onChange={(e) => setSdWebuiBatchSize(parseInt(e.target.value, 10))}
            className="mb-4"
          />

          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-sm font-medium text-ink">SD Model</label>
            <button
              type="button"
              onClick={fetchSdModels}
              className="text-xs text-primary hover:text-primary-hover"
            >
              Refresh Models
            </button>
          </div>
          <Select
            value={sdWebuiModel}
            onChange={(e) => {
              setSdWebuiModel(e.target.value);
              localStorage.setItem(LS_SD_WEBUI_MODEL, e.target.value);
            }}
            className="mb-4"
          >
            <option value="">Default (From SD WebUI)</option>
            {sdWebuiModels.map((m) => (
              <option key={m.title} value={m.title}>
                {m.model_name}
              </option>
            ))}
          </Select>

          <FieldLabel hint="How to use the character's appearance images">Reference Image Mode</FieldLabel>
          <Select value={sdWebuiRefMode} onChange={(e) => setSdWebuiRefMode(e.target.value)} className="mb-4">
            <option value="none">None (Text to Image only)</option>
            <option value="img2img">img2img API</option>
            <option value="controlnet">ControlNet (Alwayson Scripts)</option>
            <option value="reactor">Face Swap (ReActor Extension)</option>
          </Select>

          {sdWebuiRefMode === 'reactor' && (
            <div className="mb-4">
              <p className="text-xs text-primary font-medium mb-1">
                ReActor requires the "sd-webui-reactor-sfw" extension installed in Forge.
              </p>
              <p className="text-xs text-ink-muted">
                This passes the character image natively to inswapper to perform a highly accurate
                post-process face swap over the generated subject.
              </p>
            </div>
          )}

          {sdWebuiRefMode === 'img2img' && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-ink-muted mb-2">
                <span>Denoising Strength</span>
                <span className="font-mono text-xs">{sdWebuiDenoising}</span>
              </div>
              <Slider value={sdWebuiDenoising} min={0} max={1} step={0.05} onChange={setSdWebuiDenoising} />
            </div>
          )}

          {sdWebuiRefMode === 'controlnet' && (
            <div className="mb-4">
              <FieldLabel>ControlNet Model Name</FieldLabel>
              <TextInput
                type="text"
                value={sdWebuiControlnetModel}
                onChange={(e) => setSdWebuiControlnetModel(e.target.value)}
                placeholder="e.g. ip-adapter_sd15"
              />
              <p className="text-xs text-ink-muted mt-1">
                Make sure this model is installed in your Forge/WebUI.
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
          <FieldLabel hint="Used when &quot;send pic&quot; or similar is queried.">Image Generation Model</FieldLabel>
          <Select value={imageModel} onChange={(e) => setImageModel(e.target.value)} className="mb-4">
            {imageModelList.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </Select>
        </>
      )}

      <FieldLabel hint="Used as the base instruction whenever an image is requested." className="mt-4">
        Image Generation Base Prompt
      </FieldLabel>
      <TextArea
        value={imageGenPrompt}
        onChange={(e) => setImageGenPrompt(e.target.value)}
        placeholder="e.g. Create a high quality, detailed image..."
      />

      <div className="mb-4 mt-6">
        <FieldLabel>Default Image Resolution</FieldLabel>
        <Select value={imageResolution} onChange={(e) => setImageResolution(e.target.value)} className="mb-4">
          {IMAGE_RESOLUTIONS.map((res) => (
            <option key={res} value={res}>
              {res}
            </option>
          ))}
        </Select>

        <FieldLabel>Save Generated Images To:</FieldLabel>
        <div className="flex items-center justify-between bg-app p-3 rounded-xl border border-line mb-2">
          <span className="text-ink text-sm truncate pr-2">
            {imageSaveDirName}
          </span>
          <button
            onClick={handleSelectDirectory}
            className="px-3 py-1.5 bg-primary text-onAccent text-sm rounded-lg hover:bg-primary-hover transition whitespace-nowrap"
          >
            Select Folder
          </button>
        </div>
        <p className="text-xs text-ink-muted">
          Note: Browsers may prompt you to re-approve write permissions to this folder when resuming
          the app.
        </p>
      </div>
    </>
  );
};

export default ImageGenerationSettings;
