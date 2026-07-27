import { ChatMessage, UsageInfo } from "../types";
import { ChatCallOptions, ChatCallResult, ChatProviderAdapter, ProviderRuntimeConfig } from "./types";

// Covers every provider that speaks OpenAI's Chat Completions wire format:
// OpenAI itself, DeepSeek, Qwen (via DashScope's compatible-mode endpoint),
// Kimi/Moonshot, and Ollama (via its /v1 endpoint). One factory, parameterized
// by base URL / auth / whether a key is required, replaces five bespoke adapters.
export interface OpenAiCompatibleProviderDef {
  id: string;
  label: string;
  defaultBaseUrl: string;
  requiresApiKey: boolean;
}

interface OpenAiChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const toOpenAiRole = (role: ChatMessage["role"]): "system" | "user" | "assistant" =>
  role === "assistant" ? "assistant" : role === "system" ? "system" : "user";

const toOpenAiMessages = (opts: ChatCallOptions): OpenAiChatMessage[] => {
  const messages: OpenAiChatMessage[] = [];
  if (opts.systemInstruction) messages.push({ role: "system", content: opts.systemInstruction });
  for (const m of opts.history) {
    messages.push({ role: toOpenAiRole(m.role), content: m.text || " " });
  }
  messages.push({ role: "user", content: opts.prompt });
  return messages;
};

interface OpenAiUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

const normalizeUsage = (usage?: OpenAiUsage): UsageInfo | undefined => {
  if (!usage) return undefined;
  const inputTokens = usage.prompt_tokens || 0;
  const outputTokens = usage.completion_tokens || 0;
  return { inputTokens, outputTokens, totalTokens: usage.total_tokens || inputTokens + outputTokens };
};

const buildHeaders = (def: OpenAiCompatibleProviderDef, apiKey?: string | null): Record<string, string> => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
  return headers;
};

const extractErrorMessage = async (response: Response): Promise<string> => {
  try {
    const body = await response.json();
    return body?.error?.message || body?.message || `${response.status} ${response.statusText}`;
  } catch {
    return `${response.status} ${response.statusText}`;
  }
};

const chatCompletions = async (
  def: OpenAiCompatibleProviderDef,
  messages: OpenAiChatMessage[],
  model: string,
  config: ProviderRuntimeConfig,
  extra: { temperature?: number; maxOutputTokens?: number; signal?: AbortSignal }
): Promise<ChatCallResult> => {
  if (def.requiresApiKey && !config.apiKey) {
    throw new Error(`An API key is required for ${def.label}.`);
  }

  const baseUrl = (config.baseUrl || def.defaultBaseUrl).replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: buildHeaders(def, config.apiKey),
    body: JSON.stringify({
      model,
      messages,
      temperature: extra.temperature,
      max_tokens: extra.maxOutputTokens,
      stream: false,
    }),
    signal: extra.signal,
  });

  if (!response.ok) {
    throw new Error(`${def.label} error: ${await extractErrorMessage(response)}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content || "";
  return { text: text.trim(), usage: normalizeUsage(data?.usage) };
};

export const createOpenAiCompatibleAdapter = (def: OpenAiCompatibleProviderDef): ChatProviderAdapter => ({
  id: def.id,
  capabilities: { supportsImageGen: false, requiresApiKey: def.requiresApiKey, requiresBaseUrl: def.id === "ollama" },
  generateChat: (opts, config) =>
    chatCompletions(def, toOpenAiMessages(opts), opts.model, config, {
      temperature: opts.temperature,
      maxOutputTokens: opts.maxOutputTokens,
      signal: opts.signal,
    }),
  generateOnce: (prompt, model, config, systemInstruction) => {
    const messages: OpenAiChatMessage[] = [];
    if (systemInstruction) messages.push({ role: "system", content: systemInstruction });
    messages.push({ role: "user", content: prompt });
    return chatCompletions(def, messages, model, config, {});
  },
});
