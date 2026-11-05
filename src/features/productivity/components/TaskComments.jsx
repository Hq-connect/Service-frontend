import React, { useState } from 'react';
import { useTaskComments, useCreateTaskComment, useDeleteTaskComment } from '../queries/taskDetails.queries';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, Send, MessageCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import { extractUser, getInitials, getAvatarStyle } from '@/global/utils/user';

const TaskComments = ({ projectId, taskId }) => {
    const { data: commentsResponse, isLoading } = useTaskComments(projectId, taskId);
    const { mutate: createComment, isPending: isCreating } = useCreateTaskComment();
    const { mutate: deleteComment, isPending: isDeleting } = useDeleteTaskComment();
    
    const [content, setContent] = useState('');
    const rawUser = useSelector((state) => state.auth?.user);
    const currentUser = extractUser(rawUser);

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
            <div className="h-20 bg-muted rounded-xl" />
            <div className="h-20 bg-muted rounded-xl" />
        </div>;
    }

    return (
        <div className="space-y-6">
            {/* Comments List */}
            <div className="space-y-4">
                {comments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                        <MessageCircle className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-sm">No comments yet. Be the first to start the discussion!</p>
                    </div>
                ) : (
                    comments.map((comment) => {
                        const authorName = comment.userSnapshot?.name || comment.authorSnapshot?.name || 'Unknown User';
                        const authorAvatar = comment.userSnapshot?.avatar || comment.authorSnapshot?.avatar;
                        const authorId = comment.userId || comment.authorId || authorName;
                        const isAuthor = currentUser && (
                            comment.userId === currentUser._id || 
                            comment.userId === currentUser.id || 
                            comment.authorId === currentUser._id
                        );

                        const initials = getInitials(authorName);
                        const avatarStyle = getAvatarStyle(authorId);

                        return (
                            <div key={comment._id} className="flex gap-4 group">
                                {/* Avatar */}
                                <div className="flex-shrink-0">
                                    {authorAvatar ? (
                                        <img 
                                            src={authorAvatar} 
                                            alt={authorName} 
                                            className="w-8 h-8 rounded-full border border-border object-cover"
                                        />
                                    ) : (
                                        <div 
                                            style={avatarStyle}
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold select-none shadow-2xs border border-border/40"
                                        >
                                            {initials}
                                        </div>
                                    )}
                                </div>

                                {/* Comment Bubble */}
                                <div className="flex-1 space-y-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm text-foreground">
                                                {authorName}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : ''}
                                            </span>
                                        </div>
                                        
                                        {/* Delete Button (Only for author) */}
                                        {isAuthor && (
                                            <button
                                                onClick={() => deleteComment({ projectId, taskId, commentId: comment._id })}
                                                disabled={isDeleting}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-all focus:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="text-sm text-foreground bg-card p-3 rounded-2xl rounded-tl-none border border-border whitespace-pre-wrap shadow-2xs">
                                        {comment.content}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Comment Input */}
            <div className="flex gap-4 items-start pt-4 border-t border-border">
                <div className="flex-shrink-0">
                    {currentUser?.avatar ? (
                        <img 
                            src={currentUser.avatar} 
                            alt="You" 
                            className="w-8 h-8 rounded-full border border-border object-cover"
                        />
                    ) : (
                        <div 
                            style={getAvatarStyle(currentUser || 'You')}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold select-none shadow-2xs border border-border/40"
                        >
                            {getInitials(currentUser || 'You')}
                        </div>
                    )}
                </div>
                <form onSubmit={handleSubmit} className="flex-1 relative">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full min-h-[80px] p-3 pr-12 text-sm bg-card text-foreground placeholder:text-muted-foreground border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring resize-none transition-shadow shadow-2xs"
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
                        className="absolute bottom-3 right-3 p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-2xs"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TaskComments;
