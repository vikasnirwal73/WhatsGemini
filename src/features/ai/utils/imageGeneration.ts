import { GoogleGenAI, Content, Part, GenerateContentConfig, GenerateContentResponseUsageMetadata, SafetySetting } from "@google/genai";
import { SDImageParams } from "../../../types";
import { appendCharacterImages } from "./imageProcessing";
import { generateSDImage } from "./sdWebuiUtils";

export interface ImageDerivationResult {
  derivedImagePrompt: string;
  derivedParams: SDImageParams;
  derivedSummary: string;
  usage?: GenerateContentResponseUsageMetadata;
}

// Step 1 of an image request: ask the text model to turn the user's request (plus
// chat context) into an SD-style image prompt, optional generation params, and an
// in-character reply acknowledging the picture. Skipped in favor of the prior
// prompt/params when regenerating an existing image.
//
// isCharacterInitiated distinguishes two very different situations that both flow
// through this function: a real user turn (toggle + message, which may or may not
// literally ask for a picture in its text) vs. a character-initiated follow-up
// (no user message at all - the character is choosing to share a picture on its
// own). Conflating them used to make every image reply say "here's the picture you
// asked for" even when the user's actual text never asked for one.
export const deriveImagePrompt = async (
  ai: GoogleGenAI,
  selectedModel: string,
  textModelConfig: GenerateContentConfig,
  historyForSdk: Content[],
  prompt: string,
  imageGenPrompt: string,
  sdWebuiModel: string,
  useSdWebui: boolean,
  existingImagePrompt: string | undefined,
  existingImageParams: SDImageParams | undefined,
  signal?: AbortSignal,
  isCharacterInitiated = false
): Promise<ImageDerivationResult> => {
  if (existingImagePrompt) {
    const regenSummary = isCharacterInitiated
      ? "Here's another look at that same moment.\n[Image Context: Retrying generation of the previous scene]"
      : "Here is the regenerated image you requested.\n[Image Context: Retrying generation of the previous scene]";
    return {
      derivedImagePrompt: existingImagePrompt,
      derivedParams: existingImageParams || {},
      derivedSummary: regenSummary,
    };
  }

  const sdModelInfo = sdWebuiModel
    ? ` The currently active model checkpoint is "${sdWebuiModel}". Tailor your prompt and parameters (especially "sampler_name" and "steps") for this specific model.`
    : " We are using a Stable Diffusion 1.5 model. Use tag-based prompting (e.g., masterpiece, best quality, highly detailed, comma-separated keywords) tailored for SD 1.5.";

  const sdInstruction = useSdWebui
    ? `\n\nPARAMS:\n<A strictly valid JSON object containing optimal generation parameters tailored to the requested image style and model checkpoint. Allowed keys: "cfg_scale" (1.0-15.0), "steps" (15-40), "sampler_name", "width", "height". Determine the optimal width and height (e.g., portrait/selfie 512x768, landscape 768x512, square 512x512) based on the image subject. If a specific model checkpoint is active or a specific artistic style requires it, ALWAYS include the ideal "sampler_name" (e.g., "DPM++ 2M Karras", "Euler a"). Leave the JSON empty {} if no specific tweaking is needed.>`
    : "";
  const parseSection = useSdWebui
    ? `three sections formatted exactly like this:\n\nPROMPT:\n<...>${sdInstruction}\n\nSUMMARY:`
    : `two sections formatted exactly like this:\n\nPROMPT:\n<...>\n\nSUMMARY:`;

  const requestContext = isCharacterInitiated
    ? `(INTERNAL DIRECTIVE) You are sending a follow-up message and have decided, entirely on your own initiative, to share a picture as part of it. There was no request from the user for this - you're choosing to send it because it fits the moment.`
    : `(INTERNAL DIRECTIVE) The user's message: "${prompt}"\nAn image will be generated to accompany your reply. Base it on the user's message and the surrounding context - do not assume the message itself explicitly asked for a picture unless it actually did.`;

  const summaryInstruction = isCharacterInitiated
    ? `<Respond IN CHARACTER, maintaining your exact persona, personality, and tone, as a natural follow-up message. Naturally mention that you're sharing a picture, framed as your own idea - never imply the user asked for it.`
    : `<Respond IN CHARACTER to the user's message above, maintaining your exact persona, personality, and tone. Only say you're "sending/showing the picture they asked for" if their message literally asked for one - otherwise just reply naturally to what they actually said, and let the picture accompany your reply without claiming they requested it.`;

  const derivationPrompt = `${requestContext}${useSdWebui ? sdModelInfo : ""}\n\nYou must function as an expert prompt engineer. Prioritize this base style rule:\n${imageGenPrompt}\n\nPlease output EXACTLY ${parseSection}\n\nPROMPT:\n<write a highly detailed, clean, and optimized tag-based SD 1.5 image generation prompt that fits the scene and context. Make sure the subject matches your visual description.>${sdInstruction}\n\nSUMMARY:\n${summaryInstruction} MUST INCLUDE: At the end of your response, append [Image Context: <short visual description of the generated image>] so you can remember what you sent in future turns.>`;

  const derivationChat = ai.chats.create({ model: selectedModel, config: textModelConfig, history: [...historyForSdk] });
  const derivationPromptParts: Part[] = [{ text: derivationPrompt }];

  // sendMessage's per-call config replaces (rather than merges with) the chat's
  // config, so textModelConfig has to be spread back in alongside the signal.
  const derivationResult = await derivationChat.sendMessage({
    message: derivationPromptParts,
    config: { ...textModelConfig, abortSignal: signal },
  });
  const derivationText = derivationResult.text || "";

  const promptMatch = useSdWebui ? derivationText.match(/PROMPT:\s*([\s\S]*?)PARAMS:/i) : derivationText.match(/PROMPT:\s*([\s\S]*?)SUMMARY:/i);
  const paramsMatch = useSdWebui ? derivationText.match(/PARAMS:\s*([\s\S]*?)SUMMARY:/i) : null;
  const summaryMatch = derivationText.match(/SUMMARY:\s*([\s\S]*)/i);

  let derivedImagePrompt = prompt;
  let derivedParams: SDImageParams = {};
  let derivedSummary = derivationText;

  if (promptMatch && promptMatch[1]) {
    derivedImagePrompt = promptMatch[1].trim();
  }
  if (paramsMatch && paramsMatch[1]) {
    try {
      // Remove any markdown code block formatting if present
      const jsonStr = paramsMatch[1].trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
      derivedParams = JSON.parse(jsonStr);
    } catch (e) {
      console.warn("Failed to parse SD PARAMS json:", e);
    }
  }
  if (summaryMatch && summaryMatch[1]) {
    derivedSummary = summaryMatch[1].trim();
  }

  return { derivedImagePrompt, derivedParams, derivedSummary, usage: derivationResult.usageMetadata };
};

