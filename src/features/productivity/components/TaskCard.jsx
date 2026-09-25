import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Calendar, MessageSquare, Paperclip, AlertCircle } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setSelectedTaskId } from '../states/productivity.slice';
import { TaskCountdown } from './TaskCountdown';

export const TaskCard = ({ task, index }) => {
    const dispatch = useDispatch();

    // Determine priority color
    let priorityColor = 'bg-slate-500';
    if (task.priority === 'urgent' || task.priority === 'high') priorityColor = 'bg-destructive';
    if (task.priority === 'medium') priorityColor = 'bg-amber-500';
    if (task.priority === 'low') priorityColor = 'bg-green-500';

    return (
        <Draggable draggableId={task._id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={() => dispatch(setSelectedTaskId(task._id))}
                    className={`group relative flex flex-col p-3 mb-2 rounded-lg border bg-card text-card-foreground select-none transition-all cursor-pointer
                        ${snapshot.isDragging ? 'shadow-lg ring-1 ring-primary/30 z-50' : 'shadow-sm hover:border-primary/40'}
                    `}
                    style={{
                        ...provided.draggableProps.style,
                    }}
                >
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium text-white ${priorityColor}`}>
                            {task.priority || 'No Priority'}
                        </span>
                        
                        {task.labels && task.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {task.labels.slice(0, 2).map((l, i) => (
                                    <span 
                                        key={l._id || i}
                                        className="text-[10px] px-1.5 py-0.2 rounded font-medium border"
                                        style={{ backgroundColor: l.color ? `${l.color}15` : '#f4f4f5', borderColor: l.color ? `${l.color}40` : '#e4e4e7', color: l.color || '#52525b' }}
                                    >
                                        {l.name}
                                    </span>
                                ))}
                                {task.labels.length > 2 && (
                                    <span className="text-[10px] text-zinc-400">+{task.labels.length - 2}</span>
                                )}
                            </div>
                        )}
                    </div>

                    <h4 className="text-sm font-medium leading-tight mb-1 text-foreground line-clamp-2">
                        {task.title}
                    </h4>

                    {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                            {task.description}
                        </p>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2.5">
                            {task.dueDate && (
                                <TaskCountdown dueDate={task.dueDate} status={task.status} />
                            )}
                            <span className="flex items-center gap-1" title="Comments">
                                <MessageSquare className="w-3.5 h-3.5" />
                                {task.comments?.length || 0}
                            </span>
                            <span className="flex items-center gap-1" title="Attachments">
                                <Paperclip className="w-3.5 h-3.5" />
                                {task.attachments?.length || 0}
                            </span>
                        </div>

                        {/* Assignee Avatar */}
                        {task.assignedTo && (
                            <div className="flex-shrink-0" title={task.assigneeSnapshot?.name || 'Assigned'}>
                                {task.assigneeSnapshot?.avatar ? (
                                    <img 
                                        src={task.assigneeSnapshot.avatar} 
                                        alt={task.assigneeSnapshot?.name} 
                                        className="w-5 h-5 rounded-full object-cover border border-zinc-200"
                                    />
                                ) : (
                                    <div className="w-5 h-5 rounded-full bg-zinc-800 text-white flex items-center justify-center text-[9px] font-semibold">
                                        {(task.assigneeSnapshot?.name || 'A').charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Draggable>
    );
};
