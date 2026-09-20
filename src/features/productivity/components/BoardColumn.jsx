import React, { useState } from 'react';
import { MoreHorizontal, Trash2, Edit2 } from 'lucide-react';
import { useDeleteColumn, useUpdateColumn } from '../queries/board.queries';

export const BoardColumn = ({ column, boardId, provided, isDragging }) => {
    const deleteColumnMutation = useDeleteColumn();
    const updateColumnMutation = useUpdateColumn();
    
    const [isEditing, setIsEditing] = useState(false);
    const [columnName, setColumnName] = useState(column.name);

    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete the column "${column.name}"?`)) {
            deleteColumnMutation.mutate({ boardId, columnId: column._id });
        }
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        if (columnName.trim() && columnName !== column.name) {
            updateColumnMutation.mutate({
                boardId,
                columnId: column._id,
                data: { name: columnName }
            });
        }
        setIsEditing(false);
    };

    return (
        <div 
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`shrink-0 w-80 flex flex-col rounded-xl bg-card border ${isDragging ? 'shadow-xl ring-2 ring-primary/20' : 'shadow-sm'} transition-shadow h-full max-h-full`}
        >
            <div 
                {...provided.dragHandleProps}
                className="p-3 pb-2 border-b flex items-center justify-between group bg-muted/30 rounded-t-xl"
            >
                {isEditing ? (
                    <form onSubmit={handleUpdate} className="flex-1 mr-2">
                        <input
                            autoFocus
                            value={columnName}
                            onChange={(e) => setColumnName(e.target.value)}
                            onBlur={handleUpdate}
                            className="w-full flex h-7 rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                    </form>
                ) : (
                    <h3 className="font-medium text-sm text-foreground truncate select-none pl-1">
                        {column.name}
                    </h3>
                )}

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                        title="Rename Column"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                        onClick={handleDelete}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                        title="Delete Column"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 p-2 overflow-y-auto min-h-[150px] bg-muted/10">
                <Droppable droppableId={column._id} type="task">
                    {(provided, snapshot) => (
                        <div 
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`min-h-[100px] transition-colors rounded-lg ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}
                        >
                            {tasks.map((task, index) => (
                                <TaskCard key={task._id} task={task} index={index} />
                            ))}
                            {provided.placeholder}
                            
                            {tasks.length === 0 && !snapshot.isDraggingOver && (
                                <div className="flex flex-col items-center justify-center h-[100px] text-xs text-muted-foreground italic border-2 border-dashed border-muted/50 rounded-lg m-1 py-4">
                                    No tasks yet
                                </div>
                            )}
                        </div>
                    )}
                </Droppable>
            </div>
            
            <div className="p-2 border-t bg-card">
                <button 
                    onClick={() => onAddTask(column._id)}
                    className="flex items-center justify-center w-full py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Task
                </button>
            </div>
        </div>
    );
};
