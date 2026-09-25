import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useCreateTask } from '../queries/task.queries';
import { X, Loader2, Clock } from 'lucide-react';
// Assuming you have an action in your slice or you manage this via local state in BoardView.
// For now we'll accept props: isOpen, onClose, projectId, defaultColumnId

export const CreateTaskModal = ({ isOpen, onClose, projectId, boardId, defaultColumnId }) => {
    const createTaskMutation = useCreateTask();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium', // Note: task.validation expects low, medium, high, urgent
        dueDate: '',
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
            boardId,
            columnId: defaultColumnId,
        };
        createTaskMutation.mutate({
            projectId,
            data: payload
        }, {
            onSuccess: () => {
                onClose();
                setFormData({ title: '', description: '', priority: 'medium', dueDate: '' });
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

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label htmlFor="dueDate" className="text-sm font-medium leading-none flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-blue-600" />
                                <span>Time Schedule / Deadline</span>
                            </label>
                            {formData.dueDate && (
                                <button
                                    type="button"
                                    onClick={() => setFormData((prev) => ({ ...prev, dueDate: '' }))}
                                    className="text-xs text-muted-foreground hover:text-foreground"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        {/* Quick Presets */}
                        <div className="flex flex-wrap gap-1.5">
                            {[
                                { label: '+6h', hours: 6 },
                                { label: '+12h', hours: 12 },
                                { label: '+24h (1d)', hours: 24 },
                                { label: '+48h (2d)', hours: 48 },
                                { label: '+7d', hours: 168 },
                            ].map((preset) => (
                                <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => {
                                        const d = new Date(Date.now() + preset.hours * 60 * 60 * 1000);
                                        const pad = (n) => String(n).padStart(2, '0');
                                        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                                        setFormData((prev) => ({ ...prev, dueDate: formatted }));
                                    }}
                                    className="px-2 py-1 text-xs font-medium rounded border bg-muted/40 hover:bg-muted text-foreground transition-colors"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        <input 
                            id="dueDate"
                            type="datetime-local"
                            value={formData.dueDate}
                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
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
