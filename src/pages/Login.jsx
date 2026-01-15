import React, { useState, useContext, useCallback } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";

const Login = () => {
  const [key, setKey] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { saveApiKey, apiKey } = useContext(AuthContext);

  const handleLogin = useCallback(() => {
    setError(null);

    if (!key.trim()) {
      setError("API key is required.");
      return;
    }

    setLoading(true);

    try {
      saveApiKey(key);
    } catch (err) {
      console.error("Error saving API key:", err);
      setError("Failed to save API key. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [key, saveApiKey]);

  if (apiKey) {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex items-center justify-center h-screen bg-app-light dark:bg-app-dark">
      <div className="bg-panel-light dark:bg-panel-dark p-8 rounded-2xl shadow-xl w-96 max-w-[calc(100%-30px)]">
        <h2 className="text-2xl font-bold text-center text-primary dark:text-white mb-6">
          Enter Google API Key
        </h2>

        {/* Error Message */}
        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

        <input
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Enter your API Key..."
          className="w-full p-3 bg-app-light dark:bg-app-dark text-black dark:text-white rounded-xl border border-transparent focus:border-primary outline-none mb-4 transition-all"
        />

        <button
          onClick={handleLogin}
          className="w-full p-3 bg-primary text-white rounded-xl shadow-lg hover:bg-primary-hover transform hover:scale-[1.02] transition-all"
          disabled={loading || !key.trim()}
        >
          {loading ? "Saving..." : "Save & Continue"}
        </button>
      </div>
    </div>
  );
};

export default Login;
