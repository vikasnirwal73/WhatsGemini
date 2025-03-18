import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { db } from "./chatSlice";
import { CHARACTER } from "../utils/constants";

// Helper function to handle database errors
const handleDbError = (error, rejectWithValue) => {
  console.error("Database Error:", error);
  return rejectWithValue(error.message || "An error occurred while accessing the database.");
};

// Async Thunks
export const fetchCharacters = createAsyncThunk(
  "character/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await db.characters.toArray();
    } catch (error) {
      return handleDbError(error, rejectWithValue);
    }
  }
);

export const fetchCharacterById = createAsyncThunk(
  "character/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const character = await db.characters.get(id);
      if (!character) throw new Error("Character not found.");
      return character;
    } catch (error) {
      return handleDbError(error, rejectWithValue);
    }
  }
);

export const addCharacter = createAsyncThunk(
  "character/add",
  async ({ name, description, prompt }, { rejectWithValue }) => {
    try {
      if (!name.trim() || !prompt.trim()) {
        throw new Error("Character name and prompt are required.");
      }
      const id = await db.characters.add({ name, description, prompt });
      return { id, name, description, prompt };
    } catch (error) {
      return handleDbError(error, rejectWithValue);
    }
  }
);

export const deleteCharacter = createAsyncThunk(
  "character/delete",
  async (characterId, { rejectWithValue }) => {
    try {
      await db.chats.where("characterId").equals(characterId).delete();
      await db.characters.delete(characterId);
      return characterId;
    } catch (error) {
      return handleDbError(error, rejectWithValue);
    }
  }
);

export const updateCharacter = createAsyncThunk(
  "character/update",
  async ({ id, name, description, prompt }, { rejectWithValue }) => {
    try {
      await db.characters.update(id, { name, description, prompt });
      return { id, name, description, prompt };
    } catch (error) {
      return rejectWithValue("Failed to update character.");
    }
  }
);

// Character Slice
const characterSlice = createSlice({
  name: CHARACTER,
  initialState: { characters: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCharacters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCharacters.fulfilled, (state, action) => {
        state.loading = false;
        state.characters = action.payload;
      })
      .addCase(fetchCharacters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCharacterById.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(addCharacter.fulfilled, (state, action) => {
        state.characters.push(action.payload);
      })
      .addCase(addCharacter.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(deleteCharacter.fulfilled, (state, action) => {
        state.characters = state.characters.filter((char) => char.id !== action.payload);
      })
      .addCase(deleteCharacter.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default characterSlice.reducer;
