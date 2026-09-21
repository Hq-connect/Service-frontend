import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as taskService from '../services/task.service';

export const useTasks = (projectId) => {
    return useQuery({
        queryKey: ['productivity-tasks', projectId],
        queryFn: () => taskService.getTasks(projectId),
        enabled: !!projectId,
    });
};

export const useTask = (projectId, taskId) => {
    return useQuery({
        queryKey: ['productivity-task', projectId, taskId],
        queryFn: () => taskService.getTaskById(projectId, taskId),
        enabled: !!projectId && !!taskId,
    });
};

export const useCreateTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, data }) => taskService.createTask(projectId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['productivity-tasks', variables.projectId] });
        },
    });
};

export const useUpdateTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, taskId, data }) => taskService.updateTask(projectId, taskId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['productivity-tasks', variables.projectId] });
            queryClient.invalidateQueries({ queryKey: ['productivity-task', variables.projectId, variables.taskId] });
        },
    });
};

export const useDeleteTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, taskId }) => taskService.deleteTask(projectId, taskId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['productivity-tasks', variables.projectId] });
        },
    });
};

export const useMoveTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, taskId, moveData }) => taskService.moveTask(projectId, taskId, moveData),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['productivity-tasks', variables.projectId] });
        },
    });
};

export const useReorderTasks = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, updates }) => taskService.reorderTasks(projectId, updates),
        // Optimistic updates handled in the component
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['productivity-tasks', variables.projectId] });
        },
    });
};

export const useAssignTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, taskId, userId }) => taskService.assignTask(projectId, taskId, userId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['productivity-tasks', variables.projectId] });
            queryClient.invalidateQueries({ queryKey: ['productivity-task', variables.projectId, variables.taskId] });
            queryClient.invalidateQueries({ queryKey: ['task-activities', variables.taskId] });
        },
    });
};

export const useUnassignTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, taskId }) => taskService.unassignTask(projectId, taskId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['productivity-tasks', variables.projectId] });
            queryClient.invalidateQueries({ queryKey: ['productivity-task', variables.projectId, variables.taskId] });
            queryClient.invalidateQueries({ queryKey: ['task-activities', variables.taskId] });
        },
    });
};
