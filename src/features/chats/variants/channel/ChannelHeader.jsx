import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Info,
  MoreHorizontal,
  Hash,
  Lock,
  Pin,
  ChevronLeft,
  Users,
  X,
  Megaphone,
} from "lucide-react";
import ChannelDetailsDialog from "./ChannelDetailsDialog";
import { useChannelDetails, usePinChannelMessage } from "../../hooks/useChannelActions";
import { useGroupMembers } from "../../hooks/useGroupMembers";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";

/**
 * Header for a Channel chat window.
 * @param {{ _id, chatId, name, topic, visibility, postingPermission, isArchived, pinnedMessages, memberCount }} chat
 */
function ChannelHeader({ chat }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [pinsOpen, setPinsOpen] = useState(false);

  const chatId = chat?._id || chat?.chatId;
  const { currentUserId } = useCurrentUser();
  const { data: channelDetails } = useChannelDetails(chatId);
  const { data: members = [] } = useGroupMembers(chatId, "channel");
  const { mutate: togglePin } = usePinChannelMessage();

  const resolved = channelDetails || chat || {};
  const name = resolved.name ?? "channel";
  const topic = resolved.topic ?? resolved.description ?? "";
  const isPrivate = resolved.visibility === "private";
  const isAdminsOnly = resolved.postingPermission === "admins_only";
  const isArchived = Boolean(resolved.isArchived);
  const memberCount = members.length || resolved.memberCount || 0;
  const pinnedMessages = Array.isArray(resolved.pinnedMessages) ? resolved.pinnedMessages : [];

  const myParticipant = members.find((m) => {
    const mId = String(m.userId?._id || m.userId || m._id || "");
    return mId === String(currentUserId || "");
  });
  const myRole = myParticipant?.role || resolved.myRole || "member";
  const canUnpin = myRole === "owner" || myRole === "admin";

  const handleJumpToPinned = (msgId) => {
    setPinsOpen(false);
    const targetEl =
      document.getElementById(`msg-${msgId}`) ||
      document.querySelector(`[data-message-id="${msgId}"]`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    window.dispatchEvent(
      new CustomEvent("highlight-message", { detail: { messageId: msgId } })
    );
  };

  return (
    <>
      <div className="flex items-center justify-between px-4 h-14 border-b border-border bg-background shrink-0">
        <div
          onClick={() => setDetailsOpen(true)}
          className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <Link
            to="/chats/channel"
            onClick={(e) => e.stopPropagation()}
            className="md:hidden p-1 mr-0.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
          >
            <ChevronLeft className="size-5" />
          </Link>

          <div className="size-8 rounded-lg bg-muted border border-border/60 flex items-center justify-center shrink-0">
            {isPrivate ? (
              <Lock className="size-4 text-muted-foreground" />
            ) : (
              <Hash className="size-4 text-muted-foreground" />
            )}
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <p className="text-sm font-semibold text-foreground tracking-tight truncate">
              {name}
            </p>

            {isArchived && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                Archived
              </span>
            )}

            {isAdminsOnly && !isArchived && (
              <span
                title="Only channel admins can post"
                className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary shrink-0"
              >
                <Megaphone className="size-2.5" />
                Announcements
              </span>
            )}

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono tabular-nums font-medium bg-muted/60 text-muted-foreground border border-border shrink-0">
              <Users className="size-2.5" />
              {memberCount}
            </span>

            {topic && (
              <div className="hidden lg:flex items-center gap-2 min-w-0">
                <span className="text-border">•</span>
                <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                  {topic}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Pinned Messages Popover */}
          <Popover open={pinsOpen} onOpenChange={setPinsOpen}>
            <PopoverTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  title="Pinned Messages"
                  className="h-8 px-2 gap-1 text-muted-foreground hover:text-foreground"
                >
                  <Pin className="size-3.5" />
                  {pinnedMessages.length > 0 && (
                    <span className="text-[11px] font-mono font-semibold text-primary">
                      {pinnedMessages.length}
                    </span>
                  )}
                </Button>
              }
            />
            <PopoverContent
              side="bottom"
              align="end"
              className="w-80 p-0 bg-popover border border-border rounded-xl shadow-popover overflow-hidden z-50"
            >
              <div className="px-3 py-2 border-b border-border bg-muted/30 flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Pin className="size-3.5 text-primary" />
                  Pinned Messages ({pinnedMessages.length})
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-border/50">
                {pinnedMessages.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    No pinned messages in this channel yet.
                  </div>
                ) : (
                  pinnedMessages.map((pm) => {
                    const pmId = typeof pm === "object" ? pm._id : pm;
                    const pmText =
                      typeof pm === "object"
                        ? pm.content?.text ||
                          (pm.content?.attachments?.length
                            ? `📎 ${pm.content.attachments.length} attachment(s)`
                            : "Pinned message")
                        : "Pinned message";

                    return (
                      <div
                        key={pmId}
                        className="p-2.5 hover:bg-accent/40 transition-colors flex items-start justify-between gap-2"
                      >
                        <button
                          type="button"
                          onClick={() => handleJumpToPinned(pmId)}
                          className="text-left flex-1 min-w-0 cursor-pointer"
                        >
                          <p className="text-xs text-foreground line-clamp-2">{pmText}</p>
                          {pm?.createdAt && (
                            <span className="text-[10px] text-muted-foreground mt-0.5 block">
                              {new Date(pm.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </button>
                        {canUnpin && (
                          <button
                            type="button"
                            title="Unpin message"
                            onClick={() =>
                              togglePin({ chatId, messageId: pmId, pinned: false })
                            }
                            className="text-muted-foreground hover:text-destructive p-1 shrink-0"
                          >
                            <X className="size-3" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            title="Channel Info"
            onClick={() => setDetailsOpen(true)}
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            <Info className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDetailsOpen(true)}
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </div>
      </div>

      <ChannelDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        chat={resolved}
      />
    </>
  );
}

export default ChannelHeader;
