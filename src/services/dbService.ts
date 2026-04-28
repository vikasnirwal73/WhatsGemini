import Dexie, { Table } from "dexie";
import { DB_NAME } from "../utils/constants";
import { Chat, Character } from "../types";

class WhatsGeminiDB extends Dexie {
  chats!: Table<Chat, number>;
  characters!: Table<Character, number>;

  constructor() {
    super(DB_NAME);
    this.version(3).stores({
      chats: "++id, title, timestamp, content, characterId",
      characters: "++id, name, description, prompt, relationship, avatar",
    });
  }
}

export const db = new WhatsGeminiDB();

export const dbService = {
  // Chats
  async getAllChats(): Promise<Chat[]> {
    return await db.chats.orderBy("timestamp").toArray();
  },

  async getChatById(id: number): Promise<Chat> {
    const chat = await db.chats.get(id);
    if (!chat) throw new Error(`Chat with id ${id} not found.`);
    return chat;
  },

  async getChatByCharacterId(characterId: number): Promise<Chat | undefined> {
    return await db.chats.where("characterId").equals(characterId).first();
  },

  async addChat(chat: Omit<Chat, "id">): Promise<number> {
    return await db.chats.add(chat as Chat);
  },

  async updateChat(chat: Chat): Promise<number> {
    return await db.chats.put(chat);
  },

  async deleteChat(id: number): Promise<void> {
    await db.chats.delete(id);
  },

  async deleteChatsByCharacterId(characterId: number): Promise<void> {
    await db.chats.where("characterId").equals(characterId).delete();
  },

  // Characters
  async getAllCharacters(): Promise<Character[]> {
    return await db.characters.toArray();
  },

  async getCharacterById(id: number): Promise<Character> {
    const character = await db.characters.get(id);
    if (!character) throw new Error(`Character with id ${id} not found.`);
    return character;
  },

  async addCharacter(character: Omit<Character, "id">): Promise<number> {
    return await db.characters.add(character as Character);
  },

  async updateCharacter(character: Character): Promise<number> {
    return await db.characters.put(character);
  },

  async deleteCharacter(id: number): Promise<void> {
    return await db.characters.delete(id);
  }
};
