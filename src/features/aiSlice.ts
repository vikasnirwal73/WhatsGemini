import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { GoogleGenAI, Content, GenerateContentConfig, GenerateContentResponseUsageMetadata } from "@google/genai";
import { performChatCompression, buildValidHistory, autoCompressHistory, truncateHistory, trimTrailingUserMessages } from "./ai/utils/chatHistoryUtils";
import { AI, YOU, MODEL_PRICING, DEFAULT_MODEL_PRICING } from "../utils/constants";
import { getAPIKey, formatSafetySettings } from "./ai/utils/settings";
import { extractAndSaveBase64ImagesLocally, stripLeakedBase64 } from "./ai/utils/apiUtils";
import { deriveImagePrompt, generateImage } from "./ai/utils/imageGeneration";
import { streamTextResponse } from "./ai/utils/textResponse";
import { extractMemoryFacts } from "./ai/utils/memoryExtraction";
import { RootState } from "../store/store";
import { SDImageParams, Message } from "../types";

export interface GenerateAIResponseResult {
  text: string;
  tokenCount: number;
  costEstimate: number;
  imagePrompt: string;
  imageParams: SDImageParams;
  images?: string[];
}

// Async Thunk for generating AI response

export const generateAIResponse = createAsyncThunk(
  "ai/generateResponse",
  async ({ prompt, history = [], systemInstruction, characterImages, characterName, isImageRequest = false, existingImagePrompt, existingImageParams }: { prompt: string; history?: Content[], systemInstruction?: string, characterImages?: string[], characterName?: string, isImageRequest?: boolean, existingImagePrompt?: string, existingImageParams?: SDImageParams }, { getState, rejectWithValue, signal }) => {
    try {
      const state = getState() as RootState;
      const settings = state.settings;

      const apiKey = getAPIKey();
      if (!apiKey) throw new Error("API key is missing. Please log in.");

      const selectedModel = settings.selectedModel;
      const imageModelName = settings.imageModel;
      const ai = new GoogleGenAI({ apiKey });

      const safetySettings = formatSafetySettings(settings.safetySettings);
      const textModelConfig: GenerateContentConfig = {
        maxOutputTokens: settings.maxOutputTokens,
        temperature: settings.temperature,
        safetySettings: safetySettings,
      };
      if (systemInstruction) {
        // Already normalized once by buildSystemInstruction - no need to re-clean here.
        textModelConfig.systemInstruction = systemInstruction;
      }

      let totalTokens = 0;
      let costEstimate = 0;

      // Adds a call's usage to the running totals, priced by whichever model actually
      // served that call (a turn can span the selected text model and the image model).
      const trackUsage = (usage: GenerateContentResponseUsageMetadata | undefined, modelName: string) => {
        if (!usage) return;
        const promptTokens = usage.promptTokenCount || 0;
        const candidateTokens = usage.candidatesTokenCount || 0;
        totalTokens += usage.totalTokenCount || (promptTokens + candidateTokens);
        const pricing = MODEL_PRICING[modelName] || DEFAULT_MODEL_PRICING;
        costEstimate += (promptTokens / 1_000_000) * pricing.input + (candidateTokens / 1_000_000) * pricing.output;
      };

      // Prepare the context: dedupe, auto-compress if it's grown too long, hard-cap
      // length, and make sure it ends on a model turn.
      let validHistory = buildValidHistory(history, prompt);

      const compressed = await autoCompressHistory(ai, validHistory, settings.compressThreshold, selectedModel);
      validHistory = compressed.history;
      trackUsage(compressed.usage, selectedModel);

      validHistory = truncateHistory(validHistory, settings.maxChatLength);
      validHistory = trimTrailingUserMessages(validHistory);

      const historyForSdk = [...validHistory];

      let response = "";
      let generatedImages: string[] = [];
      let finalDerivedImagePrompt = "";
      let finalDerivedImageParams: SDImageParams = {};

      if (isImageRequest) {
        const useSdWebui = settings.useSdWebui;

        const derivation = await deriveImagePrompt(
          ai, selectedModel, textModelConfig, historyForSdk, prompt,
          settings.imageGenPrompt, settings.sdWebuiModel, useSdWebui,
          existingImagePrompt, existingImageParams
        );
        trackUsage(derivation.usage, selectedModel);

        finalDerivedImagePrompt = derivation.derivedImagePrompt;
        finalDerivedImageParams = derivation.derivedParams;
        response = derivation.derivedSummary;

        const imageResult = await generateImage(
          ai, useSdWebui, imageModelName, derivation.derivedImagePrompt, derivation.derivedParams,
          characterImages, characterName, safetySettings
        );
        trackUsage(imageResult.usage, imageModelName);
        generatedImages = imageResult.images;
        if (imageResult.warning) response += imageResult.warning;
      } else {
        const streamed = await streamTextResponse(ai, selectedModel, textModelConfig, historyForSdk, prompt, signal);
        trackUsage(streamed.usage, selectedModel);
        response = streamed.text;
      }

      const finalResponseText = await extractAndSaveBase64ImagesLocally(response, generatedImages);

      const returnPayload: GenerateAIResponseResult = {
        text: finalResponseText.trim(),
        tokenCount: totalTokens,
        costEstimate: costEstimate,
        imagePrompt: finalDerivedImagePrompt,
        imageParams: finalDerivedImageParams
      };

      if (generatedImages.length > 0) {
        returnPayload.images = generatedImages;
      }

      return returnPayload;
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
  async ({ history = [], systemInstruction }: { history: Content[], systemInstruction?: string }, { rejectWithValue }) => {
    try {
      return await performChatCompression(history, systemInstruction);
    } catch (error: any) {
      console.error("AI Compress Error:", error);
      return rejectWithValue(error.message || "Failed to compress history.");
    }
  }
);

// Async Thunk for extracting long-term character memory from a slice of recent messages
export const extractCharacterMemory = createAsyncThunk(
  "ai/extractCharacterMemory",
  async (
    { recentMessages, existingMemory }: { recentMessages: Message[]; existingMemory: string[] },
    { getState, rejectWithValue }
  ) => {
    try {
      const apiKey = getAPIKey();
      if (!apiKey) throw new Error("API key is missing. Please log in.");

      const state = getState() as RootState;
      const selectedModel = state.settings.selectedModel;
      const ai = new GoogleGenAI({ apiKey });

      const conversationText = recentMessages
        .map((m) => `${m.role === YOU ? "User" : "AI"}: ${stripLeakedBase64(m.txt || "")}`)
        .join("\n\n");

      const { facts } = await extractMemoryFacts(ai, selectedModel, conversationText, existingMemory);
      return facts;
    } catch (error: any) {
      console.error("Memory extraction error:", error);
      return rejectWithValue(error.message || "Failed to extract memory.");
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
