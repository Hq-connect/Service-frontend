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
import { incrementUnreadCount } from "@/features/notifications/states/notification.slice";
import { notificationKeys } from "@/features/notifications/queries/notification.keys";
import { playNotificationChime } from "@/features/notifications/utils/sound";
import { showTeamsNotificationToast } from "@/features/notifications/components/TeamsNotificationToast";
import { router } from "@/app/router/Router";
import { store } from "@/app/store/store";
import chatService from "@/features/chats/services/chat.service";

const extractUserId = (userObj) => {
    if (!userObj) return null;
    if (typeof userObj === "string") return userObj;
    return (
        userObj?._id ||
        userObj?.id ||
        userObj?.user?._id ||
        userObj?.user?.id ||
        userObj?.data?._id ||
        userObj?.data?.user?._id ||
        userObj?.data?.user?.id ||
        null
    );
};

// Track recently processed message IDs to guarantee idempotency across multiple socket broadcasts
const processedMessageIds = new Set();

export const useSocketSetup = (enabled) => {
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
            console.log("[useSocket] presence:init event:", onlineUserIds);
            dispatch(setOnlineUsers(onlineUserIds));
        };

        const handleUserOnline = (userId) => {
            console.log("[useSocket] user:online event:", userId);
            dispatch(setUserOnline(userId));
        };

        const handleUserOffline = (userId) => {
            console.log("[useSocket] user:offline event:", userId);
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
            if (messageId) {
                processedMessageIds.add(String(messageId));
                if (processedMessageIds.size > 500) {
                    const first = processedMessageIds.values().next().value;
                    processedMessageIds.delete(first);
                }
            }
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

            // Invalidate chat lists and unread count so the conversation preview & nav badges update
            queryClient.invalidateQueries({
                queryKey: chatKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: chatKeys.unread(),
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

        // LAST MESSAGE / CONVERSATION PREVIEW UPDATE VIA TENANT BROADCAST
        const handleLastMessage = ({ chatId, type, lastMessage, updatedAt, isUpdate, isDelete }) => {
            if (!chatId) return;
            const targetType = type || "dm";

            const msgId = lastMessage?._id ? String(lastMessage._id) : null;
            const isDuplicate = Boolean(msgId && processedMessageIds.has(msgId));
            if (msgId && !isUpdate && !isDelete) {
                processedMessageIds.add(msgId);
                if (processedMessageIds.size > 500) {
                    const first = processedMessageIds.values().next().value;
                    processedMessageIds.delete(first);
                }
            }

            const activeChatId = store.getState().chat?.activeChatId;
            const authUser = store.getState().auth?.user;
            const currentUserId = extractUserId(authUser);
            const senderId = extractUserId(lastMessage?.senderId) || (typeof lastMessage?.senderId === "string" ? lastMessage.senderId : null);

            const isFromOther = senderId && currentUserId ? String(senderId) !== String(currentUserId) : true;
            const isCurrentChatActive = activeChatId && String(activeChatId) === String(chatId);

            // If message is for currently active chat, keep unread as 0 and mark read on backend
            if (isCurrentChatActive && isFromOther && !isUpdate && !isDelete && !isDuplicate) {
                chatService.markChatAsRead({ chatId, messageId: lastMessage?._id }).catch((e) =>
                    console.error("Error auto-marking active chat as read:", e)
                );
            }

            // If message is from someone else, chat is not active, and NOT duplicate, increment unread counts
            if (isFromOther && !isCurrentChatActive && !isUpdate && !isDelete && !isDuplicate) {
                queryClient.setQueryData(chatKeys.unread(), (old) => {
                    const prev = old || { total: 0, dm: 0, group: 0, channel: 0, byChat: {} };
                    const byChat = { ...(prev.byChat || {}) };
                    byChat[chatId] = (byChat[chatId] || 0) + 1;

                    return {
                        ...prev,
                        total: (prev.total || 0) + 1,
                        [targetType]: (prev[targetType] || 0) + 1,
                        byChat,
                    };
                });

                queryClient.invalidateQueries({
                    queryKey: chatKeys.unread(),
                });
            }

            queryClient.setQueryData(chatKeys.list(targetType), (oldChats) => {
                if (!oldChats || !Array.isArray(oldChats)) {
                    queryClient.invalidateQueries({
                        queryKey: chatKeys.list(targetType),
                    });
                    return oldChats;
                }

                let chatFound = false;
                const updatedChats = oldChats.map((chat) => {
                    const cId = chat.chatId || chat._id;
                    if (cId === chatId) {
                        chatFound = true;
                        if (isDelete) {
                            if (chat.lastMessage?._id === lastMessage?._id) {
                                return {
                                    ...chat,
                                    lastMessage: {
                                        ...chat.lastMessage,
                                        deletedAt: lastMessage.deletedAt,
                                    },
                                };
                            }
                            return chat;
                        }

                        if (isUpdate) {
                            if (chat.lastMessage?._id === lastMessage?._id) {
                                return {
                                    ...chat,
                                    lastMessage: {
                                        ...chat.lastMessage,
                                        content: lastMessage.content,
                                    },
                                };
                            }
                            return chat;
                        }

                        // Deduplication: if chat already has this message as lastMessage and it's not an update/delete
                        if (
                            !isUpdate &&
                            !isDelete &&
                            chat.lastMessage?._id &&
                            lastMessage?._id &&
                            String(chat.lastMessage._id) === String(lastMessage._id)
                        ) {
                            return chat;
                        }

                        // Monotonic check: only update if incoming message is newer or equal
                        const incomingTime = new Date(updatedAt || lastMessage?.createdAt || Date.now()).getTime();
                        const existingTime = new Date(chat.updatedAt || chat.lastMessage?.createdAt || 0).getTime();

                        if (existingTime > incomingTime) {
                            return chat;
                        }

                        const unreadCount = isCurrentChatActive
                            ? 0
                            : (isFromOther && !isDuplicate)
                            ? (chat.unreadCount || 0) + 1
                            : (chat.unreadCount || 0);

                        return {
                            ...chat,
                            lastMessage: {
                                ...chat.lastMessage,
                                ...lastMessage,
                            },
                            unreadCount,
                            updatedAt: updatedAt || lastMessage?.createdAt || new Date().toISOString(),
                        };
                    }
                    return chat;
                });

                // If this is a brand new chat not yet present in the sidebar list, refresh the chat list query
                if (!chatFound && !isDelete) {
                    queryClient.invalidateQueries({
                        queryKey: chatKeys.list(targetType),
                    });
                    queryClient.invalidateQueries({
                        queryKey: chatKeys.unread(),
                    });
                    return oldChats;
                }

                if (chatFound && !isUpdate && !isDelete) {
                    return [...updatedChats].sort(
                        (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
                    );
                }

                return updatedChats;
            });
        };

        // CHAT READ SYNC ACROSS TABS / SESSIONS
        const handleChatRead = ({ chatId, userId }) => {
            const authUser = store.getState().auth?.user;
            const currentUserId = extractUserId(authUser);
            const targetUserId = extractUserId(userId) || (typeof userId === "string" ? userId : null);

            if (targetUserId && currentUserId && String(targetUserId) !== String(currentUserId)) {
                return;
            }

            // Zero out unread count for this chat in list queries
            ["dm", "group"].forEach((type) => {
                queryClient.setQueryData(chatKeys.list(type), (oldChats) => {
                    if (!oldChats || !Array.isArray(oldChats)) return oldChats;
                    return oldChats.map((chat) => {
                        const cId = chat.chatId || chat._id;
                        if (cId === chatId) {
                            return { ...chat, unreadCount: 0 };
                        }
                        return chat;
                    });
                });
            });

            // Update unread count summary
            queryClient.setQueryData(chatKeys.unread(), (old) => {
                if (!old) return old;
                const prevCount = old.byChat?.[chatId] || 0;
                if (prevCount === 0) return old;

                const byChat = { ...(old.byChat || {}) };
                delete byChat[chatId];

                return {
                    ...old,
                    total: Math.max(0, (old.total || 0) - prevCount),
                    dm: Math.max(0, (old.dm || 0) - prevCount),
                    group: Math.max(0, (old.group || 0) - prevCount),
                    byChat,
                };
            });

            queryClient.invalidateQueries({
                queryKey: chatKeys.unread(),
            });
        };

        // NOTIFICATION RECEIVED
        const handleNotificationReceive = (data) => {
            const notification = data?.notification || data;
            if (!notification) return;

            // 1. Increment Redux unread count
            dispatch(incrementUnreadCount(1));

            // 2. Invalidate notification list & unread count in TanStack query cache
            queryClient.invalidateQueries({
                queryKey: notificationKeys.all,
            });

            // Invalidate chat unread counts if notification is chat-related
            const isChatNotification =
                notification.type === "chat" ||
                notification.type === "message" ||
                (typeof notification.event === "string" && notification.event.startsWith("chat.")) ||
                notification.action?.type === "chat" ||
                Boolean(notification.metadata?.chatId);

            if (isChatNotification) {
                queryClient.invalidateQueries({
                    queryKey: chatKeys.unread(),
                });
            }

            // 3. Play audio chime if sound is enabled
            const isSoundEnabled = store.getState().notifications?.soundEnabled ?? true;
            if (isSoundEnabled) {
                playNotificationChime();
            }

            // 4. Show Microsoft Teams style floating toast at the bottom-right
            showTeamsNotificationToast(notification, (targetUrl) => {
                if (targetUrl) {
                    if (router?.navigate) {
                        router.navigate(targetUrl);
                    } else {
                        window.location.assign(targetUrl);
                    }
                }
            });
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
        socket.on("chat:lastMessage", handleLastMessage);
        socket.on("message:receive", handleMessageReceive);
        socket.on("message:update", handleMessageUpdated);
        socket.on("message:updated", handleMessageUpdated);
        socket.on("message:delete", handleMessageDeleted);
        socket.on("message:deleted", handleMessageDeleted);
        socket.on("message:reaction", handleMessageReaction);
        socket.on("notification:receive", handleNotificationReceive);
        socket.on("chat:read", handleChatRead);

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
            socket.off("chat:lastMessage", handleLastMessage);
            socket.off("message:receive", handleMessageReceive);
            socket.off("message:update", handleMessageUpdated);
            socket.off("message:updated", handleMessageUpdated);
            socket.off("message:delete", handleMessageDeleted);
            socket.off("message:deleted", handleMessageDeleted);
            socket.off("message:reaction", handleMessageReaction);
            socket.off("notification:receive", handleNotificationReceive);
            socket.off("chat:read", handleChatRead);

            disconnectSocket();
        };
    }, [enabled, dispatch, queryClient]);

    return socket;
};