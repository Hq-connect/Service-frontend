import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCreateProjectModalOpen } from '../states/productivity.slice';
import { useCreateProject } from '../queries/project.queries';
import { X, Loader2, Globe, Lock } from 'lucide-react';

export const CreateProjectModal = () => {
    const dispatch = useDispatch();
    const isOpen = useSelector((state) => state.productivity?.isCreateProjectModalOpen);
    const createProjectMutation = useCreateProject();

    const [formData, setFormData] = useState({
        name: '',
        key: '',
        description: '',
        visibility: 'public',
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        createProjectMutation.mutate(formData, {
            onSuccess: () => {
                dispatch(setCreateProjectModalOpen(false));
                setFormData({ name: '', key: '', description: '', visibility: 'public' });
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-0">
            <div className="bg-card text-card-foreground rounded-xl border shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-lg font-semibold tracking-tight">Create New Project</h2>
                    <button 
                        onClick={() => dispatch(setCreateProjectModalOpen(false))}
                        className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Project Name
                        </label>
                        <input 
                            id="name"
                            type="text" 
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="e.g. Website Redesign"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label htmlFor="key" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Project Key (2-10 chars)
                        </label>
                        <input 
                            id="key"
                            type="text" 
                            required
                            minLength={2}
                            maxLength={10}
                            value={formData.key}
                            onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase() })}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 uppercase"
                            placeholder="e.g. PROJ"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label htmlFor="description" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Description
                        </label>
                        <textarea 
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="flex min-h-[70px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Briefly describe the project goals..."
                        />
                    </div>

                    {/* Visibility Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">
                            Project Visibility
                        </label>
                        <div className="grid grid-cols-2 gap-3 pt-1">
                            {/* Public Option */}
                            <div
                                onClick={() => setFormData({ ...formData, visibility: 'public' })}
                                className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                                    formData.visibility === 'public'
                                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                        : 'border-border hover:bg-muted/50'
                                }`}
                            >
                                <div className="flex items-center gap-1.5 font-semibold text-sm text-foreground">
                                    <Globe className="w-4 h-4 text-blue-500" />
                                    <span>Public</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 leading-snug">
                                    Visible to organization. Membership required to view boards.
                                </p>
                            </div>

                            {/* Private Option */}
                            <div
                                onClick={() => setFormData({ ...formData, visibility: 'private' })}
                                className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                                    formData.visibility === 'private'
                                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                        : 'border-border hover:bg-muted/50'
                                }`}
                            >
                                <div className="flex items-center gap-1.5 font-semibold text-sm text-foreground">
                                    <Lock className="w-4 h-4 text-amber-500" />
                                    <span>Private</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 leading-snug">
                                    Only added project members can see and access this project.
                                </p>
                            </div>
                        </div>
                    </div>

                    {createProjectMutation.isError && (
                        <div className="text-sm font-medium text-destructive">
                            Failed to create project. Please try again.
                        </div>
                    )}

                    <div className="flex justify-end space-x-2 pt-4">
                        <button
                            type="button"
                            onClick={() => dispatch(setCreateProjectModalOpen(false))}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createProjectMutation.isPending}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 disabled:opacity-50"
                        >
                            {createProjectMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Project'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
