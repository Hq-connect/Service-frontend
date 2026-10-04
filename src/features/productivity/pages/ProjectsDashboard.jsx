import React, { useState, useMemo } from 'react';
import { useProjects, useDeleteProject } from '../queries/project.queries';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveProject, setCreateProjectModalOpen } from '../states/productivity.slice';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { Link, useSearchParams } from 'react-router-dom';
import { 
    Plus, FolderKanban, Trash2, Search, X, ArrowRight, 
    ArrowUpDown, Check, MoreHorizontal, Layers, CheckCircle2, Archive, UserCheck
} from 'lucide-react';
import { 
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { getInitials, getAvatarStyle } from '@/global/utils/user';

export const ProjectsDashboard = () => {
    const dispatch = useDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const currentView = searchParams.get('view') || 'all';

    const currentUser = useSelector((state) => state.auth?.user);
    const currentUserId = currentUser?._id || currentUser?.id;

    // Sorting state
    const [sortField, setSortField] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [searchQuery, setSearchQuery] = useState('');

    // Query parameters forwarded directly to the backend
    const projectParams = useMemo(() => {
        const params = {
            sortBy: sortField,
            sortOrder: sortOrder,
        };
        if (searchQuery.trim()) {
            params.search = searchQuery.trim();
        }
        if (currentView === 'created') {
            params.status = 'created';
        } else if (currentView === 'completed') {
            params.status = 'completed';
        } else if (currentView === 'archived') {
            params.status = 'archived';
        } else if (currentView === 'assigned') {
            params.status = 'active';
        } else {
            params.status = 'active';
        }
        return params;
    }, [currentView, searchQuery, sortField, sortOrder]);

    const { data: projectsData, isLoading, error } = useProjects(projectParams);
    const deleteProjectMutation = useDeleteProject();

    const projects = projectsData?.data?.projects || (Array.isArray(projectsData?.data) ? projectsData.data : []);

    const handleDelete = (e, projectId) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this project? All associated boards, columns, and tasks will be removed.')) {
            deleteProjectMutation.mutate(projectId);
        }
    };

    const handleViewChange = (view) => {
        const next = new URLSearchParams(searchParams);
        if (view === 'all') {
            next.delete('view');
        } else {
            next.set('view', view);
        }
        setSearchParams(next);
    };

    const sortOptions = [
        { label: 'Recently Created', field: 'createdAt', order: 'desc' },
        { label: 'Oldest Created', field: 'createdAt', order: 'asc' },
        { label: 'Name (A → Z)', field: 'name', order: 'asc' },
        { label: 'Name (Z → A)', field: 'name', order: 'desc' },
        { label: 'Recently Updated', field: 'updatedAt', order: 'desc' },
    ];

    const currentSortLabel = sortOptions.find(
        (o) => o.field === sortField && o.order === sortOrder
    )?.label || 'Sort';

    const getEmptyStateContent = () => {
        if (searchQuery.trim()) {
            return {
                title: `No projects found for "${searchQuery}"`,
                description: 'Try adjusting your search terms or clearing your search filter.',
                showClearSearch: true,
            };
        }
        switch (currentView) {
            case 'created':
                return {
                    icon: <Layers className="h-9 w-9 text-muted-foreground/60 mb-2" />,
                    title: 'No projects created by you yet',
                    description: 'Start by creating your first project space to manage tasks, boards, and team workflows.',
                    showCreateBtn: true,
                };
            case 'completed':
                return {
                    icon: <CheckCircle2 className="h-9 w-9 text-emerald-500/60 mb-2" />,
                    title: 'No completed projects yet',
                    description: 'Projects marked with completed status will appear here for review and historical reference.',
                };
            case 'archived':
                return {
                    icon: <Archive className="h-9 w-9 text-muted-foreground/60 mb-2" />,
                    title: 'No archived projects',
                    description: 'Projects moved to archive will be safely stored here and can be restored anytime.',
                };
            case 'assigned':
                return {
                    icon: <UserCheck className="h-9 w-9 text-primary/60 mb-2" />,
                    title: 'No assigned projects found',
                    description: 'Projects where you are added as a team member or assigned tasks will show up here.',
                };
            default:
                return {
                    icon: <FolderKanban className="h-9 w-9 text-muted-foreground/60 mb-2" />,
                    title: 'No active projects found',
                    description: 'Create your first project space to start organizing tasks, boards, and team workflows.',
                    showCreateBtn: true,
                };
        }
    };

    const emptyState = getEmptyStateContent();

    return (
        <div className="flex-1 overflow-y-auto bg-background p-5 sm:p-7 space-y-6">
            {/* Top Bar: Title & Primary CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                        Projects
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Manage your team's project spaces, boards, and workflows.
                    </p>
                </div>

                <button 
                    onClick={() => dispatch(setCreateProjectModalOpen(true))}
                    className="inline-flex items-center gap-1.5 rounded-md text-xs font-semibold bg-primary text-primary-foreground shadow-2xs hover:bg-primary/90 h-8 px-3.5 py-1.5 transition-colors self-start sm:self-auto"
                >
                    <Plus className="h-3.5 w-3.5" />
                    <span>New Project</span>
                </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Search & Sort */}
                <div className="flex items-center gap-2 flex-1 max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search projects by name or key..."
                            className="w-full h-8 pl-8 pr-7 rounded-md border border-input bg-card text-xs shadow-2xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2 top-2 p-0.5 text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    {/* Sort Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button 
                                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-input bg-card text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 shadow-2xs"
                                title="Sort Projects"
                            >
                                <ArrowUpDown className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{currentSortLabel}</span>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-1 text-xs">
                            <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-1">
                                Sort Projects By
                            </DropdownMenuLabel>
                            {sortOptions.map((opt) => (
                                <DropdownMenuItem
                                    key={opt.label}
                                    onClick={() => {
                                        setSortField(opt.field);
                                        setSortOrder(opt.order);
                                    }}
                                    className="flex items-center justify-between cursor-pointer py-1.5"
                                >
                                    <span>{opt.label}</span>
                                    {sortField === opt.field && sortOrder === opt.order && (
                                        <Check className="w-3.5 h-3.5 text-primary" />
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Filter Tabs (Screenshot 4) */}
                <div className="flex items-center gap-1 overflow-x-auto p-0.5 rounded-lg bg-muted/60 border border-border text-xs shrink-0">
                    <button
                        onClick={() => handleViewChange('all')}
                        className={cn(
                            "px-3 py-1 rounded-md font-medium transition-all whitespace-nowrap text-xs",
                            currentView === 'all'
                                ? "bg-background text-foreground shadow-2xs font-semibold"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => handleViewChange('created')}
                        className={cn(
                            "px-3 py-1 rounded-md font-medium transition-all whitespace-nowrap text-xs",
                            currentView === 'created'
                                ? "bg-background text-foreground shadow-2xs font-semibold"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Created by Me
                    </button>
                    <button
                        onClick={() => handleViewChange('completed')}
                        className={cn(
                            "px-3 py-1 rounded-md font-medium transition-all whitespace-nowrap text-xs",
                            currentView === 'completed'
                                ? "bg-background text-foreground shadow-2xs font-semibold"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Completed
                    </button>
                    <button
                        onClick={() => handleViewChange('archived')}
                        className={cn(
                            "px-3 py-1 rounded-md font-medium transition-all whitespace-nowrap text-xs",
                            currentView === 'archived'
                                ? "bg-background text-foreground shadow-2xs font-semibold"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Archived
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {isLoading ? (
                <div className="flex-1 flex items-center justify-center p-12 text-muted-foreground animate-pulse text-xs">
                    Loading projects...
                </div>
            ) : error ? (
                <div className="flex-1 flex items-center justify-center p-12 text-destructive text-xs">
                    Failed to load projects. Please refresh the page.
                </div>
            ) : projects.length === 0 ? (
                /* Context-Specific Empty State */
                <div className="flex flex-col items-center justify-center p-10 border border-dashed border-border rounded-lg bg-card/40 text-center">
                    {emptyState.icon || <FolderKanban className="h-9 w-9 text-muted-foreground/60 mb-2" />}
                    <h3 className="text-sm font-semibold text-foreground">
                        {emptyState.title}
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4 leading-relaxed">
                        {emptyState.description}
                    </p>
                    {emptyState.showClearSearch && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="inline-flex items-center justify-center rounded-md text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground h-8 px-3 py-1 transition-colors"
                        >
                            Clear search
                        </button>
                    )}
                    {emptyState.showCreateBtn && (
                        <button 
                            onClick={() => dispatch(setCreateProjectModalOpen(true))}
                            className="inline-flex items-center justify-center rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3.5 py-1.5 transition-colors shadow-2xs gap-1.5"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Create Project</span>
                        </button>
                    )}
                </div>
            ) : (
                /* Projects Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((project) => {
                        const projectInitials = getInitials(project.name || project.key || 'PRJ');
                        const projectStyle = getAvatarStyle(project._id || project.name);

                        return (
                            <Link 
                                key={project._id} 
                                to={`/tasks/projects/${project._id}`}
                                onClick={() => dispatch(setActiveProject(project))}
                                className="group relative flex flex-col justify-between rounded-lg border border-border bg-card text-card-foreground shadow-2xs transition-all hover:shadow-sm hover:border-primary/40 overflow-hidden"
                            >
                                {/* Card Body */}
                                <div className="p-4 space-y-2.5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div 
                                                style={projectStyle}
                                                className="size-8 rounded-md font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs border border-border/40"
                                            >
                                                {projectInitials}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                                    {project.name}
                                                </h3>
                                                <span className="text-[10px] font-mono text-muted-foreground">
                                                    {project.key || 'PROJECT'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Project Actions Menu */}
                                        <div onClick={(e) => e.preventDefault()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button 
                                                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                                        title="Project Actions"
                                                    >
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-36 p-1 text-xs">
                                                    <DropdownMenuItem 
                                                        onClick={(e) => handleDelete(e, project._id)}
                                                        className="text-destructive focus:text-destructive cursor-pointer"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                                                        <span>Delete</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed min-h-[30px]">
                                        {project.description || 'No description provided.'}
                                    </p>
                                </div>

                                {/* Card Footer */}
                                <div className="px-4 py-2.5 border-t border-border/60 bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground">
                                    <span className="capitalize font-medium">
                                        {project.status || 'Active'}
                                    </span>
                                    
                                    <div className="flex items-center gap-1 text-primary font-semibold group-hover:translate-x-0.5 transition-transform text-xs">
                                        <span>Open Board</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            <CreateProjectModal />
        </div>
    );
};

export default ProjectsDashboard;
