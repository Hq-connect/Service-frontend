import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as taskService from '../services/task.service';

// Helper: produce updated subtasks array optimistically
const applyOptimisticToggle = (task, subtaskId, isCompleted) => {
    if (!task?.subtasks) return task;
    return {
        ...task,
        subtasks: task.subtasks.map((st) =>
            st._id === subtaskId ? { ...st, isCompleted } : st
        ),
    };
};

export const useTasks = (projectId, params = {}) => {
    return useQuery({
        queryKey: ['productivity-tasks', projectId, params],
        queryFn: () => taskService.getTasks(projectId, params),
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
            queryClient.invalidateQueries({ queryKey: ['productivity-task', variables.projectId, variables.taskId] });
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

// --- SUBTASK MUTATIONS ---

export const useAddSubtask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, taskId, title, assignedTo, dueDate }) =>
            taskService.addSubtask(projectId, taskId, { title, assignedTo, dueDate }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['productivity-task', variables.projectId, variables.taskId] });
            queryClient.invalidateQueries({ queryKey: ['productivity-tasks', variables.projectId] });
        },
    });
};

export const useToggleSubtask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, taskId, subtaskId, isCompleted }) =>
            taskService.toggleSubtask(projectId, taskId, subtaskId, isCompleted),
        // Optimistic update — checkbox reacts immediately
        onMutate: async ({ projectId, taskId, subtaskId, isCompleted }) => {
            const queryKey = ['productivity-task', projectId, taskId];
            await queryClient.cancelQueries({ queryKey });
            const previous = queryClient.getQueryData(queryKey);
            queryClient.setQueryData(queryKey, (old) => {
                if (!old?.data?.task) return old;
                return {
                    ...old,
                    data: {
                        ...old.data,
                        task: applyOptimisticToggle(old.data.task, subtaskId, isCompleted),
                    },
                };
            });
            return { previous };
        },
        onError: (_err, { projectId, taskId }, context) => {
            if (context?.previous) {
                queryClient.setQueryData(['productivity-task', projectId, taskId], context.previous);
            }
        },
        // Always re-fetch after settle — backend may have auto-moved task status
        onSettled: (_, __, { projectId, taskId }) => {
            queryClient.invalidateQueries({ queryKey: ['productivity-task', projectId, taskId] });
            queryClient.invalidateQueries({ queryKey: ['productivity-tasks', projectId] });
            queryClient.invalidateQueries({ queryKey: ['taskDetails', projectId, taskId, 'activities'] });
        },
    });
};

export const useUpdateSubtask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, taskId, subtaskId, data }) =>
            taskService.updateSubtask(projectId, taskId, subtaskId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['productivity-task', variables.projectId, variables.taskId] });
            queryClient.invalidateQueries({ queryKey: ['productivity-tasks', variables.projectId] });
        },
    });
};

export const useDeleteSubtask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, taskId, subtaskId }) =>
            taskService.deleteSubtask(projectId, taskId, subtaskId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['productivity-task', variables.projectId, variables.taskId] });
            queryClient.invalidateQueries({ queryKey: ['productivity-tasks', variables.projectId] });
        },
    });
};
