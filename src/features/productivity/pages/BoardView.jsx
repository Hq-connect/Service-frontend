import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setTaskCounts } from '../states/productivity.slice';
import { useBoards, useCreateBoard } from '../queries/board.queries';
import { useBoardColumns, useReorderColumns, useCreateColumn } from '../queries/board.queries';
import { useTasks, useReorderTasks, useMoveTask } from '../queries/task.queries';
import { useProjectMembers } from '../queries/project.queries';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { BoardColumn } from '../components/BoardColumn';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { ProjectMembersModal } from '../components/ProjectMembersModal';
import TaskDetailsSlideOver from '../components/TaskDetailsSlideOver';
import { Plus, Loader2, UserPlus, Users, X, Filter, Lock, ArrowLeft } from 'lucide-react';

export const BoardView = () => {
    const { projectId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const currentView = searchParams.get('view') || 'inbox';

    const dispatch = useDispatch();
    const currentUser = useSelector((state) => state.auth?.user);
    const currentUserId = currentUser?._id || currentUser?.id;

    const { data: boardsData, isLoading: isLoadingBoards, error: boardsError } = useBoards(projectId);
    
    const boards = boardsData?.data?.boards || (Array.isArray(boardsData?.data) ? boardsData.data : []);
    const activeBoard = boards.length > 0 ? boards[0] : null;
    const boardId = activeBoard?._id;

    const { data: columnsData, isLoading: isLoadingColumns } = useBoardColumns(boardId);
    const { data: tasksData, isLoading: isLoadingTasks } = useTasks(projectId);
    const { data: membersResponse } = useProjectMembers(projectId);
    const projectMembers = membersResponse?.data?.members || [];
    
    const reorderColumnsMutation = useReorderColumns();
    const createColumnMutation = useCreateColumn();
    const reorderTasksMutation = useReorderTasks();
    const moveTaskMutation = useMoveTask();

    const createBoardMutation = useCreateBoard();

    const [columns, setColumns] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [newColumnName, setNewColumnName] = useState('');
    const [isCreatingColumn, setIsCreatingColumn] = useState(false);
    const [newBoardName, setNewBoardName] = useState('Main Board');
    const [isCreatingBoard, setIsCreatingBoard] = useState(false);
    
    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
    const [taskColumnId, setTaskColumnId] = useState(null);
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

    useEffect(() => {
        const columnsArray = Array.isArray(columnsData?.data) ? columnsData.data : (columnsData?.data?.columns || []);
        if (columnsArray.length > 0) {
            const sorted = [...columnsArray].sort((a, b) => a.position - b.position);
            setColumns(sorted);
        } else {
            setColumns([]);
        }
    }, [columnsData]);

    useEffect(() => {
        const tasksArray = tasksData?.data?.tasks || (Array.isArray(tasksData?.data) ? tasksData.data : []);
        setTasks(tasksArray);

        // Update live task count badges for secondary sidebar
        const counts = {
            inbox: tasksArray.filter(t => !t.isArchived).length,
            assigned: tasksArray.filter(t => !t.isArchived && (String(t.assignedTo) === String(currentUserId) || String(t.assigneeSnapshot?.userId) === String(currentUserId))).length,
            created: tasksArray.filter(t => !t.isArchived && (String(t.createdBy) === String(currentUserId) || String(t.creatorSnapshot?.userId) === String(currentUserId))).length,
            completed: tasksArray.filter(t => t.status === 'done').length,
            archived: tasksArray.filter(t => t.isArchived || t.status === 'archived').length,
        };
        dispatch(setTaskCounts(counts));
    }, [tasksData, currentUserId, dispatch]);

    const handleDragEnd = (result) => {
        const { destination, source, type, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        if (type === 'column') {
            const newColumns = Array.from(columns);
            const [reorderedItem] = newColumns.splice(source.index, 1);
            newColumns.splice(destination.index, 0, reorderedItem);

            setColumns(newColumns);
            const orderedColumnIds = newColumns.map(c => c._id);
            reorderColumnsMutation.mutate({ boardId, orderedColumnIds });
        }

        if (type === 'task') {
            const startColumnId = source.droppableId;
            const finishColumnId = destination.droppableId;

            const newTasks = Array.from(tasks);
            const taskIndex = newTasks.findIndex(t => t._id === draggableId);
            const task = { ...newTasks[taskIndex] };

            // Optimistic UI Update
            if (startColumnId === finishColumnId) {
                // --- SAME COLUMN: reorder only ---
                const columnTasks = newTasks.filter(t => t.columnId === startColumnId).sort((a, b) => a.position - b.position);
                columnTasks.splice(source.index, 1);
                columnTasks.splice(destination.index, 0, task);
                
                columnTasks.forEach((t, i) => {
                    const idx = newTasks.findIndex(nt => nt._id === t._id);
                    newTasks[idx] = { ...newTasks[idx], position: i };
                });

                setTasks(newTasks);

                // Backend: send raw array to /reorder
                const updates = columnTasks.map((t, i) => ({
                    taskId: t._id,
                    columnId: startColumnId,
                    position: i,
                }));
                reorderTasksMutation.mutate({ projectId, updates });

            } else {
                // --- CROSS-COLUMN: use /move endpoint ---
                newTasks[taskIndex] = { ...task, columnId: finishColumnId };

                const finishColumnTasks = newTasks.filter(t => t.columnId === finishColumnId).sort((a, b) => a.position - b.position);
                // Insert at destination index
                const movedTaskIdxInFinish = finishColumnTasks.findIndex(t => t._id === draggableId);
                if (movedTaskIdxInFinish === -1) finishColumnTasks.splice(destination.index, 0, newTasks[taskIndex]);
                
                finishColumnTasks.forEach((t, i) => {
                    const idx = newTasks.findIndex(nt => nt._id === t._id);
                    if (idx !== -1) newTasks[idx] = { ...newTasks[idx], position: i };
                });

                setTasks(newTasks);

                // Backend: use dedicated move endpoint (requires status field)
                moveTaskMutation.mutate({
                    projectId,
                    taskId: draggableId,
                    moveData: {
                        columnId: finishColumnId,
                        position: destination.index,
                        status: task.status || 'todo',
                    }
                });
            }
        }
    };

    const handleCreateColumn = (e) => {
        e.preventDefault();
        if (!newColumnName.trim()) return;

        createColumnMutation.mutate({
            boardId,
            data: { 
                name: newColumnName.trim(),
                key: newColumnName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''),
                position: columns.length 
            }
        }, {
            onSuccess: () => {
                setNewColumnName('');
                setIsCreatingColumn(false);
            }
        });
    };
    
    const handleOpenCreateTask = (columnId) => {
        setTaskColumnId(columnId);
        setIsCreateTaskOpen(true);
    };

    if (isLoadingBoards) {
        return (
            <div className="flex items-center justify-center h-full min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const isForbidden = boardsError?.response?.status === 403 || 
        boardsError?.response?.data?.message?.toLowerCase().includes("not a member") ||
        boardsError?.message?.toLowerCase().includes("not a member");

    if (isForbidden) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 border border-amber-500/20 shadow-sm">
                    <Lock className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-foreground tracking-tight">You are not a member of this project</h2>
                <p className="text-sm text-muted-foreground max-w-md mt-2 mb-6 leading-relaxed">
                    This is a public project visible to members of your organization. However, to view boards, create tasks, and collaborate, you need to be added as a member by a project admin or owner.
                </p>
                <Link
                    to="/tasks"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to All Projects
                </Link>
            </div>
        );
    }

    if (!activeBoard) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-6 px-4">
                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Plus className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">No board yet</h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                        Create your first board to start organizing tasks with columns and drag-and-drop.
                    </p>
                </div>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (!newBoardName.trim()) return;
                        createBoardMutation.mutate(
                            { projectId, data: { name: newBoardName.trim(), type: 'kanban' } },
                            { onSuccess: () => setIsCreatingBoard(false) }
                        );
                    }}
                    className="flex gap-2 w-full max-w-sm"
                >
                    <input
                        type="text"
                        value={newBoardName}
                        onChange={(e) => setNewBoardName(e.target.value)}
                        placeholder="Board name"
                        className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                    <button
                        type="submit"
                        disabled={createBoardMutation.isPending || !newBoardName.trim()}
                        className="bg-primary text-primary-foreground text-sm px-4 py-2 rounded-md font-medium disabled:opacity-50 shrink-0"
                    >
                        {createBoardMutation.isPending ? 'Creating...' : 'Create Board'}
                    </button>
                </form>
            </div>
        );
    }

    if (isLoadingColumns || isLoadingTasks) {
        return (
            <div className="flex items-center justify-center h-full min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const filteredTasks = useMemo(() => {
        if (!tasks) return [];
        switch (currentView) {
            case 'assigned':
                return tasks.filter(t => !t.isArchived && (String(t.assignedTo) === String(currentUserId) || String(t.assigneeSnapshot?.userId) === String(currentUserId)));
            case 'created':
                return tasks.filter(t => !t.isArchived && (String(t.createdBy) === String(currentUserId) || String(t.creatorSnapshot?.userId) === String(currentUserId)));
            case 'completed':
                return tasks.filter(t => t.status === 'done');
            case 'archived':
                return tasks.filter(t => t.isArchived || t.status === 'archived');
            case 'inbox':
            default:
                return tasks.filter(t => !t.isArchived);
        }
    }, [tasks, currentView, currentUserId]);

    return (
        <div className="h-full flex flex-col p-3 sm:p-6 overflow-hidden bg-background">
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{activeBoard.name}</h2>
                        {activeBoard.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground">{activeBoard.description}</p>
                        )}
                    </div>
                    {currentView !== 'inbox' && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-semibold text-primary">
                            <Filter className="w-3 h-3" />
                            <span>
                                {currentView === 'assigned' ? 'Assigned to me' :
                                 currentView === 'created' ? 'Created by me' :
                                 currentView === 'completed' ? 'Completed' :
                                 currentView === 'archived' ? 'Archived' : currentView} ({filteredTasks.length})
                            </span>
                            <button 
                                type="button" 
                                onClick={() => setSearchParams({})}
                                className="ml-0.5 p-0.5 hover:bg-primary/20 rounded-full transition-colors"
                                title="Clear filter"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Members Avatar Stack */}
                    <div 
                        onClick={() => setIsMembersModalOpen(true)}
                        className="flex items-center -space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
                        title="Manage Project Members"
                    >
                        {projectMembers.slice(0, 4).map((m) => (
                            m.userSnapshot?.avatar ? (
                                <img 
                                    key={m._id || m.userId} 
                                    src={m.userSnapshot.avatar} 
                                    alt={m.userSnapshot?.name} 
                                    className="w-8 h-8 rounded-full border-2 border-background object-cover" 
                                />
                            ) : (
                                <div 
                                    key={m._id || m.userId}
                                    className="w-8 h-8 rounded-full bg-zinc-800 text-white flex items-center justify-center text-xs font-semibold border-2 border-background"
                                >
                                    {(m.userSnapshot?.name || 'M').charAt(0).toUpperCase()}
                                </div>
                            )
                        ))}
                        {projectMembers.length > 4 && (
                            <div className="w-8 h-8 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center text-xs font-semibold border-2 border-background">
                                +{projectMembers.length - 4}
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsMembersModalOpen(true)}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-accent transition-colors shadow-sm"
                    >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Members ({projectMembers.length})</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto pb-4">
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="all-columns" direction="horizontal" type="column">
                        {(provided) => (
                            <div 
                                className="flex h-full items-start gap-4"
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                            >
                                {columns.map((column, index) => {
                                    // Filter and sort tasks for this column
                                    const columnTasks = filteredTasks
                                        .filter(t => t.columnId === column._id)
                                        .sort((a, b) => a.position - b.position);

                                    return (
                                        <Draggable key={column._id} draggableId={column._id} index={index}>
                                            {(provided, snapshot) => (
                                                <BoardColumn 
                                                    column={column}
                                                    boardId={boardId}
                                                    provided={provided}
                                                    isDragging={snapshot.isDragging}
                                                    tasks={columnTasks}
                                                    onAddTask={handleOpenCreateTask}
                                                />
                                            )}
                                        </Draggable>
                                    );
                                })}
                                {provided.placeholder}

                                <div className="shrink-0 w-[280px] sm:w-80 flex flex-col rounded-xl bg-muted/30 border border-transparent">
                                    {isCreatingColumn ? (
                                        <form onSubmit={handleCreateColumn} className="p-3 bg-card border rounded-xl shadow-sm">
                                            <input
                                                type="text"
                                                autoFocus
                                                placeholder="Column name"
                                                value={newColumnName}
                                                onChange={(e) => setNewColumnName(e.target.value)}
                                                className="w-full flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mb-2"
                                            />
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    type="button" 
                                                    onClick={() => setIsCreatingColumn(false)}
                                                    className="text-xs hover:text-foreground text-muted-foreground px-2 py-1"
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    type="submit"
                                                    disabled={createColumnMutation.isPending || !newColumnName.trim()}
                                                    className="bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-md font-medium disabled:opacity-50"
                                                >
                                                    {createColumnMutation.isPending ? 'Adding...' : 'Add Column'}
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <button 
                                            onClick={() => setIsCreatingColumn(true)}
                                            className="flex items-center gap-2 p-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors w-full"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Column
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>
            
            <CreateTaskModal 
                isOpen={isCreateTaskOpen}
                onClose={() => setIsCreateTaskOpen(false)}
                projectId={projectId}
                boardId={boardId}
                defaultColumnId={taskColumnId}
            />

            <ProjectMembersModal
                isOpen={isMembersModalOpen}
                onClose={() => setIsMembersModalOpen(false)}
                projectId={projectId}
                projectName={activeBoard.name}
            />

            <TaskDetailsSlideOver boardColumns={columns} />
        </div>
    );
};
