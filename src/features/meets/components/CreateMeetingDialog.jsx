import React, { useState } from "react";
import { X, Calendar, Clock, Video, FileText, Globe } from "lucide-react";

export const CreateMeetingDialog = ({ isOpen, onClose, onSubmit, loading }) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState("scheduled"); // "scheduled" | "instant"
    const [scheduledAt, setScheduledAt] = useState("");
    const [duration, setDuration] = useState("30");
    const [timezone, setTimezone] = useState(
        Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
    );

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            title,
            description: description.trim() || undefined,
            type,
            timezone,
            duration: parseInt(duration, 10),
        };

        if (type === "scheduled" && scheduledAt) {
            payload.scheduledAt = new Date(scheduledAt).toISOString();
        }

        await onSubmit(payload);
        // Reset form
        setTitle("");
        setDescription("");
        setScheduledAt("");
        setType("scheduled");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            <Video className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-semibold">New Meeting</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Meeting Type Selector */}
                    <div className="grid grid-cols-2 gap-3 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
                        <button
                            type="button"
                            onClick={() => setType("scheduled")}
                            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                                type === "scheduled"
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                                    : "text-zinc-400 hover:text-zinc-200"
                            }`}
                        >
                            <Calendar className="w-4 h-4" />
                            Scheduled
                        </button>
                        <button
                            type="button"
                            onClick={() => setType("instant")}
                            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                                type === "instant"
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                                    : "text-zinc-400 hover:text-zinc-200"
                            }`}
                        >
                            <Video className="w-4 h-4" />
                            Instant Meet
                        </button>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                            Meeting Title <span className="text-rose-400">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Weekly Product Sync"
                            className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                            Description (Optional)
                        </label>
                        <textarea
                            rows={2}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add meeting agenda or notes..."
                            className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                        />
                    </div>

                    {/* Scheduled Date/Time if scheduled */}
                    {type === "scheduled" && (
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                                Date & Time <span className="text-rose-400">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                required={type === "scheduled"}
                                value={scheduledAt}
                                min={new Date().toISOString().slice(0, 16)}
                                onChange={(e) => setScheduledAt(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                            />
                        </div>
                    )}

                    {/* Duration & Timezone Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                                Duration
                            </label>
                            <select
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                            >
                                <option value="15">15 minutes</option>
                                <option value="30">30 minutes</option>
                                <option value="45">45 minutes</option>
                                <option value="60">1 hour</option>
                                <option value="90">1.5 hours</option>
                                <option value="120">2 hours</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                                Timezone
                            </label>
                            <input
                                type="text"
                                value={timezone}
                                onChange={(e) => setTimezone(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 text-sm font-medium transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {loading
                                ? "Creating..."
                                : type === "instant"
                                ? "Start Instant Meet"
                                : "Schedule Meeting"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateMeetingDialog;
