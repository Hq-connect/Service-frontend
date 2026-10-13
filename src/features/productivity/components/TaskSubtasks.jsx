import React, { useState, useRef, useEffect } from 'react';
import { 
    Check, Plus, Trash2, Loader2, ListChecks, X, 
    UserPlus, Calendar, ChevronDown, Edit2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getInitials, getAvatarStyle } from '@/global/utils/user';
import { getDueDateStatus } from '../utils/dueDate.utils';
import {
    useAddSubtask,
    useToggleSubtask,
    useUpdateSubtask,
    useDeleteSubtask,
} from '../queries/task.queries';
import { useProjectMembers } from '../queries/project.queries';

// ─── Animated Checkbox ──────────────────────────────────────────────────────
const SubtaskCheckbox = ({ checked, onChange, disabled }) => (
    <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={(e) => {
            e.stopPropagation();
            onChange();
        }}
        className={cn(
            'relative w-4 h-4 shrink-0 rounded border-2 flex items-center justify-center transition-all duration-200 cursor-pointer',
            checked
                ? 'bg-emerald-500 border-emerald-500 scale-105 shadow-2xs'
                : 'border-border bg-transparent hover:border-primary/60 hover:scale-105',
            disabled && 'opacity-60 cursor-not-allowed'
        )}
    >
        {checked && (
            <Check
                className="w-2.5 h-2.5 text-white animate-in zoom-in-50 duration-150"
                strokeWidth={3}
            />
        )}
    </button>
);

// ─── Progress Bar ────────────────────────────────────────────────────────────
const SubtaskProgress = ({ completed, total }) => {
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
    const isComplete = total > 0 && completed === total;

    return (
        <div className="flex items-center gap-2.5">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                    className={cn(
                        'h-full rounded-full transition-all duration-500 ease-out',
                        isComplete ? 'bg-emerald-500' : 'bg-primary'
                    )}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span
                className={cn(
                    'text-[10px] font-semibold tabular-nums shrink-0',
                    isComplete ? 'text-emerald-500' : 'text-muted-foreground'
                )}
            >
                {pct}%
            </span>
        </div>
    );
};

