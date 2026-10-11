import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as labelService from '../services/label.service';
import * as taskDetailsService from '../services/taskDetails.service';
import { useAddLabelsToTask, useRemoveLabelsFromTask } from '../queries/taskDetails.queries';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, X, Loader2, Tag, Check, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

// --- Color presets for label creation ---
const COLOR_PRESETS = [
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Zinc', value: '#71717a' },
];

// --- Queries for project-level labels ---
const useProjectLabels = (projectId) => {
    return useQuery({
        queryKey: ['project-labels', projectId],
        queryFn: () => labelService.getProjectLabels(projectId),
        enabled: !!projectId,
    });
};

const useCreateProjectLabel = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, labelData }) => labelService.createProjectLabel(projectId, labelData),
        onSuccess: (response, { projectId }) => {
            const newLabel = response?.data?.label;
            if (newLabel) {
                queryClient.setQueryData(['project-labels', projectId], (old) => {
                    const existing = old?.data?.labels || [];
                    return {
                        ...old,
                        data: {
                            ...old?.data,
                            labels: [...existing, newLabel].sort((a, b) => a.name.localeCompare(b.name)),
                        },
                    };
                });
            }
            queryClient.invalidateQueries({ queryKey: ['project-labels', projectId] });
        },
    });
};

// --- Component ---
const TaskLabels = ({ projectId, taskId }) => {
    const { data: taskLabelsResp } = useQuery({
        queryKey: ['task-labels', projectId, taskId],
        queryFn: () => taskDetailsService.getTaskLabels(projectId, taskId),
        enabled: !!projectId && !!taskId,
    });

    const { data: projectLabelsResp, isLoading: loadingProjectLabels } = useProjectLabels(projectId);
    const { mutate: addLabels } = useAddLabelsToTask();
    const { mutate: removeLabels } = useRemoveLabelsFromTask();
    const { mutate: createLabel, isPending: isCreating } = useCreateProjectLabel();

    const [isOpen, setIsOpen] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [createError, setCreateError] = useState('');
    const [newLabelName, setNewLabelName] = useState('');
    const [newLabelColor, setNewLabelColor] = useState(COLOR_PRESETS[5].value);
    const [pendingLabelId, setPendingLabelId] = useState(null);

    const taskLabels = taskLabelsResp?.data?.labels || [];
    const projectLabels = projectLabelsResp?.data?.labels || [];
    const assignedIds = new Set(taskLabels.map(l => l._id || l.labelId || l));

    const handleToggleLabel = (label) => {
        if (pendingLabelId) return; // Prevent double-clicks / race conditions
        const labelId = label._id;
        const isAssigned = assignedIds.has(labelId);

        setPendingLabelId(labelId);

        if (isAssigned) {
            removeLabels(
                { projectId, taskId, labelIds: [labelId] },
                {
                    onError: (err) => {
                        toast.error(err.response?.data?.message || 'Failed to remove label');
                    },
                    onSettled: () => {
                        setPendingLabelId(null);
                    },
                }
            );
        } else {
            addLabels(
                { projectId, taskId, labelIds: [labelId] },
                {
                    onError: (err) => {
                        toast.error(err.response?.data?.message || 'Failed to add label');
                    },
                    onSettled: () => {
                        setPendingLabelId(null);
                    },
                }
            );
        }
    };

    const handleCreateLabel = (e) => {
        e.preventDefault();
        const trimmed = newLabelName.trim();
        if (!trimmed || isCreating) return;
        setCreateError('');

        createLabel(
            { projectId, labelData: { name: trimmed, color: newLabelColor } },
            {
                onSuccess: (resp) => {
                    const created = resp?.data?.label;
                    setNewLabelName('');
                    setShowCreate(false);
                    toast.success(`Label "${trimmed}" created`);

                    // Automatically attach the newly created label to this task
                    if (created?._id) {
                        setPendingLabelId(created._id);
                        addLabels(
                            { projectId, taskId, labelIds: [created._id] },
                            {
                                onError: () => {
                                    toast.error('Label created, but failed to assign to task');
                                },
                                onSettled: () => {
                                    setPendingLabelId(null);
                                },
                            }
                        );
                    }
                },
                onError: (err) => {
                    const msg = err.response?.data?.message || err.message || 'Failed to create label';
                    setCreateError(msg);
                    toast.error(msg);
                },
            }
        );
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* Assigned Labels */}
            {taskLabels.map((label) => {
                const lId = label._id || label.labelId || label;
                const lData = projectLabels.find(l => l._id === lId) || (typeof label === 'object' && label.name ? label : { name: lId, color: '#71717a' });
                const isBusy = pendingLabelId === lId;

                return (
                    <span
                        key={lId}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-white shadow-xs transition-opacity ${isBusy ? 'opacity-70' : ''}`}
                        style={{ backgroundColor: lData.color || '#71717a' }}
                    >
                        <span>{lData.name}</span>
                        <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => {
                                setPendingLabelId(lId);
                                removeLabels(
                                    { projectId, taskId, labelIds: [lId] },
                                    {
                                        onError: (err) => {
                                            toast.error(err.response?.data?.message || 'Failed to remove label');
                                        },
                                        onSettled: () => {
                                            setPendingLabelId(null);
                                        },
                                    }
                                );
                            }}
                            className="hover:bg-black/20 rounded p-0.5 -mr-1 transition-colors cursor-pointer disabled:cursor-not-allowed"
                            title="Remove label"
                        >
                            {isBusy ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <X className="w-3 h-3" />
                            )}
                        </button>
                    </span>
                );
            })}

            {/* Add Label Popover */}
            <Popover
                open={isOpen}
                onOpenChange={(open) => {
                    setIsOpen(open);
                    if (!open) {
                        setShowCreate(false);
                        setCreateError('');
                        setNewLabelName('');
                    }
                }}
            >
                <PopoverTrigger
                    render={
                        <button
                            type="button"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/50 hover:bg-muted/50 transition-colors cursor-pointer"
                            title="Add or manage labels"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    }
                />

                <PopoverContent
                    side="top"
                    align="start"
                    sideOffset={6}
                    className="w-64 p-0 bg-popover text-popover-foreground border border-border shadow-xl rounded-xl overflow-hidden z-50"
                >
                    {!showCreate ? (
                        <>
                            <div className="p-3 border-b border-border flex items-center justify-between">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Labels
                                </p>
                            </div>

                            <div className="p-2 max-h-52 overflow-y-auto space-y-1">
                                {loadingProjectLabels ? (
                                    <div className="flex items-center justify-center py-5 text-muted-foreground gap-2 text-xs">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Loading labels...</span>
                                    </div>
                                ) : projectLabels.length === 0 ? (
                                    <div className="text-center py-5 text-muted-foreground text-xs space-y-1">
                                        <Tag className="w-5 h-5 mx-auto opacity-40" />
                                        <p>No labels in project</p>
                                    </div>
                                ) : (
                                    projectLabels.map((label) => {
                                        const isAssigned = assignedIds.has(label._id);
                                        const isBusy = pendingLabelId === label._id;

                                        return (
                                            <button
                                                key={label._id}
                                                type="button"
                                                disabled={isBusy}
                                                onClick={() => handleToggleLabel(label)}
                                                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer disabled:cursor-not-allowed ${
                                                    isAssigned
                                                        ? 'bg-accent/70 font-semibold text-accent-foreground'
                                                        : 'hover:bg-muted font-medium text-foreground'
                                                }`}
                                            >
                                                <span
                                                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs ring-1 ring-border"
                                                    style={{ backgroundColor: label.color }}
                                                />
                                                <span className="truncate flex-1">{label.name}</span>
                                                {isBusy ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground shrink-0" />
                                                ) : isAssigned ? (
                                                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                                                ) : null}
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            <div className="p-2 border-t border-border bg-muted/20">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreate(true);
                                        setCreateError('');
                                    }}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Create new label</span>
                                </button>
                            </div>
                        </>
                    ) : (
                        <form onSubmit={handleCreateLabel} className="p-3 space-y-3">
                            <div className="flex items-center gap-2 pb-1 border-b border-border">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreate(false);
                                        setCreateError('');
                                    }}
                                    className="p-1 -ml-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors cursor-pointer"
                                    title="Back"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                </button>
                                <p className="text-xs font-semibold text-foreground">Create Label</p>
                            </div>

                            <div className="space-y-1">
                                <input
                                    autoFocus
                                    value={newLabelName}
                                    onChange={(e) => {
                                        setNewLabelName(e.target.value);
                                        if (createError) setCreateError('');
                                    }}
                                    placeholder="Label name..."
                                    maxLength={30}
                                    className="w-full h-8 px-2.5 text-xs bg-background text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                                />
                                {createError && (
                                    <p className="text-[11px] text-destructive font-medium leading-tight pt-0.5">
                                        {createError}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    Color
                                </p>
                                <div className="grid grid-cols-5 gap-1.5">
                                    {COLOR_PRESETS.map((c) => (
                                        <button
                                            key={c.value}
                                            type="button"
                                            onClick={() => setNewLabelColor(c.value)}
                                            className={`h-6 rounded-md transition-all cursor-pointer ${
                                                newLabelColor === c.value
                                                    ? 'ring-2 ring-primary ring-offset-2 scale-105'
                                                    : 'hover:scale-105 opacity-85 hover:opacity-100'
                                            }`}
                                            style={{ backgroundColor: c.value }}
                                            title={c.name}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreate(false);
                                        setCreateError('');
                                    }}
                                    className="flex-1 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating || !newLabelName.trim()}
                                    className="flex-1 py-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center cursor-pointer disabled:cursor-not-allowed shadow-xs"
                                >
                                    {isCreating ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        'Create & Apply'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </PopoverContent>
            </Popover>

            {taskLabels.length === 0 && !isOpen && (
                <span className="text-xs text-muted-foreground italic">No labels</span>
            )}
        </div>
    );
};

export default TaskLabels;
