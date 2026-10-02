import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { 
    Calendar, MessageSquare, Paperclip, AlertCircle, AlertTriangle, ArrowUp, ArrowDown, Minus 
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setSelectedTaskId } from '../states/productivity.slice';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { getInitials, getAvatarStyle } from '@/global/utils/user';
import { getDueDateStatus } from '../utils/dueDate.utils';

export const TaskCard = ({ task, index, projectKey = 'PRJ' }) => {
    const dispatch = useDispatch();

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

                    {/* Bottom Metadata Bar */}
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-3">
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
                        </div>

                        {/* Assignee Avatar */}
                        {task.assignedTo ? (
                            <div className="shrink-0" title={assigneeName}>
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
