import { Content } from "@google/genai";
import { Character, Message, UserProfile } from "../../../types";
import { YOU, USER, MODEL, LS_USER_PROFILE } from "../../../utils/constants";
import { stripLeakedBase64 } from "./apiUtils";

// Converts stored DB messages into the Gemini SDK's Content shape, stripping any
// leaked base64 image data and falling back to a single space since Gemini
// requires non-empty text parts.
export const buildChatHistory = (messages: Message[]): Content[] =>
  messages.map((msg) => {
    const text = stripLeakedBase64(msg.txt || "");
    return {
      role: msg.role === YOU ? USER : MODEL,
      parts: [{ text: text.trim() || " " }],
    };
  });

export interface SystemInstructionResult {
  text?: string;
  images?: string[];
  characterName?: string;
}

// Assembles the character's system instruction from clearly separated sections
// (persona, user profile, relationship, appearance, long-term memory, and any
// one-off directive like an auto-follow-up nudge) instead of one hand-built
// string. Whitespace is normalized once, here, rather than a second time by
// the caller.
export const buildSystemInstruction = (
  character: Character | undefined,
  extraDirectives?: string[]
): SystemInstructionResult => {
  if (!character) return { text: undefined, images: undefined, characterName: undefined };

  const sections: string[] = [
    `Role play as, Character Name: ${character.name}.\nCharacter description: ${character.description}.\nExample dialogue: ${character.prompt}`,
  ];

  try {
    const userProfileRaw = localStorage.getItem(LS_USER_PROFILE);
    if (userProfileRaw) {
      const userProfile: UserProfile = JSON.parse(userProfileRaw);
      const userNameStr = userProfile.name ? `User's Name: ${userProfile.name}.` : "";
      const userBioStr = userProfile.bio ? `User's Bio/Details: ${userProfile.bio}.` : "";
      if (userNameStr || userBioStr) {
        sections.push(`About the User you are talking to:\n${userNameStr} ${userBioStr}`);
      }
    }
  } catch (e) {
    console.error("Error parsing user profile for context:", e);
  }

  if (character.relationship) {
    sections.push(`Your relationship with the user: ${character.relationship}`);
  }
  if (character.appearance) {
    sections.push(`Your physical appearance/looks: ${character.appearance}`);
  }
  if (character.memory && character.memory.length > 0) {
    sections.push(`Known facts about the user and your relationship, remembered from past conversations:\n- ${character.memory.join("\n- ")}`);
  }
  if (extraDirectives && extraDirectives.length > 0) {
    sections.push(...extraDirectives);
  }

  const text = sections
    .join("\n\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { text, images: character.appearanceImages, characterName: character.name };
};

export interface TurnContext {
  history: Content[];
  systemInstruction?: string;
  characterImages?: string[];
  characterName?: string;
}

// The single function replacing the copy-pasted "build history + build system
// instruction" block that used to appear separately in handleSend,
// handleEditMessage, and handleRegenerate.
export const buildTurnContext = (
  messages: Message[],
  character: Character | undefined,
  extraDirectives?: string[]
): TurnContext => {
  const history = buildChatHistory(messages);
  const { text, images, characterName } = buildSystemInstruction(character, extraDirectives);
  return { history, systemInstruction: text, characterImages: images, characterName };
};