export interface ImageGenerationResult {
  images: string[];
  warning?: string;
  usage?: GenerateContentResponseUsageMetadata;
}

// Step 2 of an image request: actually render the image, via the local SD WebUI or
// Gemini's native image output depending on settings. Never throws - generation
// failures come back as a warning so the text reply can still be saved.
export const generateImage = async (
  ai: GoogleGenAI,
  useSdWebui: boolean,
  imageModelName: string,
  derivedImagePrompt: string,
  derivedParams: SDImageParams,
  characterImages: string[] | undefined,
  characterName: string | undefined,
  safetySettings: SafetySetting[],
  signal?: AbortSignal
): Promise<ImageGenerationResult> => {
  try {
    if (useSdWebui) {
      const images = await generateSDImage(derivedImagePrompt, derivedParams, characterImages, characterName, signal);
      return { images };
    }

    const imagePromptParts: Part[] = [{ text: derivedImagePrompt }];
    if (characterImages && characterImages.length > 0) {
      await appendCharacterImages(imagePromptParts, characterImages);
    }

    const imageRes = await ai.models.generateContent({
      model: imageModelName,
      contents: imagePromptParts,
      config: { safetySettings, abortSignal: signal }
    });

    const images: string[] = [];
    const parts = imageRes.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        images.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
      }
    }
    return { images, usage: imageRes.usageMetadata };
  } catch (err) {
    console.error("Image generation failed:", err);
    return { images: [], warning: "\n\n[Warning: Image generation failed due to API error.]" };
  }
};
