import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";

import { socket,connectSocket,disconnectSocket } from "../config/socket.config";

import {
    setSocketStatus,
    setOnlineUsers,
    setUserOnline,
    setUserOffline,
    addTypingUser,
    removeTypingUser,
} from "@/features/chats/states/chat.slice";

import { chatKeys } from "@/features/chats/queries/chat.keys";

export const useSocketSetup = (enabled) => {
    console.log("useSocketSetup called with enabled:", enabled);
    const dispatch = useDispatch();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!enabled) {
            return;
        }

        connectSocket();

        const handleConnect = () => {
            dispatch(setSocketStatus("connected"));
            socket.emit("presence:get");
        };

        const handleDisconnect = () => {
            dispatch(setSocketStatus("disconnected"));
        };

        const handlePresenceInit = (onlineUserIds) => {
            dispatch(setOnlineUsers(onlineUserIds));
        };

        const handleUserOnline = (userId) => {
            dispatch(setUserOnline(userId));
        };

        const handleUserOffline = (userId) => {
            dispatch(setUserOffline(userId));
        };

        const handleTypingStarted = ({ chatId, userId }) => {
            dispatch(addTypingUser({ chatId, userId }));
        };

        const handleTypingStopped = ({ chatId, userId }) => {
            dispatch(removeTypingUser({ chatId, userId }));
        };

        // NEW MESSAGE
        const handleMessageReceive = (message) => {
            const { chatId, type } = message;
            const messageId = message.messageId || message._id;
            const normalizedMsg = {
                ...message,
                _id: messageId,
            };

            if (chatId) {
                queryClient.setQueryData(
                    chatKeys.messages(type, chatId),
                    (oldData) => {
                        if (!oldData) {
                            return oldData;
                        }

                        const alreadyExists = oldData.pages.some((page) =>
                            page.some((msg) => msg._id === messageId)
                        );

                        if (alreadyExists) {
                            return oldData;
                        }

                        return {
                            ...oldData,
                            pages: [
                                [normalizedMsg, ...oldData.pages[0]],
                                ...oldData.pages.slice(1),
                            ],
                        };
                    }
                );
            }

            // Invalidate chat lists so the conversation preview & unread indicators update
            queryClient.invalidateQueries({
                queryKey: chatKeys.lists(),
            });
        };

        // MESSAGE UPDATED
        const handleMessageUpdated = (message) => {
            const { chatId, messageId, content, updatedAt, type } = message;
            const targetId = messageId || message._id;

            if (chatId) {
                queryClient.setQueryData(
                    chatKeys.messages(type, chatId),
                    (oldData) => {
                        if (!oldData) {
                            return oldData;
                        }

                        return {
                            ...oldData,
                            pages: oldData.pages.map((page) =>
                                page.map((msg) =>
                                    msg._id === targetId
                                        ? {
                                              ...msg,
                                              content: typeof content !== "undefined" ? content : msg.content,
                                              updatedAt: updatedAt || msg.updatedAt,
                                              editedAt: updatedAt || msg.editedAt,
                                          }
                                        : msg
                                )
                            ),
                        };
                    }
                );
            }

            queryClient.invalidateQueries({
                queryKey: chatKeys.lists(),
            });
        };

        // MESSAGE DELETED
        const handleMessageDeleted = ({ chatId, messageId, _id, type, deletedAt }) => {
            const targetId = messageId || _id;

            if (chatId) {
                queryClient.setQueryData(
                    chatKeys.messages(type, chatId),
                    (oldData) => {
                        if (!oldData) {
                            return oldData;
                        }

                        return {
                            ...oldData,
                            pages: oldData.pages.map((page) =>
                                page.map((msg) =>
                                    msg._id === targetId
                                        ? {
                                              ...msg,
                                              deletedAt: deletedAt || new Date().toISOString(),
                                          }
                                        : msg
                                )
                            ),
                        };
                    }
                );
            }

            queryClient.invalidateQueries({
                queryKey: chatKeys.lists(),
            });
        };

        // REACTION
        const handleMessageReaction = ({ chatId, messageId, _id, reactions, type }) => {
            const targetId = messageId || _id;

            if (chatId) {
                queryClient.setQueryData(
                    chatKeys.messages(type, chatId),
                    (oldData) => {
                        if (!oldData) {
                            return oldData;
                        }

                        return {
                            ...oldData,
                            pages: oldData.pages.map((page) =>
                                page.map((msg) =>
                                    msg._id === targetId
                                        ? {
                                              ...msg,
                                              reactions: reactions || msg.reactions,
                                          }
                                        : msg
                                )
                            ),
                        };
                    }
                );
            }
        };

        // REGISTER EVENTS
        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("presence:init", handlePresenceInit);
        socket.on("users:online", handlePresenceInit);
        socket.on("user:online", handleUserOnline);
        socket.on("user:offline", handleUserOffline);
        socket.on("typing:started", handleTypingStarted);
        socket.on("typing:stopped", handleTypingStopped);
        socket.on("message:receive", handleMessageReceive);
        socket.on("message:update", handleMessageUpdated);
        socket.on("message:updated", handleMessageUpdated);
        socket.on("message:delete", handleMessageDeleted);
        socket.on("message:deleted", handleMessageDeleted);
        socket.on("message:reaction", handleMessageReaction);

        // CLEANUP
        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("presence:init", handlePresenceInit);
            socket.off("users:online", handlePresenceInit);
            socket.off("user:online", handleUserOnline);
            socket.off("user:offline", handleUserOffline);
            socket.off("typing:started", handleTypingStarted);
            socket.off("typing:stopped", handleTypingStopped);
            socket.off("message:receive", handleMessageReceive);
            socket.off("message:update", handleMessageUpdated);
            socket.off("message:updated", handleMessageUpdated);
            socket.off("message:delete", handleMessageDeleted);
            socket.off("message:deleted", handleMessageDeleted);
            socket.off("message:reaction", handleMessageReaction);

            disconnectSocket();
        };
    }, [enabled, dispatch, queryClient]);

    return socket;
};