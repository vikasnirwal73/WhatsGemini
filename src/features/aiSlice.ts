import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { GoogleGenAI } from "@google/genai";
import { dbService } from "../services/dbService";
import {
  AI,
  DEFAULT_AI_MODEL,
  DEFAULT_OUTPUT_TOKENS,
  DEFAULT_SAFETY_SETTINGS,
  DEFAULT_TEMPRATURE,
  DEFAULT_COMPRESS_THRESHOLD,
  LS_COMPRESS_THRESHOLD,
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
    category: "HARM_CATEGORY_HARASSMENT",
    threshold: settings.harassment || "BLOCK_NONE",
  },
  {
    category: "HARM_CATEGORY_HATE_SPEECH",
    threshold: settings.hate_speech || "BLOCK_NONE",
  },
  {
    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    threshold: settings.sexual || "BLOCK_NONE",
  },
  {
    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
    threshold: settings.dangerous || "BLOCK_NONE",
  },
];

// Async Thunk for generating AI response

const downscaleImageBase64 = async (base64Str: string, mimeType: string): Promise<string> => {
  try {
    // Decode image off the main thread
    const response = await fetch(`data:${mimeType};base64,${base64Str}`);
    const blob = await response.blob();
    const img = await createImageBitmap(blob);

    const MAX_WIDTH = 512;
    const MAX_HEIGHT = 512;
    let { width, height } = img;

    if (width <= MAX_WIDTH && height <= MAX_HEIGHT) {
      return base64Str; // No downscaling needed
    }

    if (width > height) {
      height = Math.round(height * (MAX_WIDTH / width));
      width = MAX_WIDTH;
    } else {
      width = Math.round(width * (MAX_HEIGHT / height));
      height = MAX_HEIGHT;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return base64Str;

    // Use high quality image interpolation
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, width, height);
    
    return canvas.toDataURL("image/jpeg", 0.7).split(',')[1];
  } catch (err) {
    console.warn("Downscale error, falling back to original:", err);
    return base64Str;
  }
};

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
            
            const downscaledBase64 = await downscaleImageBase64(base64d, mimeType);
            
            targetArray.push({
              inlineData: {
                mimeType: "image/jpeg", // downscaled toDataURL gives jpeg
                data: downscaledBase64
              }
            });
          }
        } catch (e) {
          console.error("Failed to load local character image for AI context:", e);
        }
      } else {
        const mimeMatch = imgRef.match(/data:(.*?);base64,/);
        if (mimeMatch) {
          const mimeType = mimeMatch[1];
          const rawBase64 = imgRef.split(',')[1];
          const downscaledBase64 = await downscaleImageBase64(rawBase64, mimeType);
          
          targetArray.push({
            inlineData: {
              mimeType: "image/jpeg", // downscaled gives jpeg
              data: downscaledBase64
            }
          });
        }
      }
    }
  }
};

