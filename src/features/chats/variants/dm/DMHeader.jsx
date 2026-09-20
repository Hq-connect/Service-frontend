import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Phone, Video, Search, MoreHorizontal, ChevronLeft } from "lucide-react";
import OnlineIndicator from "../../components/OnlineIndicator";

/**
 * Header for a Direct Message chat window.
 *
 * otherUser shape: { userId, name, avatar, presence }
 */
function DMHeader({ chat }) {
  const otherUser = chat?.otherUser ?? {};
  const displayName = otherUser.name || "Unknown";

  const initials = displayName
    .split(" ")
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  const onlineUsers = useSelector((state) => state.chat.onlineUsers);
  const rawTargetUserId = otherUser.userId || otherUser._id || otherUser.id;
  const targetUserId = rawTargetUserId ? String(rawTargetUserId) : null;
  const isOnline = targetUserId ? onlineUsers[targetUserId] : undefined;
  const presence =
    isOnline === true ? "online" : isOnline === false ? "offline" : (otherUser.presence ?? "offline");

  const presenceLabel =
    presence === "online" ? "Active now" :
    presence === "away"   ? "Away"       : "Offline";

  const seed = otherUser.userId ?? otherUser.name ?? "u";
  let hash = 0;
  for (let i = 0; i < seed.length; i++)
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash % 360);
  const avatarStyle = {
    backgroundColor: `hsl(${h},55%,88%)`,
    color: `hsl(${h},60%,30%)`,
  };

  return (
    <div className="flex items-center justify-between px-4 h-14 border-b border-border bg-background shrink-0">
      {/* Left: avatar + name + status */}
      <div className="flex items-center gap-3">
        <Link 
          to="/chats/dm" 
          className="md:hidden p-1 mr-0.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
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
        <div className="leading-tight">
          <p className="text-sm font-semibold text-foreground">{displayName}</p>
          <p className="text-[11px] text-muted-foreground">{presenceLabel}</p>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
          <Phone className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
          <Video className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
          <Search className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export default DMHeader;
