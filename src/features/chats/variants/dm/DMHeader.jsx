import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Phone, Video, Search, MoreHorizontal, ChevronLeft, Loader2 } from "lucide-react";
import OnlineIndicator from "../../components/OnlineIndicator";
import { getUserInitials, getAvatarStyle } from "@/global/utils/user";
import useInitiateCall from "../../hooks/useInitiateCall";

/**
 * Header for a Direct Message chat window.
 *
 * otherUser shape: { userId, name, avatar, presence }
 */
function DMHeader({ chat }) {
  const otherUser = chat?.otherUser ?? {};
  const displayName = otherUser.name || "Unknown";
  const initials = getUserInitials(otherUser);
  const avatarStyle = getAvatarStyle(otherUser);

  const { initiateCall, isStartingCall } = useInitiateCall({ chat, chatType: "dm" });

  const onlineUsers = useSelector((state) => state.chat.onlineUsers);
  const rawTargetUserId = otherUser.userId || otherUser._id || otherUser.id;
  const targetUserId = rawTargetUserId ? String(rawTargetUserId) : null;
  const isOnline = targetUserId ? onlineUsers[targetUserId] : undefined;
  const presence =
    isOnline === true ? "online" : isOnline === false ? "offline" : (otherUser.presence ?? "offline");

  const presenceLabel =
    presence === "online" ? "Active now" :
    presence === "away"   ? "Away"       : "Offline";

  return (
    <div className="flex items-center justify-between px-4 h-14 border-b border-border bg-background shrink-0 select-none">
      {/* Left: avatar + name + status */}
      <div className="flex items-center gap-3">
        <Link 
          to="/chats/dm" 
          className="md:hidden p-1 mr-0.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div className="relative">
          <Avatar className="size-8">
            {otherUser.avatar && (
              <AvatarImage src={otherUser.avatar} alt={displayName} />
            )}
            <AvatarFallback style={avatarStyle} className="text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-0.5 -right-0.5">
            <OnlineIndicator status={presence} size="xs" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground tracking-tight">{displayName}</p>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border border-border bg-muted/40 text-muted-foreground"
            style={
              presence === "online"
                ? {
                    backgroundColor: "var(--status-live-bg)",
                    color: "var(--status-live-fg)",
                    borderColor: "transparent",
                  }
                : undefined
            }
          >
            {presenceLabel}
          </span>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg border border-border bg-muted/30 mr-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => initiateCall({ callType: "audio" })}
            disabled={isStartingCall}
            title={`Start audio call with ${displayName}`}
            className="size-7 text-muted-foreground hover:text-foreground hover:bg-background active:scale-95 transition-all duration-150 cursor-pointer"
          >
            {isStartingCall ? (
              <Loader2 className="size-3.5 animate-spin text-primary" />
            ) : (
              <Phone className="size-3.5" />
            )}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => initiateCall({ callType: "video" })}
            disabled={isStartingCall}
            title={`Start video call with ${displayName}`}
            className="size-7 text-muted-foreground hover:text-foreground hover:bg-background active:scale-95 transition-all duration-150 cursor-pointer"
          >
            {isStartingCall ? (
              <Loader2 className="size-3.5 animate-spin text-primary" />
            ) : (
              <Video className="size-3.5" />
            )}
          </Button>
        </div>
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150">
          <Search className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150">
          <MoreHorizontal className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export default DMHeader;
