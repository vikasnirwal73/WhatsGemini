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
import { AISafetySettings } from "../types";

// Helper function to get values from localStorage with fallbacks
const getStoredValue = <T>(key: string, defaultValue: T, parser: (val: string) => any = (val) => val): T => {
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue !== null ? parser(storedValue) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const getInitialMessages = (): any[] => {
  try {
    return JSON.parse(localStorage.getItem(LS_INITIAL_MESSAGES) || "[]");
  } catch (error) {
    console.error("Error parsing initial messages from localStorage:", error);
    return [];
  }
};

const getAPIKey = (): string | null => getStoredValue<string | null>(LS_GOOGLE_API_KEY, null);

// Format safety settings into the required API format
const formatSafetySettings = (settings: AISafetySettings | any) => [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold[settings.harassment as keyof typeof HarmBlockThreshold] || HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold[settings.hate_speech as keyof typeof HarmBlockThreshold] || HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold[settings.sexual as keyof typeof HarmBlockThreshold] || HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold[settings.dangerous as keyof typeof HarmBlockThreshold] || HarmBlockThreshold.BLOCK_NONE,
  },
];

// Async Thunk for generating AI response
export const generateAIResponse = createAsyncThunk(
  "ai/generateResponse",
  async ({ prompt, history = [], systemInstruction }: { prompt: string; history?: any[], systemInstruction?: string }, { rejectWithValue, signal }) => {
    try {
      const apiKey = getAPIKey();
      if (!apiKey) throw new Error("API key is missing. Please log in.");
      const maxHistoryLength = parseInt(localStorage.getItem(LS_MAX_CHAT_LENGTH) || "0", 10);
      const selectedModel = getStoredValue(LS_AI_MODEL, DEFAULT_AI_MODEL);
      const maxTokens = getStoredValue(LS_MAX_OUTPUT_TOKENS, DEFAULT_OUTPUT_TOKENS, Number);
      const temperature = getStoredValue(LS_TEMPRATURE, DEFAULT_TEMPRATURE, parseFloat);
      const storedSafetySettings = getStoredValue<AISafetySettings | any>(
        LS_SAFETY_SETTINGS,
        DEFAULT_SAFETY_SETTINGS,
        JSON.parse
      );

      const safetySettings = formatSafetySettings(storedSafetySettings);
      const genAI = new GoogleGenerativeAI(apiKey);
      const modelParams: any = {
        model: selectedModel,
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: temperature,
        },
        safetySettings: safetySettings,
      };

      if (systemInstruction) {
        modelParams.systemInstruction = systemInstruction;
      }

      const model = genAI.getGenerativeModel(modelParams);

      // Filter out empty messages
      const validHistory = history.filter(
        (msg) => msg?.parts?.[0]?.text && msg.role
      );

      // If the last message in history is the same as the prompt, remove it to avoid duplication
      if (
        validHistory.length > 0 &&
        validHistory[validHistory.length - 1].role === "user" &&
        validHistory[validHistory.length - 1].parts[0].text === prompt
      ) {
        validHistory.pop();
      }
      
      if (maxHistoryLength > 0) {
        const initialMessages = getInitialMessages();
        const initialMessagesLength = initialMessages.length || 0;
        const maxLength = validHistory.length - maxHistoryLength;
        if (maxLength > 0) {
           const startIndex = initialMessagesLength > 0 ? initialMessagesLength : 1;
           if (startIndex < validHistory.length) {
              validHistory.splice(startIndex, maxLength);
           }
        }
      }

      const historyForSdk = validHistory.slice(0, -1);

      // Defensively start chat session and get response
      const chat = await model.startChat({ history: historyForSdk });
      const stream = await chat.sendMessageStream(prompt);
      
      let response = "";
      for await (const chunk of stream.stream) {
        if (signal.aborted) {
          console.log("AI response generation aborted by user.");
          break;
        }
        try {
          const chunkText = chunk.text();
          if (chunkText) {
            response += chunkText;
          }
        } catch (e) {
          console.warn("Could not parse text chunk:", e);
        }
      }

      return response.trim();
    } catch (error: any) {
      console.error("AI Response Error:", error);
      return rejectWithValue(error.message || "An unexpected error occurred.");
    }
  }
);

interface AIState {
  response: string;
  loading: boolean;
  error: string | null;
  tokenCount: number;
  costEstimate: number;
}

const initialState: AIState = {
  response: "",
  loading: false,
  error: null,
  tokenCount: 0,
  costEstimate: 0,
};

// Async Thunk for calculating token count and cost
export const calculateTokenCount = createAsyncThunk(
  "ai/calculateTokenCount",
  async ({ history = [], systemInstruction }: { history?: any[], systemInstruction?: string }, { rejectWithValue }) => {
    try {
      const apiKey = getAPIKey();
      if (!apiKey) throw new Error("API key is missing.");
      const selectedModel = getStoredValue(LS_AI_MODEL, DEFAULT_AI_MODEL);

      const genAI = new GoogleGenerativeAI(apiKey);
      const modelParams: any = { model: selectedModel };
      
      if (systemInstruction) {
        modelParams.systemInstruction = systemInstruction;
      }

      const model = genAI.getGenerativeModel(modelParams);

      // Filter out empty messages
      const validHistory = history.filter(
        (msg) => msg?.parts?.[0]?.text && msg.role
      );

      if (validHistory.length === 0) {
        return { tokenCount: 0, costEstimate: 0 };
      }

      // Count tokens
      const { totalTokens } = await model.countTokens({ contents: validHistory });
      
      // Rough cost estimate (using Gemini 1.5 Flash pricing as example: $0.075 / 1M tokens)
      // Note: Pricing varies by model, this is just a subtle indicator.
      let costPerMillion = 0.075; 
      if (selectedModel.includes("pro")) {
        costPerMillion = 1.25; // Example Pro pricing
      }
      
      const costEstimate = (totalTokens / 1_000_000) * costPerMillion;

      return { tokenCount: totalTokens, costEstimate };
    } catch (error: any) {
      // Don't crash the app for token counting failure
      return { tokenCount: 0, costEstimate: 0 };
    }
  }
);

// AI Slice
const aiSlice = createSlice({
  name: AI,
  initialState,
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
        state.response = action.payload as string;
      })
      .addCase(generateAIResponse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(calculateTokenCount.fulfilled, (state, action) => {
        state.tokenCount = action.payload.tokenCount;
        state.costEstimate = action.payload.costEstimate;
      });
  },
});

export const { clearResponse } = aiSlice.actions;
export default aiSlice.reducer;
