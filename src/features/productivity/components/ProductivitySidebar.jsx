import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
    Kanban, 
    ListTodo, 
    BarChart3, 
    Users, 
    Plus, 
    ChevronDown, 
    Check, 
    ArrowLeft, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    UserCheck, 
    Archive, 
    Inbox 
} from 'lucide-react';
import { useProjects, useProjectMembers } from '../queries/project.queries';
import { setCreateProjectModalOpen, setActiveProject } from '../states/productivity.slice';
import { 
    DropdownMenu, 
    DropdownMenuTrigger, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuSeparator, 
    DropdownMenuLabel 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { getInitials, getAvatarStyle } from '@/global/utils/user';
import { ProjectMembersModal } from './ProjectMembersModal';

export const ProductivitySidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    // Extract projectId from URL if present
    const projectMatch = location.pathname.match(/\/tasks\/projects\/([^/?]+)/);
    const projectId = projectMatch ? projectMatch[1] : null;

    const searchParams = new URLSearchParams(location.search);
    const activeView = searchParams.get('view') || 'board';
    const activeFilter = searchParams.get('filter') || '';
    const dashboardView = searchParams.get('view') || 'all';

    const { data: projectsData, isLoading: isLoadingProjects } = useProjects();
    const projects = projectsData?.data?.projects || (Array.isArray(projectsData?.data) ? projectsData.data : []);

    const activeProject = useMemo(() => {
        if (!projectId || !projects.length) return null;
        return projects.find(p => p._id === projectId) || null;
    }, [projectId, projects]);

    const { data: membersResponse } = useProjectMembers(projectId, { enabled: !!projectId });
    const projectMembers = membersResponse?.data?.members || [];

    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

    // Keep active project synchronized in Redux
    React.useEffect(() => {
        if (activeProject) {
            dispatch(setActiveProject(activeProject));
        }
    }, [activeProject, dispatch]);

    const handleSelectProject = (project) => {
        dispatch(setActiveProject(project));
        navigate(`/tasks/projects/${project._id}`);
    };

    const handleViewChange = (viewName) => {
        if (!projectId) return;
        const newParams = new URLSearchParams(location.search);
        newParams.set('view', viewName);
        navigate(`/tasks/projects/${projectId}?${newParams.toString()}`);
    };

    const handleFilterChange = (filterKey) => {
        if (!projectId) return;
        const newParams = new URLSearchParams(location.search);
        if (newParams.get('filter') === filterKey) {
            newParams.delete('filter');
        } else {
            newParams.set('filter', filterKey);
        }
        navigate(`/tasks/projects/${projectId}?${newParams.toString()}`);
    };

    // --- RENDER 1: PROJECT CONTEXT MODE (inside a specific project) ---
    if (projectId) {
        const projectInitials = getInitials(activeProject?.name || activeProject?.key || 'PRJ');
        const projectAvatarStyle = getAvatarStyle(activeProject?._id || activeProject?.name);

        return (
            <div className="flex flex-col h-full overflow-hidden text-sidebar-foreground">
                {/* 1. Project Switcher & Header */}
                <div className="p-3 border-b border-sidebar-border bg-sidebar/50 flex flex-col gap-2">
                    <Link
                        to="/tasks"
                        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group w-fit"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                        <span>All Projects</span>
                    </Link>

                    {/* Project Switcher Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger className="w-full flex items-center justify-between p-2 rounded-lg bg-card/80 hover:bg-card border border-sidebar-border shadow-2xs transition-all text-left group cursor-pointer focus:outline-hidden">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div 
                                    style={projectAvatarStyle}
                                    className="size-7 rounded-md font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs border border-border/40"
                                >
                                    {projectInitials}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-foreground truncate leading-tight">
                                        {activeProject?.name || 'Loading Project...'}
                                    </p>
                                    <span className="text-[10px] text-muted-foreground font-mono">
                                        {activeProject?.key || 'PROJECT'}
                                    </span>
                                </div>
                            </div>
                            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56 p-1 z-50 text-xs">
                            <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-1">
                                Switch Project
                            </DropdownMenuLabel>
                            {projects.map((p) => {
                                const pInitials = getInitials(p.name || p.key);
                                const pStyle = getAvatarStyle(p._id || p.name);
                                return (
                                    <DropdownMenuItem 
                                        key={p._id} 
                                        onClick={() => handleSelectProject(p)}
                                        className="flex items-center justify-between cursor-pointer py-1.5"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span 
                                                style={pStyle}
                                                className="size-5 rounded text-[9px] font-bold flex items-center justify-center shrink-0 border border-border/40"
                                            >
                                                {pInitials}
                                            </span>
                                            <span className="text-xs truncate font-medium">
                                                {p.name}
                                            </span>
                                        </div>
                                        {p._id === projectId && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                                    </DropdownMenuItem>
                                );
                            })}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                onClick={() => dispatch(setCreateProjectModalOpen(true))}
                                className="flex items-center gap-2 text-primary cursor-pointer text-xs font-medium"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Create New Project</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* 2. Navigation items & Views */}
                <div className="flex-1 overflow-y-auto p-2 space-y-4">
                    {/* PLANNING VIEWS */}
                    <div>
                        <div className="px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Planning Views
                        </div>
                        <div className="mt-1 space-y-0.5">
                            <button
                                onClick={() => handleViewChange('board')}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors group",
                                    activeView === 'board'
                                        ? "bg-accent text-accent-foreground font-semibold shadow-2xs"
                                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                )}
                            >
                                <div className="flex items-center gap-2.5">
                                    <Kanban className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                                    <span>Kanban Board</span>
                                </div>
                            </button>

                            <button
                                onClick={() => handleViewChange('list')}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors group",
                                    activeView === 'list'
                                        ? "bg-accent text-accent-foreground font-semibold shadow-2xs"
                                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                )}
                            >
                                <div className="flex items-center gap-2.5">
                                    <ListTodo className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                                    <span>List / Table View</span>
                                </div>
                            </button>

                            <button
                                onClick={() => handleViewChange('insights')}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors group",
                                    activeView === 'insights'
                                        ? "bg-accent text-accent-foreground font-semibold shadow-2xs"
                                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                )}
                            >
                                <div className="flex items-center gap-2.5">
                                    <BarChart3 className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                                    <span>Project Insights</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* QUICK FILTERS */}
                    <div>
                        <div className="px-3 py-1 flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                            <span>Quick Filters</span>
                            {activeFilter && (
                                <button
                                    onClick={() => handleFilterChange('')}
                                    className="text-[10px] text-primary hover:underline lowercase font-normal"
                                >
                                    clear
                                </button>
                            )}
                        </div>
                        <div className="mt-1 space-y-0.5">
                            <button
                                onClick={() => handleFilterChange('my_issues')}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-md transition-colors",
                                    activeFilter === 'my_issues'
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <UserCheck className="w-3.5 h-3.5 shrink-0" />
                                    <span>Only My Issues</span>
                                </div>
                                {activeFilter === 'my_issues' && <Check className="w-3 h-3" />}
                            </button>

                            <button
                                onClick={() => handleFilterChange('high_priority')}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-md transition-colors",
                                    activeFilter === 'high_priority'
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-destructive" />
                                    <span>Urgent & High</span>
                                </div>
                                {activeFilter === 'high_priority' && <Check className="w-3 h-3" />}
                            </button>

                            <button
                                onClick={() => handleFilterChange('due_soon')}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-md transition-colors",
                                    activeFilter === 'due_soon'
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                                    <span>Due Soon</span>
                                </div>
                                {activeFilter === 'due_soon' && <Check className="w-3 h-3" />}
                            </button>

                            <button
                                onClick={() => handleFilterChange('done')}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-md transition-colors",
                                    activeFilter === 'done'
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                                    <span>Completed</span>
                                </div>
                                {activeFilter === 'done' && <Check className="w-3 h-3" />}
                            </button>
                        </div>
                    </div>

                    {/* PROJECT MANAGEMENT */}
                    <div>
                        <div className="px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Team & Settings
                        </div>
                        <div className="mt-1 space-y-0.5">
                            <button
                                onClick={() => setIsMembersModalOpen(true)}
                                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground rounded-md transition-colors group"
                            >
                                <div className="flex items-center gap-2.5">
                                    <Users className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                                    <span>Project Members</span>
                                </div>
                                {projectMembers.length > 0 && (
                                    <span className="px-1.5 py-0.2 text-[10px] font-semibold rounded-full bg-muted text-muted-foreground">
                                        {projectMembers.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <ProjectMembersModal
                    isOpen={isMembersModalOpen}
                    onClose={() => setIsMembersModalOpen(false)}
                    projectId={projectId}
                    projectName={activeProject?.name || 'Project'}
                />
            </div>
        );
    }

    // --- RENDER 2: WORKSPACE HUB MODE (on /tasks root) ---
    return (
        <div className="flex flex-col h-full overflow-hidden text-sidebar-foreground">
            {/* Header */}
            <div className="p-3 border-b border-sidebar-border flex items-center justify-between">
                <div>
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Productivity
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                        Projects & Task Boards
                    </p>
                </div>
                <button
                    onClick={() => dispatch(setCreateProjectModalOpen(true))}
                    className="p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs"
                    title="Create New Project"
                >
                    <Plus className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-4">
                {/* WORKSPACE FILTERS (Screenshot 3) */}
                <div>
                    <div className="px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Views
                    </div>
                    <div className="mt-1 space-y-0.5">
                        <Link
                            to="/tasks"
                            className={cn(
                                "flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition-colors",
                                dashboardView === 'all'
                                    ? "bg-accent text-accent-foreground font-semibold"
                                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                            )}
                        >
                            <Inbox className="w-4 h-4 shrink-0" />
                            <span>All Projects</span>
                        </Link>
                        <Link
                            to="/tasks?view=assigned"
                            className={cn(
                                "flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition-colors",
                                dashboardView === 'assigned'
                                    ? "bg-accent text-accent-foreground font-semibold"
                                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                            )}
                        >
                            <UserCheck className="w-4 h-4 shrink-0" />
                            <span>Assigned to Me</span>
                        </Link>
                        <Link
                            to="/tasks?view=completed"
                            className={cn(
                                "flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition-colors",
                                dashboardView === 'completed'
                                    ? "bg-accent text-accent-foreground font-semibold"
                                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                            )}
                        >
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                            <span>Completed Projects</span>
                        </Link>
                        <Link
                            to="/tasks?view=archived"
                            className={cn(
                                "flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition-colors",
                                dashboardView === 'archived'
                                    ? "bg-accent text-accent-foreground font-semibold"
                                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                            )}
                        >
                            <Archive className="w-4 h-4 shrink-0" />
                            <span>Archived Projects</span>
                        </Link>
                    </div>
                </div>

                {/* PROJECTS LIST */}
                <div>
                    <div className="px-3 py-1 flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        <span>Projects</span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                            {projects.length}
                        </span>
                    </div>

                    <div className="mt-1 space-y-0.5">
                        {isLoadingProjects ? (
                            <div className="px-3 py-2 text-xs text-muted-foreground animate-pulse">
                                Loading projects...
                            </div>
                        ) : projects.length === 0 ? (
                            <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                                No projects found
                            </div>
                        ) : (
                            projects.slice(0, 10).map((project) => {
                                const pInitials = getInitials(project.name || project.key);
                                const pStyle = getAvatarStyle(project._id || project.name);

                                return (
                                    <Link
                                        key={project._id}
                                        to={`/tasks/projects/${project._id}`}
                                        onClick={() => dispatch(setActiveProject(project))}
                                        className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors group"
                                    >
                                        <span 
                                            style={pStyle}
                                            className="size-5 rounded text-[9px] font-bold flex items-center justify-center shrink-0 border border-border/40"
                                        >
                                            {pInitials}
                                        </span>
                                        <span className="truncate flex-1">
                                            {project.name}
                                        </span>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductivitySidebar;
