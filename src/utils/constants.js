export const YOU = "you";
export const AI = "ai";
export const MODEL = "model";
export const USER = "user";
export const DB_NAME = "ChatAppDB";
export const CHARACTER = "character";
export const DEFAULT_TEMPRATURE = 0.7;
export const DEFAULT_OUTPUT_TOKENS = 1000;
export const DEFAULT_AI_MODEL = "gemini-1.5-pro";
export const harmThresholds = [
    { label: "None", value: "BLOCK_NONE" },
    { label: "Low", value: "BLOCK_LOW_AND_ABOVE" },
    { label: "Medium", value: "BLOCK_MEDIUM_AND_ABOVE" },
    { label: "High", value: "BLOCK_ONLY_HIGH" },
  ];
export const DEFAULT_SAFETY_SETTINGS = {
    harassment: "BLOCK_NONE",
    hate_speech: "BLOCK_NONE",
    sexual: "BLOCK_NONE",
    dangerous: "BLOCK_NONE",
};
export const models = [
  "gemini-1.5-pro", 
  "gemini-1.5-flash", 
  "gemini-1.5-flash-8b",
  "gemini-1.0-pro",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-pro-exp-02-05",
  "gemini-2.0-flash-exp-image-generation",
];
export const ROLE = "role";
export const MESSAGE = "message";
export const LIGHT = "light";
export const DARK = "dark";

// Local storage variables
export const LS_AI_MODEL = "ai_model";
export const LS_MAX_OUTPUT_TOKENS = "max_output_tokens";
export const LS_TEMPRATURE = "temperature";
export const LS_SAFETY_SETTINGS = "safety_settings";
export const LS_INITIAL_CHAT_MESSAGE = "initial_chat_message";
export const LS_GOOGLE_API_KEY = "google_api_key";
export const LS_THEME = "theme";
export const LS_INITIAL_MESSAGES = "initial_messages";
export const API_KEY_STORAGE_KEY = "genAI_api_key";