import { HarmCategory, HarmBlockThreshold, SafetySetting } from "@google/genai";
import { LS_GOOGLE_API_KEY, LS_INITIAL_MESSAGES } from "../../../utils/constants";
import { AISafetySettings, InitialMessage } from "../../../types";

// Helper function to get values from localStorage with fallbacks
export const getStoredValue = <T>(key: string, defaultValue: T, parser: (val: string) => T = (val) => val as unknown as T): T => {
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue !== null ? parser(storedValue) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const getInitialMessages = (): InitialMessage[] => {
  try {
    return JSON.parse(localStorage.getItem(LS_INITIAL_MESSAGES) || "[]");
  } catch (error) {
    console.error("Error parsing initial messages from localStorage:", error);
    return [];
  }
};

export const getAPIKey = (): string | null => getStoredValue<string | null>(LS_GOOGLE_API_KEY, null);

// Format safety settings into the required API format
export const formatSafetySettings = (settings: AISafetySettings): SafetySetting[] => [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: (settings.harassment || "BLOCK_NONE") as HarmBlockThreshold,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: (settings.hate_speech || "BLOCK_NONE") as HarmBlockThreshold,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: (settings.sexual || "BLOCK_NONE") as HarmBlockThreshold,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: (settings.dangerous || "BLOCK_NONE") as HarmBlockThreshold,
  },
];
