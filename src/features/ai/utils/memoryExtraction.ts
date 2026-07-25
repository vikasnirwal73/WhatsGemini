import { GoogleGenAI, GenerateContentResponseUsageMetadata } from "@google/genai";
import { MAX_MEMORY_ENTRIES } from "../../../utils/constants";

export interface MemoryExtractionResult {
  facts: string[];
  usage?: GenerateContentResponseUsageMetadata;
}

// One non-streaming call that asks the model to distill new, durable facts
// worth remembering long-term from a slice of recent conversation - fed the
// facts already known so it naturally avoids re-extracting duplicates.
export const extractMemoryFacts = async (
  ai: GoogleGenAI,
  selectedModel: string,
  conversationText: string,
  existingMemory: string[]
): Promise<MemoryExtractionResult> => {
  const knownFactsBlock = existingMemory.length > 0
    ? existingMemory.map((f) => `- ${f}`).join("\n")
    : "None yet.";

  const prompt = `You are extracting long-term memory for an AI companion character from a conversation.

Already known facts about the user and the relationship:
${knownFactsBlock}

Recent conversation:
${conversationText}

From the recent conversation only, extract any NEW durable facts about the user or the relationship worth remembering permanently - preferences, names, important life details, recurring topics, relationship milestones. Keep each fact short and self-contained (one line). Do not repeat anything already known above. If there is nothing new worth remembering, reply with exactly NONE.

Reply with only the new facts, one per line, each starting with "- ". If nothing new, reply with exactly NONE.`;

  const result = await ai.models.generateContent({ model: selectedModel, contents: prompt });
  const text = result.text?.trim() || "";

  if (!text || text.toUpperCase() === "NONE") {
    return { facts: [], usage: result.usageMetadata };
  }

  const facts = text
    .split("\n")
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);

  return { facts, usage: result.usageMetadata };
};

// Appends new facts (skipping exact duplicates), trimming the oldest entries
// once the list exceeds the cap.
export const mergeMemory = (existing: string[] = [], newFacts: string[]): string[] => {
  const merged = [...existing, ...newFacts.filter((f) => !existing.includes(f))];
  return merged.length > MAX_MEMORY_ENTRIES ? merged.slice(merged.length - MAX_MEMORY_ENTRIES) : merged;
};
