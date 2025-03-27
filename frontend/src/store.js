import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/auth/authSlice";
import notesReducer from "./features/notes/notesSlice";
import tagsReducer from "./features/tags/tagsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notes: notesReducer,
    tags: tagsReducer,
  },
});

export default store;
