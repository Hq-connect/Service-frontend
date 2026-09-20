import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { 
  CheckCheck, 
  Bell, 
  BellOff, 
  Volume2, 
  VolumeX, 
  SlidersHorizontal,
  Loader2,
  Sparkles
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications } from "../hooks/useNotifications";
import { useMarkAsRead } from "../hooks/useMarkAsRead";
import { useMarkAllAsRead } from "../hooks/useMarkAllAsRead";
import { useDeleteNotification } from "../hooks/useDeleteNotification";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { setSoundEnabled } from "../states/notification.slice";
import NotificationItem from "./NotificationItem";
import { toast } from "sonner";

export function NotificationPopover({ children, open, onOpenChange }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState("all"); // "all" | "unread"

  const soundEnabled = useSelector((state) => state.notifications?.soundEnabled ?? true);
  const unreadCount = useSelector((state) => state.notifications?.unreadCount ?? 0);

  // Queries & Mutations
  const { data, isLoading } = useNotifications({
    read: activeTab === "unread" ? false : undefined,
    limit: 30,
  });

  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead, isPending: isMarkingAll } = useMarkAllAsRead();
  const { mutate: deleteNotification } = useDeleteNotification();
  const { 
    isSubscribed, 
    subscribe, 
    loading: pushLoading, 
    supported: pushSupported,
    permission: pushPermission 
  } = usePushNotifications();

  const notifications = data?.notifications || [];

  const handleSelectNotification = (item) => {
    if (!item.read) {
      markAsRead(item._id);
    }
    onOpenChange?.(false);

    if (item.action?.url) {
      navigate(item.action.url);
    }
  };

  const handleToggleSound = () => {
    dispatch(setSoundEnabled(!soundEnabled));
  };

  const handleEnablePush = async () => {
    try {
      await subscribe();
      toast.success("Desktop push alerts enabled!");
    } catch (err) {
      toast.error(err.message || "Failed to enable push notifications");
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] max-w-[calc(100vw-24px)] p-0 shadow-2xl rounded-xl border border-border/80 bg-background/98 backdrop-blur-md flex flex-col max-h-[520px] select-none z-50"
      >
        {/* Header */}
        <div className="p-3.5 border-b border-border flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-foreground tracking-tight">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                {unreadCount} unread
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Audio Toggle */}
            <button
              onClick={handleToggleSound}
              title={soundEnabled ? "Mute notification sound" : "Unmute notification sound"}
              className={`size-7 inline-flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                soundEnabled ? "text-muted-foreground hover:text-foreground hover:bg-muted" : "text-amber-500 bg-amber-500/10"
              }`}
            >
              {soundEnabled ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
            </button>

            {/* Mark All Read */}
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                disabled={isMarkingAll}
                title="Mark all as read"
                className="size-7 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
              >
                {isMarkingAll ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Tab Filters */}
        <div className="px-3 pt-2 pb-1 border-b border-border/50 flex items-center gap-2 shrink-0 bg-muted/20">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-background text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab("unread")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "unread"
                ? "bg-background text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className="size-1.5 rounded-full bg-primary" />
            )}
          </button>
        </div>

        {/* Notifications Scroll List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/40 min-h-[220px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-primary/70 mb-2" />
              <span className="text-xs">Loading notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
              <div className="size-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground mb-2.5">
                <BellOff className="size-5" />
              </div>
              <p className="text-xs font-semibold text-foreground">
                {activeTab === "unread" ? "No unread notifications" : "All caught up!"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 max-w-[220px]">
                {activeTab === "unread"
                  ? "You don't have any unread notifications right now."
                  : "We'll let you know when new tasks, chats, or mentions occur."}
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <NotificationItem
                key={item._id}
                notification={item}
                onSelect={handleSelectNotification}
                onMarkRead={(id) => markAsRead(id)}
                onDelete={(id) => deleteNotification(id)}
              />
            ))
          )}
        </div>

        {/* Footer: Push Notification Status */}
        {!pushSupported && (
          <div className="p-2 border-t border-border/60 bg-muted/20 text-muted-foreground text-[10px] text-center shrink-0">
            Push alerts require HTTPS or http://localhost
          </div>
        )}

        {pushSupported && isSubscribed && (
          <div className="p-2.5 border-t border-border/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-between text-xs shrink-0">
            <span className="text-[11px] font-medium flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Desktop alerts active
            </span>
            <button
              onClick={handleEnablePush}
              disabled={pushLoading}
              title="Re-sync push subscription with server"
              className="px-2 py-0.5 rounded text-[10px] font-semibold hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 transition-colors cursor-pointer disabled:opacity-50"
            >
              {pushLoading ? "Syncing..." : "Re-sync"}
            </button>
          </div>
        )}

        {pushSupported && !isSubscribed && pushPermission === "denied" && (
          <div className="p-2.5 border-t border-border/60 bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-between text-xs shrink-0">
            <span className="text-[11px] leading-tight">
              Desktop alerts are blocked. Click the site settings icon in your browser address bar to allow.
            </span>
          </div>
        )}

        {pushSupported && !isSubscribed && pushPermission !== "denied" && (
          <div className="p-2.5 border-t border-border/60 bg-muted/30 flex items-center justify-between text-xs shrink-0">
            <span className="text-[11px] text-muted-foreground">
              Get desktop alerts when closed
            </span>
            <button
              onClick={handleEnablePush}
              disabled={pushLoading}
              className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
            >
              {pushLoading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Sparkles className="size-3" />
              )}
              Enable
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default NotificationPopover;
