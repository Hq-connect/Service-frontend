import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  loading: true,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        removeUser: (state) => {
            state.user = null;
            state.error = null;
        }
    }
});

export const { setUser, setLoading, setError, removeUser } = authSlice.actions;
export default authSlice.reducer;