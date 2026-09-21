import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as taskDetailsService from '../services/taskDetails.service';

export const taskDetailsKeys = {
    all: (projectId, taskId) => ['taskDetails', projectId, taskId],
    comments: (projectId, taskId) => [...taskDetailsKeys.all(projectId, taskId), 'comments'],
    activities: (projectId, taskId) => [...taskDetailsKeys.all(projectId, taskId), 'activities'],
    labels: (projectId, taskId) => [...taskDetailsKeys.all(projectId, taskId), 'labels'],
    attachments: (projectId, taskId) => [...taskDetailsKeys.all(projectId, taskId), 'attachments'],
};

// --- COMMENTS ---
export const useTaskComments = (projectId, taskId) => {
    return useQuery({
        queryKey: taskDetailsKeys.comments(projectId, taskId),
        queryFn: () => taskDetailsService.getTaskComments(projectId, taskId),
        enabled: !!projectId && !!taskId,
    });
};

export const useCreateTaskComment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, taskId, content }) => taskDetailsService.createTaskComment(projectId, taskId, content),
        onSuccess: (data, { projectId, taskId }) => {
            queryClient.invalidateQueries({ queryKey: taskDetailsKeys.comments(projectId, taskId) });
            queryClient.invalidateQueries({ queryKey: taskDetailsKeys.activities(projectId, taskId) });
        },
    });
};

export const useUpdateTaskComment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, taskId, commentId, content }) => taskDetailsService.updateTaskComment(projectId, taskId, commentId, content),
        onSuccess: (data, { projectId, taskId }) => {
            queryClient.invalidateQueries({ queryKey: taskDetailsKeys.comments(projectId, taskId) });
            queryClient.invalidateQueries({ queryKey: taskDetailsKeys.activities(projectId, taskId) });
        },
    });
};

export const useDeleteTaskComment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, taskId, commentId }) => taskDetailsService.deleteTaskComment(projectId, taskId, commentId),
        onSuccess: (data, { projectId, taskId }) => {
            queryClient.invalidateQueries({ queryKey: taskDetailsKeys.comments(projectId, taskId) });
            queryClient.invalidateQueries({ queryKey: taskDetailsKeys.activities(projectId, taskId) });
        },
    });
};

// --- ACTIVITIES ---
export const useTaskActivities = (projectId, taskId) => {
    return useQuery({
        queryKey: taskDetailsKeys.activities(projectId, taskId),
        queryFn: () => taskDetailsService.getTaskActivities(projectId, taskId),
        enabled: !!projectId && !!taskId,
    });
};

// --- LABELS ---
export const useTaskLabels = (projectId, taskId) => {
    return useQuery({
        queryKey: taskDetailsKeys.labels(projectId, taskId),
        queryFn: () => taskDetailsService.getTaskLabels(projectId, taskId),
        enabled: !!projectId && !!taskId,
    });
};

export const useAddLabelsToTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, taskId, labelIds }) => taskDetailsService.addLabelsToTask(projectId, taskId, labelIds),
        onSuccess: (data, { projectId, taskId }) => {
            queryClient.invalidateQueries({ queryKey: taskDetailsKeys.labels(projectId, taskId) });
            queryClient.invalidateQueries({ queryKey: ['task-labels', projectId, taskId] });
            queryClient.invalidateQueries({ queryKey: ['productivity-tasks', projectId] });
        },
    });
};

export const useRemoveLabelsFromTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, taskId, labelIds }) => taskDetailsService.removeLabelsFromTask(projectId, taskId, labelIds),
        onSuccess: (data, { projectId, taskId }) => {
            queryClient.invalidateQueries({ queryKey: taskDetailsKeys.labels(projectId, taskId) });
            queryClient.invalidateQueries({ queryKey: ['task-labels', projectId, taskId] });
            queryClient.invalidateQueries({ queryKey: ['productivity-tasks', projectId] });
        },
    });
};

// --- ATTACHMENTS ---
export const useTaskAttachments = (projectId, taskId) => {
    return useQuery({
        queryKey: taskDetailsKeys.attachments(projectId, taskId),
        queryFn: () => taskDetailsService.getTaskAttachments(projectId, taskId),
        enabled: !!projectId && !!taskId,
    });
};

export const useCreateTaskAttachment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, taskId, file }) => taskDetailsService.createTaskAttachment(projectId, taskId, file),
        onSuccess: (data, { projectId, taskId }) => {
            queryClient.invalidateQueries({ queryKey: taskDetailsKeys.attachments(projectId, taskId) });
            queryClient.invalidateQueries({ queryKey: taskDetailsKeys.activities(projectId, taskId) });
        },
    });
};

export const useDeleteTaskAttachment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, taskId, attachmentId }) => taskDetailsService.deleteTaskAttachment(projectId, taskId, attachmentId),
        onSuccess: (data, { projectId, taskId }) => {
            queryClient.invalidateQueries({ queryKey: taskDetailsKeys.attachments(projectId, taskId) });
            queryClient.invalidateQueries({ queryKey: taskDetailsKeys.activities(projectId, taskId) });
        },
    });
};
