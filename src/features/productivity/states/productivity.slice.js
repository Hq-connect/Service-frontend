import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeProject: null,
  isCreateProjectModalOpen: false,
};

const productivitySlice = createSlice({
  name: 'productivity',
  initialState,
  reducers: {
    setActiveProject: (state, action) => {
      state.activeProject = action.payload;
    },
    setCreateProjectModalOpen: (state, action) => {
      state.isCreateProjectModalOpen = action.payload;
    },
  },
});

export const { setActiveProject, setCreateProjectModalOpen } = productivitySlice.actions;

export default productivitySlice.reducer;
