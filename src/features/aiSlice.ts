import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { GoogleGenAI } from "@google/genai";
import { dbService } from "../services/dbService";
import { performChatCompression } from "./ai/utils/chatHistoryUtils";
import {
  AI,
  DEFAULT_AI_MODEL,
  DEFAULT_OUTPUT_TOKENS,
  DEFAULT_SAFETY_SETTINGS,
  DEFAULT_TEMPRATURE,
  DEFAULT_COMPRESS_THRESHOLD,
  LS_COMPRESS_THRESHOLD,
  LS_AI_MODEL,
  LS_MAX_CHAT_LENGTH,
  LS_MAX_OUTPUT_TOKENS,
  LS_SAFETY_SETTINGS,
  LS_TEMPRATURE,
  // LS_IMAGE_RESOLUTION,
  // DEFAULT_IMAGE_RESOLUTION,
  LS_IMAGE_MODEL,
  DEFAULT_IMAGE_MODEL,
  LS_IMAGE_GEN_PROMPT,
  DEFAULT_IMAGE_GEN_PROMPT,
  LS_USE_SD_WEBUI,
  LS_SD_WEBUI_API_URL,
  DEFAULT_SD_WEBUI_API_URL,
  LS_SD_WEBUI_REF_MODE,
  DEFAULT_SD_WEBUI_REF_MODE,
  LS_SD_WEBUI_DENOISING,
  DEFAULT_SD_WEBUI_DENOISING,
  LS_SD_WEBUI_CONTROLNET_MODEL,
  DEFAULT_SD_WEBUI_CONTROLNET_MODEL,
  LS_SD_WEBUI_MODEL,
  DEFAULT_SD_WEBUI_MODEL,
  LS_SD_WEBUI_BATCH_SIZE,
  DEFAULT_SD_WEBUI_BATCH_SIZE,
  LS_IMAGE_RESOLUTION,
  DEFAULT_IMAGE_RESOLUTION
} from "../utils/constants";
import { AISafetySettings } from "../types";
import { getStoredValue, getInitialMessages, getAPIKey, formatSafetySettings } from "./ai/utils/settings";
import { appendCharacterImages } from "./ai/utils/imageProcessing";
import { extractAndSaveBase64ImagesLocally } from "./ai/utils/apiUtils";
import { generateSDImage } from "./ai/utils/sdWebuiUtils";
import { RootState } from "../store/store";

// Async Thunk for generating AI response

