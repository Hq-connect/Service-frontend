import React, { useState } from 'react';
import { MoreHorizontal, Trash2, Edit2, Plus } from 'lucide-react';
import { useDeleteColumn, useUpdateColumn } from '../queries/board.queries';
import { useCreateTask } from '../queries/task.queries';
import { Droppable } from '@hello-pangea/dnd';
import { TaskCard } from './TaskCard';
import { 
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export const BoardColumn = ({ 
    column, 
    boardId, 
    projectId, 
    provided, 
    isDragging, 
    tasks = [], 
    onAddTask,
    projectKey = 'PRJ'
}) => {
    const deleteColumnMutation = useDeleteColumn();
    const updateColumnMutation = useUpdateColumn();
    const createTaskMutation = useCreateTask();
    
    const [isEditing, setIsEditing] = useState(false);
    const [columnName, setColumnName] = useState(column.name);

    // Quick inline task creation state
    const [isQuickAdding, setIsQuickAdding] = useState(false);
    const [quickTitle, setQuickTitle] = useState('');

    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete the column "${column.name}"?`)) {
            deleteColumnMutation.mutate({ boardId, columnId: column._id });
        }
    };

    const handleUpdate = (e) => {
        e?.preventDefault();
        if (columnName.trim() && columnName !== column.name) {
            updateColumnMutation.mutate({
                boardId,
                columnId: column._id,
                data: { name: columnName.trim() }
            });
        }
        setIsEditing(false);
    };

    const mapColumnKeyToStatus = (key = '') => {
        const k = (key || '').toLowerCase();
        if (k === 'to_do' || k.includes('todo') || k.includes('to do')) return 'todo';
        if (k.includes('prog') || k.includes('doing') || k.includes('wip')) return 'in_progress';
        if (k.includes('rev') || k.includes('qa') || k.includes('test')) return 'review';
        if (k.includes('done') || k.includes('comp')) return 'done';
        return 'todo';
    };

    const handleQuickAddSubmit = (e) => {
        e.preventDefault();
        if (!quickTitle.trim()) return;

        createTaskMutation.mutate({
            projectId,
            data: {
                boardId,
                columnId: column._id,
                title: quickTitle.trim(),
                status: mapColumnKeyToStatus(column.key),
                position: tasks.length,
            }
        }, {
            onSuccess: () => {
                setQuickTitle('');
                setIsQuickAdding(false);
            }
        });
    };

    // Status indicator color using existing tokens
    const getColumnAccent = (key = '', name = '') => {
        const lower = (key || name).toLowerCase();
        if (lower.includes('done') || lower.includes('complete')) return 'bg-status-live-foreground';
        if (lower.includes('review') || lower.includes('qa')) return 'bg-primary-sidebar-marker';
        if (lower.includes('prog') || lower.includes('doing') || lower.includes('wip')) return 'bg-status-warn-foreground';
        return 'bg-muted-foreground/60';
    };

    return (
        <div 
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={cn(
                "shrink-0 w-[290px] sm:w-[308px] flex flex-col rounded-xl bg-muted/30 border border-border transition-all h-full max-h-full overflow-hidden select-none",
                isDragging ? "shadow-(--shadow-popover) ring-2 ring-ring/40 rotate-1" : "shadow-(--shadow-card)"
            )}
        >
            {/* Column Header */}
            <div 
                {...provided.dragHandleProps}
                className="px-3.5 py-3 border-b border-border flex items-center justify-between bg-card/85 backdrop-blur-xs rounded-t-xl"
            >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={cn("size-2 rounded-full shrink-0", getColumnAccent(column.key, column.name))} />
                    
                    {isEditing ? (
                        <form onSubmit={handleUpdate} className="flex-1 mr-2">
                            <input
                                autoFocus
                                value={columnName}
                                onChange={(e) => setColumnName(e.target.value)}
                                onBlur={handleUpdate}
                                className="w-full h-7 rounded-md border border-input bg-background px-2 py-0.5 text-xs font-semibold shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                        </form>
                    ) : (
                        <h3 className="font-semibold text-xs text-foreground tracking-tight truncate cursor-grab">
                            {column.name}
                        </h3>
                    )}

                    <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono tabular-nums font-semibold bg-muted text-muted-foreground border border-border shrink-0">
                        {tasks.length}
                    </span>
                </div>

                <div className="flex items-center gap-0.5 shrink-0">
                    <button
                        type="button"
                        onClick={() => setIsQuickAdding(true)}
                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        title="Add Issue"
                    >
                        <Plus className="size-3.5" />
                    </button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            >
                                <MoreHorizontal className="size-3.5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36 p-1 text-xs">
                            <DropdownMenuItem onClick={() => setIsEditing(true)} className="cursor-pointer">
                                <Edit2 className="size-3.5 mr-2 text-muted-foreground" />
                                <span>Rename</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive cursor-pointer">
                                <Trash2 className="size-3.5 mr-2" />
                                <span>Delete Column</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Column Droppable Area & Cards */}
            <div className="flex-1 p-2.5 overflow-y-auto min-h-[150px] custom-scrollbar">
                <Droppable droppableId={column._id} type="task">
                    {(provided, snapshot) => (
                        <div 
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn(
                                "min-h-[120px] transition-colors rounded-lg p-0.5",
                                snapshot.isDraggingOver && "bg-muted/70 ring-1 ring-border rounded-lg"
                            )}
                        >
                            {/* Inline Quick Add Input Box at top if active */}
                            {isQuickAdding && (
                                <form 
                                    onSubmit={handleQuickAddSubmit}
                                    className="p-3 mb-2.5 rounded-xl border border-ring/50 bg-card shadow-(--shadow-card) animate-in fade-in-0 duration-150"
                                >
                                    <textarea
                                        autoFocus
                                        rows={2}
                                        value={quickTitle}
                                        onChange={(e) => setQuickTitle(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleQuickAddSubmit(e);
                                            }
                                            if (e.key === 'Escape') {
                                                setIsQuickAdding(false);
                                            }
                                        }}
                                        placeholder="Issue summary… (Enter to save, Esc to cancel)"
                                        className="w-full text-xs bg-transparent border-0 resize-none focus:outline-none placeholder:text-muted-foreground"
                                    />
                                    <div className="flex items-center justify-end gap-1.5 mt-2 pt-2 border-t border-border">
                                        <button
                                            type="button"
                                            onClick={() => setIsQuickAdding(false)}
                                            className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={createTaskMutation.isPending || !quickTitle.trim()}
                                            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
                                        >
                                            {createTaskMutation.isPending ? 'Adding…' : 'Add Issue'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {tasks.map((task, index) => (
                                <TaskCard 
                                    key={task._id} 
                                    task={task} 
                                    index={index} 
                                    projectKey={projectKey}
                                />
                            ))}
                            {provided.placeholder}
                            
                            {tasks.length === 0 && !snapshot.isDraggingOver && !isQuickAdding && (
                                <div className="flex flex-col items-center justify-center h-28 text-xs text-muted-foreground border border-dashed border-border rounded-xl m-0.5 py-4 bg-card/30">
                                    <p className="text-[11px] font-medium">No issues in {column.name}</p>
                                    <button
                                        type="button"
                                        onClick={() => setIsQuickAdding(true)}
                                        className="mt-1 text-[11px] text-foreground hover:underline font-medium cursor-pointer"
                                    >
                                        + Create issue
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </Droppable>
            </div>
            
            {/* Column Footer */}
            <div className="p-2 border-t border-border bg-card/60">
                <button 
                    type="button"
                    onClick={() => setIsQuickAdding(true)}
                    className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg transition-colors cursor-pointer"
                >
                    <Plus className="size-3.5" />
                    <span>New Issue</span>
                </button>
            </div>
        </div>
    );
};

export default BoardColumn;
