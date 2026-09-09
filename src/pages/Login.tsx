import React, { useState, useContext, useCallback } from "react";
import { useSelector } from "react-redux";
import { AuthContext } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { FaExternalLinkAlt, FaLock } from "react-icons/fa";
import Logo from "../components/ui/Logo";
import { TextInput, Select } from "../components/ui/FormControls";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useAppDispatch } from "../store/hooks";
import { RootState } from "../store/store";
import { setChatProvider, setOllamaBaseUrl } from "../features/settingsSlice";
import { CHAT_PROVIDER_META, CHAT_PROVIDERS } from "../features/ai/providers/registry";

const Login = () => {
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { saveApiKey, isConfigured, authChecked, chatProvider } = useContext(AuthContext);
  const dispatch = useAppDispatch();
  const ollamaBaseUrl = useSelector((state: RootState) => state.settings.ollamaBaseUrl);
  const capabilities = CHAT_PROVIDERS[chatProvider]?.capabilities;

  const handleLogin = useCallback(async () => {
    setError(null);

    if (!key.trim()) {
      setError("API key is required.");
      return;
    }

    setLoading(true);

    try {
      await saveApiKey(key);
    } catch (err) {
      console.error("Error saving API key:", err);
      setError("Failed to save API key. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [key, saveApiKey]);

  if (!authChecked) {
    return null;
  }

  if (isConfigured) {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <Card className="p-8 w-96 max-w-[calc(100%-30px)]">
        <Logo size={48} className="shadow-lg shadow-primary/30 rounded-[13px] mx-auto mb-5 block" />
        <h2 className="text-xl font-bold text-center text-foreground mb-1.5">
          Welcome to WhatsGemini
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Chat with characters powered by your choice of AI provider.
        </p>

        <label className="block text-sm font-medium text-foreground mb-1.5">AI Provider</label>
        <Select
          value={chatProvider}
          onChange={(e) => dispatch(setChatProvider(e.target.value))}
          className="mb-4"
        >
          {CHAT_PROVIDER_META.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </Select>

        {chatProvider === "gemini" && (
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-[13px] text-primary font-medium hover:underline mb-4"
          >
            Get a free API key from Google AI Studio
            <FaExternalLinkAlt size={10} />
          </a>
        )}

        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

        {capabilities?.requiresBaseUrl ? (
          <>
            <label className="block text-sm font-medium text-foreground mb-1.5">Ollama Server URL</label>
            <TextInput
              type="text"
              value={ollamaBaseUrl}
              onChange={(e) => dispatch(setOllamaBaseUrl(e.target.value))}
              placeholder="http://localhost:11434/v1"
              className="mb-2"
            />
            <p className="text-xs text-ink-faint mb-4">
              No API key needed for a local Ollama install - you'll be taken straight in.
            </p>
          </>
        ) : (
          <>
            <TextInput
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Paste your API key here..."
              className="mb-2"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />

            <p className="flex items-center gap-1.5 text-[11.5px] text-ink-faint mb-4">
              <FaLock size={9} className="flex-shrink-0" />
              Stored encrypted, only on this device - never sent anywhere but the provider's API.
            </p>

            <Button
              onClick={handleLogin}
              size="lg"
              className="w-full shadow-lg transition-all hover:scale-[1.02]"
              disabled={loading || !key.trim()}
            >
              {loading ? "Saving..." : "Save & Continue"}
            </Button>
          </>
        )}
      </Card>
    </div>
  );
};

export default Login;
