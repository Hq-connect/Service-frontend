import api from '@/api/api';
import { store } from '@/app/store/store';

const getHeaders = () => {
    const state = store.getState();
    const userId = state.auth?.user?._id; 
    const tenantId = state.tenant?.currentTenant?._id || state.tenant?.id || 'temp-tenant-id';

    return {
        'x-user-id': userId,
        'x-tenant-id': tenantId,
    };
};

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

export const reorderTasks = async (projectId, payload) => {
    // Expected payload: { updates: [{ taskId: '...', position: 0, columnId: '...' }, ...] }
    // Note: Backend might expect a different format for cross-column reordering.
    const response = await api.patch(`/projects/${projectId}/tasks/reorder`, payload, { headers: getHeaders() });
    return response.data;
};
