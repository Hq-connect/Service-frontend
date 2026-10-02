import React, { useState } from 'react';
import { 
    Search, X, Kanban, ListTodo, BarChart3, Plus, Users, User, ChevronDown, Check,
    UserCheck, AlertCircle, ArrowUpDown, ArrowDown, ArrowUp, Calendar, Layers
} from 'lucide-react';
import { 
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, 
    DropdownMenuSeparator, DropdownMenuLabel 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { getInitials, getAvatarStyle } from '@/global/utils/user';
import { CreateBoardModal } from './CreateBoardModal';

export const BoardHeader = ({
    project,
    boards = [],
    activeBoard,
    onSelectBoard,
    activeView = 'board',
    onViewChange,
    searchQuery = '',
    onSearchChange,
    activeFilter = '',
    onFilterChange,
    selectedAssignee = null,
    onSelectAssignee,
    selectedPriority = '',
    onSelectPriority,
    sortBy = 'default',
    onSortChange,
    members = [],
    onOpenMembers,
    onOpenCreateTask,
    totalTasksCount = 0,
}) => {
    const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);

    const projectInitials = getInitials(project?.name || project?.key || 'PRJ');
    const projectAvatarStyle = getAvatarStyle(project?._id || project?.name);

    const sortLabels = {
        default: 'Default (Manual)',
        'priority-desc': 'Priority: Urgent → Low',
        'priority-asc': 'Priority: Low → Urgent',
        'due-date': 'Due Date: Earliest First',
        'title-asc': 'Title: A → Z',
        'newest': 'Newest Created',
    };

    const getAssigneeLabel = () => {
        if (!selectedAssignee) return 'Assignee: All';
        if (selectedAssignee === 'unassigned') return 'Assignee: Unassigned';
        const found = members.find((m) => {
            const id = m.userId?._id ? String(m.userId._id) : String(m.userId);
            return id === String(selectedAssignee);
        });
        return found ? `Assignee: ${found.userSnapshot?.name || 'Member'}` : 'Assignee: 1 Selected';
    };

    return (
        <div className="border-b border-border bg-card/60 backdrop-blur-xs shrink-0 px-5 sm:px-6 py-3 space-y-3 z-10">
            {/* Top Row: Title, Board Switcher, View Switcher & Primary Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Left: Project identity & Board Switcher & View Switcher */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-2.5">
                        <div 
                            style={projectAvatarStyle}
                            className="size-8 rounded-md font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs border border-border/40"
                        >
                            {projectInitials}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-sm sm:text-base font-bold text-foreground leading-tight">
                                    {project?.name || 'Project'}
                                </h1>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-muted text-muted-foreground border border-border">
                                    {project?.key || 'PRJ'}
                                </span>
                            </div>

                            {/* Multi-Board Switcher Dropdown */}
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button 
                                            className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 px-1.5 py-0.5 rounded transition-colors group"
                                            title="Switch or Create Boards"
                                        >
                                            <Kanban className="w-3 h-3 text-primary shrink-0" />
                                            <span className="font-semibold text-foreground truncate max-w-[150px]">
                                                {activeBoard?.name || 'Main Board'}
                                            </span>
                                            <ChevronDown className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-56 p-1 text-xs z-50">
                                        <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-1">
                                            Project Boards ({boards.length})
                                        </DropdownMenuLabel>
                                        {boards.map((b) => (
                                            <DropdownMenuItem
                                                key={b._id}
                                                onClick={() => onSelectBoard && onSelectBoard(b)}
                                                className="flex items-center justify-between cursor-pointer py-1.5 text-xs"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <Kanban className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                                    <span className="truncate font-medium">{b.name}</span>
                                                </div>
                                                {b._id === activeBoard?._id && (
                                                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                                                )}
                                            </DropdownMenuItem>
                                        ))}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => setIsCreateBoardOpen(true)}
                                            className="flex items-center gap-2 text-primary font-medium cursor-pointer text-xs py-1.5"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>Create New Board</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <span className="text-[11px] text-muted-foreground">·</span>
                                <span className="text-[11px] text-muted-foreground">
                                    {totalTasksCount} issues
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* View Switcher Pills */}
                    <div className="inline-flex items-center p-0.5 rounded-lg bg-muted/60 border border-border text-xs">
                        <button
                            onClick={() => onViewChange('board')}
                            className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all text-xs",
                                activeView === 'board'
                                    ? "bg-background text-foreground shadow-2xs font-semibold"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Kanban className="w-3.5 h-3.5" />
                            <span>Board</span>
                        </button>
                        <button
                            onClick={() => onViewChange('list')}
                            className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all text-xs",
                                activeView === 'list'
                                    ? "bg-background text-foreground shadow-2xs font-semibold"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <ListTodo className="w-3.5 h-3.5" />
                            <span>List</span>
                        </button>
                        <button
                            onClick={() => onViewChange('insights')}
                            className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all text-xs",
                                activeView === 'insights'
                                    ? "bg-background text-foreground shadow-2xs font-semibold"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <BarChart3 className="w-3.5 h-3.5" />
                            <span>Insights</span>
                        </button>
                    </div>
                </div>

                {/* Right: Members & Create Button */}
                <div className="flex items-center gap-2">
                    {/* Members Avatar Stack */}
                    <button
                        onClick={onOpenMembers}
                        className="flex items-center -space-x-1.5 hover:opacity-85 transition-opacity"
                        title="Manage Project Members"
                    >
                        {members.slice(0, 3).map((m) => {
                            const name = m.userSnapshot?.name || 'Member';
                            const avatar = m.userSnapshot?.avatar;
                            const userId = m.userId?._id ? String(m.userId._id) : String(m.userId);
                            const style = getAvatarStyle(userId || name);
                            const initials = getInitials(name);

                            return avatar ? (
                                <img
                                    key={m._id || userId}
                                    src={avatar}
                                    alt={name}
                                    className="w-7 h-7 rounded-full border-2 border-background object-cover"
                                />
                            ) : (
                                <div
                                    key={m._id || userId}
                                    style={style}
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-background shadow-2xs"
                                >
                                    {initials}
                                </div>
                            );
                        })}
                        {members.length > 3 && (
                            <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-semibold border-2 border-background">
                                +{members.length - 3}
                            </div>
                        )}
                    </button>

                    <button
                        onClick={onOpenMembers}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border bg-card text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-2xs"
                    >
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="hidden sm:inline">Members</span>
                    </button>

                    <button
                        onClick={onOpenCreateTask}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-2xs"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Issue</span>
                    </button>
                </div>
            </div>

            {/* Bottom Row: Quick Filters, Assignee Dropdown, Priority Dropdown, Sort Dropdown & Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                    {/* Search Input */}
                    <div className="relative w-44 sm:w-52">
                        <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Filter issues..."
                            className="w-full h-8 pl-8 pr-7 rounded-md border border-input bg-background/80 text-xs shadow-2xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => onSearchChange('')}
                                className="absolute right-2 top-2 p-0.5 text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    {/* Only My Issues Pill */}
                    <button
                        onClick={() => onFilterChange(activeFilter === 'my_issues' ? '' : 'my_issues')}
                        className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
                            activeFilter === 'my_issues'
                                ? "bg-primary text-primary-foreground border-primary font-semibold shadow-2xs"
                                : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted"
                        )}
                    >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Only My Issues</span>
                    </button>

                    {/* Dedicated Assignee Filter Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
                                selectedAssignee
                                    ? "bg-primary/10 text-primary border-primary/30 font-semibold"
                                    : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted"
                            )}>
                                <Users className="w-3 h-3 opacity-70" />
                                <span className="max-w-[130px] truncate">{getAssigneeLabel()}</span>
                                <ChevronDown className="w-3 h-3 opacity-60" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-52 p-1 text-xs z-50">
                            <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-1">
                                Filter by Assignee
                            </DropdownMenuLabel>
                            <DropdownMenuItem 
                                onClick={() => onSelectAssignee(null)}
                                className="flex items-center justify-between cursor-pointer py-1.5"
                            >
                                <span>All Assignees</span>
                                {!selectedAssignee && <Check className="w-3.5 h-3.5 text-primary" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => onSelectAssignee('unassigned')}
                                className="flex items-center justify-between cursor-pointer py-1.5 text-muted-foreground"
                            >
                                <div className="flex items-center gap-2">
                                    <User className="w-3.5 h-3.5" />
                                    <span>Unassigned</span>
                                </div>
                                {selectedAssignee === 'unassigned' && <Check className="w-3.5 h-3.5 text-primary" />}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {members.map((m) => {
                                const memberName = m.userSnapshot?.name || 'Member';
                                const memberUserId = m.userId?._id ? String(m.userId._id) : String(m.userId);
                                const isSelected = selectedAssignee === memberUserId;
                                const avatarStyle = getAvatarStyle(memberUserId || memberName);
                                const initials = getInitials(memberName);

                                return (
                                    <DropdownMenuItem
                                        key={m._id || memberUserId}
                                        onClick={() => onSelectAssignee(isSelected ? null : memberUserId)}
                                        className="flex items-center justify-between cursor-pointer py-1.5"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            {m.userSnapshot?.avatar ? (
                                                <img
                                                    src={m.userSnapshot.avatar}
                                                    alt={memberName}
                                                    className="w-5 h-5 rounded-full object-cover shrink-0"
                                                />
                                            ) : (
                                                <div 
                                                    style={avatarStyle}
                                                    className="w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 border border-border/40"
                                                >
                                                    {initials}
                                                </div>
                                            )}
                                            <span className="truncate">{memberName}</span>
                                        </div>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                                    </DropdownMenuItem>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Priority Filter Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
                                selectedPriority
                                    ? "bg-primary/10 text-primary border-primary/30 font-semibold"
                                    : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted"
                            )}>
                                <span>{selectedPriority ? `Priority: ${selectedPriority}` : 'Priority'}</span>
                                <ChevronDown className="w-3 h-3 opacity-60" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-36 p-1 text-xs">
                            <DropdownMenuItem onClick={() => onSelectPriority('')}>
                                All Priorities
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onSelectPriority('urgent')}>Urgent</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onSelectPriority('high')}>High</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onSelectPriority('medium')}>Medium</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onSelectPriority('low')}>Low</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Sort Filter Dropdown (Sort issues by filters) */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
                                sortBy && sortBy !== 'default'
                                    ? "bg-primary/10 text-primary border-primary/30 font-semibold"
                                    : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted"
                            )}>
                                <ArrowUpDown className="w-3 h-3 opacity-70" />
                                <span>{sortLabels[sortBy] || 'Sort'}</span>
                                <ChevronDown className="w-3 h-3 opacity-60" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-52 p-1 text-xs">
                            <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-1">
                                Sort Issues In Board
                            </DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onSortChange && onSortChange('default')}>
                                <span>Default (Manual / Position)</span>
                                {sortBy === 'default' && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onSortChange && onSortChange('priority-desc')}>
                                <span>Priority: Urgent → Low</span>
                                {sortBy === 'priority-desc' && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onSortChange && onSortChange('priority-asc')}>
                                <span>Priority: Low → Urgent</span>
                                {sortBy === 'priority-asc' && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onSortChange && onSortChange('due-date')}>
                                <span>Due Date: Soonest</span>
                                {sortBy === 'due-date' && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onSortChange && onSortChange('title-asc')}>
                                <span>Title: A → Z</span>
                                {sortBy === 'title-asc' && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onSortChange && onSortChange('newest')}>
                                <span>Newest Created</span>
                                {sortBy === 'newest' && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Clear Filters Button */}
                    {(searchQuery || activeFilter || selectedPriority || selectedAssignee || (sortBy && sortBy !== 'default')) && (
                        <button
                            onClick={() => {
                                onSearchChange('');
                                onFilterChange('');
                                onSelectPriority('');
                                onSelectAssignee(null);
                                if (onSortChange) onSortChange('default');
                            }}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-1.5 py-1"
                        >
                            <X className="w-3 h-3" />
                            <span>Reset</span>
                        </button>
                    )}
                </div>

                {/* Assignee Filter Quick Avatars */}
                {members.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="text-[11px] mr-1 hidden lg:inline">Assignee:</span>
                        {members.slice(0, 5).map((m) => {
                            const memberName = m.userSnapshot?.name || 'Member';
                            const memberUserId = m.userId?._id ? String(m.userId._id) : String(m.userId);
                            const isSelected = selectedAssignee === memberUserId;
                            const avatar = m.userSnapshot?.avatar;
                            const style = getAvatarStyle(memberUserId || memberName);
                            const initials = getInitials(memberName);

                            return (
                                <button
                                    key={m._id || memberUserId}
                                    onClick={() => onSelectAssignee(isSelected ? null : memberUserId)}
                                    className={cn(
                                        "relative rounded-full transition-all p-0.5",
                                        isSelected ? "ring-2 ring-primary ring-offset-1" : "opacity-75 hover:opacity-100"
                                    )}
                                    title={memberName}
                                >
                                    {avatar ? (
                                        <img
                                            src={avatar}
                                            alt={memberName}
                                            className="w-5 h-5 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div 
                                            style={style}
                                            className="w-5 h-5 rounded-full font-bold text-[9px] flex items-center justify-center border border-border/40"
                                        >
                                            {initials}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create Board Modal */}
            <CreateBoardModal
                isOpen={isCreateBoardOpen}
                onClose={() => setIsCreateBoardOpen(false)}
                projectId={project?._id}
                onBoardCreated={(newBoard) => {
                    if (onSelectBoard) onSelectBoard(newBoard);
                }}
            />
        </div>
    );
};

export default BoardHeader;