export const generateAIResponse = createAsyncThunk(
  "ai/generateResponse",
  async ({ prompt, history = [], systemInstruction, characterImages, characterName, isImageRequest = false, existingImagePrompt, existingImageParams }: { prompt: string; history?: any[], systemInstruction?: string, characterImages?: string[], characterName?: string, isImageRequest?: boolean, existingImagePrompt?: string, existingImageParams?: any }, { getState, rejectWithValue, signal }) => {
    try {
      const state = getState() as RootState;
      const settings = state.settings;
      
      const apiKey = getAPIKey();
      if (!apiKey) throw new Error("API key is missing. Please log in.");
      
      const maxHistoryLength = settings.maxChatLength;
      let selectedModel = settings.selectedModel;
      
      let finalPrompt = prompt;
      let generatedImages: string[] = [];
      let response = "";
      let totalTokens = 0;
      let costPerMillion = 0.075;
      
      let finalDerivedImagePrompt = "";
      let finalDerivedImageParams: any = {};
      
      let imageModelName = settings.imageModel;
      const ai = new GoogleGenAI({ apiKey });

      const maxTokens = settings.maxOutputTokens;
      const temperature = settings.temperature;
      const safetySettings: any = formatSafetySettings(settings.safetySettings);

      const textModelConfig: any = {
        maxOutputTokens: maxTokens,
        temperature: temperature,
        safetySettings: safetySettings,
      };

      if (systemInstruction) {
        textModelConfig.systemInstruction = systemInstruction.trim().replace(/\s+/g, ' ');
      }

      // Filter out empty messages
      let validHistory = history
        .filter((msg) => msg?.parts?.[0]?.text && msg.role)
        .map(msg => {
           // Deep clone parts so we don't accidentally mutate react state
           return { ...msg, parts: [...msg.parts] };
        });

      // Remove any unsupported 'images' fields from the history before sending to SDK
      for (let msg of validHistory) {
         if (msg.images) {
            delete msg.images;
         }
      }

      // If the last message in history is the same as the prompt, remove it to avoid duplication
      if (
        validHistory.length > 0 &&
        validHistory[validHistory.length - 1].role === "user" &&
        validHistory[validHistory.length - 1].parts[0].text === prompt
      ) {
        validHistory.pop();
      }
      
      const compressThreshold = settings.compressThreshold;
      
      if (compressThreshold > 0 && validHistory.length > compressThreshold) {
        const messagesToCompress = validHistory.length - Math.floor(compressThreshold / 2);
        
        if (messagesToCompress > 0) {
          const initialMessages = getInitialMessages();
          const initialLen = initialMessages.length || 0;
          const startIndex = initialLen > 0 ? initialLen : 0;
          
          if (startIndex < validHistory.length) {
            // Compress the older messages (excluding initial messages)
            const oldMessagesForSummary = validHistory.slice(startIndex, startIndex + messagesToCompress);
            
            // Only compress if we actually have messages to compress
            if (oldMessagesForSummary.length > 2) { 
              const conversationText = oldMessagesForSummary
                .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.parts[0].text}`)
                .join("\n\n");

              const compressPrompt = `Provide a very concise but comprehensive summary of the following chat history. 
Retain key facts, user preferences, important context, and the emotional tone.
Do NOT act as a conversational partner. Just reply with the summary block.

Conversation:
${conversationText}`;
              
              try {
                // Background summary call using the currently selected model
                const sumResult = await ai.models.generateContent({
                  model: selectedModel,
                  contents: compressPrompt
                });
                
                const summaryText = sumResult.text?.trim() || "";
                
                if (summaryText) {
                  totalTokens += sumResult.usageMetadata?.totalTokenCount || 0;
                  
                  // Construct a summary message
                  const summaryMsg = { 
                    role: "user", 
                    parts: [{ text: `[SYSTEM: Older chat history has been compressed into this summary to save memory. Summary: ${summaryText}]` }] 
                  };
                  
                  // Keep initial messages, insert summary, keep recent messages
                  const newValidHistory = [
                    ...validHistory.slice(0, startIndex),
                    summaryMsg,
                    ...validHistory.slice(startIndex + messagesToCompress)
                  ];
                  validHistory = newValidHistory;
                }
              } catch (e) {
                 console.warn("Auto-compression failed, falling back to truncation.", e);
                 // Fallback to truncation if summarization fails
                 validHistory.splice(startIndex, messagesToCompress);
              }
            }
          }
        }
      }

      if (maxHistoryLength > 0 && validHistory.length > maxHistoryLength) {
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

      while (validHistory.length > 0 && validHistory[validHistory.length - 1].role === "user") {
        validHistory.pop();
      }

      const historyForSdk = [...validHistory];
      
      if (isImageRequest) {
        // Step 1: Use Text Model to derive image prompt & chat summary
        const useSdWebui = settings.useSdWebui;

        let derivedImagePrompt = prompt;
        let derivedSummary = `[Generated Image requested: ${prompt}]`;
        let derivedParams: any = {};
        
        if (existingImagePrompt) {
          derivedImagePrompt = existingImagePrompt;
          if (existingImageParams) derivedParams = existingImageParams;
          derivedSummary = "Here is the regenerated image you requested.\n[Image Context: Retrying generation of the previous scene]";
        } else {
        const baseImagePrompt = settings.imageGenPrompt;
        const sdModel = settings.sdWebuiModel;
        const sdModelInfo = sdModel ? ` The currently active model checkpoint is "${sdModel}". Tailor your prompt and parameters (especially "sampler_name" and "steps") for this specific model.` : " We are using a Stable Diffusion 1.5 model. Use tag-based prompting (e.g., masterpiece, best quality, highly detailed, comma-separated keywords) tailored for SD 1.5.";

        const sdInstruction = useSdWebui ? 
          `\n\nPARAMS:\n<A strictly valid JSON object containing optimal generation parameters tailored to the requested image style and model checkpoint. Allowed keys: "cfg_scale" (1.0-15.0), "steps" (15-40), "sampler_name", "width", "height". Determine the optimal width and height (e.g., portrait/selfie 512x768, landscape 768x512, square 512x512) based on the image subject. If a specific model checkpoint is active or a specific artistic style requires it, ALWAYS include the ideal "sampler_name" (e.g., "DPM++ 2M Karras", "Euler a"). Leave the JSON empty {} if no specific tweaking is needed.>` : "";
        const parseSection = useSdWebui ? `three sections formatted exactly like this:\n\nPROMPT:\n<...>${sdInstruction}\n\nSUMMARY:` : `two sections formatted exactly like this:\n\nPROMPT:\n<...>\n\nSUMMARY:`;

        const derivationPrompt = `(INTERNAL DIRECTIVE) User request: "${prompt}"\nThe user wants a picture/image based on the current context.${useSdWebui ? sdModelInfo : ""}\n\nYou must function as an expert prompt engineer. Prioritize this base style rule:\n${baseImagePrompt}\n\nPlease output EXACTLY ${parseSection}\n\nPROMPT:\n<write a highly detailed, clean, and optimized tag-based SD 1.5 image generation prompt based on the user request and context. Make sure the subject matches your visual description.>${sdInstruction}\n\nSUMMARY:\n<Respond IN CHARACTER to the user, maintaining your exact persona, personality, and tone. Acknowledge that you are showing/sending them the requested picture. MUST INCLUDE: At the end of your response, append [Image Context: <short visual description of the generated image>] so you can remember what you sent in future turns.>`;

        const derivationChat = ai.chats.create({ model: selectedModel, config: textModelConfig, history: [...historyForSdk] });
        const derivationPromptParts: any[] = [{ text: derivationPrompt }];
        
        const derivationResult = await derivationChat.sendMessage({ message: derivationPromptParts });
        const derivationText = derivationResult.text || "";
        totalTokens += derivationResult.usageMetadata?.totalTokenCount || 0;
        
        // Parse the segments
        const promptMatch = useSdWebui ? derivationText.match(/PROMPT:\s*([\s\S]*?)PARAMS:/i) : derivationText.match(/PROMPT:\s*([\s\S]*?)SUMMARY:/i);
        const paramsMatch = useSdWebui ? derivationText.match(/PARAMS:\s*([\s\S]*?)SUMMARY:/i) : null;
        const summaryMatch = derivationText.match(/SUMMARY:\s*([\s\S]*)/i);
        
        if (promptMatch && promptMatch[1]) {
           derivedImagePrompt = promptMatch[1].trim();
        }
        if (paramsMatch && paramsMatch[1]) {
           try {
             // Remove any markdown code block formatting if present
             const jsonStr = paramsMatch[1].trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
             derivedParams = JSON.parse(jsonStr);
           } catch(e) {
             console.warn("Failed to parse SD PARAMS json:", e);
           }
        }
        if (summaryMatch && summaryMatch[1]) {
           derivedSummary = summaryMatch[1].trim();
        } else {
           derivedSummary = derivationText;
        }
        } // close `if (existingImagePrompt) { ... } else { ... }` block
        
        finalDerivedImagePrompt = derivedImagePrompt;
        finalDerivedImageParams = derivedParams;
        response = derivedSummary;
        
        // Step 2: Use Image Model to actually generate the image
        try {
           if (useSdWebui) {
             const sdImages = await generateSDImage(derivedImagePrompt, derivedParams, characterImages, characterName);
             generatedImages.push(...sdImages);
           } else {
             const imagePromptParts: any[] = [{ text: derivedImagePrompt }];
             if (characterImages && characterImages.length > 0) {
               await appendCharacterImages(imagePromptParts, characterImages);
             }

             const imageRes = await ai.models.generateContent({
               model: imageModelName,
               contents: imagePromptParts,
               config: { safetySettings }
             });
             totalTokens += imageRes.usageMetadata?.totalTokenCount || 0;
             const parts = imageRes.candidates?.[0]?.content?.parts || [];
             for (const part of parts) {
                 if (part.inlineData) {
                    const mimeType = part.inlineData.mimeType;
                    const base64d = part.inlineData.data;
                    generatedImages.push(`data:${mimeType};base64,${base64d}`);
                 }
             }
           }
        } catch (err) {
           console.error("Image generation failed:", err);
           response += "\n\n[Warning: Image generation failed due to API error.]";
        }
      } else {
        // Normal Text Chat
        const chat = ai.chats.create({ model: selectedModel, config: textModelConfig, history: historyForSdk });
        const promptParts: any[] = [{ text: finalPrompt }];

        const stream = await chat.sendMessageStream({ message: promptParts });
        for await (const chunk of stream) {
          if (signal.aborted) {
            console.log("AI response generation aborted by user.");
            break;
          }

          try {
            if (chunk.text) {
               response += chunk.text;
            }
            // The Gemini streaming API attaches the cumulative usage total to
            // each chunk once available, so the last value seen is the total for this turn.
            if (chunk.usageMetadata?.totalTokenCount) {
              totalTokens = chunk.usageMetadata.totalTokenCount;
            }
          } catch (e) {
            console.warn("Could not parse text chunk:", e);
          }
        }
      }

      if (selectedModel.includes("pro")) {
        costPerMillion = 1.25; 
      }
      const costEstimate = (totalTokens / 1_000_000) * costPerMillion;

      let finalResponseText = response;

      finalResponseText = await extractAndSaveBase64ImagesLocally(finalResponseText, generatedImages);

      const returnPayload: any = {
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
  async ({ history = [], systemInstruction }: { history: any[], systemInstruction?: string }, { rejectWithValue }) => {
    try {
      return await performChatCompression(history, systemInstruction);
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
