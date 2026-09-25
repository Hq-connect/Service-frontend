import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const TaskCountdown = ({ dueDate, status, compact = false, showIcon = true, className = '' }) => {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        if (!dueDate || status === 'done') return;

        // If less than 1 hour remaining, tick every 1 second; otherwise every 15 seconds
        const diff = new Date(dueDate).getTime() - Date.now();
        const intervalMs = diff > 0 && diff < 3600000 ? 1000 : 15000;

        const interval = setInterval(() => {
            setNow(Date.now());
        }, intervalMs);

        return () => clearInterval(interval);
    }, [dueDate, status]);

    if (!dueDate) return null;

    if (status === 'done') {
        return (
            <span 
                className={`inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full ${className}`}
                title="Task marked as Completed"
            >
                {showIcon && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                <span>Completed</span>
            </span>
        );
    }

    const dueTime = new Date(dueDate).getTime();
    const diff = dueTime - now;
    const isOverdue = diff <= 0;

    let timeText = '';
    let badgeClass = '';

    if (isOverdue) {
        const absDiff = Math.abs(diff);
        const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
            timeText = `Overdue by ${days}d ${hours}h`;
        } else if (hours > 0) {
            timeText = `Overdue by ${hours}h ${mins}m`;
        } else {
            timeText = `Overdue by ${Math.max(1, mins)}m`;
        }

        badgeClass = 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
    } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);

        if (days > 0) {
            timeText = `${days}d ${hours}h left`;
            badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
        } else if (hours >= 2) {
            timeText = `${hours}h ${mins}m left`;
            badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
        } else if (hours >= 1) {
            timeText = `${hours}h ${mins}m left`;
            badgeClass = 'bg-amber-50 text-amber-700 border-amber-300 font-semibold';
        } else {
            // Less than 1 hour left
            timeText = `${mins}m ${secs}s left`;
            badgeClass = 'bg-amber-100 text-amber-800 border-amber-300 font-semibold animate-pulse';
        }
    }

    const fullDueDateStr = new Date(dueDate).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    return (
        <span 
            className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition-colors ${badgeClass} ${className}`}
            title={`Deadline: ${fullDueDateStr}`}
        >
            {showIcon && (
                isOverdue ? (
                    <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                ) : (
                    <Clock className="w-3 h-3 shrink-0" />
                )
            )}
            <span className="font-mono tracking-tight">{timeText}</span>
        </span>
    );
};
