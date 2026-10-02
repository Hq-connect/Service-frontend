import React, { useState } from 'react';
import { MoreHorizontal, Trash2, Edit2, Plus, X, Check } from 'lucide-react';
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

    // Status indicator color
    const getColumnAccent = (key = '', name = '') => {
        const lower = (key || name).toLowerCase();
        if (lower.includes('done') || lower.includes('complete')) return 'bg-emerald-500';
        if (lower.includes('review') || lower.includes('qa')) return 'bg-indigo-500';
        if (lower.includes('prog') || lower.includes('doing') || lower.includes('wip')) return 'bg-blue-500';
        return 'bg-slate-400 dark:bg-slate-500';
    };

    return (
        <div 
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={cn(
                "shrink-0 w-[280px] sm:w-[300px] flex flex-col rounded-lg bg-muted/30 border border-border/80 transition-all h-full max-h-full overflow-hidden select-none",
                isDragging ? "shadow-xl ring-2 ring-primary/40 rotate-1" : "shadow-2xs"
            )}
        >
            {/* Column Header */}
            <div 
                {...provided.dragHandleProps}
                className="p-3 border-b border-border/60 flex items-center justify-between bg-card/60 rounded-t-lg"
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
                        <h3 className="font-semibold text-xs text-foreground truncate cursor-grab">
                            {column.name}
                        </h3>
                    )}

                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border shrink-0">
                        {tasks.length}
                    </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={() => setIsQuickAdding(true)}
                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Add Issue"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                                <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36 p-1 text-xs">
                            <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                <Edit2 className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                                <span>Rename</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                                <Trash2 className="w-3.5 h-3.5 mr-2" />
                                <span>Delete Column</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Column Droppable Area & Cards */}
            <div className="flex-1 p-2 overflow-y-auto min-h-[150px] bg-muted/10">
                <Droppable droppableId={column._id} type="task">
                    {(provided, snapshot) => (
                        <div 
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn(
                                "min-h-[120px] transition-colors rounded-md p-0.5",
                                snapshot.isDraggingOver && "bg-primary/5 ring-1 ring-primary/20 rounded-md"
                            )}
                        >
                            {/* Inline Quick Add Input Box at top if active */}
                            {isQuickAdding && (
                                <form 
                                    onSubmit={handleQuickAddSubmit}
                                    className="p-2.5 mb-2 rounded-md border border-primary/40 bg-card shadow-2xs animate-in fade-in-0 duration-150"
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
                                        placeholder="What needs to be done? (Enter to save, Esc to cancel)"
                                        className="w-full text-xs bg-transparent border-0 resize-none focus:outline-none placeholder:text-muted-foreground"
                                    />
                                    <div className="flex items-center justify-end gap-1.5 mt-2 pt-2 border-t border-border">
                                        <button
                                            type="button"
                                            onClick={() => setIsQuickAdding(false)}
                                            className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={createTaskMutation.isPending || !quickTitle.trim()}
                                            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                                        >
                                            {createTaskMutation.isPending ? 'Adding...' : 'Add'}
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
                                <div className="flex flex-col items-center justify-center h-24 text-xs text-muted-foreground border border-dashed border-border/80 rounded-md m-1 py-4 bg-card/20">
                                    <p className="text-[11px]">No issues</p>
                                    <button
                                        onClick={() => setIsQuickAdding(true)}
                                        className="mt-1 text-[11px] text-primary hover:underline font-medium"
                                    >
                                        + Create one
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </Droppable>
            </div>
            
            {/* Column Footer */}
            <div className="p-2 border-t border-border/60 bg-card/40">
                <button 
                    onClick={() => setIsQuickAdding(true)}
                    className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Issue</span>
                </button>
            </div>
        </div>
    );
};

export default BoardColumn;
