import React from 'react';
import { TextInput, Select, FieldLabel, Slider } from '../ui/FormControls';

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
