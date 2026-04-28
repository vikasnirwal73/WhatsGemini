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
      // (This happens because it was just saved in Redux before this thunk was called)
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

      // Ensure the history passed to startChat does not end with a "user" string 
      // otherwise sendMessageStream(prompt) will result in consecutive user turns. 
      // (If it does, pop the trailing un-anwered user message).
      while (validHistory.length > 0 && validHistory[validHistory.length - 1].role === "user") {
        validHistory.pop();
      }

      const historyForSdk = validHistory;

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

      const responseData = await stream.response;
      const totalTokens = responseData?.usageMetadata?.totalTokenCount || 0;

      let costPerMillion = 0.075; 
      if (selectedModel.includes("pro")) {
        costPerMillion = 1.25; 
      }
      const costEstimate = (totalTokens / 1_000_000) * costPerMillion;

      return {
        text: response.trim(),
        tokenCount: totalTokens,
        costEstimate: costEstimate
      };
    } catch (error: any) {
      console.error("AI Response Error:", error);
      return rejectWithValue(error.message || "An unexpected error occurred.");
    }
  }
);

interface AIState {
  response: string;
  loading: boolean;
  compressing: boolean;
  error: string | null;
  tokenCount: number;
  costEstimate: number;
}

const initialState: AIState = {
  response: "",
  loading: false,
  compressing: false,
  error: null,
  tokenCount: 0,
  costEstimate: 0,
};


// Async Thunk for compressing chat history
export const compressChatHistory = createAsyncThunk(
  "ai/compressHistory",
  async ({ history = [], systemInstruction }: { history: any[], systemInstruction?: string }, { rejectWithValue }) => {
    try {
      const apiKey = getAPIKey();
      if (!apiKey) throw new Error("API key is missing. Please log in.");
      const selectedModel = getStoredValue(LS_AI_MODEL, DEFAULT_AI_MODEL);

      const genAI = new GoogleGenerativeAI(apiKey);
      const modelParams: any = {
        model: selectedModel,
      };

      if (systemInstruction) {
        modelParams.systemInstruction = {
          role: "system",
          parts: [{ text: systemInstruction }]
        };
      }

      const model = genAI.getGenerativeModel(modelParams);

      const conversationText = history
        .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.parts[0].text}`)
        .join("\n\n");

      const prompt = `Please provide a concise but comprehensive summary of the following conversation history. 
Retain all key facts, user preferences, important context, the language used (e.g., Hinglish, English), the tone, and the current emotional state of both the User and the AI. This summary will act as the AI's memory replacing the older messages.
Do not act as a conversational partner, just provide the summary directly. Ensure you explicitly note the language format, tone, and emotional context so the AI can seamlessly resume in the exact same style and mood.

Conversation:
${conversationText}`;

      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error: any) {
      console.error("AI Compress Error:", error);
      return rejectWithValue(error.message || "Failed to compress history.");
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
        state.response = action.payload.text;
        state.tokenCount = action.payload.tokenCount;
        state.costEstimate = action.payload.costEstimate;
      })
      .addCase(generateAIResponse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(compressChatHistory.pending, (state) => {
        state.compressing = true;
        state.error = null;
      })
      .addCase(compressChatHistory.fulfilled, (state) => {
        state.compressing = false;
      })
      .addCase(compressChatHistory.rejected, (state, action) => {
        state.compressing = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearResponse } = aiSlice.actions;
export default aiSlice.reducer;
