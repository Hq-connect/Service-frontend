import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as boardService from '../services/board.service';
import * as boardColumnService from '../services/boardColumn.service';

// --- Board Queries & Mutations ---

export const useBoards = (projectId) => {
    return useQuery({
        queryKey: ['productivity-boards', projectId],
        queryFn: () => boardService.getBoards(projectId),
        enabled: !!projectId,
    });
};

export const useBoard = (projectId, boardId) => {
    return useQuery({
        queryKey: ['productivity-board', projectId, boardId],
        queryFn: () => boardService.getBoardById(projectId, boardId),
        enabled: !!projectId && !!boardId,
    });
};

export const useCreateBoard = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, data }) => boardService.createBoard(projectId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['productivity-boards', variables.projectId] });
        },
    });
};

export const useUpdateBoard = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, boardId, data }) => boardService.updateBoard(projectId, boardId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['productivity-boards', variables.projectId] });
            queryClient.invalidateQueries({ queryKey: ['productivity-board', variables.projectId, variables.boardId] });
        },
    });
};

export const useDeleteBoard = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, boardId }) => boardService.deleteBoard(projectId, boardId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['productivity-boards', variables.projectId] });
        },
    });
};

// --- Board Column Queries & Mutations ---

export const useBoardColumns = (boardId) => {
    return useQuery({
        queryKey: ['productivity-board-columns', boardId],
        queryFn: () => boardColumnService.getColumns(boardId),
        enabled: !!boardId,
    });
};

export const useCreateColumn = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ boardId, data }) => boardColumnService.createColumn(boardId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['productivity-board-columns', variables.boardId] });
        },
    });
};

export const useUpdateColumn = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ boardId, columnId, data }) => boardColumnService.updateColumn(boardId, columnId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['productivity-board-columns', variables.boardId] });
        },
    });
};

export const useDeleteColumn = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ boardId, columnId }) => boardColumnService.deleteColumn(boardId, columnId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['productivity-board-columns', variables.boardId] });
        },
    });
};

export const useReorderColumns = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ boardId, orderedColumnIds }) => boardColumnService.reorderColumns(boardId, orderedColumnIds),
        // Optimistic updates can be added here for a snappier drag-and-drop experience
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['productivity-board-columns', variables.boardId] });
        },
    });
};
