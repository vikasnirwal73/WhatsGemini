import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { dbService } from "../services/dbService";
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
  // LS_IMAGE_RESOLUTION,
  // DEFAULT_IMAGE_RESOLUTION,
  LS_IMAGE_MODEL,
  DEFAULT_IMAGE_MODEL,
  LS_IMAGE_GEN_PROMPT,
  DEFAULT_IMAGE_GEN_PROMPT
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

const appendCharacterImages = async (targetArray: any[], images: string[] | undefined) => {
  if (images && images.length > 0) {
    for (const imgRef of images) {
      if (imgRef.startsWith('local:')) {
        try {
          const filename = imgRef.substring(6);
          const dirHandle = await dbService.getSetting("image_save_directory");
          if (dirHandle) {
            const fileHandle = await dirHandle.getFileHandle(filename);
            const file = await fileHandle.getFile();
            const buffer = await file.arrayBuffer();
            const base64d = btoa(
              new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
            );
            const ext = filename.split('.').pop()?.toLowerCase();
            let mimeType = 'image/png';
            if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
            else if (ext === 'webp') mimeType = 'image/webp';
            
            targetArray.push({
              inlineData: {
                mimeType,
                data: base64d
              }
            });
          }
        } catch (e) {
          console.error("Failed to load local character image for AI context:", e);
        }
      } else {
        const mimeMatch = imgRef.match(/data:(.*?);base64,/);
        if (mimeMatch) {
          targetArray.push({
            inlineData: {
              mimeType: mimeMatch[1],
              data: imgRef.split(',')[1]
            }
          });
        }
      }
    }
  }
};

