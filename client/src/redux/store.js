import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./userSlice";

export default configureStore({
  reducer: {
    auth: authReducer
  }
});