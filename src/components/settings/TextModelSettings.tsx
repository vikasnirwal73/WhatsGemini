import React from 'react';
import { TextInput, Select, FieldLabel, Slider } from '../ui/FormControls';
import { CHAT_PROVIDER_META } from '../../features/ai/providers/registry';
import { ProviderCapabilities } from '../../features/ai/providers/types';

interface TextModelSettingsProps {
  temperature: number;
  setTemperature: (temp: number) => void;
  chatProvider: string;
  setChatProvider: (provider: string) => void;
  chatProviderCapabilities: ProviderCapabilities;
  providerApiKey: string;
  setProviderApiKey: (key: string) => void;
  ollamaBaseUrl: string;
  setOllamaBaseUrl: (url: string) => void;
  ollamaModels: string[];
  fetchOllamaModels: () => void;
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
  chatProvider,
  setChatProvider,
  chatProviderCapabilities,
  providerApiKey,
  setProviderApiKey,
  ollamaBaseUrl,
  setOllamaBaseUrl,
  ollamaModels,
  fetchOllamaModels,
  selectedModel,
  setSelectedModel,
  modelList,
  maxOutputTokens,
  setMaxOutputTokens,
  compressThreshold,
  setCompressThreshold,
}) => {
  const isOllama = chatProviderCapabilities.requiresBaseUrl;

  return (
    <>
      <FieldLabel hint="Chat and image generation providers can be set independently.">Chat Provider</FieldLabel>
      <div className="mb-6">
        <Select value={chatProvider} onChange={(e) => setChatProvider(e.target.value)}>
          {CHAT_PROVIDER_META.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </Select>
      </div>

      {chatProviderCapabilities.requiresApiKey && (
        <div className="mb-6">
          <FieldLabel hint="Stored encrypted, only on this device.">API Key</FieldLabel>
          <TextInput
            type="password"
            value={providerApiKey}
            onChange={(e) => setProviderApiKey(e.target.value)}
            placeholder="Paste your API key here..."
          />
        </div>
      )}

      {isOllama && (
        <div className="mb-6">
          <FieldLabel hint="Ollama's OpenAI-compatible endpoint - no API key needed for a local install.">Ollama Server URL</FieldLabel>
          <TextInput
            type="text"
            value={ollamaBaseUrl}
            onChange={(e) => setOllamaBaseUrl(e.target.value)}
            placeholder="http://localhost:11434/v1"
          />
        </div>
      )}

      <div className="mb-6">
        <div className="flex justify-between text-sm text-ink-muted mb-2">
          <span>Creativity</span>
          <span className="font-mono text-xs">{temperature.toFixed(1)}</span>
        </div>
        <Slider value={temperature} min={0} max={1} step={0.1} onChange={setTemperature} />
        <div className="flex justify-between text-xs text-ink-muted mt-2">
          <span>Precise</span>
          <span>Creative</span>
        </div>
      </div>

      {isOllama ? (
        <>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-sm font-medium text-ink">Text Generation Model</label>
            <button
              type="button"
              onClick={fetchOllamaModels}
              className="text-xs text-primary hover:text-primary-hover"
            >
              Fetch installed models
            </button>
          </div>
          <TextInput
            type="text"
            list="ollama-model-options"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            placeholder="e.g. llama3.1"
            className="mb-6"
          />
          <datalist id="ollama-model-options">
            {ollamaModels.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </>
      ) : (
        <>
          <FieldLabel>Text Generation Model</FieldLabel>
          <div className="mb-6">
            <Select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
              {modelList.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </Select>
          </div>
        </>
      )}

      <FieldLabel>Max Output Tokens</FieldLabel>
      <TextInput
        type="number"
        value={maxOutputTokens}
        onChange={(e) => setMaxOutputTokens(Number(e.target.value))}
        className="mb-6"
        min="1"
      />

      <FieldLabel hint="If history length exceeds this, older messages will be summarized to save tokens. (0 means disabled)">
        Auto-Compress History Threshold
      </FieldLabel>
      <TextInput
        type="number"
        min="0"
        value={compressThreshold}
        onChange={(e) => setCompressThreshold(Number(e.target.value))}
        placeholder="0 to disable"
      />
    </>
  );
};

export default TextModelSettings;
