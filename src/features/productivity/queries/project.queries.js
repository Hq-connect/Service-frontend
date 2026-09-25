import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as projectService from '../services/project.service';

export const useProjects = (userId) => {
    return useQuery({
        queryKey: ['productivity-projects', userId],
        queryFn: projectService.getProjects,
    });
};

export const useProject = (projectId) => {
    return useQuery({
        queryKey: ['productivity-project', projectId],
        queryFn: () => projectService.getProjectById(projectId),
        enabled: !!projectId,
    });
};

export const useCreateProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: projectService.createProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['productivity-projects'] });
        },
    });
};

export const useUpdateProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, data }) => projectService.updateProject(projectId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['productivity-projects'] });
            queryClient.invalidateQueries({ queryKey: ['productivity-project', variables.projectId] });
        },
    });
};

export const useDeleteProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: projectService.deleteProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['productivity-projects'] });
        },
    });
};

// Members
export const useProjectMembers = (projectId) => {
    return useQuery({
        queryKey: ['productivity-project-members', projectId],
        queryFn: () => projectService.getProjectMembers(projectId),
        enabled: !!projectId,
    });
};

export const useAddProjectMember = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, data }) => projectService.addProjectMember(projectId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['productivity-project-members', variables.projectId] });
        },
    });
};

export const useRemoveProjectMember = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, userId }) => projectService.removeProjectMember(projectId, userId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['productivity-project-members', variables.projectId] });
        },
    });
};
