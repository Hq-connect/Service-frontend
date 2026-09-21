import api from '@/api/api';
import { getHeaders } from './headers';

// --- Project Labels (CRUD) ---
export const getProjectLabels = async (projectId) => {
    const response = await api.get(`/projects/${projectId}/labels`, { headers: getHeaders() });
    return response.data;
};

export const createProjectLabel = async (projectId, { name, color, description }) => {
    const response = await api.post(`/projects/${projectId}/labels`, { name, color, description }, { headers: getHeaders() });
    return response.data;
};

export const updateProjectLabel = async (projectId, labelId, data) => {
    const response = await api.patch(`/projects/${projectId}/labels/${labelId}`, data, { headers: getHeaders() });
    return response.data;
};

export const deleteProjectLabel = async (projectId, labelId) => {
    const response = await api.delete(`/projects/${projectId}/labels/${labelId}`, { headers: getHeaders() });
    return response.data;
};
