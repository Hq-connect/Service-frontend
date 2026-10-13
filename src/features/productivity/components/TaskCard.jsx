import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { 
    Calendar, MessageSquare, Paperclip, AlertCircle, AlertTriangle, 
    ArrowUp, ArrowDown, Minus, CheckSquare, Check, ChevronDown 
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setSelectedTaskId } from '../states/productivity.slice';
import { useToggleSubtask } from '../queries/task.queries';
import { cn } from '@/lib/utils';
import { getInitials, getAvatarStyle } from '@/global/utils/user';
import { getDueDateStatus } from '../utils/dueDate.utils';

export const TaskCard = ({ task, index, projectKey = 'PRJ' }) => {
    const dispatch = useDispatch();
    const toggleSubtaskMutation = useToggleSubtask();
    const [isExpanded, setIsExpanded] = useState(false);

    const issueKey = `${projectKey}-${index + 1}`;
    const dueStatus = getDueDateStatus(task.dueDate, task.status);

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

    const assigneeName = task.assigneeSnapshot?.name || 'Member';
    const assigneeUserId = task.assignedTo || task.assigneeSnapshot?.userId;
    const assigneeInitials = getInitials(assigneeName);
    const assigneeAvatarStyle = getAvatarStyle(assigneeUserId || assigneeName);

    // Subtask calculations
    const subtasks = task.subtasks || [];
    const totalSubtasks = subtasks.length;
    const completedSubtasks = subtasks.filter((st) => st.isCompleted).length;
    const allSubtasksDone = totalSubtasks > 0 && completedSubtasks === totalSubtasks;

    // Unique collaborators from subtasks
    const subtaskCollaborators = React.useMemo(() => {
        const list = [];
        const seen = new Set();
        subtasks.forEach((st) => {
            if (st.assignedTo && !seen.has(String(st.assignedTo))) {
                seen.add(String(st.assignedTo));
                list.push({
                    id: st.assignedTo,
                    name: st.assigneeSnapshot?.name || 'Member',
                    avatar: st.assigneeSnapshot?.avatar || null,
                });
            }
        });
        return list;
    }, [subtasks]);

    const handleToggleSubtask = (e, subtaskId, currentCompleted) => {
        e.stopPropagation();
        toggleSubtaskMutation.mutate({
            projectId: task.projectId,
            taskId: task._id,
            subtaskId,
            isCompleted: !currentCompleted,
        });
    };

    return (
        <Draggable draggableId={task._id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={() => dispatch(setSelectedTaskId(task._id))}
                    className={cn(
                        "group relative flex flex-col p-3 mb-2 rounded-lg border bg-card text-card-foreground select-none transition-all cursor-pointer",
                        snapshot.isDragging 
                            ? "shadow-xl ring-2 ring-primary/40 rotate-1 scale-[1.01] z-50 bg-card" 
                            : "shadow-2xs hover:shadow-sm hover:border-primary/40 border-border/80"
                    )}
                    style={{
                        ...provided.draggableProps.style,
                    }}
                >
                    {/* Top Row: Key, Labels & Priority */}
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-mono text-[11px] font-bold text-muted-foreground group-hover:text-primary transition-colors">
                                {issueKey}
                            </span>
                            {task.labels && task.labels.length > 0 && (
                                <div className="flex items-center gap-1 truncate">
                                    {task.labels.slice(0, 2).map((l, i) => (
                                        <span 
                                            key={l._id || i}
                                            className="text-[9px] px-1.5 py-0.2 rounded font-medium border shrink-0"
                                            style={{ 
                                                backgroundColor: l.color ? `${l.color}15` : undefined, 
                                                borderColor: l.color ? `${l.color}40` : undefined, 
                                                color: l.color || undefined 
                                            }}
                                        >
                                            {l.name}
                                        </span>
                                    ))}
                                    {task.labels.length > 2 && (
                                        <span className="text-[9px] text-muted-foreground shrink-0">
                                            +{task.labels.length - 2}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="shrink-0 flex items-center gap-1" title={`Priority: ${task.priority || 'medium'}`}>
                            {getPriorityIcon(task.priority)}
                        </div>
                    </div>

                    {/* Task Title */}
                    <h4 className="text-xs font-semibold leading-snug mb-1 text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {task.title}
                    </h4>

                    {/* Description preview */}
                    {task.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
                            {task.description}
                        </p>
                    )}

                    {/* Expandable Subtask Accordion (Linear style) */}
                    {isExpanded && totalSubtasks > 0 && (
                        <div 
                            className="mt-1 mb-2.5 p-2 rounded-lg bg-muted/30 border border-border/60 divide-y divide-border/40 space-y-1 animate-in fade-in-0 duration-150"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {subtasks.map((st) => (
                                <div key={st._id} className="flex items-center gap-2 py-1 first:pt-0 last:pb-0 text-[11px]">
                                    <button
                                        type="button"
                                        onClick={(e) => handleToggleSubtask(e, st._id, st.isCompleted)}
                                        disabled={toggleSubtaskMutation.isPending}
                                        className={cn(
                                            "w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all cursor-pointer",
                                            st.isCompleted 
                                                ? "bg-emerald-500 border-emerald-500 text-white" 
                                                : "border-border bg-card hover:border-primary/60"
                                        )}
                                    >
                                        {st.isCompleted && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                                    </button>

                                    <span 
                                        className={cn(
                                            "flex-1 truncate",
                                            st.isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                                        )}
                                    >
                                        {st.title}
                                    </span>

                                    {st.assignedTo && (
                                        <span 
                                            className="shrink-0"
                                            title={`Assigned to ${st.assigneeSnapshot?.name || 'Member'}`}
                                        >
                                            {st.assigneeSnapshot?.avatar ? (
                                                <img 
                                                    src={st.assigneeSnapshot.avatar} 
                                                    alt="" 
                                                    className="w-3.5 h-3.5 rounded-full object-cover" 
                                                />
                                            ) : (
                                                <div 
                                                    style={getAvatarStyle(st.assignedTo || st.assigneeSnapshot?.name)} 
                                                    className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold text-white shadow-2xs"
                                                >
                                                    {getInitials(st.assigneeSnapshot?.name || 'M')}
                                                </div>
                                            )}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Bottom Metadata Bar */}
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            {dueStatus && (
                                <span 
                                    className={cn(
                                        "flex items-center gap-1 text-[10px] transition-colors",
                                        dueStatus.colorClass
                                    )} 
                                    title={dueStatus.fullText}
                                >
                                    {dueStatus.iconType === 'alert-circle' && (
                                        <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
                                    )}
                                    {dueStatus.iconType === 'alert-triangle' && (
                                        <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                                    )}
                                    {dueStatus.iconType === 'calendar' && (
                                        <Calendar className="w-3 h-3 shrink-0" />
                                    )}
                                    <span>{dueStatus.label}</span>
                                </span>
                            )}
                            {(task.comments?.length > 0 || task.commentCount > 0) && (
                                <span className="flex items-center gap-1 text-[10px]" title="Comments">
                                    <MessageSquare className="w-3 h-3" />
                                    <span>{task.comments?.length || task.commentCount || 0}</span>
                                </span>
                            )}
                            {(task.attachments?.length > 0 || task.attachmentCount > 0) && (
                                <span className="flex items-center gap-1 text-[10px]" title="Attachments">
                                    <Paperclip className="w-3 h-3" />
                                    <span>{task.attachments?.length || task.attachmentCount || 0}</span>
                                </span>
                            )}

                            {/* Subtask progress badge with expand toggle & collaborator avatars */}
                            {totalSubtasks > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsExpanded((prev) => !prev);
                                        }}
                                        className={cn(
                                            "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border transition-colors cursor-pointer",
                                            allSubtasksDone
                                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                                                : "bg-muted/50 text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground"
                                        )}
                                        title={`Subtasks: ${completedSubtasks}/${totalSubtasks} completed. Click to ${isExpanded ? 'collapse' : 'view'}`}
                                    >
                                        <CheckSquare className="w-3 h-3" />
                                        <span>{completedSubtasks}/{totalSubtasks}</span>
                                        <ChevronDown className={cn("w-2.5 h-2.5 transition-transform duration-200", isExpanded && "rotate-180")} />
                                    </button>

                                    {/* Overlapping Subtask Collaborator Avatars */}
                                    {subtaskCollaborators.length > 0 && (
                                        <div 
                                            className="flex items-center -space-x-1.5 ml-0.5" 
                                            title={`Collaborators: ${subtaskCollaborators.map(c => c.name).join(', ')}`}
                                        >
                                            {subtaskCollaborators.slice(0, 3).map((c) => (
                                                c.avatar ? (
                                                    <img 
                                                        key={c.id} 
                                                        src={c.avatar} 
                                                        alt={c.name} 
                                                        className="w-4 h-4 rounded-full object-cover ring-1 ring-card" 
                                                    />
                                                ) : (
                                                    <div 
                                                        key={c.id} 
                                                        style={getAvatarStyle(c.id || c.name)} 
                                                        className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white ring-1 ring-card shadow-2xs"
                                                    >
                                                        {getInitials(c.name)}
                                                    </div>
                                                )
                                            ))}
                                            {subtaskCollaborators.length > 3 && (
                                                <span className="text-[8px] text-muted-foreground pl-1 font-semibold">
                                                    +{subtaskCollaborators.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Assignee Avatar */}
                        {task.assignedTo ? (
                            <div className="shrink-0 ml-1.5" title={`Owner: ${assigneeName}`}>
                                {task.assigneeSnapshot?.avatar ? (
                                    <img 
                                        src={task.assigneeSnapshot.avatar} 
                                        alt={assigneeName} 
                                        className="w-5 h-5 rounded-full object-cover border border-border"
                                    />
                                ) : (
                                    <div 
                                        style={assigneeAvatarStyle}
                                        className="w-5 h-5 rounded-full font-bold flex items-center justify-center text-[9px] shadow-2xs border border-border/40"
                                    >
                                        {assigneeInitials}
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </Draggable>
    );
};

export default TaskCard;
