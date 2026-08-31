import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import ChatList from "./ChatList";
import { useChats } from "../hooks/useChats";

/**
 * Left panel showing the list of conversations for the active type.
 * The secondary sidebar (in AppLayout) already handles switching between
 * DMs / Groups / Channels - so no tabs needed here.
 *
 * @param {"dm"|"group"|"channel"} activeType - Derived from current route
 */
function ChatSidebar({ activeType = "dm" }) {
  const { chatId } = useParams();
  const [search, setSearch] = useState("");
  const { data: chats = [], isLoading } = useChats(activeType);

  const filtered = chats.filter((c) => {
    const name =
      activeType === "dm"
        ? c.otherUser?.name || ""
        : c.name || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <aside className={`flex-col w-full md:w-[280px] md:min-w-[240px] border-r border-border bg-background shrink-0 overflow-hidden ${
      chatId ? "hidden md:flex" : "flex"
    }`}>
      {/* Search */}
      <div className="px-3 py-3 shrink-0 border-b border-border">
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
      <div className="flex-1 overflow-y-auto">
        <ChatList type={activeType} chats={filtered} isLoading={isLoading} />
      </div>
    </aside>
  );
}

export default ChatSidebar;
