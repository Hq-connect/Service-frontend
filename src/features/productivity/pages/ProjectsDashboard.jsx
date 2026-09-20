import React, { useState } from 'react';
import { useProjects, useDeleteProject } from '../queries/project.queries';
import { useDispatch } from 'react-redux';
import { setActiveProject, setCreateProjectModalOpen } from '../states/productivity.slice';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { Link } from 'react-router-dom';
import { Plus, FolderKanban, Trash2 } from 'lucide-react';

export const ProjectsDashboard = () => {
    const dispatch = useDispatch();
    const { data: projectsData, isLoading, error } = useProjects();
    const deleteProjectMutation = useDeleteProject();

    const projects = projectsData?.data || []; // Assuming backend returns { data: [...] }

    const handleDelete = (e, projectId) => {
        e.preventDefault();
        if (window.confirm('Are you sure you want to delete this project?')) {
            deleteProjectMutation.mutate(projectId);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading projects...</div>;
    if (error) return <div className="p-8 text-destructive">Error loading projects.</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">Projects</h1>
                <button 
                    onClick={() => dispatch(setCreateProjectModalOpen(true))}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    New Project
                </button>
            </div>

            {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-card text-card-foreground">
                    <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No projects found</h3>
                    <p className="text-sm text-muted-foreground mb-4">Get started by creating a new project.</p>
                    <button 
                        onClick={() => dispatch(setCreateProjectModalOpen(true))}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-4 py-2"
                    >
                        Create Project
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <Link 
                            key={project._id} 
                            to={`/productivity/projects/${project._id}`}
                            onClick={() => dispatch(setActiveProject(project))}
                            className="group relative flex flex-col justify-between rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/50 overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-lg leading-none tracking-tight">
                                        {project.name}
                                    </h3>
                                    <button 
                                        onClick={(e) => handleDelete(e, project._id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 rounded-md"
                                        title="Delete Project"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                                    {project.description || 'No description provided.'}
                                </p>
                            </div>
                            <div className="p-6 pt-0 mt-auto border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground mt-4 py-3">
                                <span>Status: {project.status || 'Active'}</span>
                                {project.createdAt && (
                                    <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            <CreateProjectModal />
        </div>
    );
};
