import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Calendar, MessageSquare, Paperclip, AlertCircle } from 'lucide-react';

export const TaskCard = ({ task, index }) => {
    // Determine priority color
    let priorityColor = 'bg-slate-500';
    if (task.priority === 'High') priorityColor = 'bg-destructive';
    if (task.priority === 'Medium') priorityColor = 'bg-amber-500';
    if (task.priority === 'Low') priorityColor = 'bg-green-500';

    return (
        <Draggable draggableId={task._id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`group relative flex flex-col p-3 mb-2 rounded-lg border bg-card text-card-foreground select-none transition-all
                        ${snapshot.isDragging ? 'shadow-lg ring-1 ring-primary/30 z-50' : 'shadow-sm hover:border-primary/40'}
                    `}
                    style={{
                        ...provided.draggableProps.style,
                    }}
                >
                    <div className="flex justify-between items-start mb-2 gap-2">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium text-white ${priorityColor}`}>
                            {task.priority || 'No Priority'}
                        </span>
                        
                        {/* Task specific actions like edit could go here on hover */}
                    </div>

                    <h4 className="text-sm font-medium leading-tight mb-2 text-foreground line-clamp-2">
                        {task.title}
                    </h4>

                    {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                            {task.description}
                        </p>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50 text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1" title="Comments">
                                <MessageSquare className="w-3.5 h-3.5" />
                                {task.comments?.length || 0}
                            </span>
                            <span className="flex items-center gap-1" title="Attachments">
                                <Paperclip className="w-3.5 h-3.5" />
                                {task.attachments?.length || 0}
                            </span>
                        </div>

                        {task.dueDate && (
                            <span className="flex items-center gap-1" title="Due Date">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </Draggable>
    );
};
