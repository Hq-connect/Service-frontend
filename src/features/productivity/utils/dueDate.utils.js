import { format } from 'date-fns';

/**
 * Calculates due date status for tasks:
 * - 'overdue': task not completed within assigned time (red)
 * - 'warning': task time is ending in 2 days or fewer (yellow/amber warning)
 * - 'completed': task status is 'done'
 * - 'normal': more than 2 days remaining
 */
export const getDueDateStatus = (dueDate, status) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    if (isNaN(due.getTime())) return null;

    const isDone = status === 'done';
    const now = new Date();

    // Normalize to calendar day difference (0 = today, negative = past, positive = future)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const diffDays = Math.round((startOfDue - startOfToday) / (1000 * 60 * 60 * 24));

    const dateFormatted = format(due, 'MMM d');

    if (isDone) {
        return {
            type: 'completed',
            label: dateFormatted,
            fullText: `Completed · ${dateFormatted}`,
            colorClass: 'text-muted-foreground',
            badgeClass: 'text-muted-foreground bg-muted/40 border-border',
            iconType: 'calendar',
        };
    }

    if (diffDays < 0) {
        const daysOver = Math.abs(diffDays);
        const overdueText = daysOver === 1 ? '1d overdue' : `${daysOver}d overdue`;
        return {
            type: 'overdue',
            label: `Overdue · ${dateFormatted}`,
            shortLabel: `Overdue · ${dateFormatted}`,
            badgeText: overdueText,
            fullText: `Overdue by ${daysOver} ${daysOver === 1 ? 'day' : 'days'} (${dateFormatted})`,
            detail: `Not completed within assigned time (${dateFormatted})`,
            colorClass: 'text-destructive font-semibold',
            badgeClass: 'text-destructive bg-destructive/10 border-destructive/20 font-semibold',
            iconType: 'alert-circle',
        };
    }

    if (diffDays <= 2) {
        const urgencyText = diffDays === 0
            ? 'Due today'
            : diffDays === 1
                ? 'Due tomorrow'
                : 'Due in 2 days';
        return {
            type: 'warning',
            label: `${urgencyText} · ${dateFormatted}`,
            shortLabel: `${urgencyText} · ${dateFormatted}`,
            badgeText: urgencyText,
            fullText: `${urgencyText} (${dateFormatted})`,
            detail: `Warning: Time ending soon (${urgencyText})`,
            colorClass: 'text-amber-600 dark:text-amber-400 font-semibold',
            badgeClass: 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/30 font-semibold',
            iconType: 'alert-triangle',
        };
    }

    return {
        type: 'normal',
        label: dateFormatted,
        shortLabel: dateFormatted,
        badgeText: dateFormatted,
        fullText: dateFormatted,
        detail: `Due: ${dateFormatted}`,
        colorClass: 'text-muted-foreground',
        badgeClass: 'text-muted-foreground',
        iconType: 'calendar',
    };
};
