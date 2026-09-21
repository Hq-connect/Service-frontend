import api from '@/api/api';
import { getHeaders } from './headers';

export const getColumns = async (boardId) => {
    const response = await api.get(`/boards/${boardId}/columns`, { headers: getHeaders() });
    return response.data;
};

export const createColumn = async (boardId, columnData) => {
    const response = await api.post(`/boards/${boardId}/columns`, columnData, { headers: getHeaders() });
    return response.data;
};

export const updateColumn = async (boardId, columnId, columnData) => {
    const response = await api.patch(`/boards/${boardId}/columns/${columnId}`, columnData, { headers: getHeaders() });
    return response.data;
};

export const deleteColumn = async (boardId, columnId) => {
    const response = await api.delete(`/boards/${boardId}/columns/${columnId}`, { headers: getHeaders() });
    return response.data;
};

export const reorderColumns = async (boardId, orderedColumnIds) => {
    // Backend validates body as a raw array via body().isArray()
    const response = await api.patch(`/boards/${boardId}/columns/reorder`, orderedColumnIds, { headers: getHeaders() });
    return response.data;
};
