import api from '@/api/api';
import { getHeaders } from './headers';

export const getTasks = async (projectId, params = {}) => {
    const response = await api.get(`/projects/${projectId}/tasks`, { 
        headers: getHeaders(),
        params: { limit: 100, ...params }
    });
    return response.data;
};

export const getTaskById = async (projectId, taskId) => {
    const response = await api.get(`/projects/${projectId}/tasks/${taskId}`, { headers: getHeaders() });
    return response.data;
};

export const createTask = async (projectId, taskData) => {
    const response = await api.post(`/projects/${projectId}/tasks`, taskData, { headers: getHeaders() });
    return response.data;
};

export const updateTask = async (projectId, taskId, taskData) => {
    const response = await api.patch(`/projects/${projectId}/tasks/${taskId}`, taskData, { headers: getHeaders() });
    return response.data;
};

export const deleteTask = async (projectId, taskId) => {
    const response = await api.delete(`/projects/${projectId}/tasks/${taskId}`, { headers: getHeaders() });
    return response.data;
};

export const moveTask = async (projectId, taskId, { columnId, position, status }) => {
    const response = await api.patch(
        `/projects/${projectId}/tasks/${taskId}/move`,
        { columnId, position, status },
        { headers: getHeaders() }
    );
    return response.data;
};

export const reorderTasks = async (projectId, updates) => {
    // Backend expects a raw array: [{ taskId, columnId, position }, ...]
    const response = await api.patch(`/projects/${projectId}/tasks/reorder`, updates, { headers: getHeaders() });
    return response.data;
};

export const assignTask = async (projectId, taskId, userId) => {
    const response = await api.patch(
        `/projects/${projectId}/tasks/${taskId}/assignee`,
        { userId },
        { headers: getHeaders() }
    );
    return response.data;
};

export const unassignTask = async (projectId, taskId) => {
    const response = await api.delete(
        `/projects/${projectId}/tasks/${taskId}/assignee`,
        { headers: getHeaders() }
    );
    return response.data;
};

// --- SUBTASKS ---
export const addSubtask = async (projectId, taskId, { title, assignedTo, dueDate } = {}) => {
    const response = await api.post(
        `/projects/${projectId}/tasks/${taskId}/subtasks`,
        { title, assignedTo, dueDate },
        { headers: getHeaders() }
    );
    return response.data;
};

export const toggleSubtask = async (projectId, taskId, subtaskId, isCompleted) => {
    const response = await api.patch(
        `/projects/${projectId}/tasks/${taskId}/subtasks/${subtaskId}/toggle`,
        { isCompleted },
        { headers: getHeaders() }
    );
    return response.data;
};

export const updateSubtask = async (projectId, taskId, subtaskId, data) => {
    const response = await api.patch(
        `/projects/${projectId}/tasks/${taskId}/subtasks/${subtaskId}`,
        data,
        { headers: getHeaders() }
    );
    return response.data;
};

export const deleteSubtask = async (projectId, taskId, subtaskId) => {
    const response = await api.delete(
        `/projects/${projectId}/tasks/${taskId}/subtasks/${subtaskId}`,
        { headers: getHeaders() }
    );
    return response.data;
};
