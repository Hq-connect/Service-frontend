import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import ChatList from "./ChatList";
import { useChats } from "../hooks/useChats";
import { useUsers } from "@/global/hooks/useUsers";
import useAuth from "@/features/auth/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CreateGroupDialog from "../variants/group/CreateGroupDialog";

function NewUserListItem({ user, onClick }) {
  const displayName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.name || user.email || "Workspace User";
  const initials = displayName
    .split(" ")
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  const seed = user._id ?? user.email ?? "u";
  let hash = 0;
  for (let i = 0; i < seed.length; i++)
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash % 360);
  const avatarStyle = {
    backgroundColor: `hsl(${h},55%,88%)`,
    color: `hsl(${h},60%,30%)`,
  };

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent/50 text-foreground/80 hover:text-foreground text-left transition-colors duration-100 group"
    >
      <div className="relative shrink-0">
        <Avatar className="size-8">
          {user.avatar && (
            <AvatarImage src={user.avatar} alt={displayName} />
          )}
          <AvatarFallback style={avatarStyle} className="text-[10px] font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium truncate block">{displayName}</span>
        <span className="text-[10px] text-muted-foreground truncate block">{user.email}</span>
      </div>
    </button>
  );
}

/**
 * Left panel showing the list of conversations for the active type.
 * The secondary sidebar (in AppLayout) already handles switching between
 * DMs / Groups / Channels - so no tabs needed here.
 *
 * @param {"dm"|"group"|"channel"} activeType - Derived from current route
 */
function ChatSidebar({ activeType = "dm" }) {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const { data: chats = [], isLoading } = useChats(activeType);

  const { user } = useAuth();
  const currentUser = user?.user || user?.data || user;
  const currentUserId = currentUser?._id || currentUser?.id;

  // Debounce the search query to minimize API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Query tenant users if searching in DM, disabled if empty
  const { data: tenantUsers = [] } = useUsers({
    search: activeType === "dm" ? debouncedSearch : "",
    status: "active",
    enabled: activeType === "dm" && !!debouncedSearch.trim(),
  });

  const filtered = chats.filter((c) => {
    const name =
      activeType === "dm"
        ? c.otherUser?.name || ""
        : c.name || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const existingDmUserIds = new Set(
    chats
      .map((c) => c.otherUser?.userId || c.otherUser?._id)
      .filter(Boolean)
  );

  const newUsersToDm = search.trim()
    ? tenantUsers.filter((u) => u._id !== currentUserId && !existingDmUserIds.has(u._id))
    : [];

  return (
    <>
      <aside className={`flex-col w-full md:w-[280px] md:min-w-[240px] border-r border-border bg-background shrink-0 overflow-hidden ${
        chatId ? "hidden md:flex" : "flex"
      }`}>
        {/* Header Search & Create Action */}
        <div className="px-3 py-3 shrink-0 border-b border-border space-y-2">
          {activeType === "group" && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Groups
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCreateGroupOpen(true)}
                className="h-7 px-2 text-xs font-medium text-primary hover:bg-primary/10 gap-1"
              >
                <Plus className="size-3.5" />
                New Group
              </Button>
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="pl-8 h-8 text-sm bg-muted border-0 focus-visible:ring-1"
            />
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 py-2">
          <div>
            {search && activeType === "dm" && (
              <h3 className="px-3 pb-1.5 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">
                Conversations
              </h3>
            )}
            <ChatList type={activeType} chats={filtered} isLoading={isLoading} />
          </div>

          {activeType === "dm" && search && newUsersToDm.length > 0 && (
            <div className="px-2">
              <h3 className="px-3 pb-1.5 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">
                Start a new DM
              </h3>
              <div className="flex flex-col gap-0.5">
                {newUsersToDm.map((u) => (
                  <NewUserListItem
                    key={u._id}
                    user={u}
                    onClick={() => {
                      setSearch("");
                      navigate(`/chats/dm/new-${u._id}`);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Create Group Dialog */}
      <CreateGroupDialog
        open={createGroupOpen}
        onOpenChange={setCreateGroupOpen}
      />
    </>
  );
}

export default ChatSidebar;
