import React, { useState } from 'react';
import { useTaskComments, useCreateTaskComment, useDeleteTaskComment } from '../queries/taskDetails.queries';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, Send, MessageCircle } from 'lucide-react';
import { useSelector } from 'react-redux';

const TaskComments = ({ projectId, taskId }) => {
    const { data: commentsResponse, isLoading } = useTaskComments(projectId, taskId);
    const { mutate: createComment, isPending: isCreating } = useCreateTaskComment();
    const { mutate: deleteComment, isPending: isDeleting } = useDeleteTaskComment();
    
    const [content, setContent] = useState('');
    const currentUser = useSelector((state) => state.auth?.user);

    const comments = commentsResponse?.data?.comments || [];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!content.trim() || isCreating) return;

        createComment(
            { projectId, taskId, content: content.trim() },
            {
                onSuccess: () => setContent('')
            }
        );
    };

    if (isLoading) {
        return <div className="space-y-4 animate-pulse">
            <div className="h-20 bg-zinc-100 rounded-xl" />
            <div className="h-20 bg-zinc-100 rounded-xl" />
        </div>;
    }

    return (
        <div className="space-y-6">
            {/* Comments List */}
            <div className="space-y-4">
                {comments.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                        <MessageCircle className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
                        <p className="text-sm">No comments yet. Be the first to start the discussion!</p>
                    </div>
                ) : (
                    comments.map((comment) => {
                        const authorName = comment.userSnapshot?.name || comment.authorSnapshot?.name || 'Unknown User';
                        const authorAvatar = comment.userSnapshot?.avatar || comment.authorSnapshot?.avatar;
                        const isAuthor = currentUser && (
                            comment.userId === currentUser._id || 
                            comment.userId === currentUser.id || 
                            comment.authorId === currentUser._id
                        );

                        return (
                            <div key={comment._id} className="flex gap-4 group">
                                {/* Avatar */}
                                <div className="flex-shrink-0">
                                    {authorAvatar ? (
                                        <img 
                                            src={authorAvatar} 
                                            alt={authorName} 
                                            className="w-8 h-8 rounded-full border border-zinc-200 object-cover"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-zinc-800 text-white flex items-center justify-center text-xs font-medium">
                                            {authorName.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                {/* Comment Bubble */}
                                <div className="flex-1 space-y-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm text-zinc-900">
                                                {authorName}
                                            </span>
                                            <span className="text-xs text-zinc-500">
                                                {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : ''}
                                            </span>
                                        </div>
                                        
                                        {/* Delete Button (Only for author) */}
                                        {isAuthor && (
                                            <button
                                                onClick={() => deleteComment({ projectId, taskId, commentId: comment._id })}
                                                disabled={isDeleting}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-all focus:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="text-sm text-zinc-700 bg-zinc-50 p-3 rounded-2xl rounded-tl-none border border-zinc-100 whitespace-pre-wrap">
                                        {comment.content}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Comment Input */}
            <div className="flex gap-4 items-start pt-4 border-t border-zinc-100">
                <div className="flex-shrink-0">
                    {currentUser?.avatar ? (
                        <img 
                            src={currentUser.avatar} 
                            alt="You" 
                            className="w-8 h-8 rounded-full border border-zinc-200"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-800 text-white flex items-center justify-center text-xs font-medium">
                            {currentUser?.firstName?.charAt(0) || currentUser?.email?.charAt(0) || 'Y'}
                        </div>
                    )}
                </div>
                <form onSubmit={handleSubmit} className="flex-1 relative">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full min-h-[80px] p-3 pr-12 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent resize-none transition-shadow"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!content.trim() || isCreating}
                        className="absolute bottom-3 right-3 p-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TaskComments;
