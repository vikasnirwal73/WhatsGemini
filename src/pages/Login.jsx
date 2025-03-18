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
    <div className="flex items-center justify-center h-screen bg-[#eae6df] dark:bg-[#0d1418]">
      <div className="bg-white dark:bg-[#202c33] p-6 rounded-lg shadow-md w-96 max-w-[calc(100%-30px)]">
        <h2 className="text-lg font-semibold text-center text-[#008069] dark:text-[#25D366] mb-4">
          Enter Google API Key
        </h2>

        {/* Error Message */}
        {error && <p className="text-red-500 text-sm text-center mb-3">{error}</p>}

        <input
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Enter your API Key..."
          className="w-full p-3 bg-[#f0f2f5] dark:bg-[#2a3942] text-black dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 outline-none mb-3"
        />

        <button
          onClick={handleLogin}
          className="w-full p-3 bg-[#25D366] text-white rounded-lg shadow-md hover:bg-[#1db954] transition"
          disabled={loading || !key.trim()}
        >
          {loading ? "Saving..." : "Save & Continue"}
        </button>
      </div>
    </div>
  );
};

export default Login;
