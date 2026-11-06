import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
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

    const navItemClass = (isActive) =>
        cn(
            "relative w-full flex items-center justify-between px-2.5 py-2 text-[13px] rounded-lg transition-colors cursor-pointer",
            isActive
                ? "bg-muted text-foreground font-medium before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-full before:bg-primary-sidebar-marker"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        );

    // --- RENDER 1: PROJECT CONTEXT MODE (inside a specific project) ---
    if (projectId) {
        const projectInitials = getInitials(activeProject?.name || activeProject?.key || 'PRJ');
        const projectAvatarStyle = getAvatarStyle(activeProject?._id || activeProject?.name);

        return (
            <div className="flex flex-col h-full overflow-hidden text-sidebar-foreground select-none">
                {/* 1. Project Switcher & Header */}
                <div className="px-3 py-3 border-b border-sidebar-border flex flex-col gap-2">
                    <Link
                        to="/tasks"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-1.5 py-1 rounded-md hover:bg-muted w-fit group"
                    >
                        <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
                        <span>All Projects</span>
                    </Link>

                    {/* Project Switcher Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger className="w-full flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted border border-border/70 transition-all text-left group cursor-pointer focus:outline-hidden">
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
                            <ChevronDown className="size-3.5 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
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
                                        {p._id === projectId && <Check className="size-3.5 text-primary shrink-0" />}
                                    </DropdownMenuItem>
                                );
                            })}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                onClick={() => dispatch(setCreateProjectModalOpen(true))}
                                className="flex items-center gap-2 text-primary cursor-pointer text-xs font-medium"
                            >
                                <Plus className="size-3.5" />
                                <span>Create New Project</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* 2. Navigation items & Views */}
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 custom-scrollbar">
                    {/* PLANNING VIEWS */}
                    <div className="space-y-1">
                        <div className="px-2.5 pb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Planning Views
                        </div>
                        <button
                            type="button"
                            onClick={() => handleViewChange('board')}
                            className={navItemClass(activeView === 'board')}
                        >
                            <div className="flex items-center gap-2.5">
                                <Kanban className="size-4 shrink-0" />
                                <span>Kanban Board</span>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleViewChange('list')}
                            className={navItemClass(activeView === 'list')}
                        >
                            <div className="flex items-center gap-2.5">
                                <ListTodo className="size-4 shrink-0" />
                                <span>List / Table View</span>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleViewChange('insights')}
                            className={navItemClass(activeView === 'insights')}
                        >
                            <div className="flex items-center gap-2.5">
                                <BarChart3 className="size-4 shrink-0" />
                                <span>Project Insights</span>
                            </div>
                        </button>
                    </div>

                    {/* QUICK FILTERS */}
                    <div className="space-y-1">
                        <div className="px-2.5 pb-1 flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                            <span>Quick Filters</span>
                            {activeFilter && (
                                <button
                                    type="button"
                                    onClick={() => handleFilterChange('')}
                                    className="text-[10px] text-primary hover:underline lowercase font-normal cursor-pointer"
                                >
                                    clear
                                </button>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => handleFilterChange('my_issues')}
                            className={navItemClass(activeFilter === 'my_issues')}
                        >
                            <div className="flex items-center gap-2.5">
                                <UserCheck className="size-4 shrink-0" />
                                <span>Only My Issues</span>
                            </div>
                            {activeFilter === 'my_issues' && <Check className="size-3.5" />}
                        </button>

                        <button
                            type="button"
                            onClick={() => handleFilterChange('high_priority')}
                            className={navItemClass(activeFilter === 'high_priority')}
                        >
                            <div className="flex items-center gap-2.5">
                                <AlertCircle className="size-4 shrink-0 text-destructive" />
                                <span>Urgent & High</span>
                            </div>
                            {activeFilter === 'high_priority' && <Check className="size-3.5" />}
                        </button>

                        <button
                            type="button"
                            onClick={() => handleFilterChange('due_soon')}
                            className={navItemClass(activeFilter === 'due_soon')}
                        >
                            <div className="flex items-center gap-2.5">
                                <Clock className="size-4 shrink-0 text-status-warn-foreground" />
                                <span>Due Soon</span>
                            </div>
                            {activeFilter === 'due_soon' && <Check className="size-3.5" />}
                        </button>

                        <button
                            type="button"
                            onClick={() => handleFilterChange('done')}
                            className={navItemClass(activeFilter === 'done')}
                        >
                            <div className="flex items-center gap-2.5">
                                <CheckCircle2 className="size-4 shrink-0 text-status-live-foreground" />
                                <span>Completed</span>
                            </div>
                            {activeFilter === 'done' && <Check className="size-3.5" />}
                        </button>
                    </div>

                    {/* PROJECT MANAGEMENT */}
                    <div className="space-y-1">
                        <div className="px-2.5 pb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Team & Access
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsMembersModalOpen(true)}
                            className="w-full flex items-center justify-between px-2.5 py-2 text-[13px] font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground rounded-lg transition-colors group cursor-pointer"
                        >
                            <div className="flex items-center gap-2.5">
                                <Users className="size-4 shrink-0" />
                                <span>Project Members</span>
                            </div>
                            {projectMembers.length > 0 && (
                                <span className="px-1.5 py-0.2 text-[10px] font-mono tabular-nums font-semibold rounded-md bg-muted text-muted-foreground border border-border/60">
                                    {projectMembers.length}
                                </span>
                            )}
                        </button>
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
        <div className="flex flex-col h-full overflow-hidden text-sidebar-foreground select-none">
            {/* Header */}
            <div className="px-3.5 py-3 border-b border-sidebar-border flex items-center justify-between">
                <div>
                    <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Productivity
                    </h3>
                    <p className="text-[11px] text-foreground font-medium">
                        Projects & Task Boards
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => dispatch(setCreateProjectModalOpen(true))}
                    className="size-7 inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs cursor-pointer"
                    title="Create New Project"
                >
                    <Plus className="size-3.5" />
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 custom-scrollbar">
                {/* WORKSPACE FILTERS */}
                <div className="space-y-1">
                    <div className="px-2.5 pb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Views
                    </div>
                    <Link
                        to="/tasks"
                        className={navItemClass(dashboardView === 'all')}
                    >
                        <div className="flex items-center gap-2.5">
                            <Inbox className="size-4 shrink-0" />
                            <span>All Projects</span>
                        </div>
                    </Link>
                    <Link
                        to="/tasks?view=assigned"
                        className={navItemClass(dashboardView === 'assigned')}
                    >
                        <div className="flex items-center gap-2.5">
                            <UserCheck className="size-4 shrink-0" />
                            <span>Assigned to Me</span>
                        </div>
                    </Link>
                    <Link
                        to="/tasks?view=completed"
                        className={navItemClass(dashboardView === 'completed')}
                    >
                        <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="size-4 shrink-0 text-status-live-foreground" />
                            <span>Completed Projects</span>
                        </div>
                    </Link>
                    <Link
                        to="/tasks?view=archived"
                        className={navItemClass(dashboardView === 'archived')}
                    >
                        <div className="flex items-center gap-2.5">
                            <Archive className="size-4 shrink-0" />
                            <span>Archived Projects</span>
                        </div>
                    </Link>
                </div>

                {/* PROJECTS LIST */}
                <div className="space-y-1">
                    <div className="px-2.5 pb-1 flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        <span>Project Spaces</span>
                        <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
                            {projects.length}
                        </span>
                    </div>

                    {isLoadingProjects ? (
                        <div className="space-y-1 px-2 py-1">
                            {[1, 2, 3].map((n) => (
                                <div key={n} className="h-7 rounded-md bg-muted/60 animate-pulse" />
                            ))}
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="px-2.5 py-3 text-xs text-muted-foreground">
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
                                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors group"
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
                                    <span className="text-[10px] font-mono text-muted-foreground/70">
                                        {project.key}
                                    </span>
                                </Link>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductivitySidebar;
