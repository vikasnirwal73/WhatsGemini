import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import Dexie from "dexie";
import { AI, DB_NAME, LS_INITIAL_MESSAGES, YOU } from "../utils/constants";

// Initialize database
export const db = new Dexie(DB_NAME);
db.version(2).stores({
  chats: "++id, title, timestamp, content, characterId",
  characters: "++id, name, description, prompt",
});

// Helper function for error handling
const handleDbError = (error, rejectWithValue) => {
  console.error("Database Error:", error);
  return rejectWithValue(error.message || "An error occurred while accessing the database.");
};

// Async Thunks
export const fetchChats = createAsyncThunk("chat/fetchAll", async (_, { rejectWithValue }) => {
  try {
    return await db.chats.orderBy("timestamp").toArray();
  } catch (error) {
    return handleDbError(error, rejectWithValue);
  }
});

export const fetchChatById = createAsyncThunk("chat/fetchById", async (id, { rejectWithValue }) => {
  try {
    const chat = await db.chats.get(id);
    if (!chat) throw new Error("Chat not found.");
    return chat;
  } catch (error) {
    return handleDbError(error, rejectWithValue);
  }
});

export const fetchChatByCharacterId = createAsyncThunk(
  "chat/fetchByCharacterId",
  async (characterId, { rejectWithValue }) => {
    try {
      return await db.chats.where("characterId").equals(characterId).first();
    } catch (error) {
      return handleDbError(error, rejectWithValue);
    }
  }
);

export const addChat = createAsyncThunk("chat/add", async ({ title, characterId }, { rejectWithValue }) => {
  try {
    const timestamp = Date.now();
    const id = await db.chats.add({ title, timestamp, content: [], characterId });
    return { id, title, timestamp, content: [], characterId };
  } catch (error) {
    return handleDbError(error, rejectWithValue);
  }
});

export const addMessage = createAsyncThunk(
  "chat/addMessage",
  async ({ chatId, role, text }, { dispatch, rejectWithValue }) => {
    try {
      const chat = await db.chats.get(chatId);
      if (!chat) throw new Error("Chat not found.");

      // Retrieve initial messages from localStorage
      const savedMessages = JSON.parse(localStorage.getItem(LS_INITIAL_MESSAGES)) || [];

      // If it's the first message, prepopulate with system messages
      if (chat.content.length === 0) {
        savedMessages.forEach((msg) => {
          if (msg.role && msg.message) {
            chat.content.push({ role: msg.role, txt: msg.message });
          }
        });

        // Fetch character details
        const character = await db.characters.get(chat.characterId);
        if (chat.characterId && character) {
          chat.content.push({
            role: YOU,
            txt: `Role play as, Character Name: ${character.name}.\nCharacter description: ${character.description}.\nExample dialogue: ${character.prompt}`,
          });
          chat.content.push({
            role: AI,
            txt: `Understood, I'll play as ${character.name} from now on.`,
          });
        }
      }

      chat.content.push({ role, txt: text });
      await db.chats.put(chat);
      dispatch(fetchChats()); // Refresh state
      return chat.content;
    } catch (error) {
      return handleDbError(error, rejectWithValue);
    }
  }
);

export const deleteChat = createAsyncThunk("chat/delete", async (chatId, { rejectWithValue }) => {
  try {
    await db.chats.delete(chatId);
    return chatId;
  } catch (error) {
    return handleDbError(error, rejectWithValue);
  }
});

export const updateMessages = createAsyncThunk(
  "chat/updateMessages",
  async ({ chatId, newMessages }, { rejectWithValue }) => {
    try {
      const chat = await db.chats.get(chatId);
      if (!chat) throw new Error("Chat not found.");
      
      chat.content = newMessages;
      await db.chats.put(chat);
      return { chatId, newMessages };
    } catch (error) {
      return handleDbError(error, rejectWithValue);
    }
  }
);

export const importChat = createAsyncThunk("chat/import", async (chatData, { rejectWithValue }) => {
  try {
    const { title, content, characterId, timestamp } = chatData;
    // Basic validation
    if (!title || !content || !Array.isArray(content)) {
      throw new Error("Invalid chat data format.");
    }

    // Create new chat object, ignoring original ID
    const newChat = {
      title,
      content,
      characterId: characterId || null,
      timestamp: timestamp || Date.now(),
    };

    const id = await db.chats.add(newChat);
    return { ...newChat, id };
  } catch (error) {
    return handleDbError(error, rejectWithValue);
  }
});

// Chat Slice
const chatSlice = createSlice({
  name: "chat",
  initialState: { chats: [], loading: false, error: null },
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
        state.error = action.payload;
      })
      .addCase(fetchChatById.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(addChat.fulfilled, (state, action) => {
        state.chats.push(action.payload);
      })
      .addCase(addChat.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(deleteChat.fulfilled, (state, action) => {
        state.chats = state.chats.filter((chat) => chat.id !== action.payload);
      })
      .addCase(deleteChat.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(updateMessages.fulfilled, (state, action) => {
        const chat = state.chats.find((c) => c.id === action.payload.chatId);
        if (chat) {
          chat.content = action.payload.newMessages;
        }
      })
      .addCase(updateMessages.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(importChat.fulfilled, (state, action) => {
        state.chats.push(action.payload);
      })
      .addCase(importChat.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default chatSlice.reducer;
