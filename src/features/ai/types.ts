// Provider-agnostic chat/message shapes. Every adapter (Gemini, OpenAI-compatible,
// Anthropic, ...) translates to/from its own wire format at the call boundary -
// nothing outside src/features/ai/providers/* should ever import a provider SDK type.
export type NormalizedRole = "user" | "assistant" | "system";

export interface NormalizedImage {
  mimeType: string;
  data: string; // raw base64, no "data:" prefix
}

export interface ChatMessage {
  role: NormalizedRole;
  text: string;
}

export interface UsageInfo {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}
