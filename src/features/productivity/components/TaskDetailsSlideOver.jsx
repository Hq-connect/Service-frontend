import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { setSelectedTaskId } from '../states/productivity.slice';
import { useTask, useUpdateTask, useAssignTask, useUnassignTask } from '../queries/task.queries';
import { useProjectMembers } from '../queries/project.queries';
import { 
    X, Calendar, User, AlignLeft, Tag, Paperclip, MessageSquare, 
    Activity, Check, ChevronDown, Clock, CheckCircle2, AlertCircle, AlertTriangle,
    ArrowUp, ArrowDown, Minus, Timer, Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import TaskComments from './TaskComments';
import TaskLabels from './TaskLabels';
import TaskAttachments from './TaskAttachments';
import TaskActivityFeed from './TaskActivityFeed';
import { getInitials, getAvatarStyle } from '@/global/utils/user';
import { getDueDateStatus } from '../utils/dueDate.utils';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const TaskDetailsSlideOver = () => {
    const dispatch = useDispatch();
    const { activeProject, selectedTaskId } = useSelector((state) => state.productivity);
    const { projectId: urlProjectId } = useParams();
    
    // Fallback to URL param if Redux state was lost
    const projectId = activeProject?._id || urlProjectId;

    const { data: taskResponse, isLoading } = useTask(projectId, selectedTaskId);
    const task = taskResponse?.data?.task;
    const dueStatus = getDueDateStatus(task?.dueDate, task?.status);

    const { data: membersResponse } = useProjectMembers(projectId, { enabled: !!projectId });
    const members = membersResponse?.data?.members || [];

    const updateTaskMutation = useUpdateTask();
    const assignTaskMutation = useAssignTask();
    const unassignTaskMutation = useUnassignTask();

    const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [descText, setDescText] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleText, setTitleText] = useState('');
    const [activeTab, setActiveTab] = useState('comments'); // 'comments' | 'activity'

    // Time tracking state
    const [isEditingHours, setIsEditingHours] = useState(false);
    const [estimatedHours, setEstimatedHours] = useState('');
    const [actualHours, setActualHours] = useState('');

    useEffect(() => {
        if (task) {
            setDescText(task.description || '');
            setTitleText(task.title || '');
            setEstimatedHours(task.estimatedHours != null ? String(task.estimatedHours) : '');
            setActualHours(task.actualHours != null ? String(task.actualHours) : '');
        }
    }, [task]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !isEditingTitle && !isEditingDesc && !isEditingHours) {
                handleClose();
            }
        };
        if (selectedTaskId) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [selectedTaskId, isEditingTitle, isEditingDesc, isEditingHours]);

    if (!selectedTaskId) return null;

    const handleClose = () => {
        dispatch(setSelectedTaskId(null));
    };

    const handleAssign = (userId) => {
        if (!userId) {
            unassignTaskMutation.mutate({ projectId, taskId: selectedTaskId });
        } else {
            assignTaskMutation.mutate({ projectId, taskId: selectedTaskId, userId });
        }
        setIsAssigneeOpen(false);
    };

    const handleDueDateChange = (e) => {
        const val = e.target.value;
        const newDueDate = val ? new Date(val).toISOString() : null;
        updateTaskMutation.mutate({
            projectId,
            taskId: selectedTaskId,
            data: { dueDate: newDueDate }
        });
    };

    const handlePriorityChange = (val) => {
        const priority = typeof val === 'string' ? val : val?.target?.value;
        if (!priority) return;
        updateTaskMutation.mutate({
            projectId,
            taskId: selectedTaskId,
            data: { priority }
        });
    };

    const handleStatusChange = (val) => {
        const status = typeof val === 'string' ? val : val?.target?.value;
        if (!status) return;
        updateTaskMutation.mutate({
            projectId,
            taskId: selectedTaskId,
            data: { status }
        });
    };

    const handleSaveDescription = () => {
        updateTaskMutation.mutate({
            projectId,
            taskId: selectedTaskId,
            data: { description: descText }
        }, {
            onSuccess: () => setIsEditingDesc(false)
        });
    };

    const handleSaveTitle = () => {
        if (!titleText.trim()) return;
        updateTaskMutation.mutate({
            projectId,
            taskId: selectedTaskId,
            data: { title: titleText.trim() }
        }, {
            onSuccess: () => setIsEditingTitle(false)
        });
    };

    const handleSaveHours = () => {
        const est = estimatedHours === '' ? null : parseFloat(estimatedHours);
        const act = actualHours === '' ? null : parseFloat(actualHours);
        updateTaskMutation.mutate({
            projectId,
            taskId: selectedTaskId,
            data: { 
                estimatedHours: isNaN(est) ? null : est, 
                actualHours: isNaN(act) ? null : act 
            }
        }, {
            onSuccess: () => setIsEditingHours(false)
        });
    };

    const currentAssigneeName = task?.assigneeSnapshot?.name || (task?.assignedTo ? 'Assigned' : 'Unassigned');
    const currentAssigneeAvatar = task?.assigneeSnapshot?.avatar;

    const getPriorityIcon = (priority) => {
        switch (priority) {
            case 'urgent':
                return <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />;
            case 'high':
                return <ArrowUp className="w-3.5 h-3.5 text-destructive shrink-0" />;
            case 'medium':
                return <Minus className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
            case 'low':
                return <ArrowDown className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
            default:
                return <Minus className="w-3.5 h-3.5 text-muted-foreground shrink-0" />;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 overflow-y-auto">
            {/* Backdrop with blur */}
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in-0 duration-200"
                onClick={handleClose}
            />

            {/* Main Centered Dialog Panel - Jira / Linear Style */}
            <div className="relative w-full max-w-5xl xl:max-w-6xl max-h-[92vh] bg-card text-card-foreground rounded-lg shadow-2xl border border-border flex flex-col overflow-hidden z-10 animate-in fade-in-0 zoom-in-95 duration-200">
                
                {/* Modal Top Bar */}
                <div className="flex items-center justify-between px-6 py-3.5 border-b border-border bg-card sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-md bg-muted text-foreground font-mono font-bold text-xs uppercase tracking-wider border border-border">
                            {activeProject?.key || 'ISSUE'}
                        </span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-xs font-semibold text-muted-foreground truncate max-w-xs">
                            {activeProject?.name || 'Project'}
                        </span>
                    </div>

                    <button 
                        onClick={handleClose}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                        title="Close (Esc)"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* 2-Column Responsive Body */}
                <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto min-h-0">
                    
                    {/* Left Column: Main Content (Title, Description, Attachments, Comments) */}
                    <div className="lg:col-span-8 p-6 sm:p-8 space-y-7 overflow-y-auto border-b lg:border-b-0 lg:border-r border-border bg-background">
                        
                        {/* Title Section */}
                        <div>
                            {isLoading ? (
                                <div className="h-10 w-3/4 bg-muted animate-pulse rounded-lg" />
                            ) : isEditingTitle ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={titleText}
                                        onChange={(e) => setTitleText(e.target.value)}
                                        className="text-xl sm:text-2xl font-bold text-foreground border border-input bg-card rounded-xl p-2 w-full focus:outline-none focus:ring-2 focus:ring-ring shadow-2xs"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveTitle();
                                            if (e.key === 'Escape') setIsEditingTitle(false);
                                        }}
                                    />
                                    <button
                                        onClick={handleSaveTitle}
                                        disabled={updateTaskMutation.isPending}
                                        className="p-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors shadow-2xs"
                                        title="Save title"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setIsEditingTitle(false)}
                                        className="p-2 text-muted-foreground hover:bg-muted rounded-xl transition-colors"
                                        title="Cancel"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <h1 
                                    onClick={() => setIsEditingTitle(true)}
                                    className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-snug cursor-pointer hover:bg-muted/50 p-1.5 -ml-1.5 rounded-xl transition-colors"
                                    title="Click to edit title"
                                >
                                    {task?.title || 'Untitled Issue'}
                                </h1>
                            )}
                        </div>

                        {/* Description Section */}
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-foreground font-semibold text-xs uppercase tracking-wider">
                                    <AlignLeft className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>Description</span>
                                </div>
                                {!isEditingDesc && (
                                    <button
                                        onClick={() => setIsEditingDesc(true)}
                                        className="text-xs font-semibold text-primary hover:underline px-2 py-0.5 rounded transition-colors"
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>

                            {isEditingDesc ? (
                                <div className="space-y-3">
                                    <textarea
                                        value={descText}
                                        onChange={(e) => setDescText(e.target.value)}
                                        rows={6}
                                        className="w-full text-xs text-foreground bg-card p-3 rounded-xl border border-input focus:outline-none focus:ring-2 focus:ring-ring shadow-2xs leading-relaxed"
                                        placeholder="Add notes, specifications, acceptance criteria..."
                                        autoFocus
                                    />
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleSaveDescription}
                                            disabled={updateTaskMutation.isPending}
                                            className="px-3.5 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-2xs"
                                        >
                                            {updateTaskMutation.isPending ? 'Saving...' : 'Save Description'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setDescText(task?.description || '');
                                                setIsEditingDesc(false);
                                            }}
                                            className="px-3 py-1.5 text-muted-foreground hover:text-foreground rounded-lg text-xs font-medium hover:bg-muted transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div 
                                    onClick={() => setIsEditingDesc(true)}
                                    className="text-xs text-foreground/90 bg-card p-4 rounded-xl border border-border min-h-[90px] whitespace-pre-wrap cursor-pointer hover:border-primary/40 transition-colors leading-relaxed shadow-2xs"
                                >
                                    {task?.description ? (
                                        task.description
                                    ) : (
                                        <span className="text-muted-foreground italic font-normal">
                                            No description provided. Click here to add detailed notes...
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Attachments Section */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center gap-2 text-foreground font-semibold text-xs uppercase tracking-wider">
                                <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>Attachments</span>
                            </div>
                            <TaskAttachments projectId={projectId} taskId={selectedTaskId} />
                        </div>

                        {/* Activity & Comments Tabs */}
                        <div className="space-y-4 pt-4 border-t border-border">
                            <div className="flex items-center gap-4 border-b border-border">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('comments')}
                                    className={cn(
                                        "flex items-center gap-2 pb-2.5 text-xs font-semibold transition-all relative",
                                        activeTab === 'comments'
                                            ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>Comments</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('activity')}
                                    className={cn(
                                        "flex items-center gap-2 pb-2.5 text-xs font-semibold transition-all relative",
                                        activeTab === 'activity'
                                            ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Activity className="w-3.5 h-3.5" />
                                    <span>Activity History</span>
                                </button>
                            </div>

                            {activeTab === 'comments' ? (
                                <TaskComments projectId={projectId} taskId={selectedTaskId} />
                            ) : (
                                <TaskActivityFeed projectId={projectId} taskId={selectedTaskId} />
                            )}
                        </div>
                    </div>

                    {/* Right Column: Properties Sidebar */}
                    <div className="lg:col-span-4 p-6 sm:p-7 bg-muted/20 space-y-5 overflow-y-auto">
                        
                        <div className="pb-1 border-b border-border">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Properties</h3>
                        </div>

                        {/* Status */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Status</span>
                            </label>
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    disabled={updateTaskMutation.isPending}
                                    className="w-full flex items-center justify-between p-2 rounded-xl bg-card border border-input hover:border-primary/50 text-xs font-semibold shadow-2xs capitalize cursor-pointer focus:outline-hidden disabled:opacity-50"
                                >
                                    <span>
                                        {{
                                            todo: 'To Do',
                                            in_progress: 'In Progress',
                                            review: 'In Review',
                                            done: 'Done',
                                        }[task?.status] || task?.status || 'To Do'}
                                    </span>
                                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-48 p-1 text-xs">
                                    <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-1">
                                        Change Status
                                    </DropdownMenuLabel>
                                    {[
                                        { value: 'todo', label: 'To Do' },
                                        { value: 'in_progress', label: 'In Progress' },
                                        { value: 'review', label: 'In Review' },
                                        { value: 'done', label: 'Done' },
                                    ].map((opt) => (
                                        <DropdownMenuItem
                                            key={opt.value}
                                            onClick={() => handleStatusChange(opt.value)}
                                            className="flex items-center justify-between cursor-pointer py-1.5"
                                        >
                                            <span>{opt.label}</span>
                                            {(task?.status || 'todo') === opt.value && <Check className="w-3.5 h-3.5 text-primary" />}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Assignee */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" />
                                <span>Assignee</span>
                            </label>
                            
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsAssigneeOpen(!isAssigneeOpen)}
                                    className="w-full flex items-center justify-between p-2 bg-card border border-input hover:border-primary/50 rounded-xl shadow-2xs transition-colors"
                                >
                                    <div className="flex items-center gap-2.5 truncate">
                                        {currentAssigneeAvatar ? (
                                            <img 
                                                src={currentAssigneeAvatar} 
                                                alt={currentAssigneeName} 
                                                className="w-6 h-6 rounded-full border border-border object-cover"
                                            />
                                        ) : (
                                            <div 
                                                style={task?.assignedTo ? getAvatarStyle(task.assignedTo || currentAssigneeName) : undefined}
                                                className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] border border-border/40"
                                            >
                                                {task?.assignedTo ? getInitials(currentAssigneeName) : <User className="w-3 h-3" />}
                                            </div>
                                        )}
                                        <span className="text-xs font-semibold text-foreground truncate">
                                            {currentAssigneeName}
                                        </span>
                                    </div>
                                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                </button>

                                {/* Dropdown Menu */}
                                {isAssigneeOpen && (
                                    <>
                                        <div className="fixed inset-0 z-30" onClick={() => setIsAssigneeOpen(false)} />
                                        <div className="absolute left-0 top-full mt-1.5 w-full bg-popover text-popover-foreground border border-border rounded-lg shadow-xl z-40 py-1 animate-in fade-in-0 zoom-in-95">
                                            <div className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                                Assign To Member
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleAssign(null)}
                                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground text-left transition-colors"
                                            >
                                                <div className="w-5 h-5 rounded-full border border-dashed border-border flex items-center justify-center text-muted-foreground">
                                                    <X className="w-2.5 h-2.5" />
                                                </div>
                                                <span>Unassigned</span>
                                                {!task?.assignedTo && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                                            </button>
                                            <div className="border-t border-border my-1" />
                                            {members.length === 0 ? (
                                                <div className="px-3 py-2 text-xs text-muted-foreground">No project members</div>
                                            ) : (
                                                members.map((m) => {
                                                    const mName = m.userSnapshot?.name || 'Member';
                                                    const mUserId = m.userId?._id || m.userId;
                                                    const isCurrent = String(task?.assignedTo) === String(mUserId);

                                                    return (
                                                        <button
                                                            key={m._id || mUserId}
                                                            type="button"
                                                            onClick={() => handleAssign(mUserId)}
                                                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-accent text-left transition-colors"
                                                        >
                                                            {m.userSnapshot?.avatar ? (
                                                                <img src={m.userSnapshot.avatar} alt={mName} className="w-5 h-5 rounded-full object-cover" />
                                                            ) : (
                                                                <div 
                                                                    style={getAvatarStyle(mUserId || mName)}
                                                                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border border-border/40"
                                                                >
                                                                    {getInitials(mName)}
                                                                </div>
                                                            )}
                                                            <span className="truncate flex-1 font-medium">{mName}</span>
                                                            {isCurrent && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Priority */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Priority</span>
                            </label>
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    disabled={updateTaskMutation.isPending}
                                    className="w-full flex items-center justify-between p-2 rounded-xl bg-card border border-input hover:border-primary/50 text-xs font-semibold shadow-2xs capitalize cursor-pointer focus:outline-hidden disabled:opacity-50"
                                >
                                    <span>{task?.priority || 'medium'}</span>
                                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-48 p-1 text-xs">
                                    <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-1">
                                        Change Priority
                                    </DropdownMenuLabel>
                                    {['low', 'medium', 'high', 'urgent'].map((p) => (
                                        <DropdownMenuItem
                                            key={p}
                                            onClick={() => handlePriorityChange(p)}
                                            className="capitalize flex items-center justify-between cursor-pointer py-1.5"
                                        >
                                            <span>{p}</span>
                                            {(task?.priority || 'medium') === p && <Check className="w-3.5 h-3.5 text-primary" />}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Due Date */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Due Date</span>
                            </label>
                            <div className="flex items-center gap-2 p-1.5 bg-card border border-input rounded-xl shadow-2xs">
                                <input
                                    type="date"
                                    value={task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                                    onChange={handleDueDateChange}
                                    disabled={updateTaskMutation.isPending}
                                    className="text-xs font-semibold text-foreground bg-transparent flex-1 cursor-pointer focus:outline-none"
                                />
                                {task?.dueDate && (
                                    <button
                                        type="button"
                                        title="Clear due date"
                                        onClick={() => updateTaskMutation.mutate({ projectId, taskId: selectedTaskId, data: { dueDate: null } })}
                                        className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>

                            {/* Overdue / Warning alerts */}
                            {dueStatus && dueStatus.type === 'overdue' && (
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold border border-destructive/20 animate-in fade-in-50">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>Overdue: Task was not completed in the assigned time ({dueStatus.badgeText})</span>
                                </div>
                            )}
                            {dueStatus && dueStatus.type === 'warning' && (
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold border border-amber-500/20 animate-in fade-in-50">
                                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                                    <span>Warning: Due date approaching ({dueStatus.badgeText} remaining)</span>
                                </div>
                            )}
                        </div>

                        {/* Time Tracking (Estimated vs Actual Hours) */}
                        <div className="space-y-2 pt-2 border-t border-border">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                    <Timer className="w-3.5 h-3.5" />
                                    <span>Time Tracking</span>
                                </label>
                                {!isEditingHours && (
                                    <button
                                        onClick={() => setIsEditingHours(true)}
                                        className="text-[11px] font-semibold text-primary hover:underline"
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>

                            {isEditingHours ? (
                                <div className="space-y-2 p-2.5 rounded-xl border border-border bg-card">
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="text-[10px] text-muted-foreground block mb-1">Estimated (h)</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.5"
                                                value={estimatedHours}
                                                onChange={(e) => setEstimatedHours(e.target.value)}
                                                className="w-full h-7 rounded border border-input bg-background px-2 text-xs"
                                                placeholder="e.g. 8"
                                            />
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-muted-foreground block mb-1">Actual (h)</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.5"
                                                value={actualHours}
                                                onChange={(e) => setActualHours(e.target.value)}
                                                className="w-full h-7 rounded border border-input bg-background px-2 text-xs"
                                                placeholder="e.g. 5"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-1.5 pt-1">
                                        <button
                                            onClick={() => setIsEditingHours(false)}
                                            className="px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveHours}
                                            disabled={updateTaskMutation.isPending}
                                            className="px-2.5 py-0.5 rounded bg-primary text-primary-foreground text-xs font-medium"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-2.5 rounded-xl border border-border bg-card space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Logged:</span>
                                        <span className="font-semibold text-foreground">
                                            {task?.actualHours != null ? `${task.actualHours}h` : '0h'} / {task?.estimatedHours != null ? `${task.estimatedHours}h` : '—'}
                                        </span>
                                    </div>
                                    {task?.estimatedHours > 0 && (
                                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                            <div 
                                                className={cn(
                                                    "h-1.5 rounded-full transition-all",
                                                    (task.actualHours || 0) > task.estimatedHours ? "bg-destructive" : "bg-primary"
                                                )}
                                                style={{ width: `${Math.min(100, Math.round(((task.actualHours || 0) / task.estimatedHours) * 100))}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Labels */}
                        <div className="space-y-2 pt-2 border-t border-border">
                            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5" />
                                <span>Labels</span>
                            </label>
                            <TaskLabels projectId={projectId} taskId={selectedTaskId} />
                        </div>

                        {/* Metadata Details */}
                        <div className="pt-3 border-t border-border text-[11px] text-muted-foreground space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span>Created</span>
                                <span className="font-medium text-foreground">
                                    {task?.createdAt ? format(new Date(task.createdAt), 'MMM d, yyyy') : '—'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Last Updated</span>
                                <span className="font-medium text-foreground">
                                    {task?.updatedAt ? format(new Date(task.updatedAt), 'MMM d, yyyy') : '—'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailsSlideOver;
