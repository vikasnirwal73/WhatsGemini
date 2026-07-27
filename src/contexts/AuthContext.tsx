import React, { createContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { getProviderApiKey, saveProviderApiKey, clearProviderApiKey } from "../features/ai/utils/settings";
import { CHAT_PROVIDERS } from "../features/ai/providers/registry";

interface AuthContextType {
  // Whether the currently selected chat provider is ready to use - true
  // immediately for keyless providers (Ollama), otherwise once a key is on file.
  isConfigured: boolean;
  authChecked: boolean;
  chatProvider: string;
  saveApiKey: (key: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  isConfigured: false,
  authChecked: false,
  chatProvider: "gemini",
  saveApiKey: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const chatProvider = useSelector((state: RootState) => state.settings.chatProvider);
  const [isConfigured, setIsConfigured] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Re-checks whenever the selected chat provider changes - a keyless provider
  // (Ollama) is always "configured", everything else needs a key on file.
  useEffect(() => {
    let cancelled = false;
    setAuthChecked(false);
    (async () => {
      const capabilities = CHAT_PROVIDERS[chatProvider]?.capabilities;
      if (capabilities && !capabilities.requiresApiKey) {
        if (!cancelled) {
          setIsConfigured(true);
          setAuthChecked(true);
        }
        return;
      }
      try {
        const key = await getProviderApiKey(chatProvider);
        if (!cancelled) setIsConfigured(!!key);
      } catch (error) {
        console.error("Error checking provider API key:", error);
        if (!cancelled) setIsConfigured(false);
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chatProvider]);

  const saveApiKey = useCallback(async (key: string) => {
    try {
      await saveProviderApiKey(chatProvider, key);
      setIsConfigured(true);
    } catch (error) {
      console.error("Error saving API key:", error);
    }
  }, [chatProvider]);

  const logout = useCallback(() => {
    try {
      clearProviderApiKey(chatProvider);
      setIsConfigured(false);
    } catch (error) {
      console.error("Error clearing API key:", error);
    }
  }, [chatProvider]);

  return (
    <AuthContext.Provider value={{ isConfigured, authChecked, chatProvider, saveApiKey, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
