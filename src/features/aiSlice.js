import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import {
  AI,
  DEFAULT_AI_MODEL,
  DEFAULT_OUTPUT_TOKENS,
  DEFAULT_SAFETY_SETTINGS,
  DEFAULT_TEMPRATURE,
  LS_AI_MODEL,
  LS_GOOGLE_API_KEY,
  LS_INITIAL_MESSAGES,
  LS_MAX_CHAT_LENGTH,
  LS_MAX_OUTPUT_TOKENS,
  LS_SAFETY_SETTINGS,
  LS_TEMPRATURE,
} from "../utils/constants";

// Helper function to get values from localStorage with fallbacks
const getStoredValue = (key, defaultValue, parser = (val) => val) => {
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue !== null ? parser(storedValue) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const getInitialMessages = () => {
    try {
      return JSON.parse(localStorage.getItem(LS_INITIAL_MESSAGES)) || [];
    } catch (error) {
      console.error("Error parsing initial messages from localStorage:", error);
      return [];
    }
  };

// Retrieve API Key from localStorage
const getAPIKey = () => getStoredValue(LS_GOOGLE_API_KEY, null);

// Format safety settings into the required API format
const formatSafetySettings = (settings) => [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold[settings.harassment] || HarmBlockThreshold.NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold[settings.hate_speech] || HarmBlockThreshold.NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold[settings.sexual] || HarmBlockThreshold.NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold[settings.dangerous] || HarmBlockThreshold.NONE,
  },
];

// Async Thunk for generating AI response
export const generateAIResponse = createAsyncThunk(
  "ai/generateResponse",
  async ({ prompt, history = [] }, { rejectWithValue }) => {
    try {
      const apiKey = getAPIKey();
      if (!apiKey) throw new Error("API key is missing. Please log in.");
      const maxHistoryLength = parseInt(localStorage.getItem(LS_MAX_CHAT_LENGTH) || "0", 10);
      const selectedModel = getStoredValue(LS_AI_MODEL, DEFAULT_AI_MODEL);
      const maxTokens = getStoredValue(LS_MAX_OUTPUT_TOKENS, DEFAULT_OUTPUT_TOKENS, Number);
      const temperature = getStoredValue(LS_TEMPRATURE, DEFAULT_TEMPRATURE, parseFloat);
      const storedSafetySettings = getStoredValue(
        LS_SAFETY_SETTINGS,
        DEFAULT_SAFETY_SETTINGS,
        JSON.parse
      );

      const safetySettings = formatSafetySettings(storedSafetySettings);
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: selectedModel,
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: temperature,
        },
        safetySettings: safetySettings,
      });

      // Filter out empty messages and ensure the last message is from the user
      const validHistory = history.filter(
        (msg) => msg?.parts?.[0]?.text && msg.role
      );

      if (!validHistory.length || validHistory[validHistory.length - 1].role !== "user") {
        throw new Error("Invalid chat history: Must end with a user message.");
      }
      
      if (maxHistoryLength > 0) {
        const initialMessages = getInitialMessages();
        const initialMessagesLength = initialMessages.length || 0;
        const maxLength = validHistory.length - maxHistoryLength;
        if (maxLength > 0) {
           // Keep the first message (assuming context) and remove older messages from the middle
           // But ensure we don't remove the start index if it's beyond the available bounds
           const startIndex = initialMessagesLength > 0 ? initialMessagesLength : 1;
           if (startIndex < validHistory.length) {
              validHistory.splice(startIndex, maxLength);
           }
        }
      }

      // The history passed to startChat should not contain the current prompt message,
      // as it will be sent via sendMessageStream.
      // validHistory currently ends with the user's prompt.
      const historyForSdk = validHistory.slice(0, -1);

      // Start a chat session
      const chat = await model.startChat({ history: historyForSdk });
      const stream = await chat.sendMessageStream(prompt);
      
      let response = "";
      for await (const chunk of stream.stream) {
        response += chunk.text();
      }

      return response.trim();
    } catch (error) {
      console.error("AI Response Error:", error);
      return rejectWithValue(error.message || "An unexpected error occurred.");
    }
  }
);

// AI Slice
const aiSlice = createSlice({
  name: AI,
  initialState: {
    response: "",
    loading: false,
    error: null,
  },
  reducers: {
    clearResponse: (state) => {
      state.response = "";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateAIResponse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateAIResponse.fulfilled, (state, action) => {
        state.loading = false;
        state.response = action.payload;
      })
      .addCase(generateAIResponse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearResponse } = aiSlice.actions;
export default aiSlice.reducer;
