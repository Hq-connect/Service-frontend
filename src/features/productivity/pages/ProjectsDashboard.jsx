import React, { useState, useMemo } from 'react';
import { useProjects, useDeleteProject } from '../queries/project.queries';
import { useDispatch } from 'react-redux';
import { setActiveProject, setCreateProjectModalOpen } from '../states/productivity.slice';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { Link, useSearchParams } from 'react-router-dom';
import { 
    Plus, FolderKanban, Trash2, Search, X, ArrowRight, 
    ArrowUpDown, Check, MoreHorizontal, Layers, CheckCircle2, Archive, UserCheck, Calendar
} from 'lucide-react';
import { 
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getInitials, getAvatarStyle } from '@/global/utils/user';
import useCurrentUser from '@/features/auth/hooks/useCurrentUser';

function formatShortDate(iso) {
    if (!iso) return 'Recently';
    try {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
        }).format(new Date(iso));
    } catch {
        return 'Recently';
    }
}

export const ProjectsDashboard = () => {
    const dispatch = useDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const currentView = searchParams.get('view') || 'all';

    useCurrentUser();

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

    const viewLabels = {
        all: 'Active spaces',
        created: 'Created by you',
        assigned: 'Assigned to you',
        completed: 'Completed',
        archived: 'Archived',
    };

    const kpis = [
        {
            label: 'Visible projects',
            value: projects.length,
            sub: viewLabels[currentView] || 'Active spaces',
        },
        {
            label: 'Active status',
            value: projects.filter((p) => (p.status || 'active') === 'active').length,
            sub: 'Live boards',
        },
        {
            label: 'Completed',
            value: projects.filter((p) => p.status === 'completed').length,
            sub: 'Delivered',
        },
        {
            label: 'Sort order',
            value: sortOrder.toUpperCase(),
            sub: currentSortLabel,
        },
    ];

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
                    icon: <Layers className="size-5 text-muted-foreground" />,
                    title: 'No projects created by you yet',
                    description: 'Start by creating your first project space to manage tasks, boards, and team workflows.',
                    showCreateBtn: true,
                };
            case 'completed':
                return {
                    icon: <CheckCircle2 className="size-5 text-status-live-foreground" />,
                    title: 'No completed projects yet',
                    description: 'Projects marked with completed status will appear here for review and historical reference.',
                };
            case 'archived':
                return {
                    icon: <Archive className="size-5 text-muted-foreground" />,
                    title: 'No archived projects',
                    description: 'Projects moved to archive will be safely stored here and can be restored anytime.',
                };
            case 'assigned':
                return {
                    icon: <UserCheck className="size-5 text-foreground" />,
                    title: 'No assigned projects found',
                    description: 'Projects where you are added as a team member or assigned tasks will show up here.',
                };
            default:
                return {
                    icon: <FolderKanban className="size-5 text-muted-foreground" />,
                    title: 'No active projects found',
                    description: 'Create your first project space to start organizing tasks, boards, and team workflows.',
                    showCreateBtn: true,
                };
        }
    };

    const emptyState = getEmptyStateContent();

    return (
        <div className="flex-1 overflow-y-auto bg-background p-5 sm:p-8 custom-scrollbar">
            <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
                {/* 1. Top Bar: Title & Primary CTA (Matches Settings Header) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                    <div className="space-y-1">
                        <h1 className="text-xl font-bold text-foreground tracking-tight">
                            Projects & Workspaces
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Organize engineering sprints, Kanban boards, and cross-functional team deliverables.
                        </p>
                    </div>

                    <Button 
                        size="sm"
                        onClick={() => dispatch(setCreateProjectModalOpen(true))}
                        className="gap-1.5 text-xs h-8 self-start sm:self-auto cursor-pointer"
                    >
                        <Plus className="size-3.5" />
                        <span>New Project</span>
                    </Button>
                </div>

                {/* 2. KPI Metric Strip (Matches Settings MembersAndInvitesPage) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {kpis.map((kpi) => (
                        <div
                            key={kpi.label}
                            className="rounded-xl border border-border bg-card px-4 py-3 shadow-(--shadow-card)"
                        >
                            <p className="text-[11px] font-medium text-muted-foreground">
                                {kpi.label}
                            </p>
                            <div className="mt-1 flex items-baseline justify-between gap-2">
                                <p className="text-xl font-bold tracking-tight text-foreground font-mono tabular-nums">
                                    {kpi.value}
                                </p>
                                <span className="text-[10px] text-muted-foreground truncate">
                                    {kpi.sub}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 3. Filter & Search Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Search & Sort */}
                    <div className="flex items-center gap-2 flex-1 max-w-md">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search projects by name or key…"
                                className="w-full h-8 pl-8 pr-7 rounded-lg border border-input bg-card text-xs shadow-2xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:border-ring transition-all"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                                >
                                    <X className="size-3" />
                                </button>
                            )}
                        </div>

                        {/* Sort Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button 
                                    type="button"
                                    className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-input bg-card text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 shadow-2xs cursor-pointer"
                                    title="Sort Projects"
                                >
                                    <ArrowUpDown className="size-3.5" />
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
                                            <Check className="size-3.5 text-primary" />
                                        )}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto p-0.5 rounded-lg bg-muted/60 border border-border text-xs shrink-0">
                        {[
                            { id: 'all', label: 'Active' },
                            { id: 'created', label: 'Created by Me' },
                            { id: 'completed', label: 'Completed' },
                            { id: 'archived', label: 'Archived' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => handleViewChange(tab.id)}
                                className={cn(
                                    "px-3 py-1 rounded-md font-medium transition-all whitespace-nowrap text-xs cursor-pointer",
                                    currentView === tab.id
                                        ? "bg-background text-foreground shadow-2xs font-semibold"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 4. Content Area: Layout-Accurate Skeletons / Empty State / Architectural Project Cards */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                            <div
                                key={n}
                                className="rounded-xl border border-border bg-card shadow-(--shadow-card) overflow-hidden"
                            >
                                <div className="p-5 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="size-9 rounded-lg bg-muted animate-pulse" />
                                        <div className="space-y-1.5 flex-1">
                                            <div className="h-3.5 w-32 rounded bg-muted animate-pulse" />
                                            <div className="h-2.5 w-16 rounded bg-muted/60 animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="h-3 w-full rounded bg-muted/60 animate-pulse" />
                                    <div className="h-3 w-2/3 rounded bg-muted/60 animate-pulse" />
                                </div>
                                <div className="px-5 py-3 border-t border-border bg-muted/30 flex items-center justify-between">
                                    <div className="h-3 w-16 rounded bg-muted animate-pulse" />
                                    <div className="h-3 w-20 rounded bg-muted animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
                        <p className="text-xs font-medium text-destructive">
                            Failed to load projects. Please refresh the page.
                        </p>
                    </div>
                ) : projects.length === 0 ? (
                    /* Architectural Empty State */
                    <div className="flex flex-col items-center justify-center py-14 px-6 border border-dashed border-border rounded-xl bg-card/50 text-center shadow-(--shadow-card)">
                        <div className="size-11 rounded-xl bg-muted/70 border border-border flex items-center justify-center mb-3 shadow-2xs">
                            {emptyState.icon || <FolderKanban className="size-5 text-muted-foreground" />}
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">
                            {emptyState.title}
                        </h3>
                        <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4 leading-relaxed">
                            {emptyState.description}
                        </p>
                        {emptyState.showClearSearch && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSearchQuery('')}
                                className="h-8 text-xs cursor-pointer"
                            >
                                Clear search
                            </Button>
                        )}
                        {emptyState.showCreateBtn && (
                            <Button
                                size="sm"
                                onClick={() => dispatch(setCreateProjectModalOpen(true))}
                                className="h-8 text-xs gap-1.5 cursor-pointer"
                            >
                                <Plus className="size-3.5" />
                                <span>Create Project</span>
                            </Button>
                        )}
                    </div>
                ) : (
                    /* Projects Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projects.map((project) => {
                            const projectInitials = getInitials(project.name || project.key || 'PRJ');
                            const projectStyle = getAvatarStyle(project._id || project.name);
                            const status = project.status || 'active';

                            return (
                                <Link 
                                    key={project._id} 
                                    to={`/tasks/projects/${project._id}`}
                                    onClick={() => dispatch(setActiveProject(project))}
                                    className="group relative flex flex-col justify-between rounded-xl border border-border bg-card text-card-foreground shadow-(--shadow-card) transition-all duration-150 hover:border-foreground/25 hover:-translate-y-0.5 overflow-hidden"
                                >
                                    {/* Card Body */}
                                    <div className="p-5 space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div 
                                                    style={projectStyle}
                                                    className="size-9 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs border border-border/40"
                                                >
                                                    {projectInitials}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-semibold text-[14px] text-foreground truncate group-hover:text-primary transition-colors tracking-tight">
                                                        {project.name}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <Badge variant="outline" className="font-mono text-[10px] h-4 px-1.5">
                                                            {project.key || 'PRJ'}
                                                        </Badge>
                                                        {project.createdAt && (
                                                            <span className="text-[10px] text-muted-foreground font-mono tabular-nums flex items-center gap-1">
                                                                <Calendar className="size-2.5" />
                                                                {formatShortDate(project.createdAt)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Project Actions Menu */}
                                            <div onClick={(e) => e.preventDefault()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button 
                                                            type="button"
                                                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                                            title="Project Actions"
                                                        >
                                                            <MoreHorizontal className="size-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-36 p-1 text-xs">
                                                        <DropdownMenuItem 
                                                            onClick={(e) => handleDelete(e, project._id)}
                                                            className="text-destructive focus:text-destructive cursor-pointer"
                                                        >
                                                            <Trash2 className="size-3.5 mr-2" />
                                                            <span>Delete Project</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>

                                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed min-h-[34px]">
                                            {project.description || 'No description provided for this project space.'}
                                        </p>
                                    </div>

                                    {/* Architectural Card Footer (Matches SettingsSectionCard footer) */}
                                    <div className="px-5 py-3 border-t border-border bg-muted/35 flex items-center justify-between text-[11px]">
                                        {status === 'active' ? (
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-status-live-border bg-status-live px-2 py-0.5 text-[10px] font-medium text-status-live-foreground capitalize">
                                                <span className="size-1.5 rounded-full bg-status-live-foreground" />
                                                Active
                                            </span>
                                        ) : (
                                            <Badge variant="outline" className="capitalize text-[10px]">
                                                {status}
                                            </Badge>
                                        )}
                                        
                                        <div className="flex items-center gap-1 text-foreground font-medium group-hover:translate-x-0.5 transition-transform text-xs">
                                            <span>Open Board</span>
                                            <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                <CreateProjectModal />
            </div>
        </div>
    );
};

export default ProjectsDashboard;
