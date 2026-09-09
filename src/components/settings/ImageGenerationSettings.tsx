import React from 'react';
import { IMAGE_RESOLUTIONS } from '../../utils/constants';
import { TextInput, TextArea, Select, FieldLabel, Slider } from '../ui/FormControls';
import { IMAGE_PROVIDER_META } from '../../features/ai/providers/registry';

interface ImageGenerationSettingsProps {
  imageProvider: string;
  setImageProvider: (provider: string) => void;
  openaiApiKey: string;
  setOpenaiApiKey: (key: string) => void;
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
  openaiImageModelList: { value: string; label: string }[];
  imageGenPrompt: string;
  setImageGenPrompt: (prompt: string) => void;
  imageResolution: string;
  setImageResolution: (res: string) => void;
  imageSaveDirName: string;
  handleSelectDirectory: () => void;
  LS_SD_WEBUI_MODEL: string;
}

const ImageGenerationSettings: React.FC<ImageGenerationSettingsProps> = ({
  imageProvider,
  setImageProvider,
  openaiApiKey,
  setOpenaiApiKey,
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
  openaiImageModelList,
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
      <FieldLabel hint="Chat and image generation providers can be set independently.">Image Provider</FieldLabel>
      <div className="mb-4">
        <Select value={imageProvider} onChange={(e) => setImageProvider(e.target.value)}>
          {IMAGE_PROVIDER_META.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </Select>
      </div>

      {imageProvider === 'sdwebui' ? (
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
            <label className="block text-sm font-medium text-foreground">SD Model</label>
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
              <p className="text-xs text-muted-foreground">
                This passes the character image natively to inswapper to perform a highly accurate
                post-process face swap over the generated subject.
              </p>
            </div>
          )}

          {sdWebuiRefMode === 'img2img' && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
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
              <p className="text-xs text-muted-foreground mt-1">
                Make sure this model is installed in your Forge/WebUI.
              </p>
            </div>
          )}
        </div>
      ) : imageProvider === 'openai' ? (
        <div className="mb-4">
          <FieldLabel hint="Stored encrypted, only on this device.">OpenAI API Key</FieldLabel>
          <TextInput
            type="password"
            value={openaiApiKey}
            onChange={(e) => setOpenaiApiKey(e.target.value)}
            placeholder="Paste your API key here..."
            className="mb-4"
          />

          <FieldLabel hint="Used when &quot;send pic&quot; or similar is queried.">Image Generation Model</FieldLabel>
          <Select value={imageModel} onChange={(e) => setImageModel(e.target.value)} className="mb-4">
            {openaiImageModelList.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </Select>
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
        <div className="flex items-center justify-between bg-background p-3 rounded-xl border border-border mb-2">
          <span className="text-foreground text-sm truncate pr-2">
            {imageSaveDirName}
          </span>
          <button
            onClick={handleSelectDirectory}
            className="px-3 py-1.5 bg-primary text-onAccent text-sm rounded-lg hover:bg-primary-hover transition whitespace-nowrap"
          >
            Select Folder
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Note: Browsers may prompt you to re-approve write permissions to this folder when resuming
          the app.
        </p>
      </div>
    </>
  );
};

export default ImageGenerationSettings;
