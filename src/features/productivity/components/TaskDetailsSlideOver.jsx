import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { setSelectedTaskId } from '../states/productivity.slice';
import { useTask, useUpdateTask, useAssignTask, useUnassignTask } from '../queries/task.queries';
import { useProjectMembers } from '../queries/project.queries';
import { 
    X, Calendar, User, AlignLeft, Tag, Paperclip, MessageSquare, 
    Activity, Check, ChevronDown, Loader2, Clock, CheckCircle2, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import TaskComments from './TaskComments';
import TaskLabels from './TaskLabels';
import TaskAttachments from './TaskAttachments';
import TaskActivityFeed from './TaskActivityFeed';
import { TaskCountdown } from './TaskCountdown';

const TaskDetailsSlideOver = () => {
    const dispatch = useDispatch();
    const { activeProject, selectedTaskId } = useSelector((state) => state.productivity);
    const { projectId: urlProjectId } = useParams();
    
    // Fallback to URL param if Redux state was lost
    const projectId = activeProject?._id || urlProjectId;

    const { data: taskResponse, isLoading } = useTask(projectId, selectedTaskId);
    const task = taskResponse?.data?.task;

    const { data: membersResponse } = useProjectMembers(projectId);
    const members = membersResponse?.data?.members || [];

    const updateTaskMutation = useUpdateTask();
    const assignTaskMutation = useAssignTask();
    const unassignTaskMutation = useUnassignTask();

    const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [descText, setDescText] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleText, setTitleText] = useState('');
    const [activeTab, setActiveTab] = useState('comments'); // 'comments' | 'activity'

    useEffect(() => {
        if (task) {
            setDescText(task.description || '');
            setTitleText(task.title || '');
        }
    }, [task]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !isEditingTitle && !isEditingDesc) {
                handleClose();
            }
        };
        if (selectedTaskId) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [selectedTaskId, isEditingTitle, isEditingDesc]);

    if (!selectedTaskId) return null;

    const handleClose = () => {
        dispatch(setSelectedTaskId(null));
    };

    const handleAssign = (userId) => {
        if (!userId) {
            unassignTaskMutation.mutate({ projectId, taskId: selectedTaskId });
        } else {
            assignTaskMutation.mutate({ projectId, taskId: selectedTaskId, userId });
        }
        setIsAssigneeOpen(false);
    };

    const handleDueDateChange = (e) => {
        const val = e.target.value;
        const newDueDate = val ? new Date(val).toISOString() : null;
        updateTaskMutation.mutate({
            projectId,
            taskId: selectedTaskId,
            data: { dueDate: newDueDate }
        });
    };

    const handleAddPresetHours = (hours) => {
        const newDueDate = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
        updateTaskMutation.mutate({
            projectId,
            taskId: selectedTaskId,
            data: { dueDate: newDueDate }
        });
    };

    const formatDateTimeLocal = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const handlePriorityChange = (e) => {
        updateTaskMutation.mutate({
            projectId,
            taskId: selectedTaskId,
            data: { priority: e.target.value }
        });
    };

    const handleStatusChange = (e) => {
        updateTaskMutation.mutate({
            projectId,
            taskId: selectedTaskId,
            data: { status: e.target.value }
        });
    };

    const handleSaveDescription = () => {
        updateTaskMutation.mutate({
            projectId,
            taskId: selectedTaskId,
            data: { description: descText }
        }, {
            onSuccess: () => setIsEditingDesc(false)
        });
    };

    const handleSaveTitle = () => {
        if (!titleText.trim()) return;
        updateTaskMutation.mutate({
            projectId,
            taskId: selectedTaskId,
            data: { title: titleText.trim() }
        }, {
            onSuccess: () => setIsEditingTitle(false)
        });
    };

    const currentAssigneeName = task?.assigneeSnapshot?.name || (task?.assignedTo ? 'Assigned' : 'Unassigned');
    const currentAssigneeAvatar = task?.assigneeSnapshot?.avatar;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 overflow-y-auto">
            {/* Backdrop with blur */}
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in-0 duration-200"
                onClick={handleClose}
            />

            {/* Main Centered Dialog Panel - Spacious & Clear (Linear / Jira style) */}
            <div className="relative w-full max-w-5xl xl:max-w-6xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-zinc-200/80 flex flex-col overflow-hidden z-10 animate-in fade-in-0 zoom-in-95 duration-200">
                
                {/* Modal Top Bar */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-white sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 font-bold text-xs uppercase tracking-wider">
                            {task?.taskKey || 'TASK'}
                        </span>
                        <span className="text-zinc-300">/</span>
                        <span className="text-xs font-semibold text-zinc-500 truncate max-w-xs">
                            {activeProject?.name || 'Project'}
                        </span>
                    </div>

                    <button 
                        onClick={handleClose}
                        className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
                        title="Close dialog (Esc)"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 2-Column Responsive Body */}
                <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto min-h-0">
                    
                    {/* Left Column: Main Content (Title, Description, Attachments, Comments) */}
                    <div className="lg:col-span-8 p-6 sm:p-8 space-y-8 overflow-y-auto border-b lg:border-b-0 lg:border-r border-zinc-100">
                        
                        {/* Title Section */}
                        <div>
                            {isLoading ? (
                                <div className="h-10 w-3/4 bg-zinc-200 animate-pulse rounded-lg" />
                            ) : isEditingTitle ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={titleText}
                                        onChange={(e) => setTitleText(e.target.value)}
                                        className="text-2xl sm:text-3xl font-bold text-zinc-900 border border-zinc-300 rounded-xl p-2 w-full focus:outline-none focus:ring-2 focus:ring-zinc-900 shadow-xs"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveTitle();
                                            if (e.key === 'Escape') setIsEditingTitle(false);
                                        }}
                                    />
                                    <button
                                        onClick={handleSaveTitle}
                                        disabled={updateTaskMutation.isPending}
                                        className="p-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors shadow-xs"
                                        title="Save title"
                                    >
                                        <Check className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setIsEditingTitle(false)}
                                        className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-xl transition-colors"
                                        title="Cancel"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <h1 
                                    onClick={() => setIsEditingTitle(true)}
                                    className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight leading-snug cursor-pointer hover:bg-zinc-100/70 p-1.5 -ml-1.5 rounded-xl transition-colors"
                                    title="Click to edit title"
                                >
                                    {task?.title || 'Untitled Task'}
                                </h1>
                            )}
                        </div>

                        {/* Description Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between pb-1">
                                <div className="flex items-center gap-2 text-zinc-900 font-semibold text-sm">
                                    <AlignLeft className="w-4 h-4 text-zinc-400" />
                                    <span>Description</span>
                                </div>
                                {!isEditingDesc && (
                                    <button
                                        onClick={() => setIsEditingDesc(true)}
                                        className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 px-2.5 py-1 rounded-lg hover:bg-zinc-100 transition-colors"
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>

                            {isEditingDesc ? (
                                <div className="space-y-3">
                                    <textarea
                                        value={descText}
                                        onChange={(e) => setDescText(e.target.value)}
                                        rows={5}
                                        className="w-full text-sm text-zinc-800 bg-white p-3.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 shadow-xs"
                                        placeholder="Add more details, links, or instructions..."
                                        autoFocus
                                    />
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleSaveDescription}
                                            disabled={updateTaskMutation.isPending}
                                            className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                                        >
                                            {updateTaskMutation.isPending ? 'Saving...' : 'Save Description'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setDescText(task?.description || '');
                                                setIsEditingDesc(false);
                                            }}
                                            className="px-3.5 py-2 text-zinc-600 rounded-lg text-xs font-medium hover:bg-zinc-100 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div 
                                    onClick={() => setIsEditingDesc(true)}
                                    className="text-sm text-zinc-700 bg-zinc-50/70 p-4 rounded-xl border border-zinc-200/80 min-h-[90px] whitespace-pre-wrap cursor-pointer hover:border-zinc-300 transition-colors leading-relaxed"
                                >
                                    {task?.description ? (
                                        task.description
                                    ) : (
                                        <span className="text-zinc-400 italic font-normal">
                                            No description provided. Click here to add detailed notes...
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Attachments Section */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center gap-2 text-zinc-900 font-semibold text-sm">
                                <Paperclip className="w-4 h-4 text-zinc-400" />
                                <span>Attachments</span>
                            </div>
                            <TaskAttachments projectId={projectId} taskId={selectedTaskId} />
                        </div>

                        {/* Activity & Comments Tabs */}
                        <div className="space-y-4 pt-4 border-t border-zinc-100">
                            <div className="flex items-center gap-4 border-b border-zinc-200/70">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('comments')}
                                    className={`flex items-center gap-2 pb-2.5 text-sm font-semibold transition-all relative ${
                                        activeTab === 'comments'
                                            ? 'text-zinc-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-zinc-900'
                                            : 'text-zinc-400 hover:text-zinc-600'
                                    }`}
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    <span>Comments</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('activity')}
                                    className={`flex items-center gap-2 pb-2.5 text-sm font-semibold transition-all relative ${
                                        activeTab === 'activity'
                                            ? 'text-zinc-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-zinc-900'
                                            : 'text-zinc-400 hover:text-zinc-600'
                                    }`}
                                >
                                    <Activity className="w-4 h-4" />
                                    <span>Activity History</span>
                                </button>
                            </div>

                            {activeTab === 'comments' ? (
                                <TaskComments projectId={projectId} taskId={selectedTaskId} />
                            ) : (
                                <TaskActivityFeed projectId={projectId} taskId={selectedTaskId} />
                            )}
                        </div>
                    </div>

                    {/* Right Column: Properties & Metadata Sidebar */}
                    <div className="lg:col-span-4 p-6 sm:p-7 bg-zinc-50/60 space-y-6 overflow-y-auto">
                        
                        <div className="pb-2 border-b border-zinc-200/60">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Task Properties</h3>
                        </div>

                        {/* Assignee */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" />
                                <span>Assignee</span>
                            </label>
                            
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsAssigneeOpen(!isAssigneeOpen)}
                                    className="w-full flex items-center justify-between p-2.5 bg-white border border-zinc-200 hover:border-zinc-300 rounded-xl shadow-xs transition-colors"
                                >
                                    <div className="flex items-center gap-2.5 truncate">
                                        {currentAssigneeAvatar ? (
                                            <img 
                                                src={currentAssigneeAvatar} 
                                                alt={currentAssigneeName} 
                                                className="w-7 h-7 rounded-full border border-zinc-200 object-cover"
                                            />
                                        ) : (
                                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                                                {task?.assignedTo ? currentAssigneeName.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                                            </div>
                                        )}
                                        <span className="text-sm font-semibold text-zinc-900 truncate">
                                            {currentAssigneeName}
                                        </span>
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                                </button>

                                {/* Dropdown Menu */}
                                {isAssigneeOpen && (
                                    <>
                                        <div className="fixed inset-0 z-30" onClick={() => setIsAssigneeOpen(false)} />
                                        <div className="absolute left-0 top-full mt-2 w-full bg-white border border-zinc-200 rounded-xl shadow-xl z-40 py-1.5 animate-in fade-in-0 zoom-in-95">
                                            <div className="px-3 py-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                                                Assign To Member
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleAssign(null)}
                                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 text-left transition-colors"
                                            >
                                                <div className="w-6 h-6 rounded-full border border-dashed border-zinc-300 flex items-center justify-center text-zinc-400">
                                                    <X className="w-3 h-3" />
                                                </div>
                                                <span>Unassigned</span>
                                                {!task?.assignedTo && <Check className="w-4 h-4 ml-auto text-blue-600" />}
                                            </button>
                                            <div className="border-t border-zinc-100 my-1" />
                                            {members.length === 0 ? (
                                                <div className="px-3 py-2 text-xs text-zinc-400">No project members found</div>
                                            ) : (
                                                members.map((m) => {
                                                    const mName = m.userSnapshot?.name || 'Member';
                                                    const mUserId = m.userId?._id || m.userId;
                                                    const isCurrent = String(task?.assignedTo) === String(mUserId);

                                                    return (
                                                        <button
                                                            key={m._id || mUserId}
                                                            type="button"
                                                            onClick={() => handleAssign(mUserId)}
                                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 text-left transition-colors"
                                                        >
                                                            {m.userSnapshot?.avatar ? (
                                                                <img src={m.userSnapshot.avatar} alt={mName} className="w-6 h-6 rounded-full object-cover" />
                                                            ) : (
                                                                <div className="w-6 h-6 rounded-full bg-zinc-800 text-white flex items-center justify-center text-[10px] font-medium">
                                                                    {mName.charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                            <span className="truncate flex-1 font-medium">{mName}</span>
                                                            {isCurrent && <Check className="w-4 h-4 ml-auto text-blue-600" />}
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Status */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Status</span>
                            </label>
                            <select
                                value={task?.status || 'todo'}
                                onChange={handleStatusChange}
                                disabled={updateTaskMutation.isPending}
                                className="w-full text-sm font-semibold p-2.5 bg-white border border-zinc-200 rounded-xl cursor-pointer hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 shadow-xs capitalize"
                            >
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="review">In Review</option>
                                <option value="done">Done</option>
                            </select>
                        </div>

                        {/* Priority */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Priority</span>
                            </label>
                            <select
                                value={task?.priority || 'medium'}
                                onChange={handlePriorityChange}
                                disabled={updateTaskMutation.isPending}
                                className={`w-full text-sm font-bold p-2.5 rounded-xl cursor-pointer border focus:outline-none focus:ring-2 focus:ring-zinc-900 shadow-xs uppercase tracking-wider ${
                                    task?.priority === 'urgent' ? 'bg-red-50 text-red-700 border-red-200' :
                                    task?.priority === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                    task?.priority === 'medium' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    'bg-zinc-100 text-zinc-700 border-zinc-200'
                                }`}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>

                        {/* Time Schedule & Due Date */}
                        <div className="space-y-2 pt-2 border-t border-zinc-200/60">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Time Schedule / Due</span>
                                </label>
                                {task?.dueDate && (
                                    <TaskCountdown dueDate={task?.dueDate} status={task?.status} />
                                )}
                            </div>

                            {/* Quick Time Presets */}
                            <div className="flex flex-wrap gap-1">
                                {[
                                    { label: '+1h', hours: 1 },
                                    { label: '+6h', hours: 6 },
                                    { label: '+12h', hours: 12 },
                                    { label: '+24h', hours: 24 },
                                    { label: '+48h', hours: 48 },
                                    { label: '+7d', hours: 168 },
                                ].map((preset) => (
                                    <button
                                        key={preset.label}
                                        type="button"
                                        disabled={updateTaskMutation.isPending}
                                        onClick={() => handleAddPresetHours(preset.hours)}
                                        className="px-2 py-0.5 text-[11px] font-semibold bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-zinc-200 rounded-md shadow-2xs transition-colors"
                                        title={`Set deadline to ${preset.hours} hours from now`}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>

                            {/* Exact Date & Time Picker */}
                            <div className="flex items-center gap-2 p-2 bg-white border border-zinc-200 rounded-xl shadow-xs">
                                <input
                                    type="datetime-local"
                                    value={formatDateTimeLocal(task?.dueDate)}
                                    onChange={handleDueDateChange}
                                    disabled={updateTaskMutation.isPending}
                                    className="text-xs font-semibold text-zinc-900 bg-transparent flex-1 cursor-pointer focus:outline-none"
                                />
                                {task?.dueDate && (
                                    <button
                                        type="button"
                                        title="Clear time schedule"
                                        onClick={() => updateTaskMutation.mutate({ projectId, taskId: selectedTaskId, data: { dueDate: null } })}
                                        className="p-1 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-100 transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Labels */}
                        <div className="space-y-2 pt-2 border-t border-zinc-200/60">
                            <label className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5" />
                                <span>Labels</span>
                            </label>
                            <TaskLabels projectId={projectId} taskId={selectedTaskId} />
                        </div>

                        {/* Metadata Details */}
                        <div className="pt-4 border-t border-zinc-200/60 text-xs text-zinc-400 space-y-2">
                            <div className="flex items-center justify-between">
                                <span>Created</span>
                                <span className="font-medium text-zinc-600">
                                    {task?.createdAt ? format(new Date(task.createdAt), 'MMM d, yyyy') : '—'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Last Updated</span>
                                <span className="font-medium text-zinc-600">
                                    {task?.updatedAt ? format(new Date(task.updatedAt), 'MMM d, yyyy') : '—'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailsSlideOver;
