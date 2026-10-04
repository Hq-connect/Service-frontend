import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setSelectedTaskId } from '../states/productivity.slice';
import { useUpdateTask, useDeleteTask, useAssignTask, useUnassignTask, useCreateTask } from '../queries/task.queries';
import { 
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell 
} from '@/components/ui/table';
import { 
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { 
    Calendar, User, AlertCircle, AlertTriangle, ArrowUp, ArrowDown, Minus, ArrowUpRight, 
    MoreHorizontal, Trash2, Plus, CheckCircle2, Clock, Check, ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { getInitials, getAvatarStyle } from '@/global/utils/user';
import { getDueDateStatus } from '../utils/dueDate.utils';

export const TaskListView = ({ 
    tasks = [], 
    projectId, 
    projectKey = 'PRJ', 
    boardId, 
    columns = [], 
    members = [] 
}) => {
    const dispatch = useDispatch();
    const updateTaskMutation = useUpdateTask();
    const deleteTaskMutation = useDeleteTask();
    const assignTaskMutation = useAssignTask();
    const unassignTaskMutation = useUnassignTask();
    const createTaskMutation = useCreateTask();

    const [isAddingInline, setIsAddingInline] = useState(false);
    const [inlineTitle, setInlineTitle] = useState('');
    const [inlineColumnId, setInlineColumnId] = useState(columns[0]?._id || '');

    const handleStatusChange = (taskId, newStatus) => {
        // Also map to matching column if possible
        const targetColumn = columns.find(c => c.key === newStatus || c.name.toLowerCase() === newStatus.replace('_', ' '));
        const updateData = { status: newStatus };
        if (targetColumn) {
            updateData.columnId = targetColumn._id;
        }
        updateTaskMutation.mutate({
            projectId,
            taskId,
            data: updateData,
        });
    };

    const handlePriorityChange = (taskId, newPriority) => {
        updateTaskMutation.mutate({
            projectId,
            taskId,
            data: { priority: newPriority },
        });
    };

    const handleAssign = (taskId, userId) => {
        if (!userId) {
            unassignTaskMutation.mutate({ projectId, taskId });
        } else {
            assignTaskMutation.mutate({ projectId, taskId, userId });
        }
    };

    const handleDelete = (e, taskId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this issue?')) {
            deleteTaskMutation.mutate({ projectId, taskId });
        }
    };

    const handleInlineSubmit = (e) => {
        e.preventDefault();
        if (!inlineTitle.trim() || !boardId) return;

        createTaskMutation.mutate({
            projectId,
            data: {
                boardId,
                columnId: inlineColumnId || columns[0]?._id,
                title: inlineTitle.trim(),
                priority: 'medium',
                status: 'todo',
            }
        }, {
            onSuccess: () => {
                setInlineTitle('');
                setIsAddingInline(false);
            }
        });
    };

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

    const getStatusBadge = (status) => {
        switch (status) {
            case 'done':
                return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
            case 'review':
                return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
            case 'in_progress':
                return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
            case 'todo':
            default:
                return 'bg-muted text-muted-foreground border-border';
        }
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden">
            {/* Table Header Bar */}
            <div className="px-6 py-2.5 border-b border-border flex items-center justify-between bg-card/40">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Issues ({tasks.length})
                    </span>
                </div>
                <button
                    onClick={() => setIsAddingInline(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Quick Add</span>
                </button>
            </div>

            {/* Inline Quick Add Form */}
            {isAddingInline && (
                <form 
                    onSubmit={handleInlineSubmit}
                    className="px-6 py-2.5 bg-muted/40 border-b border-border flex items-center gap-3 animate-in fade-in-0 duration-150"
                >
                    <span className="text-xs font-mono font-bold text-muted-foreground">
                        {projectKey}
                    </span>
                    <input
                        type="text"
                        autoFocus
                        value={inlineTitle}
                        onChange={(e) => setInlineTitle(e.target.value)}
                        placeholder="What needs to be done? Press Enter to save..."
                        className="flex-1 h-8 rounded-md border border-input bg-background px-3 text-xs shadow-2xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger className="h-8 px-2.5 rounded-md border border-input bg-background text-xs font-medium text-foreground flex items-center gap-1.5 hover:bg-muted/50 cursor-pointer shadow-2xs focus:outline-hidden shrink-0">
                            <span>{columns.find(c => String(c._id) === String(inlineColumnId))?.name || 'Status'}</span>
                            <ChevronDown className="w-3 h-3 opacity-60" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-40 p-1 text-xs">
                            {columns.map((col) => (
                                <DropdownMenuItem
                                    key={col._id}
                                    onClick={() => setInlineColumnId(col._id)}
                                    className="flex items-center justify-between cursor-pointer py-1.5"
                                >
                                    <span>{col.name}</span>
                                    {String(col._id) === String(inlineColumnId) && <Check className="w-3.5 h-3.5 text-primary" />}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <button
                        type="submit"
                        disabled={createTaskMutation.isPending || !inlineTitle.trim()}
                        className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
                    >
                        {createTaskMutation.isPending ? 'Saving...' : 'Add Issue'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsAddingInline(false)}
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                        Cancel
                    </button>
                </form>
            )}

            {/* Table Container */}
            <div className="flex-1 overflow-auto">
                <Table className="w-full">
                    <TableHeader className="sticky top-0 bg-muted/30 backdrop-blur-xs z-10 border-b border-border">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[100px] text-xs font-semibold">Key</TableHead>
                            <TableHead className="min-w-[280px] text-xs font-semibold">Summary</TableHead>
                            <TableHead className="w-[140px] text-xs font-semibold">Status</TableHead>
                            <TableHead className="w-[130px] text-xs font-semibold">Priority</TableHead>
                            <TableHead className="w-[160px] text-xs font-semibold">Assignee</TableHead>
                            <TableHead className="w-[120px] text-xs font-semibold">Due Date</TableHead>
                            <TableHead className="w-[60px] text-right text-xs font-semibold"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tasks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-xs">
                                    No issues found in this view.
                                </TableCell>
                            </TableRow>
                        ) : (
                            tasks.map((task, index) => {
                                const issueKey = `${projectKey}-${index + 1}`;
                                const dueStatus = getDueDateStatus(task.dueDate, task.status);

                                return (
                                    <TableRow 
                                        key={task._id}
                                        onClick={() => dispatch(setSelectedTaskId(task._id))}
                                        className="cursor-pointer group hover:bg-muted/40 transition-colors border-b border-border/60"
                                    >
                                        {/* Key */}
                                        <TableCell className="font-mono text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                                            {issueKey}
                                        </TableCell>

                                        {/* Title & Labels */}
                                        <TableCell className="max-w-[400px]">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                                    {task.title}
                                                </span>
                                                {task.labels && task.labels.length > 0 && (
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        {task.labels.slice(0, 2).map((l, i) => (
                                                            <span
                                                                key={l._id || i}
                                                                className="px-1.5 py-0.2 rounded text-[10px] font-medium border"
                                                                style={{
                                                                    backgroundColor: l.color ? `${l.color}15` : undefined,
                                                                    borderColor: l.color ? `${l.color}40` : undefined,
                                                                    color: l.color || undefined,
                                                                }}
                                                            >
                                                                {l.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Status Dropdown */}
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className={cn(
                                                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border capitalize transition-colors hover:opacity-80",
                                                        getStatusBadge(task.status)
                                                    )}>
                                                        <span>{task.status?.replace('_', ' ') || 'Todo'}</span>
                                                        <ChevronDown className="w-3 h-3 opacity-60" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="w-36 p-1 text-xs">
                                                    <DropdownMenuItem onClick={() => handleStatusChange(task._id, 'todo')}>
                                                        To Do
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleStatusChange(task._id, 'in_progress')}>
                                                        In Progress
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleStatusChange(task._id, 'review')}>
                                                        In Review
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleStatusChange(task._id, 'done')}>
                                                        Done
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>

                                        {/* Priority Dropdown */}
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-muted text-xs font-medium text-foreground transition-colors">
                                                        {getPriorityIcon(task.priority)}
                                                        <span className="capitalize">{task.priority || 'Medium'}</span>
                                                        <ChevronDown className="w-3 h-3 text-muted-foreground opacity-60" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="w-32 p-1 text-xs">
                                                    <DropdownMenuItem onClick={() => handlePriorityChange(task._id, 'urgent')} className="flex items-center gap-2">
                                                        <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                                                        <span>Urgent</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handlePriorityChange(task._id, 'high')} className="flex items-center gap-2">
                                                        <ArrowUp className="w-3.5 h-3.5 text-destructive" />
                                                        <span>High</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handlePriorityChange(task._id, 'medium')} className="flex items-center gap-2">
                                                        <Minus className="w-3.5 h-3.5 text-amber-500" />
                                                        <span>Medium</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handlePriorityChange(task._id, 'low')} className="flex items-center gap-2">
                                                        <ArrowDown className="w-3.5 h-3.5 text-emerald-500" />
                                                        <span>Low</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>

                                        {/* Assignee */}
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="inline-flex items-center gap-2 px-1.5 py-1 rounded-md hover:bg-muted text-xs transition-colors">
                                                        {task.assignedTo ? (
                                                            <>
                                                                {task.assigneeSnapshot?.avatar ? (
                                                                    <img 
                                                                        src={task.assigneeSnapshot.avatar} 
                                                                        alt={task.assigneeSnapshot?.name} 
                                                                        className="w-5 h-5 rounded-full object-cover shrink-0 border border-border" 
                                                                    />
                                                                ) : (
                                                                    <div 
                                                                        style={getAvatarStyle(task.assignedTo || task.assigneeSnapshot?.name)}
                                                                        className="w-5 h-5 rounded-full font-bold text-[9px] flex items-center justify-center shrink-0 border border-border/40"
                                                                    >
                                                                        {getInitials(task.assigneeSnapshot?.name || 'A')}
                                                                    </div>
                                                                )}
                                                                <span className="truncate max-w-[90px] text-foreground font-medium">
                                                                    {task.assigneeSnapshot?.name || 'Assigned'}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                                <User className="w-3.5 h-3.5" />
                                                                <span>Unassigned</span>
                                                            </div>
                                                        )}
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="w-48 p-1 text-xs">
                                                    <DropdownMenuItem onClick={() => handleAssign(task._id, null)} className="text-muted-foreground">
                                                        Unassigned
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {members.map((m) => {
                                                        const mName = m.userSnapshot?.name || 'Member';
                                                        const mUserId = m.userId?._id ? String(m.userId._id) : String(m.userId);
                                                        return (
                                                            <DropdownMenuItem 
                                                                key={m._id || mUserId}
                                                                onClick={() => handleAssign(task._id, mUserId)}
                                                                className="flex items-center justify-between"
                                                            >
                                                                <div className="flex items-center gap-2 truncate">
                                                                    <span 
                                                                        style={getAvatarStyle(mUserId || mName)}
                                                                        className="w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 border border-border/40"
                                                                    >
                                                                        {getInitials(mName)}
                                                                    </span>
                                                                    <span className="truncate">{mName}</span>
                                                                </div>
                                                                {String(task.assignedTo) === String(mUserId) && (
                                                                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                                                                )}
                                                            </DropdownMenuItem>
                                                        );
                                                    })}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>

                                        {/* Due Date */}
                                        <TableCell>
                                            {dueStatus ? (
                                                <span 
                                                    className={cn(
                                                        "inline-flex items-center gap-1.5 text-xs transition-colors",
                                                        dueStatus.colorClass
                                                    )}
                                                    title={dueStatus.fullText}
                                                >
                                                    {dueStatus.iconType === 'alert-circle' && (
                                                        <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                                                    )}
                                                    {dueStatus.iconType === 'alert-triangle' && (
                                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                    )}
                                                    {dueStatus.iconType === 'calendar' && (
                                                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                                                    )}
                                                    <span>{dueStatus.label}</span>
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground/50 text-xs">-</span>
                                            )}
                                        </TableCell>

                                        {/* Row Actions */}
                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={(e) => handleDelete(e, task._id)}
                                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                                                title="Delete issue"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default TaskListView;
