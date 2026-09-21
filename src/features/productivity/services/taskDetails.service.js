import api from '@/api/api';
import { getHeaders } from './headers';

const getMultipartHeaders = () => ({
    ...getHeaders(),
    'Content-Type': 'multipart/form-data',
});

// --- COMMENTS ---
export const getTaskComments = async (projectId, taskId) => {
    const response = await api.get(`/projects/${projectId}/tasks/${taskId}/comments`, { headers: getHeaders() });
    return response.data;
};

export const createTaskComment = async (projectId, taskId, content) => {
    const response = await api.post(`/projects/${projectId}/tasks/${taskId}/comments`, { content }, { headers: getHeaders() });
    return response.data;
};

export const updateTaskComment = async (projectId, taskId, commentId, content) => {
    const response = await api.patch(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`, { content }, { headers: getHeaders() });
    return response.data;
};

export const deleteTaskComment = async (projectId, taskId, commentId) => {
    const response = await api.delete(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`, { headers: getHeaders() });
    return response.data;
};

// --- ACTIVITIES ---
export const getTaskActivities = async (projectId, taskId) => {
    const response = await api.get(`/projects/${projectId}/tasks/${taskId}/activities`, { headers: getHeaders() });
    return response.data;
};

// --- LABELS ---
export const getTaskLabels = async (projectId, taskId) => {
    const response = await api.get(`/projects/${projectId}/tasks/${taskId}/labels`, { headers: getHeaders() });
    return response.data;
};

export const addLabelsToTask = async (projectId, taskId, labelIds) => {
    const response = await api.post(`/projects/${projectId}/tasks/${taskId}/labels`, { labelIds }, { headers: getHeaders() });
    return response.data;
};

export const removeLabelsFromTask = async (projectId, taskId, labelIds) => {
    const response = await api.delete(`/projects/${projectId}/tasks/${taskId}/labels`, {
        headers: getHeaders(),
        data: { labelIds } // Axios requires body in `data` for DELETE requests
    });
    return response.data;
};

export const setTaskLabels = async (projectId, taskId, labelIds) => {
    const response = await api.put(`/projects/${projectId}/tasks/${taskId}/labels`, { labelIds }, { headers: getHeaders() });
    return response.data;
};

// --- ATTACHMENTS ---
export const getTaskAttachments = async (projectId, taskId) => {
    const response = await api.get(`/projects/${projectId}/tasks/${taskId}/attachments`, { headers: getHeaders() });
    return response.data;
};

export const createTaskAttachment = async (projectId, taskId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/projects/${projectId}/tasks/${taskId}/attachments`, formData, {
        headers: getHeaders()
    });
    return response.data;
};

export const deleteTaskAttachment = async (projectId, taskId, attachmentId) => {
    const response = await api.delete(`/projects/${projectId}/tasks/${taskId}/attachments/${attachmentId}`, { headers: getHeaders() });
    return response.data;
};
