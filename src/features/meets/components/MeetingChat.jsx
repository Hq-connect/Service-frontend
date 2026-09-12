import React, { useState, useRef, useEffect } from "react";
import { Send, MessageSquare, Loader2 } from "lucide-react";

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
        <div className="flex-1 flex flex-col h-full bg-zinc-900/95 overflow-hidden">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-zinc-800">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-800/60 border border-zinc-700/40 flex items-center justify-center text-zinc-400 mb-3 shadow-inner">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <h4 className="text-xs font-semibold text-zinc-300">
                            In-Meeting Chat
                        </h4>
                        <p className="text-[11px] text-zinc-500 max-w-[220px] mt-1">
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
                                <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-zinc-400">
                                    <span className="font-medium text-zinc-300">
                                        {isOwn ? "You" : senderName}
                                    </span>
                                    <span>•</span>
                                    <span>{formatTimestamp(msg.createdAt)}</span>
                                </div>

                                {/* Message bubble */}
                                <div className="flex items-end gap-2 max-w-[85%]">
                                    {!isOwn && (
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                                            {getInitials(senderName)}
                                        </div>
                                    )}

                                    <div
                                        className={`px-3.5 py-2 text-xs leading-relaxed break-words whitespace-pre-wrap ${
                                            isOwn
                                                ? "bg-indigo-600 text-white rounded-2xl rounded-br-xs shadow-md shadow-indigo-600/20"
                                                : "bg-zinc-800/90 text-zinc-100 rounded-2xl rounded-bl-xs border border-zinc-700/50 shadow-sm"
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
            <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Send a message to everyone..."
                        maxLength={2000}
                        disabled={sending}
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-all"
                    />

                    <button
                        type="submit"
                        disabled={!inputText.trim() || sending}
                        className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center"
                        title="Send message"
                    >
                        {sending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default MeetingChat;
