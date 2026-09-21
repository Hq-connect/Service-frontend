import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    activeProject: null,
    activeBoardId: null,
    isCreateProjectModalOpen: false,
    selectedTaskId: null,
    taskCounts: null,
};

export const productivitySlice = createSlice({
    name: 'productivity',
    initialState,
    reducers: {
        setActiveProject: (state, action) => {
            state.activeProject = action.payload;
        },
        setActiveBoardId: (state, action) => {
            state.activeBoardId = action.payload;
        },
        setCreateProjectModalOpen: (state, action) => {
            state.isCreateProjectModalOpen = action.payload;
        },
        setSelectedTaskId: (state, action) => {
            state.selectedTaskId = action.payload;
        },
        setTaskCounts: (state, action) => {
            state.taskCounts = action.payload;
        },
    },
});

export const { 
    setActiveProject, 
    setActiveBoardId, 
    setCreateProjectModalOpen,
    setSelectedTaskId,
    setTaskCounts
} = productivitySlice.actions;

export default productivitySlice.reducer;
