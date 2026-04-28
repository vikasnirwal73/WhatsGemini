import { configureStore } from "@reduxjs/toolkit";
import chatReducer from "../features/chatSlice";
import characterReducer from "../features/characterSlice";
import aiReducer from "../features/aiSlice";

// Configure Redux Store
export const store = configureStore({
  reducer: {
    chat: chatReducer,
    character: characterReducer,
    ai: aiReducer,
  },
  devTools: process.env.NODE_ENV !== "production", // Enable Redux DevTools in development
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Debug Logging (Only in Development)
if (process.env.NODE_ENV === "development") {
  store.subscribe(() => {
    console.debug("Updated Redux State:", store.getState());
  });
}

export default store;
