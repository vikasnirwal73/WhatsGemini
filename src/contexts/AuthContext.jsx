import React, { createContext, useState, useEffect, useCallback } from "react";
import { LS_GOOGLE_API_KEY } from "../utils/constants";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Lazy initialization to prevent unnecessary localStorage reads
  const getStoredApiKey = () => {
    try {
      return localStorage.getItem(LS_GOOGLE_API_KEY) || null;
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      return null;
    }
  };

  const [apiKey, setApiKey] = useState(getStoredApiKey);

  // Save API key to localStorage when it changes
  useEffect(() => {
    if (apiKey) {
      try {
        localStorage.setItem(LS_GOOGLE_API_KEY, apiKey);
      } catch (error) {
        console.error("Error saving API key to localStorage:", error);
      }
    }
  }, [apiKey]);

  // Memoized function to save API key
  const saveApiKey = useCallback((key) => {
    try {
      localStorage.setItem(LS_GOOGLE_API_KEY, key);
      setApiKey(key);
    } catch (error) {
      console.error("Error saving API key:", error);
    }
  }, []);

  // Logout function to clear API key
  const logout = useCallback(() => {
    try {
      localStorage.removeItem(LS_GOOGLE_API_KEY);
      setApiKey(null);
    } catch (error) {
      console.error("Error clearing API key:", error);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ apiKey, saveApiKey, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
