import { GoogleGenAI } from "@google/genai";
import { getStoredValue, getAPIKey } from "./settings";
import { LS_AI_MODEL, DEFAULT_AI_MODEL } from "../../../utils/constants";

export const performChatCompression = async (history: any[], systemInstruction?: string) => {
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
};
