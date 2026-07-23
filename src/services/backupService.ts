import { dbService } from "./dbService";
import { Chat, Character } from "../types";

export const BACKUP_FILE_TYPE = "whatsgemini-backup";
export const BACKUP_FILE_VERSION = 1;

export interface BackupData {
  type: typeof BACKUP_FILE_TYPE;
  version: typeof BACKUP_FILE_VERSION;
  exportedAt: number;
  chats: Chat[];
  characters: Character[];
}

// Note: this covers chats, characters, and settings only. Images saved to a local
// directory (via the File System Access API) live on disk, not in IndexedDB, and
// aren't included - only the in-chat `local:<filename>` references to them.
export const getFullBackupData = async (): Promise<BackupData> => {
  const [chats, characters] = await Promise.all([
    dbService.getAllChats(),
    dbService.getAllCharacters(),
  ]);
  return {
    type: BACKUP_FILE_TYPE,
    version: BACKUP_FILE_VERSION,
    exportedAt: Date.now(),
    chats,
    characters,
  };
};

// Restores chats and characters as new records - never overwrites or collides
// with anything already in the database, so it's safe to run against a browser
// that already has data (or to import the same backup twice). Characters are
// restored first and their old->new id remapped, so restored chats keep
// pointing at the right (newly assigned) character.
export const restoreChatsAndCharacters = async (
  chats: Chat[],
  characters: Character[]
): Promise<{ chatsRestored: number; charactersRestored: number }> => {
  const idMap = new Map<number, number>();

  for (const character of characters) {
    const { id: oldId, ...rest } = character;
    const newId = await dbService.addCharacter(rest);
    if (oldId != null) idMap.set(oldId, newId);
  }

  let chatsRestored = 0;
  for (const chat of chats) {
    const { id, characterId, ...rest } = chat;
    const remappedCharacterId = characterId != null ? (idMap.get(characterId) ?? null) : null;
    await dbService.addChat({ ...rest, characterId: remappedCharacterId });
    chatsRestored++;
  }

  return { chatsRestored, charactersRestored: characters.length };
};
