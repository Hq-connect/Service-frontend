import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setTaskCounts, setActiveProject } from '../states/productivity.slice';
import { useProject, useProjectMembers } from '../queries/project.queries';
import { useBoards, useCreateBoard, useBoardColumns, useReorderColumns, useCreateColumn } from '../queries/board.queries';
import { useTasks, useReorderTasks, useMoveTask } from '../queries/task.queries';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { BoardHeader } from '../components/BoardHeader';
import { BoardColumn } from '../components/BoardColumn';
import { TaskListView } from '../components/TaskListView';
import { ProjectInsightsView } from '../components/ProjectInsightsView';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { ProjectMembersModal } from '../components/ProjectMembersModal';
import TaskDetailsSlideOver from '../components/TaskDetailsSlideOver';
import { Plus, Loader2, FolderKanban } from 'lucide-react';
import { extractUser, getUserDisplayName } from '@/global/utils/user';

export const BoardView = () => {
    const { projectId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    
    // View state: 'board' | 'list' | 'insights'
    const activeView = searchParams.get('view') || 'board';
    const activeFilter = searchParams.get('filter') || '';
    const boardIdParam = searchParams.get('boardId');

    const dispatch = useDispatch();
    const rawUser = useSelector((state) => state.auth?.user);
    const currentUser = useMemo(() => extractUser(rawUser), [rawUser]);
    const currentUserId = currentUser?._id || currentUser?.id || currentUser?.userId;
    const currentUserName = currentUser ? getUserDisplayName(currentUser) : '';
    const currentUserEmail = currentUser?.email || '';

    const { data: projectResponse, isLoading: isLoadingProject } = useProject(projectId);
    const project = projectResponse?.data?.project || projectResponse?.data;

    const { data: boardsData, isLoading: isLoadingBoards } = useBoards(projectId);
    const boards = useMemo(() => {
        return boardsData?.data?.boards || (Array.isArray(boardsData?.data) ? boardsData.data : []);
    }, [boardsData]);

    const activeBoard = useMemo(() => {
        if (!boards || boards.length === 0) return null;
        if (boardIdParam) {
            const found = boards.find(b => b._id === boardIdParam);
            if (found) return found;
        }
        return boards[0];
    }, [boards, boardIdParam]);

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
    
    // Local filter and sort states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPriority, setSelectedPriority] = useState('');
    const [selectedAssignee, setSelectedAssignee] = useState(null);
    const [sortBy, setSortBy] = useState('default');

    // Column & Board creation states
    const [newColumnName, setNewColumnName] = useState('');
    const [isCreatingColumn, setIsCreatingColumn] = useState(false);
    const [newBoardName, setNewBoardName] = useState('Main Board');
    
    // Modal states
    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
    const [taskColumnId, setTaskColumnId] = useState(null);
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

    // Synchronize active project with Redux
    useEffect(() => {
        if (project) {
            dispatch(setActiveProject(project));
        }
    }, [project, dispatch]);

    // Synchronize columns
    useEffect(() => {
        const columnsArray = Array.isArray(columnsData?.data) ? columnsData.data : (columnsData?.data?.columns || []);
        if (columnsArray.length > 0) {
            const sorted = [...columnsArray].sort((a, b) => a.position - b.position);
            setColumns(sorted);
        } else {
            setColumns([]);
        }
    }, [columnsData]);

    // Check if task is assigned to current user
    const isTaskAssignedToUser = (task) => {
        if (!task) return false;
        const assignedId = task.assignedTo ? String(task.assignedTo) : null;
        const snapshotUserId = task.assigneeSnapshot?.userId ? String(task.assigneeSnapshot.userId) : null;
        const snapshotName = task.assigneeSnapshot?.name ? task.assigneeSnapshot.name.toLowerCase().trim() : null;
        const snapshotEmail = task.assigneeSnapshot?.email ? task.assigneeSnapshot.email.toLowerCase().trim() : null;

        if (currentUserId) {
            if (assignedId && assignedId === String(currentUserId)) return true;
            if (snapshotUserId && snapshotUserId === String(currentUserId)) return true;
        }

        if (currentUserName && snapshotName) {
            if (snapshotName === currentUserName.toLowerCase().trim()) return true;
        }

        if (currentUserEmail && snapshotEmail) {
            if (snapshotEmail === currentUserEmail.toLowerCase().trim()) return true;
        }

        return false;
    };

    const isTaskCreatedByUser = (task) => {
        if (!task || !currentUserId) return false;
        return String(task.createdBy) === String(currentUserId) ||
               String(task.creatorSnapshot?.userId) === String(currentUserId);
    };

    // Synchronize tasks & live task counts
    useEffect(() => {
        const tasksArray = tasksData?.data?.tasks || (Array.isArray(tasksData?.data) ? tasksData.data : []);
        setTasks(tasksArray);

        const counts = {
            inbox: tasksArray.filter(t => !t.isArchived).length,
            assigned: tasksArray.filter(t => !t.isArchived && isTaskAssignedToUser(t)).length,
            created: tasksArray.filter(t => !t.isArchived && isTaskCreatedByUser(t)).length,
            completed: tasksArray.filter(t => t.status === 'done').length,
            archived: tasksArray.filter(t => t.isArchived || t.status === 'archived').length,
        };
        dispatch(setTaskCounts(counts));
    }, [tasksData, currentUserId, currentUserName, currentUserEmail, dispatch]);

    // Board Switch Handler
    const handleSelectBoard = (board) => {
        const next = new URLSearchParams(searchParams);
        next.set('boardId', board._id);
        setSearchParams(next);
    };

    // Drag and Drop handler for columns and tasks
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

            if (startColumnId === finishColumnId) {
                // Same column reorder
                const columnTasks = newTasks.filter(t => t.columnId === startColumnId).sort((a, b) => a.position - b.position);
                columnTasks.splice(source.index, 1);
                columnTasks.splice(destination.index, 0, task);
                
                columnTasks.forEach((t, i) => {
                    const idx = newTasks.findIndex(nt => nt._id === t._id);
                    if (idx !== -1) newTasks[idx] = { ...newTasks[idx], position: i };
                });

                setTasks(newTasks);

                const updates = columnTasks.map((t, i) => ({
                    taskId: t._id,
                    columnId: startColumnId,
                    position: i,
                }));
                reorderTasksMutation.mutate({ projectId, updates });

            } else {
                // Cross-column move
                const destCol = columns.find(c => c._id === finishColumnId);
                const nextStatus = destCol?.key || task.status || 'todo';
                newTasks[taskIndex] = { ...task, columnId: finishColumnId, status: nextStatus };

                const finishColumnTasks = newTasks.filter(t => t.columnId === finishColumnId).sort((a, b) => a.position - b.position);
                const movedTaskIdxInFinish = finishColumnTasks.findIndex(t => t._id === draggableId);
                if (movedTaskIdxInFinish === -1) finishColumnTasks.splice(destination.index, 0, newTasks[taskIndex]);
                
                finishColumnTasks.forEach((t, i) => {
                    const idx = newTasks.findIndex(nt => nt._id === t._id);
                    if (idx !== -1) newTasks[idx] = { ...newTasks[idx], position: i };
                });

                setTasks(newTasks);

                moveTaskMutation.mutate({
                    projectId,
                    taskId: draggableId,
                    moveData: {
                        columnId: finishColumnId,
                        position: destination.index,
                        status: nextStatus,
                    }
                });
            }
        }
    };

    const handleCreateColumn = (e) => {
        e.preventDefault();
        if (!newColumnName.trim() || !boardId) return;

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
    
    const handleOpenCreateTask = (columnId = null) => {
        setTaskColumnId(columnId || columns[0]?._id);
        setIsCreateTaskOpen(true);
    };

    const handleViewChange = (view) => {
        const next = new URLSearchParams(searchParams);
        next.set('view', view);
        setSearchParams(next);
    };

    const handleFilterChange = (filter) => {
        const next = new URLSearchParams(searchParams);
        if (!filter) {
            next.delete('filter');
        } else {
            next.set('filter', filter);
        }
        setSearchParams(next);
    };

    // Filter tasks based on Search, Quick Filter, Priority & Assignee
    const filteredTasks = useMemo(() => {
        if (!tasks) return [];
        let list = tasks.filter(t => !t.isArchived && t.status !== 'archived');

        // 1. Text Search (title and description)
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(t => 
                (t.title && t.title.toLowerCase().includes(q)) ||
                (t.description && t.description.toLowerCase().includes(q))
            );
        }

        // 2. Quick Filter mode
        if (activeFilter === 'my_issues') {
            list = list.filter(t => isTaskAssignedToUser(t));
        } else if (activeFilter === 'high_priority') {
            list = list.filter(t => t.priority === 'urgent' || t.priority === 'high');
        } else if (activeFilter === 'due_soon') {
            const now = new Date();
            const threeDays = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
            list = list.filter(t => t.dueDate && new Date(t.dueDate) <= threeDays && t.status !== 'done');
        } else if (activeFilter === 'done') {
            list = list.filter(t => t.status === 'done');
        }

        // 3. Priority Filter
        if (selectedPriority) {
            list = list.filter(t => t.priority === selectedPriority);
        }

        // 4. Assignee Filter
        if (selectedAssignee) {
            if (selectedAssignee === 'unassigned') {
                list = list.filter(t => !t.assignedTo && !t.assigneeSnapshot?.name);
            } else {
                list = list.filter(t => 
                    (t.assignedTo && String(t.assignedTo) === String(selectedAssignee)) ||
                    (t.assigneeSnapshot?.userId && String(t.assigneeSnapshot.userId) === String(selectedAssignee))
                );
            }
        }

        return list;
    }, [tasks, searchQuery, activeFilter, selectedPriority, selectedAssignee, currentUserId, currentUserName, currentUserEmail]);

    // Sorter function for column tasks
    const sortColumnTasks = (tasksList) => {
        const priorityWeights = { urgent: 4, high: 3, medium: 2, low: 1 };
        if (sortBy === 'priority-desc') {
            return [...tasksList].sort((a, b) => (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0));
        }
        if (sortBy === 'priority-asc') {
            return [...tasksList].sort((a, b) => (priorityWeights[a.priority] || 0) - (priorityWeights[b.priority] || 0));
        }
        if (sortBy === 'due-date') {
            return [...tasksList].sort((a, b) => {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            });
        }
        if (sortBy === 'title-asc') {
            return [...tasksList].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        }
        if (sortBy === 'newest') {
            return [...tasksList].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        // Default manual position
        return [...tasksList].sort((a, b) => (a.position || 0) - (b.position || 0));
    };

    if (isLoadingBoards || isLoadingProject) {
        return (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!activeBoard) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-6 px-4">
                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FolderKanban className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Create First Board</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
                        Start organizing tasks with custom columns and drag-and-drop workflow.
                    </p>
                </div>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (!newBoardName.trim()) return;
                        createBoardMutation.mutate(
                            { projectId, data: { name: newBoardName.trim(), type: 'kanban' } }
                        );
                    }}
                    className="flex gap-2 w-full max-w-sm"
                >
                    <input
                        type="text"
                        value={newBoardName}
                        onChange={(e) => setNewBoardName(e.target.value)}
                        placeholder="Board name"
                        className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm shadow-2xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                    <button
                        type="submit"
                        disabled={createBoardMutation.isPending || !newBoardName.trim()}
                        className="bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 shrink-0"
                    >
                        {createBoardMutation.isPending ? 'Creating...' : 'Create Board'}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-background">
            {/* 1. Jira-Grade Unified Toolbar & Header */}
            <BoardHeader
                project={project}
                boards={boards}
                activeBoard={activeBoard}
                onSelectBoard={handleSelectBoard}
                activeView={activeView}
                onViewChange={handleViewChange}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                activeFilter={activeFilter}
                onFilterChange={handleFilterChange}
                selectedAssignee={selectedAssignee}
                onSelectAssignee={setSelectedAssignee}
                selectedPriority={selectedPriority}
                onSelectPriority={setSelectedPriority}
                sortBy={sortBy}
                onSortChange={setSortBy}
                members={projectMembers}
                onOpenMembers={() => setIsMembersModalOpen(true)}
                onOpenCreateTask={() => handleOpenCreateTask()}
                totalTasksCount={tasks.length}
            />

            {/* 2. Main Viewport Content (Kanban Board / Table View / Insights) */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                {activeView === 'list' ? (
                    <TaskListView
                        tasks={filteredTasks}
                        projectId={projectId}
                        projectKey={project?.key || 'PRJ'}
                        boardId={boardId}
                        columns={columns}
                        members={projectMembers}
                    />
                ) : activeView === 'insights' ? (
                    <ProjectInsightsView
                        tasks={tasks}
                        project={project}
                        members={projectMembers}
                    />
                ) : (
                    /* Default: Kanban Board View */
                    <div className="flex-1 overflow-x-auto overflow-y-hidden p-5 sm:p-6">
                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="all-columns" direction="horizontal" type="column">
                                {(provided) => (
                                    <div 
                                        className="flex h-full items-start gap-4"
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                    >
                                        {columns.map((column, index) => {
                                            const rawColTasks = filteredTasks.filter(t => t.columnId === column._id);
                                            const columnTasks = sortColumnTasks(rawColTasks);

                                            return (
                                                <Draggable key={column._id} draggableId={column._id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <BoardColumn 
                                                            column={column}
                                                            boardId={boardId}
                                                            projectId={projectId}
                                                            provided={provided}
                                                            isDragging={snapshot.isDragging}
                                                            tasks={columnTasks}
                                                            onAddTask={handleOpenCreateTask}
                                                            projectKey={project?.key || 'PRJ'}
                                                        />
                                                    )}
                                                </Draggable>
                                            );
                                        })}
                                        {provided.placeholder}

                                        {/* "+ Add Column" Card at the end */}
                                        <div className="shrink-0 w-[280px] sm:w-[300px] flex flex-col rounded-lg bg-muted/20 border border-dashed border-border/80 p-1">
                                            {isCreatingColumn ? (
                                                <form onSubmit={handleCreateColumn} className="p-3 bg-card border border-border rounded-md shadow-2xs">
                                                    <input
                                                        type="text"
                                                        autoFocus
                                                        placeholder="Column name (e.g. In QA)"
                                                        value={newColumnName}
                                                        onChange={(e) => setNewColumnName(e.target.value)}
                                                        className="w-full flex h-8 rounded-md border border-input bg-transparent px-3 text-xs font-semibold shadow-2xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mb-2"
                                                    />
                                                    <div className="flex items-center justify-end gap-1.5">
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
                                                            className="bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-md font-semibold hover:bg-primary/90 disabled:opacity-50"
                                                        >
                                                            {createColumnMutation.isPending ? 'Adding...' : 'Add Column'}
                                                        </button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <button 
                                                    onClick={() => setIsCreatingColumn(true)}
                                                    className="flex items-center justify-center gap-2 p-3 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors w-full h-12"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    <span>Add Column</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </div>
                )}
            </div>
            
            {/* Create Task Modal */}
            <CreateTaskModal 
                isOpen={isCreateTaskOpen}
                onClose={() => setIsCreateTaskOpen(false)}
                projectId={projectId}
                boardId={boardId}
                defaultColumnId={taskColumnId}
            />

            {/* Project Members Modal */}
            <ProjectMembersModal
                isOpen={isMembersModalOpen}
                onClose={() => setIsMembersModalOpen(false)}
                projectId={projectId}
                projectName={project?.name || activeBoard?.name}
            />

            {/* Jira-Style Task Details Slide-Over */}
            <TaskDetailsSlideOver />
        </div>
    );
};

export default BoardView;
