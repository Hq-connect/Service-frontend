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
    // Expected to match backend payload structure
    const response = await api.patch(`/boards/${boardId}/columns/reorder`, { columns: orderedColumnIds }, { headers: getHeaders() });
    return response.data;
};
