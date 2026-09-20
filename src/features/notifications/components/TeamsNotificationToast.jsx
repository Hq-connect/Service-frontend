import React from "react";
import { toast } from "sonner";
import { 
  MessageSquare, 
  CheckSquare, 
  Video, 
  Sparkles, 
  Bell, 
  FileText, 
  AtSign, 
  X, 
  ExternalLink 
} from "lucide-react";

/**
 * Maps notification types to matching visual accents and icons
 */
const getTypeConfig = (type) => {
  switch (type) {
    case "chat":
      return {
        icon: MessageSquare,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        label: "Chat",
      };
    case "mention":
      return {
        icon: AtSign,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        label: "Mention",
      };
    case "task_assigned":
    case "task_due":
    case "task_completed":
      return {
        icon: CheckSquare,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        label: "Task",
      };
    case "meeting":
      return {
        icon: Video,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        label: "Meeting",
      };
    case "ai":
      return {
        icon: Sparkles,
        color: "text-indigo-500",
        bg: "bg-indigo-500/10",
        label: "AI Assistant",
      };
    case "file":
      return {
        icon: FileText,
        color: "text-cyan-500",
        bg: "bg-cyan-500/10",
        label: "Document",
      };
    default:
      return {
        icon: Bell,
        color: "text-gray-500",
        bg: "bg-gray-500/10",
        label: "Notification",
      };
  }
};

/**
 * Microsoft Teams Style Floating Toast Card (Bottom-Right)
 */
export function TeamsNotificationToast({ notification, onDismiss, onNavigate }) {
  const typeConfig = getTypeConfig(notification.type);
  const IconComponent = typeConfig.icon;

  const handleClick = () => {
    onDismiss?.();
    if (onNavigate) {
      const targetUrl = notification.action?.url || "/";
      onNavigate(targetUrl, notification);
    }
  };

  return (
    <div 
      className="w-[360px] max-w-[calc(100vw-32px)] bg-card/95 backdrop-blur-md text-card-foreground border border-border/80 shadow-2xl rounded-xl p-3.5 select-none transition-all duration-200 hover:shadow-cyan-500/5 hover:border-border cursor-pointer group"
      onClick={handleClick}
    >
      {/* Top Bar: Brand, Category, Close */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center justify-center size-5 rounded-md ${typeConfig.bg} ${typeConfig.color}`}>
            <IconComponent className="size-3" />
          </span>
          <span className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">
            {typeConfig.label}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss?.();
          }}
          className="size-5 inline-flex items-center justify-center rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          title="Dismiss"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Main Body */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground tracking-tight leading-snug truncate">
            {notification.title || "New Notification"}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
            {notification.message || ""}
          </p>
        </div>
      </div>

      {/* Footer / Quick Action */}
      <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="text-[10px] text-muted-foreground/70">Just now</span>
        <span className="inline-flex items-center gap-1 font-medium text-primary group-hover:underline">
          View details <ExternalLink className="size-3" />
        </span>
      </div>
    </div>
  );
}

/**
 * Helper to spawn the Teams-style notification toast at the bottom right
 */
export const showTeamsNotificationToast = (notification, onNavigate) => {
  return toast.custom(
    (t) => (
      <TeamsNotificationToast
        notification={notification}
        onDismiss={() => toast.dismiss(t)}
        onNavigate={onNavigate}
      />
    ),
    {
      position: "bottom-right",
      duration: 6500,
    }
  );
};

export default TeamsNotificationToast;
