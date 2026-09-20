import api from '@/api/api';
import { store } from '@/app/store/store';

// Helper to get required headers
const getHeaders = () => {
    const state = store.getState();
    // Assuming auth and tenant slices have user._id and currentTenant._id
    // Adjust these selectors based on your actual state structure
    const userId = state.auth?.user?._id; 
    const tenantId = state.tenant?.currentTenant?._id || state.tenant?.id || 'temp-tenant-id';

    return {
        'x-user-id': userId,
        'x-tenant-id': tenantId,
    };
};

export const getProjects = async () => {
    const response = await api.get('/projects', { headers: getHeaders() });
    return response.data;
};

export const getProjectById = async (projectId) => {
    const response = await api.get(`/projects/${projectId}`, { headers: getHeaders() });
    return response.data;
};

export const createProject = async (projectData) => {
    const response = await api.post('/projects', projectData, { headers: getHeaders() });
    return response.data;
};

export const updateProject = async (projectId, projectData) => {
    const response = await api.patch(`/projects/${projectId}`, projectData, { headers: getHeaders() });
    return response.data;
};

export const deleteProject = async (projectId) => {
    const response = await api.delete(`/projects/${projectId}`, { headers: getHeaders() });
    return response.data;
};

// Project Members
export const getProjectMembers = async (projectId) => {
    const response = await api.get(`/projects/${projectId}/members`, { headers: getHeaders() });
    return response.data;
};

export const addProjectMember = async (projectId, memberData) => {
    const response = await api.post(`/projects/${projectId}/members`, memberData, { headers: getHeaders() });
    return response.data;
};

export const removeProjectMember = async (projectId, userId) => {
    const response = await api.delete(`/projects/${projectId}/members/${userId}`, { headers: getHeaders() });
    return response.data;
};