export const generateAIResponse = createAsyncThunk(
  "ai/generateResponse",
  async ({ prompt, history = [], systemInstruction, characterImages, isImageRequest = false }: { prompt: string; history?: any[], systemInstruction?: string, characterImages?: string[], isImageRequest?: boolean }, { rejectWithValue, signal }) => {
    try {
      const apiKey = getAPIKey();
      if (!apiKey) throw new Error("API key is missing. Please log in.");
      const maxHistoryLength = parseInt(localStorage.getItem(LS_MAX_CHAT_LENGTH) || "0", 10);
      let selectedModel = getStoredValue(LS_AI_MODEL, DEFAULT_AI_MODEL);
      
      let finalPrompt = prompt;
      let generatedImages: string[] = [];
      let response = "";
      let totalTokens = 0;
      let costPerMillion = 0.075;
      
      let imageModelName = getStoredValue(LS_IMAGE_MODEL, DEFAULT_IMAGE_MODEL);
      const genAI = new GoogleGenerativeAI(apiKey);

      const maxTokens = getStoredValue(LS_MAX_OUTPUT_TOKENS, DEFAULT_OUTPUT_TOKENS, Number);
      const temperature = getStoredValue(LS_TEMPRATURE, DEFAULT_TEMPRATURE, parseFloat);
      const storedSafetySettings = getStoredValue<AISafetySettings | any>(
        LS_SAFETY_SETTINGS,
        DEFAULT_SAFETY_SETTINGS,
        JSON.parse
      );
      const safetySettings = formatSafetySettings(storedSafetySettings);

      const textModelParams: any = {
        model: selectedModel,
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: temperature,
        },
        safetySettings: safetySettings,
      };

      if (systemInstruction) {
        textModelParams.systemInstruction = systemInstruction;
      }

      const textModel = genAI.getGenerativeModel(textModelParams);

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

      while (validHistory.length > 0 && validHistory[validHistory.length - 1].role === "user") {
        validHistory.pop();
      }

      const historyForSdk = validHistory;
      
      if (isImageRequest) {
        // Step 1: Use Text Model to derive image prompt & chat summary
        const baseImagePrompt = getStoredValue(LS_IMAGE_GEN_PROMPT, DEFAULT_IMAGE_GEN_PROMPT);

        const derivationPrompt = `User request: "${prompt}"\n\nThe user wants to generate an image based on the current context.\nPlease output EXACTLY two sections formatted exactly like this:\n\nPROMPT:\n<write a highly detailed, descriptive image generation prompt combining the Image Generation Base Prompt ("${baseImagePrompt}") with the current chat context and user request>\n\nSUMMARY:\n<write a short 1-line chat response acknowledging the requested drawing along with key details of what you are drawing (characters, clothes, setting) in brackets. e.g. "Here is the drawing you asked for! [Generated Image: monkey in a red hat]">`;

        const derivationChat = await textModel.startChat({ history: [...historyForSdk] });
        const derivationPromptParts: any[] = [{ text: derivationPrompt }];
        await appendCharacterImages(derivationPromptParts, characterImages);
        
        const derivationResult = await derivationChat.sendMessage(derivationPromptParts);
        const derivationText = derivationResult.response.text();
        totalTokens += derivationResult.response.usageMetadata?.totalTokenCount || 0;
        
        // Parse the segments
        let derivedImagePrompt = prompt;
        let derivedSummary = `[Generated Image requested: ${prompt}]`;
        
        const promptMatch = derivationText.match(/PROMPT:\s*([\s\S]*?)SUMMARY:/i);
        const summaryMatch = derivationText.match(/SUMMARY:\s*([\s\S]*)/i);
        
        if (promptMatch && promptMatch[1]) {
           derivedImagePrompt = promptMatch[1].trim();
        }
        if (summaryMatch && summaryMatch[1]) {
           derivedSummary = summaryMatch[1].trim();
        }
        
        response = derivedSummary;
        
        // Step 2: Use Image Model to actually generate the image
        const imageModelParams: any = {
           model: imageModelName,
           safetySettings,
        };
        const imageModelInstance = genAI.getGenerativeModel(imageModelParams);
        
        try {
           const imagePromptParts: any[] = [{ text: derivedImagePrompt }];
           await appendCharacterImages(imagePromptParts, characterImages);

           const imageRes = await imageModelInstance.generateContent(imagePromptParts);
           totalTokens += imageRes.response.usageMetadata?.totalTokenCount || 0;
           const parts = imageRes.response.candidates?.[0]?.content?.parts || [];
           for (const part of parts) {
               if (part.inlineData) {
                  const mimeType = part.inlineData.mimeType;
                  const base64d = part.inlineData.data;
                  generatedImages.push(`data:${mimeType};base64,${base64d}`);
               }
           }
        } catch (err) {
           console.error("Image generation failed:", err);
           response += "\n\n[Warning: Image generation failed due to API error.]";
        }
      } else {
        // Normal Text Chat
        const chat = await textModel.startChat({ history: historyForSdk });
        const promptParts: any[] = [{ text: finalPrompt }];
        await appendCharacterImages(promptParts, characterImages);

        const stream = await chat.sendMessageStream(promptParts);
        for await (const chunk of stream.stream) {
          if (signal.aborted) {
            console.log("AI response generation aborted by user.");
            break;
          }
          
          try {
            const parts = chunk.candidates?.[0]?.content?.parts || [];
            for (const part of parts) {
               if (part.text) {
                  response += part.text;
               }
            }
          } catch (e) {
            console.warn("Could not parse text chunk:", e);
          }
        }

        const responseData = await stream.response;
        totalTokens += responseData?.usageMetadata?.totalTokenCount || 0;
      }

      if (selectedModel.includes("pro")) {
        costPerMillion = 1.25; 
      }
      const costEstimate = (totalTokens / 1_000_000) * costPerMillion;

      let finalResponseText = response;

      // Extract and remove any raw base64 images that might contain whitespace/newlines
      const markdownBase64Regex = /!\[.*?\]\(\s*(data:image\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=\s]+)\s*\)/g;
      finalResponseText = finalResponseText.replace(markdownBase64Regex, (match, base64Str) => {
          const cleanBase64 = base64Str.replace(/\s+/g, '');
          if (!generatedImages.includes(cleanBase64)) {
              generatedImages.push(cleanBase64);
          }
          return ''; // Strip the markdown image from the text
      });
      
      // Also catch HTML img tags with base64
      const htmlImgRegex = /<img[^>]+src=["'](data:image\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=\s]+)["'][^>]*>/gi;
      finalResponseText = finalResponseText.replace(htmlImgRegex, (match, base64Str) => {
          const cleanBase64 = base64Str.replace(/\s+/g, '');
          if (!generatedImages.includes(cleanBase64)) {
              generatedImages.push(cleanBase64);
          }
          return '';
      });

      // Also catch any bare data URIs floating in the text
      const bareBase64Regex = /data:image\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=\s]+/g;
      finalResponseText = finalResponseText.replace(bareBase64Regex, (match) => {
          const cleanBase64 = match.replace(/\s+/g, '');
          if (!generatedImages.includes(cleanBase64)) {
              generatedImages.push(cleanBase64);
          }
          return ''; // Strip it from the text
      });

      // Clean up any stray long base64 blocks that might have been output directly without data:image prefix
      const strayBase64 = /[A-Za-z0-9+/=]{1000,}/g; 
      finalResponseText = finalResponseText.replace(strayBase64, '');

      // Once all base64 URIs are extracted into generatedImages, flush them to disk to strip size from Redux state
      for (let i = 0; i < generatedImages.length; i++) {
        if (generatedImages[i].startsWith('data:')) {
          try {
            const dirHandle = await dbService.getSetting("image_save_directory");
            if (dirHandle && typeof dirHandle.getFileHandle === 'function') {
               const mimeMatch = generatedImages[i].match(/data:(.*?);base64,/);
               const ext = mimeMatch && mimeMatch[1] === 'image/jpeg' ? 'jpg' : 'png';
               const filename = `gemini_img_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${ext}`;
               const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
               const writable = await fileHandle.createWritable();
               
               const base64Data = generatedImages[i].split(',')[1];
               const bstr = atob(base64Data);
               let n = bstr.length;
               let u8arr = new Uint8Array(n);
               while(n--) { u8arr[n] = bstr.charCodeAt(n); }
               
               await writable.write(u8arr.buffer);
               await writable.close();
               
               generatedImages[i] = `local:${filename}`; // Replace base64 in array with local reference
            }
          } catch (err) {
            console.warn("Failed to write fully extracted image to FileSystem API directory", err);
          }
        }
      }

      const returnPayload: any = {
        text: finalResponseText.trim(),
        tokenCount: totalTokens,
        costEstimate: costEstimate
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
