import api from '@/api/api';
import { getHeaders } from './headers';

export const getTasks = async (projectId) => {
    const response = await api.get(`/projects/${projectId}/tasks`, { headers: getHeaders() });
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
