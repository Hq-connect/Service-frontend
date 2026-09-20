import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useBoards } from '../queries/board.queries';
import { useBoardColumns, useReorderColumns, useCreateColumn } from '../queries/board.queries';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { BoardColumn } from '../components/BoardColumn';
import { Plus, Loader2 } from 'lucide-react';

export const BoardView = () => {
    const { projectId } = useParams();
    const { data: boardsData, isLoading: isLoadingBoards } = useBoards(projectId);
    
    // For simplicity, auto-select the first board or use a selected board state
    const boards = boardsData?.data || [];
    const activeBoard = boards.length > 0 ? boards[0] : null;
    const boardId = activeBoard?._id;

    const { data: columnsData, isLoading: isLoadingColumns } = useBoardColumns(boardId);
    const reorderColumnsMutation = useReorderColumns();
    const createColumnMutation = useCreateColumn();

    const [columns, setColumns] = useState([]);
    const [newColumnName, setNewColumnName] = useState('');
    const [isCreatingColumn, setIsCreatingColumn] = useState(false);

    useEffect(() => {
        if (columnsData?.data) {
            // Sort by position if applicable, assuming backend returns ordered array or position field
            const sorted = [...columnsData.data].sort((a, b) => a.position - b.position);
            setColumns(sorted);
        }
    }, [columnsData]);

    const handleDragEnd = (result) => {
        const { destination, source, type } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        if (type === 'column') {
            const newColumns = Array.from(columns);
            const [reorderedItem] = newColumns.splice(source.index, 1);
            newColumns.splice(destination.index, 0, reorderedItem);

            setColumns(newColumns); // Optimistic UI update

            const orderedColumnIds = newColumns.map(c => c._id);
            reorderColumnsMutation.mutate({ boardId, orderedColumnIds });
        }
    };

    const handleCreateColumn = (e) => {
        e.preventDefault();
        if (!newColumnName.trim()) return;

        createColumnMutation.mutate({
            boardId,
            data: { name: newColumnName, position: columns.length }
        }, {
            onSuccess: () => {
                setNewColumnName('');
                setIsCreatingColumn(false);
            }
        });
    };

    if (isLoadingBoards || isLoadingColumns) {
        return (
            <div className="flex items-center justify-center h-full min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!activeBoard) {
        return <div className="p-8 text-center text-muted-foreground">No boards found for this project.</div>;
    }

    return (
        <div className="h-full flex flex-col p-6 overflow-hidden">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">{activeBoard.name}</h2>
                    <p className="text-sm text-muted-foreground">{activeBoard.description}</p>
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
                                {columns.map((column, index) => (
                                    <Draggable key={column._id} draggableId={column._id} index={index}>
                                        {(provided, snapshot) => (
                                            <BoardColumn 
                                                column={column}
                                                boardId={boardId}
                                                provided={provided}
                                                isDragging={snapshot.isDragging}
                                            />
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}

                                {/* Add New Column Button */}
                                <div className="shrink-0 w-80 flex flex-col rounded-xl bg-muted/30 border border-transparent">
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
        </div>
    );
};
