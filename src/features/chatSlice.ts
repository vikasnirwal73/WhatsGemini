import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { dbService } from "../services/dbService";
import { LS_INITIAL_MESSAGES } from "../utils/constants";
import { Chat, Message } from "../types";

// Helper function for error handling
const handleDbError = (error: unknown, rejectWithValue: any) => {
  console.error("Database Error:", error);
  if (error instanceof Error) {
    return rejectWithValue(error.message);
  }
  return rejectWithValue("An error occurred while accessing the database.");
};

// Async Thunks
export const fetchChats = createAsyncThunk("chat/fetchAll", async (_, { rejectWithValue }) => {
  try {
    return await dbService.getAllChats();
  } catch (error) {
    return handleDbError(error, rejectWithValue);
  }
});

export const fetchChatById = createAsyncThunk("chat/fetchById", async (id: number, { rejectWithValue }) => {
  try {
    return await dbService.getChatById(id);
  } catch (error) {
    return handleDbError(error, rejectWithValue);
  }
});

export const fetchChatByCharacterId = createAsyncThunk(
  "chat/fetchByCharacterId",
  async (characterId: number, { rejectWithValue }) => {
    try {
      return await dbService.getChatByCharacterId(characterId);
    } catch (error) {
      return handleDbError(error, rejectWithValue);
    }
  }
);

export const addChat = createAsyncThunk(
  "chat/add",
  async ({ title, characterId }: { title: string; characterId?: number }, { rejectWithValue }) => {
    try {
      const timestamp = Date.now();
      const newChat = { title, timestamp, content: [], characterId: characterId || null };
      const id = await dbService.addChat(newChat);
      return { id, ...newChat };
    } catch (error) {
      return handleDbError(error, rejectWithValue);
    }
  }
);

export const addMessage = createAsyncThunk(
  "chat/addMessage",
  async ({ chatId, role, text }: { chatId: number; role: string; text: string }, { dispatch, rejectWithValue }) => {
    try {
      const chat = await dbService.getChatById(chatId);
      
      // Retrieve initial messages from localStorage
      const savedMessages = JSON.parse(localStorage.getItem(LS_INITIAL_MESSAGES) || "[]") as any[];

      // If it's the first message, prepopulate with system messages
      if (chat.content.length === 0) {
        savedMessages.forEach((msg) => {
          if (msg.role && msg.message) {
            chat.content.push({ role: msg.role, txt: msg.message, isSystem: true });
          }
        });

        // Fetch character details for system instructions (no longer injected into chat stream directly)
        if (chat.characterId) {
          const character = await dbService.getCharacterById(chat.characterId);
          if (character) {
             // AI configuration moves to ChatPage / aiSlice
          }
        }
      }

      chat.content.push({ role, txt: text });
      await dbService.updateChat(chat);
      dispatch(fetchChats()); // Refresh state
      return chat.content;
    } catch (error) {
      return handleDbError(error, rejectWithValue);
    }
  }
);

export const deleteChat = createAsyncThunk("chat/delete", async (chatId: number, { rejectWithValue }) => {
  try {
    await dbService.deleteChat(chatId);
    return chatId;
  } catch (error) {
    return handleDbError(error, rejectWithValue);
  }
});

export const updateMessages = createAsyncThunk(
  "chat/updateMessages",
  async ({ chatId, newMessages }: { chatId: number; newMessages: Message[] }, { rejectWithValue }) => {
    try {
      const chat = await dbService.getChatById(chatId);
      chat.content = newMessages;
      await dbService.updateChat(chat);
      return { chatId, newMessages };
    } catch (error) {
      return handleDbError(error, rejectWithValue);
    }
  }
);

export const importChat = createAsyncThunk("chat/import", async (chatData: any, { rejectWithValue }) => {
  try {
    const { title, content, characterId, timestamp } = chatData;
    if (!title || !content || !Array.isArray(content)) {
      throw new Error("Invalid chat data format.");
    }

    const newChat = {
      title,
      content,
      characterId: characterId || null,
      timestamp: timestamp || Date.now(),
    };

    const id = await dbService.addChat(newChat);
    return { ...newChat, id };
  } catch (error) {
    return handleDbError(error, rejectWithValue);
  }
});

interface ChatState {
  chats: Chat[];
  loading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  chats: [],
  loading: false,
  error: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchChats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.loading = false;
        state.chats = action.payload;
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchChatById.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(addChat.fulfilled, (state, action) => {
        state.chats.push(action.payload as Chat);
      })
      .addCase(addChat.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(deleteChat.fulfilled, (state, action) => {
        state.chats = state.chats.filter((chat) => chat.id !== action.payload);
      })
      .addCase(deleteChat.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(updateMessages.fulfilled, (state, action) => {
        const chat = state.chats.find((c) => c.id === action.payload.chatId);
        if (chat) {
          chat.content = action.payload.newMessages;
        }
      })
      .addCase(updateMessages.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(importChat.fulfilled, (state, action) => {
        state.chats.push(action.payload as Chat);
      })
      .addCase(importChat.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export default chatSlice.reducer;
