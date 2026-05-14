import { configureStore } from "@reduxjs/toolkit";
import chatReducer from "../features/chatSlice";
import characterReducer from "../features/characterSlice";
import aiReducer from "../features/aiSlice";
import settingsReducer from "../features/settingsSlice";
import {
  LS_AI_MODEL,
  LS_MAX_CHAT_LENGTH,
  LS_MAX_OUTPUT_TOKENS,
  LS_SAFETY_SETTINGS,
  LS_TEMPRATURE,
  LS_FONT_SIZE,
  LS_USER_PROFILE,
  LS_IMAGE_RESOLUTION,
  LS_IMAGE_MODEL,
  LS_IMAGE_GEN_PROMPT,
  LS_USE_SD_WEBUI,
  LS_SD_WEBUI_API_URL,
  LS_SD_WEBUI_BATCH_SIZE,
  LS_SD_WEBUI_REF_MODE,
  LS_SD_WEBUI_DENOISING,
  LS_SD_WEBUI_CONTROLNET_MODEL,
  LS_SD_WEBUI_MODELS,
  LS_SD_WEBUI_MODEL,
  LS_COMPRESS_THRESHOLD,
} from "../utils/constants";

// Configure Redux Store
export const store = configureStore({
  reducer: {
    chat: chatReducer,
    character: characterReducer,
    ai: aiReducer,
    settings: settingsReducer,
  },
  devTools: process.env.NODE_ENV !== "production", // Enable Redux DevTools in development
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Subscribe to store changes to sync settings to localStorage
store.subscribe(() => {
  const state = store.getState().settings;
  localStorage.setItem(LS_USER_PROFILE, JSON.stringify(state.userProfile));
  localStorage.setItem(LS_AI_MODEL, state.selectedModel);
  localStorage.setItem(LS_IMAGE_MODEL, state.imageModel);
  localStorage.setItem(LS_IMAGE_GEN_PROMPT, state.imageGenPrompt);
  localStorage.setItem(LS_USE_SD_WEBUI, state.useSdWebui.toString());
  localStorage.setItem(LS_SD_WEBUI_API_URL, state.sdWebuiApiUrl);
  localStorage.setItem(LS_SD_WEBUI_BATCH_SIZE, state.sdWebuiBatchSize.toString());
  localStorage.setItem(LS_SD_WEBUI_REF_MODE, state.sdWebuiRefMode);
  localStorage.setItem(LS_SD_WEBUI_DENOISING, state.sdWebuiDenoising.toString());
  localStorage.setItem(LS_SD_WEBUI_CONTROLNET_MODEL, state.sdWebuiControlnetModel);
  localStorage.setItem(LS_SD_WEBUI_MODELS, JSON.stringify(state.sdWebuiModels));
  localStorage.setItem(LS_SD_WEBUI_MODEL, state.sdWebuiModel);
  localStorage.setItem(LS_MAX_OUTPUT_TOKENS, JSON.stringify(state.maxOutputTokens));
  localStorage.setItem(LS_COMPRESS_THRESHOLD, JSON.stringify(state.compressThreshold));
  localStorage.setItem(LS_MAX_CHAT_LENGTH, JSON.stringify(state.maxChatLength));
  localStorage.setItem(LS_TEMPRATURE, JSON.stringify(state.temperature));
  localStorage.setItem(LS_SAFETY_SETTINGS, JSON.stringify(state.safetySettings));
  localStorage.setItem(LS_FONT_SIZE, state.fontSize);
  localStorage.setItem(LS_IMAGE_RESOLUTION, state.imageResolution);
});

// Debug Logging (Only in Development)
if (process.env.NODE_ENV === "development") {
  store.subscribe(() => {
    console.debug("Updated Redux State:", store.getState());
  });
}

export default store;