// ─── Self-Contained Assignee Dropdown Picker ─────────────────────────────────
const SubtaskAssigneePicker = ({ subtask, members, onSelect, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [openUpward, setOpenUpward] = useState(false);
    const buttonRef = useRef(null);

    const assignedName = subtask.assigneeSnapshot?.name || 'Member';
    const assignedAvatar = subtask.assigneeSnapshot?.avatar;
    const assignedUserId = subtask.assignedTo;

    const handleToggle = (e) => {
        e.stopPropagation();
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            if (window.innerHeight - rect.bottom < 220) {
                setOpenUpward(true);
            } else {
                setOpenUpward(false);
            }
        }
        setIsOpen((prev) => !prev);
    };

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                type="button"
                onClick={handleToggle}
                disabled={disabled}
                className={cn(
                    "group/assignee flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] transition-all cursor-pointer border",
                    assignedUserId
                        ? "bg-muted/50 hover:bg-muted border-border/60"
                        : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/60 border-transparent hover:border-border/50"
                )}
                title={assignedUserId ? `Assigned to ${assignedName}` : 'Assign member'}
            >
                {assignedUserId ? (
                    <>
                        {assignedAvatar ? (
                            <img
                                src={assignedAvatar}
                                alt={assignedName}
                                className="w-4 h-4 rounded-full object-cover shrink-0 ring-1 ring-border/50"
                            />
                        ) : (
                            <div
                                style={getAvatarStyle(assignedUserId || assignedName)}
                                className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0 shadow-2xs"
                            >
                                {getInitials(assignedName)}
                            </div>
                        )}
                        <span className="text-[10px] font-medium text-foreground truncate max-w-[80px]">
                            {assignedName.split(' ')[0]}
                        </span>
                    </>
                ) : (
                    <span className="flex items-center gap-1">
                        <UserPlus className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Assign</span>
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                        }} 
                    />
                    <div 
                        className={cn(
                            "absolute right-0 w-52 py-1 bg-popover text-popover-foreground border border-border rounded-xl shadow-2xl z-50 animate-in fade-in-0 zoom-in-95 duration-150",
                            openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/50">
                            Assign Subtask
                        </div>

                        {/* Unassign option */}
                        <button
                            type="button"
                            onClick={() => {
                                onSelect(null);
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-accent text-left transition-colors cursor-pointer"
                        >
                            <div className="w-4 h-4 rounded-full border border-dashed border-muted-foreground/50 flex items-center justify-center text-[9px] text-muted-foreground">
                                -
                            </div>
                            <span className="text-muted-foreground">Unassigned</span>
                            {!assignedUserId && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                        </button>

                        <div className="border-t border-border/50 my-1" />

                        <div className="max-h-48 overflow-y-auto">
                            {members.length === 0 ? (
                                <div className="px-3 py-2 text-[11px] text-muted-foreground">No members found</div>
                            ) : (
                                members.map((m) => {
                                    const mUserId = m.userId?._id || m.userId;
                                    const mName = m.userSnapshot?.name || 'Member';
                                    const mAvatar = m.userSnapshot?.avatar || null;
                                    const isSelected = String(assignedUserId) === String(mUserId);

                                    return (
                                        <button
                                            key={mUserId}
                                            type="button"
                                            onClick={() => {
                                                onSelect({ userId: mUserId, name: mName, avatar: mAvatar });
                                                setIsOpen(false);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-accent text-left transition-colors cursor-pointer"
                                        >
                                            {mAvatar ? (
                                                <img src={mAvatar} alt="" className="w-4 h-4 rounded-full object-cover shrink-0" />
                                            ) : (
                                                <div
                                                    style={getAvatarStyle(mUserId || mName)}
                                                    className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                                                >
                                                    {getInitials(mName)}
                                                </div>
                                            )}
                                            <span className="truncate flex-1 font-medium">{mName}</span>
                                            {isSelected && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// ─── Self-Contained Due Date Popover Picker ─────────────────────────────────
const SubtaskDatePicker = ({ subtask, onDateChange, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [openUpward, setOpenUpward] = useState(false);
    const buttonRef = useRef(null);
    const dateInputRef = useRef(null);

    const dueStatus = getDueDateStatus(subtask.dueDate, subtask.isCompleted ? 'done' : 'in_progress');

    const handleToggle = (e) => {
        e.stopPropagation();
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            // If less than 220px below, pop upward
            if (window.innerHeight - rect.bottom < 220) {
                setOpenUpward(true);
            } else {
                setOpenUpward(false);
            }
        }
        setIsOpen((prev) => !prev);
    };

    const handleSelectQuick = (offsetDays) => {
        const d = new Date();
        d.setDate(d.getDate() + offsetDays);
        onDateChange(d.toISOString().split('T')[0]);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                type="button"
                onClick={handleToggle}
                disabled={disabled}
                className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] transition-all cursor-pointer font-medium border",
                    dueStatus
                        ? dueStatus.badgeClass
                        : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/60 border-transparent hover:border-border/50"
                )}
                title={dueStatus ? dueStatus.fullText : 'Set due date'}
            >
                <Calendar className="w-3 h-3 shrink-0" />
                {dueStatus ? (
                    <span>{dueStatus.badgeText || dueStatus.label}</span>
                ) : (
                    <span>Due</span>
                )}
            </button>

            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                        }} 
                    />
                    <div 
                        className={cn(
                            "absolute right-0 w-56 p-2.5 bg-popover text-popover-foreground border border-border rounded-xl shadow-2xl z-50 animate-in fade-in-0 zoom-in-95 duration-150 space-y-2.5",
                            openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-1 border-b border-border/60">
                            <span className="text-[11px] font-semibold text-foreground">Set Due Date</span>
                            {subtask.dueDate && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onDateChange(null);
                                        setIsOpen(false);
                                    }}
                                    className="text-[10px] text-destructive hover:underline font-semibold cursor-pointer"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        {/* Quick Presets */}
                        <div className="grid grid-cols-3 gap-1">
                            <button
                                type="button"
                                onClick={() => handleSelectQuick(0)}
                                className="px-1.5 py-1 text-[10px] font-medium bg-muted/60 hover:bg-primary hover:text-primary-foreground rounded-md transition-colors text-center cursor-pointer"
                            >
                                Today
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSelectQuick(1)}
                                className="px-1.5 py-1 text-[10px] font-medium bg-muted/60 hover:bg-primary hover:text-primary-foreground rounded-md transition-colors text-center cursor-pointer"
                            >
                                Tomorrow
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSelectQuick(7)}
                                className="px-1.5 py-1 text-[10px] font-medium bg-muted/60 hover:bg-primary hover:text-primary-foreground rounded-md transition-colors text-center cursor-pointer"
                            >
                                In 1 Wk
                            </button>
                        </div>

                        {/* Native Date Input */}
                        <div className="pt-1">
                            <input
                                ref={dateInputRef}
                                type="date"
                                value={subtask.dueDate ? new Date(subtask.dueDate).toISOString().split('T')[0] : ''}
                                onChange={(e) => {
                                    onDateChange(e.target.value || null);
                                    setIsOpen(false);
                                }}
                                className="w-full text-xs bg-muted/40 border border-input rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// ─── Inline Add Form ─────────────────────────────────────────────────────────
const AddSubtaskInput = ({ onAdd, onDismiss, isPending }) => {
    const [value, setValue] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const submit = () => {
        const trimmed = value.trim();
        if (!trimmed) return;
        onAdd(trimmed, () => setValue(''));
    };

    return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/40 bg-card shadow-2xs animate-in fade-in-0 slide-in-from-top-1 duration-150">
            <div className="w-4 h-4 shrink-0 rounded border-2 border-dashed border-primary/40" />
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Subtask title... (Enter to add)"
                disabled={isPending}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); submit(); }
                    if (e.key === 'Escape') onDismiss();
                }}
                className="flex-1 text-xs bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {isPending ? (
                <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin shrink-0" />
            ) : (
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        type="button"
                        onClick={submit}
                        disabled={!value.trim()}
                        className="p-1 text-primary hover:bg-primary/10 rounded-md disabled:opacity-40 transition-colors cursor-pointer"
                        title="Add subtask (Enter)"
                    >
                        <Check className="w-3 h-3" strokeWidth={3} />
                    </button>
                    <button
                        type="button"
                        onClick={onDismiss}
                        className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
                        title="Cancel (Esc)"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}
        </div>
    );
};

// ─── Single Subtask Row ───────────────────────────────────────────────────────
const SubtaskRow = ({ subtask, projectId, taskId, members }) => {
    const toggleMutation = useToggleSubtask();
    const updateMutation = useUpdateSubtask();
    const deleteMutation = useDeleteSubtask();

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleInput, setTitleInput] = useState(subtask.title);

    const handleToggle = () => {
        const next = !subtask.isCompleted;
        toggleMutation.mutate(
            { projectId, taskId, subtaskId: subtask._id, isCompleted: next },
            {
                onSuccess: (data) => {
                    const updatedTask = data?.data?.task;
                    if (updatedTask && next && updatedTask.status === 'done') {
                        toast.success('All subtasks complete! Task moved to Done.', { icon: '✅', duration: 3000 });
                    } else if (!next && updatedTask?.status === 'in_progress') {
                        toast.info('Task reverted to In Progress.', { icon: '↩️', duration: 2500 });
                    }
                },
            }
        );
    };

    const handleAssign = (memberData) => {
        updateMutation.mutate(
            {
                projectId,
                taskId,
                subtaskId: subtask._id,
                data: !memberData
                    ? { assignedTo: null, assigneeSnapshot: { name: null, avatar: null } }
                    : {
                          assignedTo: memberData.userId,
                          assigneeSnapshot: {
                              name: memberData.name,
                              avatar: memberData.avatar,
                          },
                      },
            },
            {
                onSuccess: () => {
                    toast.success(memberData ? `Assigned to ${memberData.name}` : 'Subtask unassigned', { duration: 2000 });
                },
                onError: (err) => {
                    toast.error(err.response?.data?.message || 'Failed to assign member');
                },
            }
        );
    };

    const handleDateChange = (newDate) => {
        updateMutation.mutate(
            {
                projectId,
                taskId,
                subtaskId: subtask._id,
                data: { dueDate: newDate || null },
            },
            {
                onSuccess: () => {
                    toast.success(newDate ? 'Due date updated' : 'Due date cleared', { duration: 2000 });
                },
                onError: (err) => {
                    toast.error(err.response?.data?.message || 'Failed to update due date');
                },
            }
        );
    };

    const handleSaveTitle = () => {
        const trimmed = titleInput.trim();
        if (!trimmed) {
            setTitleInput(subtask.title);
            setIsEditingTitle(false);
            return;
        }
        if (trimmed !== subtask.title) {
            updateMutation.mutate(
                {
                    projectId,
                    taskId,
                    subtaskId: subtask._id,
                    data: { title: trimmed },
                },
                {
                    onSuccess: () => {
                        toast.success('Title updated', { duration: 1500 });
                    },
                    onError: () => {
                        toast.error('Failed to update title');
                    },
                }
            );
        }
        setIsEditingTitle(false);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        deleteMutation.mutate(
            { projectId, taskId, subtaskId: subtask._id },
            {
                onSuccess: () => toast.success('Subtask deleted', { duration: 2000 }),
                onError: () => toast.error('Failed to delete subtask'),
            }
        );
    };

    return (
        <div className="group flex items-center gap-2.5 px-3 py-2 transition-colors hover:bg-muted/40 first:rounded-t-xl last:rounded-b-xl">
            <SubtaskCheckbox
                checked={subtask.isCompleted}
                onChange={handleToggle}
                disabled={toggleMutation.isPending}
            />

            {/* Title / Inline Edit */}
            {isEditingTitle ? (
                <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    onBlur={handleSaveTitle}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTitle();
                        if (e.key === 'Escape') {
                            setTitleInput(subtask.title);
                            setIsEditingTitle(false);
                        }
                    }}
                    autoFocus
                    className="flex-1 text-xs bg-card border border-primary/50 rounded px-1.5 py-0.5 text-foreground focus:outline-none"
                />
            ) : (
                <span
                    onDoubleClick={() => setIsEditingTitle(true)}
                    className={cn(
                        'flex-1 text-xs leading-snug transition-all duration-200 cursor-text',
                        subtask.isCompleted
                            ? 'line-through text-muted-foreground'
                            : 'text-foreground'
                    )}
                >
                    {subtask.title}
                </span>
            )}

            {/* Actions & Metadata: Assignee, Due Date, Delete */}
            <div className="flex items-center gap-1.5 shrink-0">
                {/* Assignee Picker */}
                <SubtaskAssigneePicker
                    subtask={subtask}
                    members={members}
                    onSelect={handleAssign}
                    disabled={updateMutation.isPending}
                />

                {/* Due Date Picker */}
                <SubtaskDatePicker
                    subtask={subtask}
                    onDateChange={handleDateChange}
                    disabled={updateMutation.isPending}
                />

                {/* Inline Edit Title Button on hover */}
                <button
                    type="button"
                    onClick={() => setIsEditingTitle(true)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all shrink-0 cursor-pointer"
                    title="Rename subtask"
                >
                    <Edit2 className="w-3 h-3" />
                </button>

                {/* Delete Button on hover */}
                <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all shrink-0 focus-visible:opacity-100 cursor-pointer"
                    title="Delete subtask"
                >
                    {deleteMutation.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        <Trash2 className="w-3 h-3" />
                    )}
                </button>
            </div>
        </div>
    );
};

// ─── Main Export ─────────────────────────────────────────────────────────────
export const TaskSubtasks = ({ task, projectId, members: externalMembers }) => {
    const [isAdding, setIsAdding] = useState(false);
    const addMutation = useAddSubtask();

    // Fetch members if not passed down as prop
    const { data: membersResponse } = useProjectMembers(projectId, {
        enabled: !externalMembers && !!projectId,
    });
    const members = externalMembers || membersResponse?.data?.members || [];

    // Task may still be loading — don't attempt any property access
    if (!task?._id) return null;

    const subtasks = task.subtasks || [];
    const completedCount = subtasks.filter((st) => st.isCompleted).length;
    const totalCount = subtasks.length;

    const handleAdd = (title, keepOpen) => {
        addMutation.mutate(
            { projectId, taskId: task._id, title },
            {
                onSuccess: () => keepOpen?.(),
                onError: () => toast.error('Failed to add subtask'),
            }
        );
    };

    return (
        <div className="space-y-3">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-foreground font-semibold text-xs uppercase tracking-wider">
                    <ListChecks className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Subtasks</span>
                    {totalCount > 0 && (
                        <span
                            className={cn(
                                'ml-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold border',
                                completedCount === totalCount
                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
                                    : 'bg-muted text-muted-foreground border-border'
                            )}
                        >
                            {completedCount}/{totalCount}
                        </span>
                    )}
                </div>

                {!isAdding && (
                    <button
                        type="button"
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 hover:bg-primary/10 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                        <Plus className="w-3 h-3" strokeWidth={2.5} />
                        Add Subtask
                    </button>
                )}
            </div>

            {/* Progress Bar */}
            {totalCount > 0 && (
                <SubtaskProgress completed={completedCount} total={totalCount} />
            )}

            {/* Subtask List — overflow visible so popups don't get clipped */}
            {subtasks.length > 0 && (
                <div className="rounded-xl border border-border bg-card shadow-2xs divide-y divide-border/60">
                    {[...subtasks]
                        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                        .map((st) => (
                            <SubtaskRow
                                key={st._id}
                                subtask={st}
                                projectId={projectId}
                                taskId={task._id}
                                members={members}
                            />
                        ))}
                </div>
            )}

            {/* Empty State */}
            {subtasks.length === 0 && !isAdding && (
                <button
                    type="button"
                    onClick={() => setIsAdding(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-border bg-transparent text-muted-foreground text-xs hover:border-primary/40 hover:text-foreground hover:bg-muted/30 transition-all duration-150 cursor-pointer group"
                >
                    <Plus className="w-3.5 h-3.5 group-hover:text-primary transition-colors" strokeWidth={2} />
                    <span>Break this task into smaller steps…</span>
                </button>
            )}

            {/* Inline Add Input */}
            {isAdding && (
                <AddSubtaskInput
                    onAdd={handleAdd}
                    onDismiss={() => setIsAdding(false)}
                    isPending={addMutation.isPending}
                />
            )}
        </div>
    );
};

export default TaskSubtasks;
