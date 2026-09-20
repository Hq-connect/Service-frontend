import React, { useState } from "react";
import { Bell } from "lucide-react";
import { useSelector } from "react-redux";
import { useUnreadCount } from "../hooks/useUnreadCount";
import NotificationPopover from "./NotificationPopover";

export function NotificationBell({ className = "" }) {
  const [open, setOpen] = useState(false);
  const unreadCount = useSelector((state) => state.notifications?.unreadCount ?? 0);

  // Initialize unread count query
  useUnreadCount(true);

  const displayCount = unreadCount > 99 ? "99+" : unreadCount;

  return (
    <NotificationPopover open={open} onOpenChange={setOpen}>
      <button
        type="button"
        aria-label="Open notifications"
        className={`relative inline-flex items-center justify-center size-9 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-muted dark:text-muted-foreground dark:hover:text-foreground transition-all cursor-pointer focus:outline-hidden ${className}`}
      >
        <Bell className="size-5 transition-transform duration-200 active:scale-95" />

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#f23c3c] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-background shadow-xs animate-in zoom-in-50 duration-200">
            {displayCount}
          </span>
        )}
      </button>
    </NotificationPopover>
  );
}

export default NotificationBell;
