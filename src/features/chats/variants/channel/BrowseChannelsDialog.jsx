import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Compass, Hash, Search, Users, Loader2, Check } from "lucide-react";
import { useDiscoverChannels, useJoinChannel } from "../../hooks/useChannelActions";

export default function BrowseChannelsDialog({ open, onOpenChange, onOpenCreate }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [joiningId, setJoiningId] = useState(null);

  const { data: channels = [], isLoading } = useDiscoverChannels(search, open);
  const { mutateAsync: joinChannel } = useJoinChannel();

  const handleJoin = async (channel) => {
    const cId = channel.chatId || channel._id;
    try {
      setJoiningId(cId);
      await joinChannel(cId);
      onOpenChange(false);
      navigate(`/chats/channel/${cId}`);
    } catch (err) {
      console.error("Failed to join channel:", err);
    } finally {
      setJoiningId(null);
    }
  };

  const handleOpen = (channel) => {
    const cId = channel.chatId || channel._id;
    onOpenChange(false);
    navigate(`/chats/channel/${cId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-3 border-b border-border">
          <div className="flex items-center justify-between gap-2 pr-6">
            <div>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Compass className="size-4 text-primary" />
                Browse Public Channels
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Discover and join public channels across your workspace.
              </DialogDescription>
            </div>
            {onOpenCreate && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs shrink-0"
                onClick={() => {
                  onOpenChange(false);
                  onOpenCreate();
                }}
              >
                New Channel
              </Button>
            )}
          </div>

          <div className="relative mt-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search channels by name, topic, or description..."
              className="pl-8 h-8 text-xs bg-muted/40"
            />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[420px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : channels.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <p className="text-xs text-muted-foreground">No public channels found.</p>
              {onOpenCreate && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenCreate();
                  }}
                >
                  Create the first channel
                </Button>
              )}
            </div>
          ) : (
            channels.map((ch) => {
              const cId = ch.chatId || ch._id;
              const isJoining = joiningId === cId;

              return (
                <div
                  key={cId}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/70 bg-card hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div className="size-8 rounded-lg bg-muted border border-border/60 flex items-center justify-center shrink-0 mt-0.5">
                      <Hash className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {ch.name}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full shrink-0">
                          <Users className="size-2.5" />
                          {ch.memberCount ?? 0}
                        </span>
                      </div>
                      {(ch.topic || ch.description) && (
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {ch.topic || ch.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {ch.isJoined ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => handleOpen(ch)}
                      >
                        <Check className="size-3 text-primary" />
                        Joined
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        disabled={isJoining}
                        onClick={() => handleJoin(ch)}
                      >
                        {isJoining && <Loader2 className="size-3 animate-spin mr-1" />}
                        Join
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

