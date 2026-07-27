import { getStoredValue, getInitialMessages, getProviderApiKey, getOllamaBaseUrl } from "./settings";
import { LS_CHAT_PROVIDER, DEFAULT_CHAT_PROVIDER, LS_AI_MODEL, DEFAULT_AI_MODEL } from "../../../utils/constants";
import { ChatMessage, UsageInfo } from "../types";
import { ChatProviderAdapter, ProviderRuntimeConfig } from "../providers/types";
import { CHAT_PROVIDERS } from "../providers/registry";

// Clones the raw history into fresh objects and drops the trailing user
// message if it's a duplicate of the prompt about to be sent (the caller's chat
// state often already contains it).
export const buildValidHistory = (history: ChatMessage[], prompt: string): ChatMessage[] => {
  const validHistory: ChatMessage[] = history
    .filter((msg) => msg?.text && msg.role)
    .map((msg) => ({ ...msg }));

  const last = validHistory[validHistory.length - 1];
  if (last && last.role === "user" && last.text === prompt) {
    validHistory.pop();
  }

  return validHistory;
};

// Shared summarization prompt used by both the automatic (threshold-triggered)
// and manual (Compress button) compression paths - previously these had two
// separate, divergent prompts doing the same job. Standardized on the more
// thorough of the two: explicitly retains language/tone/emotional state so
// the AI can resume seamlessly, not just facts.
export const summarizeConversation = async (
  adapter: ChatProviderAdapter,
  config: ProviderRuntimeConfig,
  selectedModel: string,
  messages: ChatMessage[],
  systemInstruction?: string
): Promise<{ summary: string; usage?: UsageInfo }> => {
  const conversationText = messages
    .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.text || ""}`)
    .join("\n\n");

  const prompt = `Please provide a concise but comprehensive summary of the following conversation history.
Retain all key facts, user preferences, important context, the language used (e.g., Hinglish, English), the tone, and the current emotional state of both the User and the AI. This summary will act as the AI's memory replacing the older messages.
Do not act as a conversational partner, just provide the summary directly. Ensure you explicitly note the language format, tone, and emotional context so the AI can seamlessly resume in the exact same style and mood.

Conversation:
${conversationText}`;

  const result = await adapter.generateOnce(prompt, selectedModel, config, systemInstruction);
  return { summary: result.text.trim(), usage: result.usage };
};

// If history has grown past compressThreshold, summarizes the older half (excluding
// any seeded initial messages) into a single system-style message via the text model,
// keeping recent messages verbatim. Falls back to plain truncation if summarization fails.
export const autoCompressHistory = async (
  adapter: ChatProviderAdapter,
  config: ProviderRuntimeConfig,
  validHistory: ChatMessage[],
  compressThreshold: number,
  selectedModel: string
): Promise<{ history: ChatMessage[]; usage?: UsageInfo }> => {
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

  try {
    const { summary, usage } = await summarizeConversation(adapter, config, selectedModel, oldMessagesForSummary);
    if (!summary) return { history: validHistory };

    const summaryMsg: ChatMessage = {
      role: "user",
      text: `[SYSTEM: Older chat history has been compressed into this summary to save memory. Summary: ${summary}]`,
    };

    const newHistory = [
      ...validHistory.slice(0, startIndex),
      summaryMsg,
      ...validHistory.slice(startIndex + messagesToCompress),
    ];
    return { history: newHistory, usage };
  } catch (e) {
    console.warn("Auto-compression failed, falling back to truncation.", e);
    const fallback = [...validHistory];
    fallback.splice(startIndex, messagesToCompress);
    return { history: fallback };
  }
};

// Hard-caps history length once it exceeds maxHistoryLength, splicing out the
// oldest non-seeded messages (used as a backstop alongside/instead of compression).
export const truncateHistory = (validHistory: ChatMessage[], maxHistoryLength: number): ChatMessage[] => {
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

// Most providers require (or strongly prefer) history to end on an assistant
// turn - drop any trailing unanswered user messages before sending it as context.
export const trimTrailingUserMessages = (validHistory: ChatMessage[]): ChatMessage[] => {
  while (validHistory.length > 0 && validHistory[validHistory.length - 1].role === "user") {
    validHistory.pop();
  }
  return validHistory;
};

export const performChatCompression = async (history: ChatMessage[], systemInstruction?: string): Promise<string> => {
  const providerId = getStoredValue(LS_CHAT_PROVIDER, DEFAULT_CHAT_PROVIDER);
  const adapter = CHAT_PROVIDERS[providerId] || CHAT_PROVIDERS[DEFAULT_CHAT_PROVIDER];

  const apiKey = await getProviderApiKey(providerId);
  if (!apiKey && adapter.capabilities.requiresApiKey) {
    throw new Error("API key is missing. Please log in.");
  }
  const baseUrl = adapter.capabilities.requiresBaseUrl ? getOllamaBaseUrl() : undefined;
  const selectedModel = getStoredValue(LS_AI_MODEL, DEFAULT_AI_MODEL);

  const { summary } = await summarizeConversation(adapter, { apiKey, baseUrl }, selectedModel, history, systemInstruction);
  return summary;
};
