import api from '@/api/api';
import { getHeaders } from './headers';

export const getBoards = async (projectId) => {
    const response = await api.get(`/projects/${projectId}/boards`, { headers: getHeaders() });
    return response.data;
};

export const getBoardById = async (projectId, boardId) => {
    const response = await api.get(`/projects/${projectId}/boards/${boardId}`, { headers: getHeaders() });
    return response.data;
};

export const createBoard = async (projectId, boardData) => {
    const response = await api.post(`/projects/${projectId}/boards`, boardData, { headers: getHeaders() });
    return response.data;
};

export const updateBoard = async (projectId, boardId, boardData) => {
    const response = await api.patch(`/projects/${projectId}/boards/${boardId}`, boardData, { headers: getHeaders() });
    return response.data;
};

export const deleteBoard = async (projectId, boardId) => {
    const response = await api.delete(`/projects/${projectId}/boards/${boardId}`, { headers: getHeaders() });
    return response.data;
};
