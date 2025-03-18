import { API_KEY_STORAGE_KEY } from "./constants";

// Save API Key
export const saveApiKey = (apiKey) => {
  try {
    if (!apiKey || typeof apiKey !== "string") {
      throw new Error("Invalid API key");
    }
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  } catch (error) {
    console.error("Error saving API key:", error);
  }
};

// Retrieve API Key
export const getApiKey = () => {
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || null;
  } catch (error) {
    console.error("Error retrieving API key:", error);
    return null; // Fallback to prevent crashes
  }
};

// Remove API Key (for logout)
export const removeApiKey = () => {
  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  } catch (error) {
    console.error("Error removing API key:", error);
  }
};
