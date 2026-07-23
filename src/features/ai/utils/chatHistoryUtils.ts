import { GoogleGenAI, Content, GenerateContentConfig, GenerateContentResponseUsageMetadata } from "@google/genai";
import { getStoredValue, getAPIKey, getInitialMessages } from "./settings";
import { LS_AI_MODEL, DEFAULT_AI_MODEL } from "../../../utils/constants";

// Clones the raw history into fresh Content objects and drops the trailing user
// message if it's a duplicate of the prompt about to be sent (the caller's chat
// state often already contains it).
export const buildValidHistory = (history: Content[], prompt: string): Content[] => {
  const validHistory: Content[] = history
    .filter((msg) => msg?.parts?.[0]?.text && msg.role)
    .map(msg => ({ ...msg, parts: [...(msg.parts || [])] }));

  const last = validHistory[validHistory.length - 1];
  if (last && last.role === "user" && last.parts?.[0]?.text === prompt) {
    validHistory.pop();
  }

  return validHistory;
};

// If history has grown past compressThreshold, summarizes the older half (excluding
// any seeded initial messages) into a single system-style message via the text model,
// keeping recent messages verbatim. Falls back to plain truncation if summarization fails.
export const autoCompressHistory = async (
  ai: GoogleGenAI,
  validHistory: Content[],
  compressThreshold: number,
  selectedModel: string
): Promise<{ history: Content[]; usage?: GenerateContentResponseUsageMetadata }> => {
  if (compressThreshold <= 0 || validHistory.length <= compressThreshold) {
    return { history: validHistory };
  }

  const messagesToCompress = validHistory.length - Math.floor(compressThreshold / 2);
  if (messagesToCompress <= 0) return { history: validHistory };

  const initialMessages = getInitialMessages();
  const initialLen = initialMessages.length || 0;
  const startIndex = initialLen > 0 ? initialLen : 0;
  if (startIndex >= validHistory.length) return { history: validHistory };

  const oldMessagesForSummary = validHistory.slice(startIndex, startIndex + messagesToCompress);
  if (oldMessagesForSummary.length <= 2) return { history: validHistory };

  const conversationText = oldMessagesForSummary
    .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.parts?.[0]?.text || ""}`)
    .join("\n\n");

  const compressPrompt = `Provide a very concise but comprehensive summary of the following chat history.
Retain key facts, user preferences, important context, and the emotional tone.
Do NOT act as a conversational partner. Just reply with the summary block.

Conversation:
${conversationText}`;

  try {
    const sumResult = await ai.models.generateContent({ model: selectedModel, contents: compressPrompt });
    const summaryText = sumResult.text?.trim() || "";

    if (!summaryText) return { history: validHistory };

    const summaryMsg: Content = {
      role: "user",
      parts: [{ text: `[SYSTEM: Older chat history has been compressed into this summary to save memory. Summary: ${summaryText}]` }]
    };

    const newHistory = [
      ...validHistory.slice(0, startIndex),
      summaryMsg,
      ...validHistory.slice(startIndex + messagesToCompress)
    ];
    return { history: newHistory, usage: sumResult.usageMetadata };
  } catch (e) {
    console.warn("Auto-compression failed, falling back to truncation.", e);
    const fallback = [...validHistory];
    fallback.splice(startIndex, messagesToCompress);
    return { history: fallback };
  }
};

// Hard-caps history length once it exceeds maxHistoryLength, splicing out the
// oldest non-seeded messages (used as a backstop alongside/instead of compression).
export const truncateHistory = (validHistory: Content[], maxHistoryLength: number): Content[] => {
  if (maxHistoryLength <= 0 || validHistory.length <= maxHistoryLength) return validHistory;

  const initialMessages = getInitialMessages();
  const initialMessagesLength = initialMessages.length || 0;
  const maxLength = validHistory.length - maxHistoryLength;
  if (maxLength <= 0) return validHistory;

  const startIndex = initialMessagesLength > 0 ? initialMessagesLength : 1;
  if (startIndex < validHistory.length) {
    validHistory.splice(startIndex, maxLength);
  }
  return validHistory;
};

// Gemini requires history to end on a model turn - drop any trailing unanswered
// user messages before sending it as context.
export const trimTrailingUserMessages = (validHistory: Content[]): Content[] => {
  while (validHistory.length > 0 && validHistory[validHistory.length - 1].role === "user") {
    validHistory.pop();
  }
  return validHistory;
};

export const performChatCompression = async (history: Content[], systemInstruction?: string) => {
  const apiKey = getAPIKey();
  if (!apiKey) throw new Error("API key is missing. Please log in.");
  const selectedModel = getStoredValue(LS_AI_MODEL, DEFAULT_AI_MODEL);

  const ai = new GoogleGenAI({ apiKey });
  const config: GenerateContentConfig = {};

  if (systemInstruction) {
    config.systemInstruction = systemInstruction;
  }

  const conversationText = history
    .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.parts?.[0]?.text || ""}`)
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
};
