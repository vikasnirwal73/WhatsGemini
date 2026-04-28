import React, { createContext, useState, useEffect, useCallback, ReactNode } from "react";
import { DARK, LIGHT, LS_THEME } from "../utils/constants";

interface ThemeContextType {
  theme: string;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: DARK,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Lazy initialization to prevent unnecessary localStorage reads
  const getStoredTheme = () => {
    try {
      return localStorage.getItem(LS_THEME) || DARK;
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      return DARK; // Default theme fallback
    }
  };

  const [theme, setTheme] = useState<string>(getStoredTheme);

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
