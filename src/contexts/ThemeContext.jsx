import React, { createContext, useState, useEffect, useCallback } from "react";
import { DARK, LIGHT, LS_THEME } from "../utils/constants";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Lazy initialization to prevent unnecessary localStorage reads
  const getStoredTheme = () => {
    try {
      return localStorage.getItem(LS_THEME) || DARK;
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      return DARK; // Default theme fallback
    }
  };

  const [theme, setTheme] = useState(getStoredTheme);

  useEffect(() => {
    try {
      document.documentElement.classList.toggle(DARK, theme === DARK);
      document.documentElement.classList.toggle(LIGHT, theme === LIGHT);
      localStorage.setItem(LS_THEME, theme);
    } catch (error) {
      console.error("Error saving theme to localStorage:", error);
    }
  }, [theme]);

  // Memoized theme toggle function
  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => (prevTheme === LIGHT ? DARK : LIGHT));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
