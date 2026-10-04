/**
 * Utility functions for recurring meetings formatting and calculations on Frontend
 */

export const DAYS_OF_WEEK = [
    { label: "S", name: "Sunday", short: "Sun", day: 0 },
    { label: "M", name: "Monday", short: "Mon", day: 1 },
    { label: "T", name: "Tuesday", short: "Tue", day: 2 },
    { label: "W", name: "Wednesday", short: "Wed", day: 3 },
    { label: "T", name: "Thursday", short: "Thu", day: 4 },
    { label: "F", name: "Friday", short: "Fri", day: 5 },
    { label: "S", name: "Saturday", short: "Sat", day: 6 },
];

/**
 * Generates a human-readable live summary string of the recurrence pattern
 */
export const getRecurrenceSummaryText = ({
    recurrenceType = "NONE",
    interval = 1,
    daysOfWeek = [],
    scheduledAt = null,
    until = null,
}) => {
    if (!recurrenceType || recurrenceType === "NONE") {
        return "Does not repeat";
    }

    const step = Math.max(1, parseInt(interval, 10) || 1);
    const date = scheduledAt ? new Date(scheduledAt) : null;
    const timeStr = date && !isNaN(date.getTime())
        ? date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
        : "";

    let patternDesc = "";

    if (recurrenceType === "DAILY") {
        patternDesc = step === 1
            ? (timeStr ? `Repeats daily at ${timeStr}` : "Repeats daily")
            : (timeStr ? `Repeats every ${step} days at ${timeStr}` : `Repeats every ${step} days`);
    } else if (recurrenceType === "WEEKLY") {
        const sortedDays = [...daysOfWeek].sort((a, b) => a - b);
        const dayNames = sortedDays
            .map((d) => DAYS_OF_WEEK.find((item) => item.day === d)?.name)
            .filter(Boolean);

        const daysLabel = dayNames.length > 0 ? dayNames.join(", ") : "selected day";

        if (step === 1) {
            patternDesc = timeStr
                ? `Repeats every ${daysLabel} at ${timeStr}`
                : `Repeats every ${daysLabel}`;
        } else {
            patternDesc = timeStr
                ? `Repeats every ${step} weeks on ${daysLabel} at ${timeStr}`
                : `Repeats every ${step} weeks on ${daysLabel}`;
        }
    } else if (recurrenceType === "MONTHLY") {
        const dayOfMonth = date && !isNaN(date.getTime()) ? date.getDate() : 1;
        const ordinal = (n) => {
            const s = ["th", "st", "nd", "rd"];
            const v = n % 100;
            return n + (s[(v - 20) % 10] || s[v] || s[0]);
        };
        patternDesc = step === 1
            ? (timeStr ? `Repeats monthly on the ${ordinal(dayOfMonth)} at ${timeStr}` : `Repeats monthly on the ${ordinal(dayOfMonth)}`)
            : (timeStr ? `Repeats every ${step} months on the ${ordinal(dayOfMonth)} at ${timeStr}` : `Repeats every ${step} months`);
    }

    if (until) {
        const untilDate = new Date(until);
        if (!isNaN(untilDate.getTime())) {
            const formattedUntil = untilDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            });
            patternDesc += ` until ${formattedUntil}`;
        }
    }

    return patternDesc;
};

/**
 * Format badge text for meeting cards
 */
export const formatRecurrenceBadge = (meeting) => {
    if (!meeting?.recurrenceType || meeting.recurrenceType === "NONE") {
        return null;
    }

    const { recurrenceType, recurrence, scheduledAt } = meeting;
    const interval = recurrence?.interval || 1;
    const days = recurrence?.daysOfWeek || [];

    if (recurrenceType === "DAILY") {
        return interval === 1 ? "Repeats Daily" : `Every ${interval} Days`;
    }

    if (recurrenceType === "WEEKLY") {
        if (days.length === 1) {
            const dayObj = DAYS_OF_WEEK.find((d) => d.day === days[0]);
            return `Weekly (${dayObj?.short || "day"})`;
        }
        if (days.length > 1) {
            const shorts = days
                .map((d) => DAYS_OF_WEEK.find((item) => item.day === d)?.short)
                .filter(Boolean)
                .join(", ");
            return `Weekly (${shorts})`;
        }
        return "Repeats Weekly";
    }

    if (recurrenceType === "MONTHLY") {
        return "Repeats Monthly";
    }

    return "Recurring";
};
