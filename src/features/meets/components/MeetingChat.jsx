import React, { useState, useRef, useEffect } from "react";
import { Send, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const MeetingChat = ({
    messages = [],
    onSendMessage,
    currentUserId,
    sending = false,
}) => {
    const [inputText, setInputText] = useState("");
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || sending) return;
        const textToSend = inputText;
        setInputText("");
        try {
            await onSendMessage(textToSend);
        } catch (err) {
            setInputText(textToSend);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const formatTimestamp = (dateString) => {
        if (!dateString) return "";
        const d = new Date(dateString);
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const getInitials = (name = "User") => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-card text-card-foreground overflow-hidden">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                        <div className="size-11 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground mb-3">
                            <MessageSquare className="size-5" />
                        </div>
                        <h4 className="text-xs font-semibold text-foreground">
                            In-Meeting Chat
                        </h4>
                        <p className="text-[11px] text-muted-foreground max-w-[220px] mt-1">
                            Messages sent here are visible to active participants in this call.
                        </p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isOwn =
                            (msg.senderId === currentUserId ||
                             msg.senderId?._id === currentUserId ||
                             msg.senderId === currentUserId?.toString());
                        const text = msg.content?.text || msg.text || "";
                        const senderName = msg.senderName || (isOwn ? "You" : "Participant");

                        return (
                            <div
                                key={msg._id || index}
                                className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
                            >
                                {/* Sender name & time */}
                                <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-muted-foreground">
                                    <span className="font-medium text-foreground">
                                        {isOwn ? "You" : senderName}
                                    </span>
                                    <span>•</span>
                                    <span>{formatTimestamp(msg.createdAt)}</span>
                                </div>

                                {/* Message bubble */}
                                <div className="flex items-end gap-2 max-w-[85%]">
                                    {!isOwn && (
                                        <Avatar className="size-6 shrink-0 text-[10px] font-bold">
                                            <AvatarFallback className="bg-primary/15 text-primary">
                                                {getInitials(senderName)}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}

                                    <div
                                        className={`px-3 py-2 text-xs leading-relaxed break-words whitespace-pre-wrap rounded-xl ${
                                            isOwn
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted text-foreground border border-border"
                                        }`}
                                    >
                                        {text}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Bottom Input Area */}
            <div className="p-3 border-t border-border bg-card">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <Input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Send a message to everyone..."
                        maxLength={2000}
                        disabled={sending}
                        className="text-xs"
                    />

                    <Button
                        type="submit"
                        disabled={!inputText.trim() || sending}
                        size="icon"
                        title="Send message"
                    >
                        {sending ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Send className="size-4" />
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default MeetingChat;
