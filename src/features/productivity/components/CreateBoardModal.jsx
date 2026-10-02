import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useCreateBoard } from '../queries/board.queries';
import { X, Kanban, Loader2, AlertCircle } from 'lucide-react';

export const CreateBoardModal = ({ isOpen, onClose, projectId, onBoardCreated }) => {
    const createBoardMutation = useCreateBoard();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('kanban');
    const [errorMessage, setErrorMessage] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        setErrorMessage('');

        if (!name.trim()) {
            setErrorMessage('Board name is required');
            return;
        }

        createBoardMutation.mutate(
            {
                projectId,
                data: {
                    name: name.trim(),
                    description: description.trim() || undefined,
                    type,
                },
            },
            {
                onSuccess: (response) => {
                    const createdBoard = response?.data?.board || response?.data;
                    setName('');
                    setDescription('');
                    setType('kanban');
                    if (onBoardCreated && createdBoard) {
                        onBoardCreated(createdBoard);
                    }
                    onClose();
                },
                onError: (err) => {
                    const msg = err.response?.data?.message || err.message || 'Failed to create board';
                    setErrorMessage(typeof msg === 'string' ? msg : 'Failed to create board');
                },
            }
        );
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-0 duration-150">
            <div 
                className="bg-card text-card-foreground rounded-lg border border-border shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-border bg-muted/20 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                            <Kanban className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-foreground">Create Board</h2>
                            <p className="text-xs text-muted-foreground">Add a new board to this project</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
                    {errorMessage && (
                        <div className="flex items-center gap-2 p-2.5 bg-destructive/10 text-destructive text-xs rounded-md border border-destructive/20">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                            Board Name <span className="text-destructive">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            autoFocus
                            placeholder="e.g. Sprint 2 Board, QA & Release..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full h-8 px-3 text-xs bg-background border border-input rounded-md shadow-2xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Board Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setType('kanban')}
                                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium border transition-colors ${
                                    type === 'kanban'
                                        ? 'bg-primary/10 border-primary text-primary font-semibold'
                                        : 'bg-background border-input text-muted-foreground hover:bg-muted'
                                }`}
                            >
                                <Kanban className="w-3.5 h-3.5" />
                                <span>Kanban</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('scrum')}
                                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium border transition-colors ${
                                    type === 'scrum'
                                        ? 'bg-primary/10 border-primary text-primary font-semibold'
                                        : 'bg-background border-input text-muted-foreground hover:bg-muted'
                                }`}
                            >
                                <span>Scrum</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                            Description <span className="text-muted-foreground font-normal">(optional)</span>
                        </label>
                        <textarea
                            rows={3}
                            placeholder="What workflows or goals does this board track?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-2.5 text-xs bg-background border border-input rounded-md shadow-2xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createBoardMutation.isPending || !name.trim()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 rounded-md transition-colors shadow-2xs"
                        >
                            {createBoardMutation.isPending ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Creating...</span>
                                </>
                            ) : (
                                <span>Create Board</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default CreateBoardModal;
