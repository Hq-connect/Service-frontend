import { useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { socket } from "@/socket/config/socket.config";
import { documentKeys } from "../queries/document.keys";
import commentService from "../services/comment.service";

/**
 * Hook to manage discussion comments and live thread updates for a document
 * @param {string} documentId
 */
export const useDocumentComments = (documentId) => {
  const queryClient = useQueryClient();

  const {
    data: comments = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: documentKeys.comments(documentId),
    queryFn: () => commentService.getComments(documentId),
    enabled: Boolean(documentId),
  });

  // Real-time socket updates for comments in the open document
  useEffect(() => {
    if (!documentId || !socket) return;

    const handleNewComment = (comment) => {
      if (!comment) return;
      queryClient.setQueryData(documentKeys.comments(documentId), (old = []) => {
        if (old.some((c) => c._id === comment._id)) return old;
        return [comment, ...old];
      });
    };

    const handleReply = ({ commentId, reply, comment: fullComment }) => {
      queryClient.setQueryData(documentKeys.comments(documentId), (old = []) =>
        old.map((c) => {
          if (c._id === commentId) {
            if (fullComment && Array.isArray(fullComment.replies)) {
              return fullComment;
            }
            const replies = c.replies || [];
            if (reply && replies.some((r) => r._id === reply._id)) return c;
            return { ...c, replies: reply ? [...replies, reply] : replies };
          }
          return c;
        })
      );
    };

    const handleStatus = ({ commentId, status }) => {
      queryClient.setQueryData(documentKeys.comments(documentId), (old = []) =>
        old.map((c) => (c._id === commentId ? { ...c, status } : c))
      );
    };

    socket.on("comment:new", handleNewComment);
    socket.on("comment:reply", handleReply);
    socket.on("comment:status", handleStatus);

    return () => {
      socket.off("comment:new", handleNewComment);
      socket.off("comment:reply", handleReply);
      socket.off("comment:status", handleStatus);
    };
  }, [documentId, queryClient]);

  const createCommentMutation = useMutation({
    mutationFn: (payload) => commentService.createComment(documentId, payload),
    onSuccess: (newComment) => {
      queryClient.setQueryData(documentKeys.comments(documentId), (old = []) => [
        newComment,
        ...old.filter((c) => c._id !== newComment._id),
      ]);
      if (socket && documentId) {
        socket.emit("doc:comment:new", { documentId, comment: newComment });
      }
    },
  });

  const addReplyMutation = useMutation({
    mutationFn: ({ commentId, content }) =>
      commentService.addReply(commentId, content),
    onSuccess: (updatedComment, variables) => {
      const commentId = updatedComment._id || variables?.commentId;
      queryClient.setQueryData(documentKeys.comments(documentId), (old = []) =>
        old.map((c) => (c._id === commentId ? updatedComment : c))
      );
      if (socket && documentId) {
        const reply = updatedComment.replies?.[updatedComment.replies.length - 1];
        socket.emit("doc:comment:reply", {
          documentId,
          commentId,
          reply,
          comment: updatedComment,
        });
      }
    },
  });

  const addReply = useCallback(
    async (commentIdOrObj, maybeContent) => {
      let commentId;
      let content;
      if (typeof commentIdOrObj === "object" && commentIdOrObj !== null) {
        commentId = commentIdOrObj.commentId || commentIdOrObj._id;
        content = commentIdOrObj.content;
      } else {
        commentId = commentIdOrObj;
        content = maybeContent;
      }
      return await addReplyMutation.mutateAsync({ commentId, content });
    },
    [addReplyMutation]
  );

  const resolveCommentMutation = useMutation({
    mutationFn: (commentId) => commentService.resolveComment(commentId),
    onSuccess: (updatedComment, commentId) => {
      const id = updatedComment._id || commentId;
      queryClient.setQueryData(documentKeys.comments(documentId), (old = []) =>
        old.map((c) => (c._id === id ? updatedComment : c))
      );
      if (socket && documentId) {
        socket.emit("doc:comment:status", { documentId, commentId: id, status: "resolved" });
      }
    },
  });

  const reopenCommentMutation = useMutation({
    mutationFn: (commentId) => commentService.reopenComment(commentId),
    onSuccess: (updatedComment, commentId) => {
      const id = updatedComment._id || commentId;
      queryClient.setQueryData(documentKeys.comments(documentId), (old = []) =>
        old.map((c) => (c._id === id ? updatedComment : c))
      );
      if (socket && documentId) {
        socket.emit("doc:comment:status", { documentId, commentId: id, status: "open" });
      }
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => commentService.deleteComment(commentId),
    onSuccess: (_, commentId) => {
      queryClient.setQueryData(documentKeys.comments(documentId), (old = []) =>
        old.filter((c) => c._id !== commentId)
      );
    },
  });

  return {
    comments,
    isLoading,
    isError,
    error,
    refetch,
    createComment: createCommentMutation.mutateAsync,
    isCreatingComment: createCommentMutation.isPending,
    addReply,
    isAddingReply: addReplyMutation.isPending,
    resolveComment: resolveCommentMutation.mutateAsync,
    isResolvingComment: resolveCommentMutation.isPending,
    reopenComment: reopenCommentMutation.mutateAsync,
    isReopeningComment: reopenCommentMutation.isPending,
    deleteComment: deleteCommentMutation.mutateAsync,
    isDeletingComment: deleteCommentMutation.isPending,
  };
};

export default useDocumentComments;
