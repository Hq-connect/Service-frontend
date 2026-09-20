import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import meetingService from "../services/meeting.service";
import { setMessages, appendMessage } from "../states/meeting.slice";
import { socket } from "@/socket/config/socket.config";
import { toast } from "sonner";

export const useMeetingChat = (meetingId, isChatOpen, currentUserName) => {
    const dispatch = useDispatch();
    const messages = useSelector((state) => state.meetings.messages || []);
    const [sending, setSending] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const prevMessagesLenRef = useRef(0);
    const pollIntervalRef = useRef(null);

    // Initial load of messages
    const fetchChatMessages = useCallback(async () => {
        if (!meetingId) return;
        try {
            const res = await meetingService.getMessages(meetingId);
            const list = res?.data?.messages || [];
            dispatch(setMessages(list));
            prevMessagesLenRef.current = list.length;
        } catch (err) {
            // Ignore polling errors silently
        }
    }, [meetingId, dispatch]);

    useEffect(() => {
        fetchChatMessages();
    }, [fetchChatMessages]);

    // Real-time socket message listener
    useEffect(() => {
        if (!meetingId) return;

        const handleIncomingMessage = (newMsg) => {
            if (!newMsg) return;
            dispatch(appendMessage(newMsg));
            if (!isChatOpen) {
                setUnreadCount((prev) => prev + 1);
            }
        };

        socket.on("meeting:message", handleIncomingMessage);

        return () => {
            socket.off("meeting:message", handleIncomingMessage);
        };
    }, [meetingId, isChatOpen, dispatch]);

    // Reset unread count when chat panel is opened
    useEffect(() => {
        if (isChatOpen) {
            setUnreadCount(0);
        }
    }, [isChatOpen]);

    // Periodic message poll (every 3 seconds) to keep room chat real-time
    useEffect(() => {
        if (!meetingId) return;

        const pollMessages = async () => {
            try {
                const res = await meetingService.getMessages(meetingId);
                const list = res?.data?.messages || [];
                if (list.length > prevMessagesLenRef.current) {
                    const diff = list.length - prevMessagesLenRef.current;
                    if (!isChatOpen) {
                        setUnreadCount((prev) => prev + diff);
                    }
                    dispatch(setMessages(list));
                    prevMessagesLenRef.current = list.length;
                }
            } catch (err) {
                // Ignore silent sync
            }
        };

        pollIntervalRef.current = setInterval(pollMessages, 3000);

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [meetingId, isChatOpen, dispatch]);

    // Send a message
    const sendMessage = async (text) => {
        if (!text || !text.trim() || !meetingId || sending) return;
        try {
            setSending(true);
            const res = await meetingService.sendMessage(meetingId, {
                text: text.trim(),
                senderName: currentUserName || "Participant",
            });
            const created = res?.data?.message;
            if (created) {
                dispatch(appendMessage(created));
                prevMessagesLenRef.current += 1;
            }
            return created;
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to send message";
            toast.error(msg);
            throw err;
        } finally {
            setSending(false);
        }
    };

    return {
        messages,
        sending,
        unreadCount,
        sendMessage,
        refreshMessages: fetchChatMessages,
    };
};

export default useMeetingChat;
