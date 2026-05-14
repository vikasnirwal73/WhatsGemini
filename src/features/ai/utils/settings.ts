import { LS_GOOGLE_API_KEY, LS_INITIAL_MESSAGES } from "../../../utils/constants";
import { AISafetySettings } from "../../../types";

// Helper function to get values from localStorage with fallbacks
export const getStoredValue = <T>(key: string, defaultValue: T, parser: (val: string) => any = (val) => val): T => {
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue !== null ? parser(storedValue) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const getInitialMessages = (): any[] => {
  try {
    return JSON.parse(localStorage.getItem(LS_INITIAL_MESSAGES) || "[]");
  } catch (error) {
    console.error("Error parsing initial messages from localStorage:", error);
    return [];
  }
};

export const getAPIKey = (): string | null => getStoredValue<string | null>(LS_GOOGLE_API_KEY, null);

// Format safety settings into the required API format
export const formatSafetySettings = (settings: AISafetySettings | any) => [
  {
    category: "HARM_CATEGORY_HARASSMENT",
    threshold: settings.harassment || "BLOCK_NONE",
  },
  {
    category: "HARM_CATEGORY_HATE_SPEECH",
    threshold: settings.hate_speech || "BLOCK_NONE",
  },
  {
    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    threshold: settings.sexual || "BLOCK_NONE",
  },
  {
    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
    threshold: settings.dangerous || "BLOCK_NONE",
  },
];
