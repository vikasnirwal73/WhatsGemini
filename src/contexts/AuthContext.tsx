import React, { createContext, useState, useEffect, useCallback, ReactNode } from "react";
import { LS_GOOGLE_API_KEY } from "../utils/constants";
import { encryptApiKey, decryptApiKey } from "../utils/secureApiKeyStorage";

interface AuthContextType {
  apiKey: string | null;
  authChecked: boolean;
  saveApiKey: (key: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  apiKey: null,
  authChecked: false,
  saveApiKey: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Decrypt the stored key once on mount. A value that fails to decrypt is
  // treated as a legacy plaintext key from before encryption-at-rest was
  // added, and is transparently re-saved in encrypted form.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = localStorage.getItem(LS_GOOGLE_API_KEY);
        if (!stored) return;
        try {
          const decrypted = await decryptApiKey(stored);
          if (!cancelled) setApiKey(decrypted);
        } catch {
          const encrypted = await encryptApiKey(stored);
          localStorage.setItem(LS_GOOGLE_API_KEY, encrypted);
          if (!cancelled) setApiKey(stored);
        }
      } catch (error) {
        console.error("Error accessing localStorage:", error);
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Memoized function to save API key
  const saveApiKey = useCallback(async (key: string) => {
    try {
      const encrypted = await encryptApiKey(key);
      localStorage.setItem(LS_GOOGLE_API_KEY, encrypted);
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
    <AuthContext.Provider value={{ apiKey, authChecked, saveApiKey, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
