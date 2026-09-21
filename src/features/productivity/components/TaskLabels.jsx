import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as labelService from '../services/label.service';
import { useAddLabelsToTask, useRemoveLabelsFromTask } from '../queries/taskDetails.queries';
import { Plus, X, Loader2, Tag } from 'lucide-react';

// --- Color presets for label creation ---
const COLOR_PRESETS = [
    { name: 'Red', value: '#ef4444', bg: 'bg-red-500' },
    { name: 'Orange', value: '#f97316', bg: 'bg-orange-500' },
    { name: 'Amber', value: '#f59e0b', bg: 'bg-amber-500' },
    { name: 'Green', value: '#22c55e', bg: 'bg-green-500' },
    { name: 'Teal', value: '#14b8a6', bg: 'bg-teal-500' },
    { name: 'Blue', value: '#3b82f6', bg: 'bg-blue-500' },
    { name: 'Indigo', value: '#6366f1', bg: 'bg-indigo-500' },
    { name: 'Purple', value: '#a855f7', bg: 'bg-purple-500' },
    { name: 'Pink', value: '#ec4899', bg: 'bg-pink-500' },
    { name: 'Zinc', value: '#71717a', bg: 'bg-zinc-500' },
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
        onSuccess: (_, { projectId }) => {
            queryClient.invalidateQueries({ queryKey: ['project-labels', projectId] });
        },
    });
};

const useDeleteProjectLabel = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, labelId }) => labelService.deleteProjectLabel(projectId, labelId),
        onSuccess: (_, { projectId }) => {
            queryClient.invalidateQueries({ queryKey: ['project-labels', projectId] });
        },
    });
};

// --- Component ---
const TaskLabels = ({ projectId, taskId }) => {
    const { data: taskLabelsResp } = useQuery({
        queryKey: ['task-labels', projectId, taskId],
        queryFn: () => import('../services/taskDetails.service').then(s => s.getTaskLabels(projectId, taskId)),
        enabled: !!projectId && !!taskId,
    });
    
    const { data: projectLabelsResp, isLoading: loadingProjectLabels } = useProjectLabels(projectId);
    const { mutate: addLabels } = useAddLabelsToTask();
    const { mutate: removeLabels } = useRemoveLabelsFromTask();
    const { mutate: createLabel, isPending: isCreating } = useCreateProjectLabel();

    const [isOpen, setIsOpen] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [newLabelName, setNewLabelName] = useState('');
    const [newLabelColor, setNewLabelColor] = useState(COLOR_PRESETS[5].value);

    const taskLabels = taskLabelsResp?.data?.labels || [];
    const projectLabels = projectLabelsResp?.data?.labels || [];
    const assignedIds = new Set(taskLabels.map(l => l._id || l.labelId || l));

    const handleToggleLabel = (label) => {
        if (assignedIds.has(label._id)) {
            removeLabels({ projectId, taskId, labelIds: [label._id] });
        } else {
            addLabels({ projectId, taskId, labelIds: [label._id] });
        }
    };

    const handleCreateLabel = (e) => {
        e.preventDefault();
        if (!newLabelName.trim()) return;
        createLabel(
            { projectId, labelData: { name: newLabelName.trim(), color: newLabelColor } },
            {
                onSuccess: () => {
                    setNewLabelName('');
                    setShowCreate(false);
                }
            }
        );
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* Assigned Labels */}
            {taskLabels.map((label) => {
                const lId = label._id || label.labelId || label;
                const lData = projectLabels.find(l => l._id === lId) || { name: lId, color: '#71717a' };
                return (
                    <span
                        key={lId}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-white"
                        style={{ backgroundColor: lData.color }}
                    >
                        {lData.name}
                        <button
                            onClick={() => removeLabels({ projectId, taskId, labelIds: [lId] })}
                            className="hover:bg-white/20 rounded p-0.5 -mr-1 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                );
            })}

            {/* Add Label Popover */}
            <div className="relative">
                <button
                    onClick={() => { setIsOpen(!isOpen); setShowCreate(false); }}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-dashed border-zinc-300 text-zinc-400 hover:text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                </button>

                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <div className="absolute top-full mt-2 left-0 w-64 max-w-[calc(100vw-3rem)] bg-white border border-zinc-200 shadow-xl rounded-xl z-50 overflow-hidden">
                            <div className="p-3 border-b border-zinc-100">
                                <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Labels</p>
                            </div>

                            {!showCreate ? (
                                <>
                                    <div className="p-2 max-h-52 overflow-y-auto space-y-1">
                                        {loadingProjectLabels ? (
                                            <div className="flex items-center justify-center py-4">
                                                <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                                            </div>
                                        ) : projectLabels.length === 0 ? (
                                            <div className="text-center py-4 text-zinc-400 text-sm">
                                                <Tag className="w-5 h-5 mx-auto mb-1 opacity-50" />
                                                No labels yet
                                            </div>
                                        ) : (
                                            projectLabels.map((label) => {
                                                const isAssigned = assignedIds.has(label._id);
                                                return (
                                                    <button
                                                        key={label._id}
                                                        onClick={() => handleToggleLabel(label)}
                                                        className="w-full flex items-center gap-2.5 px-2 py-1.5 hover:bg-zinc-50 rounded-lg text-left transition-colors"
                                                    >
                                                        <span
                                                            className="w-4 h-4 rounded-full flex-shrink-0 border-2 border-white shadow-sm"
                                                            style={{ backgroundColor: label.color }}
                                                        />
                                                        <span className="text-sm font-medium text-zinc-800 flex-1">{label.name}</span>
                                                        {isAssigned && (
                                                            <span className="w-4 h-4 text-zinc-500">✓</span>
                                                        )}
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                    <div className="p-2 border-t border-zinc-100">
                                        <button
                                            onClick={() => setShowCreate(true)}
                                            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 rounded-lg transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Create new label
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <form onSubmit={handleCreateLabel} className="p-3 space-y-3">
                                    <input
                                        autoFocus
                                        value={newLabelName}
                                        onChange={e => setNewLabelName(e.target.value)}
                                        placeholder="Label name"
                                        className="w-full h-8 px-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                                    />
                                    <div className="flex flex-wrap gap-1.5">
                                        {COLOR_PRESETS.map(c => (
                                            <button
                                                key={c.value}
                                                type="button"
                                                onClick={() => setNewLabelColor(c.value)}
                                                className={`w-6 h-6 rounded-full ${c.bg} transition-transform ${newLabelColor === c.value ? 'ring-2 ring-offset-1 ring-zinc-900 scale-110' : ''}`}
                                                title={c.name}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowCreate(false)}
                                            className="flex-1 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isCreating || !newLabelName.trim()}
                                            className="flex-1 py-1.5 text-sm bg-zinc-900 text-white rounded-lg disabled:opacity-50 transition-colors"
                                        >
                                            {isCreating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </>
                )}
            </div>

            {taskLabels.length === 0 && !isOpen && (
                <span className="text-sm text-zinc-400 italic">No labels</span>
            )}
        </div>
    );
};

export default TaskLabels;
