import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useCreateTask } from '../queries/task.queries';
import { X, Loader2 } from 'lucide-react';
// Assuming you have an action in your slice or you manage this via local state in BoardView.
// For now we'll accept props: isOpen, onClose, projectId, defaultColumnId

export const CreateTaskModal = ({ isOpen, onClose, projectId, boardId, defaultColumnId }) => {
    const createTaskMutation = useCreateTask();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium', // Note: task.validation expects low, medium, high, urgent
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        createTaskMutation.mutate({
            projectId,
            data: { 
                ...formData, 
                boardId,
                columnId: defaultColumnId 
            }
        }, {
            onSuccess: () => {
                onClose();
                setFormData({ title: '', description: '', priority: 'medium' });
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-0">
            <div className="bg-card text-card-foreground rounded-xl border shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-lg font-semibold tracking-tight">Create New Task</h2>
                    <button 
                        onClick={onClose}
                        className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="title" className="text-sm font-medium leading-none">
                            Task Title
                        </label>
                        <input 
                            id="title"
                            type="text" 
                            required
                            autoFocus
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            placeholder="e.g. Design Landing Page"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label htmlFor="description" className="text-sm font-medium leading-none">
                            Description
                        </label>
                        <textarea 
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            placeholder="Add more details..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="priority" className="text-sm font-medium leading-none">
                            Priority
                        </label>
                        <select 
                            id="priority"
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>

                    {createTaskMutation.isError && (
                        <div className="text-sm font-medium text-destructive">
                            Failed to create task. Please try again.
                        </div>
                    )}

                    <div className="flex justify-end space-x-2 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createTaskMutation.isPending || !formData.title.trim()}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 disabled:opacity-50"
                        >
                            {createTaskMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Task'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
