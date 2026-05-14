import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  DEFAULT_CHAT_LENGTH,
  DEFAULT_OUTPUT_TOKENS,
  DEFAULT_SAFETY_SETTINGS,
  DEFAULT_TEMPRATURE,
  LS_AI_MODEL,
  LS_MAX_CHAT_LENGTH,
  LS_MAX_OUTPUT_TOKENS,
  LS_SAFETY_SETTINGS,
  LS_TEMPRATURE,
  LS_FONT_SIZE,
  LS_USER_PROFILE,
  LS_IMAGE_RESOLUTION,
  DEFAULT_IMAGE_RESOLUTION,
  LS_IMAGE_MODEL,
  DEFAULT_IMAGE_MODEL,
  LS_IMAGE_GEN_PROMPT,
  DEFAULT_IMAGE_GEN_PROMPT,
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
  LS_COMPRESS_THRESHOLD,
  DEFAULT_COMPRESS_THRESHOLD,
  models,
} from '../utils/constants';
import { AISafetySettings, UserProfile } from '../types';

const getStoredValue = <T>(key: string, defaultValue: T): T => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export interface SettingsState {
  userProfile: UserProfile;
  selectedModel: string;
  imageModel: string;
  imageGenPrompt: string;
  useSdWebui: boolean;
  sdWebuiApiUrl: string;
  sdWebuiBatchSize: number;
  sdWebuiRefMode: string;
  sdWebuiDenoising: number;
  sdWebuiControlnetModel: string;
  sdWebuiModels: { title: string; model_name: string }[];
  sdWebuiModel: string;
  maxOutputTokens: number;
  compressThreshold: number;
  maxChatLength: number;
  temperature: number;
  safetySettings: AISafetySettings;
  fontSize: string;
  imageResolution: string;
}

const initialState: SettingsState = {
  userProfile: getStoredValue<UserProfile>(LS_USER_PROFILE, { name: '', bio: '' }),
  selectedModel: localStorage.getItem(LS_AI_MODEL) || models[0],
  imageModel: localStorage.getItem(LS_IMAGE_MODEL) || DEFAULT_IMAGE_MODEL,
  imageGenPrompt: localStorage.getItem(LS_IMAGE_GEN_PROMPT) || DEFAULT_IMAGE_GEN_PROMPT,
  useSdWebui: localStorage.getItem(LS_USE_SD_WEBUI) === 'true',
  sdWebuiApiUrl: localStorage.getItem(LS_SD_WEBUI_API_URL) || DEFAULT_SD_WEBUI_API_URL,
  sdWebuiBatchSize: parseInt(localStorage.getItem(LS_SD_WEBUI_BATCH_SIZE) || '1', 10) || DEFAULT_SD_WEBUI_BATCH_SIZE,
  sdWebuiRefMode: localStorage.getItem(LS_SD_WEBUI_REF_MODE) || DEFAULT_SD_WEBUI_REF_MODE,
  sdWebuiDenoising: parseFloat(localStorage.getItem(LS_SD_WEBUI_DENOISING) || String(DEFAULT_SD_WEBUI_DENOISING)),
  sdWebuiControlnetModel: localStorage.getItem(LS_SD_WEBUI_CONTROLNET_MODEL) || DEFAULT_SD_WEBUI_CONTROLNET_MODEL,
  sdWebuiModels: getStoredValue(LS_SD_WEBUI_MODELS, []),
  sdWebuiModel: localStorage.getItem(LS_SD_WEBUI_MODEL) || DEFAULT_SD_WEBUI_MODEL,
  maxOutputTokens: getStoredValue(LS_MAX_OUTPUT_TOKENS, DEFAULT_OUTPUT_TOKENS),
  compressThreshold: getStoredValue(LS_COMPRESS_THRESHOLD, DEFAULT_COMPRESS_THRESHOLD),
  maxChatLength: getStoredValue(LS_MAX_CHAT_LENGTH, DEFAULT_CHAT_LENGTH),
  temperature: getStoredValue(LS_TEMPRATURE, DEFAULT_TEMPRATURE),
  safetySettings: getStoredValue(LS_SAFETY_SETTINGS, DEFAULT_SAFETY_SETTINGS as unknown as AISafetySettings),
  fontSize: localStorage.getItem(LS_FONT_SIZE) || '16px',
  imageResolution: localStorage.getItem(LS_IMAGE_RESOLUTION) || DEFAULT_IMAGE_RESOLUTION,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setUserProfile: (state, action: PayloadAction<UserProfile>) => {
      state.userProfile = action.payload;
    },
    setSelectedModel: (state, action: PayloadAction<string>) => {
      state.selectedModel = action.payload;
    },
    setImageModel: (state, action: PayloadAction<string>) => {
      state.imageModel = action.payload;
    },
    setImageGenPrompt: (state, action: PayloadAction<string>) => {
      state.imageGenPrompt = action.payload;
    },
    setUseSdWebui: (state, action: PayloadAction<boolean>) => {
      state.useSdWebui = action.payload;
    },
    setSdWebuiApiUrl: (state, action: PayloadAction<string>) => {
      state.sdWebuiApiUrl = action.payload;
    },
    setSdWebuiBatchSize: (state, action: PayloadAction<number>) => {
      state.sdWebuiBatchSize = action.payload;
    },
    setSdWebuiRefMode: (state, action: PayloadAction<string>) => {
      state.sdWebuiRefMode = action.payload;
    },
    setSdWebuiDenoising: (state, action: PayloadAction<number>) => {
      state.sdWebuiDenoising = action.payload;
    },
    setSdWebuiControlnetModel: (state, action: PayloadAction<string>) => {
      state.sdWebuiControlnetModel = action.payload;
    },
    setSdWebuiModels: (state, action: PayloadAction<{ title: string; model_name: string }[]>) => {
      state.sdWebuiModels = action.payload;
    },
    setSdWebuiModel: (state, action: PayloadAction<string>) => {
      state.sdWebuiModel = action.payload;
    },
    setMaxOutputTokens: (state, action: PayloadAction<number>) => {
      state.maxOutputTokens = action.payload;
    },
    setCompressThreshold: (state, action: PayloadAction<number>) => {
      state.compressThreshold = action.payload;
    },
    setMaxChatLength: (state, action: PayloadAction<number>) => {
      state.maxChatLength = action.payload;
    },
    setTemperature: (state, action: PayloadAction<number>) => {
      state.temperature = action.payload;
    },
    setSafetySettings: (state, action: PayloadAction<AISafetySettings>) => {
      state.safetySettings = action.payload;
    },
    setFontSize: (state, action: PayloadAction<string>) => {
      state.fontSize = action.payload;
    },
    setImageResolution: (state, action: PayloadAction<string>) => {
      state.imageResolution = action.payload;
    },
  },
});

export const {
  setUserProfile,
  setSelectedModel,
  setImageModel,
  setImageGenPrompt,
  setUseSdWebui,
  setSdWebuiApiUrl,
  setSdWebuiBatchSize,
  setSdWebuiRefMode,
  setSdWebuiDenoising,
  setSdWebuiControlnetModel,
  setSdWebuiModels,
  setSdWebuiModel,
  setMaxOutputTokens,
  setCompressThreshold,
  setMaxChatLength,
  setTemperature,
  setSafetySettings,
  setFontSize,
  setImageResolution,
} = settingsSlice.actions;

export default settingsSlice.reducer;
