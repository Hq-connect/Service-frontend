import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useCreateTask } from '../queries/task.queries';
import { X, Loader2, AlertCircle, ChevronDown, Check } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

export const CreateTaskModal = ({ isOpen, onClose, projectId, boardId, defaultColumnId }) => {
    const createTaskMutation = useCreateTask();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
    });
    const [errorMessage, setErrorMessage] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        setErrorMessage('');

        if (!formData.title.trim()) {
            setErrorMessage('Task title is required');
            return;
        }

        createTaskMutation.mutate({
            projectId,
            data: { 
                title: formData.title.trim(),
                description: formData.description.trim() || undefined,
                priority: formData.priority,
                status: 'todo',
                boardId,
                columnId: defaultColumnId,
            }
        }, {
            onSuccess: () => {
                onClose();
                setFormData({ title: '', description: '', priority: 'medium' });
                setErrorMessage('');
            },
            onError: (err) => {
                const msg = err.response?.data?.message?.[0]?.msg || 
                            err.response?.data?.message || 
                            err.message || 
                            'Failed to create task';
                setErrorMessage(typeof msg === 'string' ? msg : 'Failed to create task');
            },
        });
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-0 duration-150">
            <div className="bg-card text-card-foreground rounded-lg border border-border shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
                <div className="flex justify-between items-center p-4 border-b border-border bg-muted/20">
                    <h2 className="text-sm font-bold text-foreground">Create New Task</h2>
                    <button 
                        onClick={onClose}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
                    {errorMessage && (
                        <div className="flex items-center gap-2 p-2.5 bg-destructive/10 text-destructive text-xs rounded-md border border-destructive/20">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label htmlFor="title" className="text-xs font-semibold text-foreground">
                            Task Title <span className="text-destructive">*</span>
                        </label>
                        <input 
                            id="title"
                            type="text" 
                            required
                            autoFocus
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="flex h-8 w-full rounded-md border border-input bg-background px-3 text-xs shadow-2xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            placeholder="e.g. Design Landing Page"
                        />
                    </div>
                    
                    <div className="space-y-1.5">
                        <label htmlFor="description" className="text-xs font-semibold text-foreground">
                            Description <span className="text-muted-foreground font-normal">(optional)</span>
                        </label>
                        <textarea 
                            id="description"
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="flex w-full rounded-md border border-input bg-background p-2.5 text-xs shadow-2xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                            placeholder="Add more context or acceptance criteria..."
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                            Priority
                        </label>
                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-xs shadow-2xs hover:bg-muted/50 capitalize cursor-pointer focus:outline-hidden">
                                <span>{formData.priority}</span>
                                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[calc(100%-2rem)] min-w-[200px] p-1 text-xs">
                                {['low', 'medium', 'high', 'urgent'].map((p) => (
                                    <DropdownMenuItem
                                        key={p}
                                        onClick={() => setFormData({ ...formData, priority: p })}
                                        className="capitalize flex items-center justify-between cursor-pointer py-1.5"
                                    >
                                        <span>{p}</span>
                                        {formData.priority === p && <Check className="w-3.5 h-3.5 text-primary" />}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createTaskMutation.isPending || !formData.title.trim()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 rounded-md transition-colors shadow-2xs"
                        >
                            {createTaskMutation.isPending ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Creating...</span>
                                </>
                            ) : (
                                <span>Create Task</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default CreateTaskModal;
