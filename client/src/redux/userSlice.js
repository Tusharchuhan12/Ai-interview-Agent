import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
    name: "user",
    initialState: {
        user: null,
    },
    reducers: {
        setUserData: (state, action) => {
            state.user = action.payload;
        },
        logoutUser: (state) => {
            state.user = null;
        },
    },
});

export const { setUserData, logoutUser } = userSlice.actions;

// 👇 IMPORTANT LINE
export default userSlice.reducer;