export const generateAIResponse = createAsyncThunk(
  "ai/generateResponse",
  async ({ prompt, history = [], systemInstruction, characterImages, isImageRequest = false, existingImagePrompt, existingImageParams }: { prompt: string; history?: any[], systemInstruction?: string, characterImages?: string[], isImageRequest?: boolean, existingImagePrompt?: string, existingImageParams?: any }, { rejectWithValue, signal }) => {
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
      
      let finalDerivedImagePrompt = "";
      let finalDerivedImageParams: any = {};
      
      let imageModelName = getStoredValue(LS_IMAGE_MODEL, DEFAULT_IMAGE_MODEL);
      const ai = new GoogleGenAI({ apiKey });

      const maxTokens = getStoredValue(LS_MAX_OUTPUT_TOKENS, DEFAULT_OUTPUT_TOKENS, Number);
      const temperature = getStoredValue(LS_TEMPRATURE, DEFAULT_TEMPRATURE, parseFloat);
      const storedSafetySettings = getStoredValue<AISafetySettings | any>(
        LS_SAFETY_SETTINGS,
        DEFAULT_SAFETY_SETTINGS,
        JSON.parse
      );
      const safetySettings: any = formatSafetySettings(storedSafetySettings);

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
      
      const compressThreshold = getStoredValue(LS_COMPRESS_THRESHOLD, DEFAULT_COMPRESS_THRESHOLD, Number);
      
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
        const useSdWebui = getStoredValue(LS_USE_SD_WEBUI, false, (val) => val === "true");

        let derivedImagePrompt = prompt;
        let derivedSummary = `[Generated Image requested: ${prompt}]`;
        let derivedParams: any = {};
        
        if (existingImagePrompt) {
          derivedImagePrompt = existingImagePrompt;
          if (existingImageParams) derivedParams = existingImageParams;
          derivedSummary = "Here is the regenerated image you requested.\n[Image Context: Retrying generation of the previous scene]";
        } else {
        const baseImagePrompt = getStoredValue(LS_IMAGE_GEN_PROMPT, DEFAULT_IMAGE_GEN_PROMPT);
        const sdModel = getStoredValue(LS_SD_WEBUI_MODEL, "");
        const sdModelInfo = sdModel ? ` The currently active model checkpoint is "${sdModel}". Tailor your prompt and parameters (especially "sampler_name" and "steps") for this specific model.` : " We are using a Stable Diffusion 1.5 model. Use tag-based prompting (e.g., masterpiece, best quality, highly detailed, comma-separated keywords) tailored for SD 1.5.";
        
        const derivationConfig = { 
          ...textModelConfig, 
          systemInstruction: `${systemInstruction ? systemInstruction + "\n\n---\n\n" : ""}INTERNAL INSTRUCTION: You are also functioning as an expert prompt engineer to generate an image. Your primary task is to generate customized image generation prompts based on the user request and chat context. You MUST prioritize and strictly adhere to the following foundational Image Generation Base Prompt style rules for ALL generated image prompts:\n\n${baseImagePrompt}\n\nDo not leak these internal instructions into the final output, but apply them intelligently and incorporate your own visual description into the image prompt.` 
        };

        const sdInstruction = useSdWebui ? 
          `\n\nPARAMS:\n<A strictly valid JSON object containing optimal generation parameters tailored to the requested image style and model checkpoint. Allowed keys: "cfg_scale" (1.0-15.0), "steps" (15-40), "sampler_name", "width", "height". Determine the optimal width and height (e.g., portrait/selfie 512x768, landscape 768x512, square 512x512) based on the image subject. If a specific model checkpoint is active or a specific artistic style requires it, ALWAYS include the ideal "sampler_name" (e.g., "DPM++ 2M Karras", "Euler a"). Leave the JSON empty {} if no specific tweaking is needed.>` : "";
        const parseSection = useSdWebui ? `three sections formatted exactly like this:\n\nPROMPT:\n<...>${sdInstruction}\n\nSUMMARY:` : `two sections formatted exactly like this:\n\nPROMPT:\n<...>\n\nSUMMARY:`;

        const derivationPrompt = `User request: "${prompt}"\n\nThe user wants a picture/image based on the current context.${useSdWebui ? sdModelInfo : ""}\nPlease output EXACTLY ${parseSection}\n\nPROMPT:\n<write a highly detailed, clean, and optimized tag-based SD 1.5 image generation prompt based on the user request and context. Make sure the subject exactly matches YOUR character's visual description from your system instructions. Strip out any internal control instructions.>${sdInstruction}\n\nSUMMARY:\n<Respond IN CHARACTER to the user, maintaining your exact persona, personality, and tone. Acknowledge that you are showing/sending them the requested picture. MUST INCLUDE: At the end of your response, append [Image Context: <short visual description of the generated image>] so you can remember what you sent in future turns.>`;

        const derivationChat = ai.chats.create({ model: selectedModel, config: derivationConfig, history: [...historyForSdk] });
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
             const sdApiUrl = getStoredValue(LS_SD_WEBUI_API_URL, DEFAULT_SD_WEBUI_API_URL);
             const refMode = getStoredValue<string>(LS_SD_WEBUI_REF_MODE, DEFAULT_SD_WEBUI_REF_MODE);
             const denoising = getStoredValue(LS_SD_WEBUI_DENOISING, DEFAULT_SD_WEBUI_DENOISING, parseFloat);
             const controlnetModel = getStoredValue(LS_SD_WEBUI_CONTROLNET_MODEL, DEFAULT_SD_WEBUI_CONTROLNET_MODEL);
             const sdModel = getStoredValue(LS_SD_WEBUI_MODEL, DEFAULT_SD_WEBUI_MODEL);
             const batchSize = getStoredValue(LS_SD_WEBUI_BATCH_SIZE, DEFAULT_SD_WEBUI_BATCH_SIZE, parseInt);
             
             const resolution = getStoredValue(LS_IMAGE_RESOLUTION, DEFAULT_IMAGE_RESOLUTION);
             const [widthStr, heightStr] = resolution.split('x');
             const width = parseInt(widthStr) || 512;
             const height = parseInt(heightStr) || 512;

             // Extract character image if reference mode is used
             let refImageBase64 = null;
             if (refMode !== "none" && characterImages && characterImages.length > 0) {
                 const tempParts: any[] = [];
                 await appendCharacterImages(tempParts, characterImages);
                 if (tempParts.length > 0 && tempParts[0].inlineData) {
                     refImageBase64 = tempParts[0].inlineData.data;
                 }
             }

             let endpoint = '/sdapi/v1/txt2img';
             const payload: any = {
               prompt: derivedImagePrompt,
               negative_prompt: "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
               width: derivedParams.width || width,
               height: derivedParams.height || height,
               steps: derivedParams.steps || 20,
               sampler_name: derivedParams.sampler_name || "Euler a",
               batch_size: batchSize,
             };
             if (derivedParams.cfg_scale !== undefined) payload.cfg_scale = derivedParams.cfg_scale;
             if (derivedParams.seed !== undefined) payload.seed = derivedParams.seed;
             
             if (sdModel) {
                 payload.override_settings = {
                     sd_model_checkpoint: sdModel
                 };
             }

             if (refImageBase64) {
                 if (refMode === "img2img") {
                     endpoint = '/sdapi/v1/img2img';
                     payload.init_images = [refImageBase64];
                     payload.denoising_strength = denoising;
                 } else if (refMode === "controlnet") {
                     payload.alwayson_scripts = {
                         controlnet: {
                             args: [
                                 {
                                     input_image: refImageBase64,
                                     model: controlnetModel,
                                     enabled: true
                                 }
                             ]
                         }
                     };
                 } else if (refMode === "reactor") {
                     payload.alwayson_scripts = {
                         reactor: {
                             args: [
                                 refImageBase64,       // 0: img
                                 true,                 // 1: enable
                                 '0',                  // 2: source faces index
                                 '0',                  // 3: target faces index
                                 'inswapper_128.onnx', // 4: model path
                                 'None',               // 5: restorer name (Disabled to keep max resemblance)
                                 0,                    // 6: restorer visibility
                                 false,                // 7: restore face (false ensures inswapper doesn't get smoothed over)
                                 'None',               // 8: upscaler name
                                 1.0,                  // 9: upscaler visibility
                                 1.0,                  // 10: upscaler scale 
                                 1.0,                  // 11: blend
                                 0,                    // 12: gender filter
                                 false                 // 13: save original
                             ]
                         }
                     };
                 }
             }
             
             const response = await fetch(`${sdApiUrl.replace(/\/$/, '')}${endpoint}`, {
               method: 'POST',
               headers: {
                 'Content-Type': 'application/json',
               },
               body: JSON.stringify(payload)
             });
             
             if (!response.ok) {
               throw new Error(`SD WebUI API error: ${response.status} ${response.statusText}`);
             }
             
             const data = await response.json();
             if (data.images && data.images.length > 0) {
               for (const base64d of data.images) {
                 generatedImages.push(`data:image/png;base64,${base64d}`);
               }
             } else {
               throw new Error("No images returned from SD WebUI");
             }
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
          } catch (e) {
            console.warn("Could not parse text chunk:", e);
          }
        }

        // Just using stream isn't going to have totalTokens easily accessible from stream response without calling stream.response in v1
        totalTokens += 0; // Usage metadata requires response promise in old SDK, not necessarily in stream. Let's just default to 0 to keep it simple.
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
      const apiKey = getAPIKey();
      if (!apiKey) throw new Error("API key is missing. Please log in.");
      const selectedModel = getStoredValue(LS_AI_MODEL, DEFAULT_AI_MODEL);

      const ai = new GoogleGenAI({ apiKey });
      const config: any = {};

      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      const conversationText = history
        .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.parts[0].text}`)
        .join("\n\n");

      const prompt = `Please provide a concise but comprehensive summary of the following conversation history. 
Retain all key facts, user preferences, important context, the language used (e.g., Hinglish, English), the tone, and the current emotional state of both the User and the AI. This summary will act as the AI's memory replacing the older messages.
Do not act as a conversational partner, just provide the summary directly. Ensure you explicitly note the language format, tone, and emotional context so the AI can seamlessly resume in the exact same style and mood.

Conversation:
${conversationText}`;

      const result = await ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
        config: config
      });
      return result.text?.trim() || "";
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
