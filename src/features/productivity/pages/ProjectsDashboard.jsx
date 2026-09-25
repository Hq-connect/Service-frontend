import React, { useMemo } from 'react';
import { useProjects, useDeleteProject } from '../queries/project.queries';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveProject, setCreateProjectModalOpen } from '../states/productivity.slice';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, FolderKanban, Trash2, Filter, X, Globe, Lock } from 'lucide-react';

export const ProjectsDashboard = () => {
    const dispatch = useDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const currentView = searchParams.get('view') || 'inbox';

    const currentUser = useSelector((state) => state.auth?.user);
    const currentUserId = currentUser?._id || currentUser?.id;

    const { data: projectsData, isLoading, error } = useProjects(currentUserId);
    const deleteProjectMutation = useDeleteProject();

    const projects = projectsData?.data?.projects || (Array.isArray(projectsData?.data) ? projectsData.data : []);

    const filteredProjects = useMemo(() => {
        if (!projects) return [];
        switch (currentView) {
            case 'archived':
                return projects.filter(p => p.status === 'archived');
            case 'completed':
                return projects.filter(p => p.status === 'completed');
            case 'created':
                return projects.filter(p => String(p.createdBy) === String(currentUserId) || String(p.ownerId) === String(currentUserId));
            case 'assigned':
                return projects; // All projects user is assigned to / has access to
            case 'inbox':
            default:
                return projects.filter(p => p.status !== 'archived');
        }
    }, [projects, currentView, currentUserId]);

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
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">Projects</h1>
                    {currentView !== 'inbox' && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-semibold text-primary">
                            <Filter className="w-3 h-3" />
                            <span>
                                {currentView === 'assigned' ? 'Assigned to me' :
                                 currentView === 'created' ? 'Created by me' :
                                 currentView === 'completed' ? 'Completed' :
                                 currentView === 'archived' ? 'Archived' : currentView} ({filteredProjects.length})
                            </span>
                            <button 
                                type="button" 
                                onClick={() => setSearchParams({})}
                                className="ml-0.5 p-0.5 hover:bg-primary/20 rounded-full transition-colors"
                                title="Clear filter"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>
                <button 
                    onClick={() => dispatch(setCreateProjectModalOpen(true))}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    New Project
                </button>
            </div>

            {filteredProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-card text-card-foreground">
                    <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">
                        {currentView !== 'inbox' ? 'No projects match this filter' : 'No projects found'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        {currentView !== 'inbox' ? 'Try clearing the active filter or selecting another view.' : 'Get started by creating a new project.'}
                    </p>
                    {currentView !== 'inbox' ? (
                        <button 
                            onClick={() => setSearchParams({})}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-4 py-2"
                        >
                            Show all projects
                        </button>
                    ) : (
                        <button 
                            onClick={() => dispatch(setCreateProjectModalOpen(true))}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-4 py-2"
                        >
                            Create Project
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <Link 
                            key={project._id} 
                            to={`/tasks/projects/${project._id}`}
                            onClick={() => dispatch(setActiveProject(project))}
                            className="group relative flex flex-col justify-between rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/50 overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-2 gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-semibold text-lg leading-none tracking-tight">
                                            {project.name}
                                        </h3>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                            project.visibility === 'private'
                                                ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                                : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                                        }`}>
                                            {project.visibility === 'private' ? (
                                                <>
                                                    <Lock className="w-3 h-3" /> Private
                                                </>
                                            ) : (
                                                <>
                                                    <Globe className="w-3 h-3" /> Public
                                                </>
                                            )}
                                        </span>
                                    </div>
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
