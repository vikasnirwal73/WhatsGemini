import { GoogleGenAI, Content, Part, GenerateContentConfig, GenerateContentResponseUsageMetadata } from "@google/genai";

export interface TextStreamResult {
  text: string;
  usage?: GenerateContentResponseUsageMetadata;
}

// Streams a normal (non-image) chat turn, concatenating text chunks as they arrive.
// The Gemini streaming API attaches the cumulative usage total to each chunk once
// available, so the last value seen is the usage total for the whole turn.
export const streamTextResponse = async (
  ai: GoogleGenAI,
  selectedModel: string,
  textModelConfig: GenerateContentConfig,
  historyForSdk: Content[],
  prompt: string,
  signal: AbortSignal
): Promise<TextStreamResult> => {
  const chat = ai.chats.create({ model: selectedModel, config: textModelConfig, history: historyForSdk });
  const promptParts: Part[] = [{ text: prompt }];

  const stream = await chat.sendMessageStream({ message: promptParts });
  let text = "";
  let usage: GenerateContentResponseUsageMetadata | undefined;

  for await (const chunk of stream) {
    if (signal.aborted) {
      console.log("AI response generation aborted by user.");
      break;
    }

    try {
      if (chunk.text) {
        text += chunk.text;
      }
      if (chunk.usageMetadata) {
        usage = chunk.usageMetadata;
      }
    } catch (e) {
      console.warn("Could not parse text chunk:", e);
    }
  }

  return { text, usage };
};
