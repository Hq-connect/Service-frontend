import React from "react";
import { formatDistanceToNow } from "date-fns";
import { 
  MessageSquare, 
  CheckSquare, 
  Video, 
  Sparkles, 
  Bell, 
  FileText, 
  AtSign, 
  Trash2, 
  Check 
} from "lucide-react";

const getTypeBadge = (type) => {
  switch (type) {
    case "chat":
      return { icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-500/10" };
    case "mention":
      return { icon: AtSign, color: "text-purple-500", bg: "bg-purple-500/10" };
    case "task_assigned":
    case "task_due":
    case "task_completed":
      return { icon: CheckSquare, color: "text-emerald-500", bg: "bg-emerald-500/10" };
    case "meeting":
      return { icon: Video, color: "text-amber-500", bg: "bg-amber-500/10" };
    case "ai":
      return { icon: Sparkles, color: "text-indigo-500", bg: "bg-indigo-500/10" };
    case "file":
      return { icon: FileText, color: "text-cyan-500", bg: "bg-cyan-500/10" };
    default:
      return { icon: Bell, color: "text-gray-500", bg: "bg-gray-500/10" };
  }
};

export function NotificationItem({
  notification,
  onSelect,
  onMarkRead,
  onDelete,
}) {
  const isRead = notification.read;
  const badge = getTypeBadge(notification.type);
  const Icon = badge.icon;

  const timeAgo = notification.createdAt
    ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
    : "";

  return (
    <div
      onClick={() => onSelect?.(notification)}
      className={`relative group px-3.5 py-3 flex items-start gap-3 transition-colors cursor-pointer border-b border-border/40 last:border-b-0 hover:bg-muted/60 ${
        !isRead ? "bg-accent/20" : ""
      }`}
    >
      {/* Type Icon Badge */}
      <span
        className={`size-8 rounded-lg shrink-0 flex items-center justify-center mt-0.5 ${badge.bg} ${badge.color}`}
      >
        <Icon className="size-4" />
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-6">
        <div className="flex items-center gap-1.5">
          <h5 className={`text-xs truncate ${!isRead ? "font-semibold text-foreground" : "font-medium text-foreground/80"}`}>
            {notification.title}
          </h5>
        </div>
        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
          {notification.message}
        </p>
        <span className="text-[10px] text-muted-foreground/60 mt-1 block font-mono">
          {timeAgo}
        </span>
      </div>

      {/* Unread dot / Actions */}
      <div className="absolute top-3.5 right-3 flex items-center gap-1">
        {!isRead && (
          <span className="size-2 rounded-full bg-[#00c2ff] ring-2 ring-background shrink-0 group-hover:hidden" />
        )}

        {/* Hover action buttons */}
        <div className="hidden group-hover:flex items-center gap-0.5 bg-background/80 backdrop-blur-xs rounded-md shadow-xs p-0.5 border border-border/50">
          {!isRead && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead?.(notification._id);
              }}
              title="Mark as read"
              className="size-5 inline-flex items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-muted transition-colors cursor-pointer"
            >
              <Check className="size-3" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(notification._id);
            }}
            title="Delete"
            className="size-5 inline-flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationItem;
