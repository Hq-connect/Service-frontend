import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Phone,
  Video,
  Search,
  ArrowRight,
  Radio,
  Sparkles,
  Users,
  Loader2,
  Check,
} from "lucide-react";
import { useUsers } from "@/global/hooks/useUsers";
import meetingService from "../services/meeting.service";
import dmService from "@/features/chats/services/dm.service";
import useAuth from "@/features/auth/hooks/useAuth";
import {
  getUserInitials,
  getAvatarStyle,
  getUserDisplayName,
  extractUser,
} from "@/global/utils/user";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Ultra-premium Quick Call & Meeting Launcher Modal.
 * Opens when the user clicks "Calls" or "Video" in the primary sidebar.
 */
export const QuickCallModal = ({ open, onOpenChange, initialMode = "all" }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(
    initialMode === "video" ? "instant" : "direct"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [startingUserId, setStartingUserId] = useState(null);
  const [isStartingInstant, setIsStartingInstant] = useState(false);

  const currentUser = extractUser(user);
  const currentUserId = currentUser?._id || currentUser?.id;
  const currentUserName =
    currentUser?.fullName ||
    currentUser?.name ||
    `${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`.trim() ||
    "You";

  const { data: tenantUsers = [], isLoading: isLoadingUsers } = useUsers({
    limit: 100,
    status: "active",
    enabled: open,
  });

  const onlineUsers = useSelector((state) => state.chat.onlineUsers || {});

  // Filter out self and filter by search
  const filteredUsers = useMemo(() => {
    return tenantUsers
      .filter((u) => {
        const uid = u._id || u.id;
        return uid && String(uid) !== String(currentUserId);
      })
      .filter((u) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const name = getUserDisplayName(u).toLowerCase();
        const email = (u.email || "").toLowerCase();
        return name.includes(q) || email.includes(q);
      });
  }, [tenantUsers, currentUserId, searchQuery]);

  // Handle direct 1-on-1 Audio/Video Call with a teammate
  const handleDirectCall = async (targetUser, callType = "audio") => {
    const targetUserId = targetUser._id || targetUser.id;
    const targetName = getUserDisplayName(targetUser);
    const isVideo = callType === "video";

    setStartingUserId(`${targetUserId}-${callType}`);
    const toastId = toast.loading(
      isVideo
        ? `Initiating video call with ${targetName}...`
        : `Calling ${targetName}...`
    );

    try {
      const response = await meetingService.createMeeting({
        title: `${isVideo ? "Video" : "Audio"} Call with ${targetName}`,
        type: "instant",
        duration: 60,
        participantIds: [String(targetUserId)],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      });

      const created = response?.data?.meeting || response?.meeting;
      const joinCode = created?.joinCode;

      if (!joinCode) {
        throw new Error("Could not retrieve join code for meeting.");
      }

      // Try sending a call invite message to their DM
      try {
        const callEmoji = isVideo ? "📹" : "📞";
        const callTypeLabel = isVideo ? "video" : "voice";
        await dmService.sendMessage(
          null,
          targetUserId,
          `${callEmoji} Started a ${callTypeLabel} call • Join room: /meets/room/${joinCode}?callType=${callType}`
        );
      } catch (chatErr) {
        console.warn("[QuickCallModal] Note on chat message dispatch:", chatErr);
      }

      toast.dismiss(toastId);
      toast.success(isVideo ? "Video call started!" : "Voice call started!");
      onOpenChange(false);
      navigate(`/meets/room/${joinCode}?callType=${callType}`);
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to start call."
      );
    } finally {
      setStartingUserId(null);
    }
  };

  // Handle Instant Voice / Video Meeting without pre-selected contact
  const handleInstantMeeting = async (callType = "video") => {
    const isVideo = callType === "video";
    setIsStartingInstant(true);
    const toastId = toast.loading(
      isVideo ? "Creating video meeting..." : "Creating voice bridge..."
    );

    try {
      const response = await meetingService.createMeeting({
        title: isVideo ? "Instant Video Meeting" : "Instant Voice Call",
        type: "instant",
        duration: 45,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      });

      const created = response?.data?.meeting || response?.meeting;
      const joinCode = created?.joinCode;

      if (!joinCode) {
        throw new Error("Could not create meeting room.");
      }

      toast.dismiss(toastId);
      toast.success(isVideo ? "Video room ready!" : "Voice room ready!");
      onOpenChange(false);
      navigate(`/meets/room/${joinCode}?callType=${callType}`);
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to start instant meeting."
      );
    } finally {
      setIsStartingInstant(false);
    }
  };

  // Handle Join by Code
  const handleJoinByCode = async (e) => {
    e.preventDefault();
    const code = joinCodeInput.trim();
    if (!code) return;

    try {
      const response = await meetingService.joinMeeting(code, currentUserName);
      const meeting = response?.data?.meeting;
      if (meeting?.joinCode) {
        onOpenChange(false);
        navigate(`/meets/room/${meeting.joinCode}`);
      } else {
        onOpenChange(false);
        navigate(`/meets/room/${code}`);
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          "Meeting not found or invalid join code."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-card/95 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl select-none">
        {/* Header */}
        <div className="p-5 pb-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center justify-center size-8 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
              <Phone className="size-4" />
            </span>
            <DialogTitle className="text-lg font-bold tracking-tight text-foreground font-heading">
              Start or Join a Call
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Call a teammate directly, start an instant room, or join an active
            session.
          </DialogDescription>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 mt-4 p-1 rounded-xl bg-muted/60 border border-border/50 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("direct")}
              className={cn(
                "flex-1 py-1.5 px-3 rounded-lg transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer",
                activeTab === "direct"
                  ? "bg-background text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Users className="size-3.5" />
              <span>Team Members</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("instant")}
              className={cn(
                "flex-1 py-1.5 px-3 rounded-lg transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer",
                activeTab === "instant"
                  ? "bg-background text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sparkles className="size-3.5" />
              <span>Instant Call & Code</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Team Members */}
        {activeTab === "direct" && (
          <div className="flex flex-col h-[380px]">
            {/* Search Input */}
            <div className="p-3 border-b border-border/50">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search teammate by name or email..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-muted/40 border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Teammates List */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/30 p-2">
              {isLoadingUsers ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                  <Loader2 className="size-5 animate-spin text-primary" />
                  <span className="text-xs">Loading team members...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-4">
                  <Users className="size-8 opacity-40 mb-1" />
                  <p className="text-xs font-semibold text-foreground">
                    No colleagues found
                  </p>
                  <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                    {searchQuery
                      ? "Try a different search term"
                      : "Invite team members to begin calling"}
                  </p>
                </div>
              ) : (
                filteredUsers.map((member) => {
                  const mId = String(member._id || member.id);
                  const isOnline = onlineUsers[mId] === true;
                  const name = getUserDisplayName(member);
                  const initials = getUserInitials(member);
                  const avatarStyle = getAvatarStyle(member);
                  const isAudioCalling = startingUserId === `${mId}-audio`;
                  const isVideoCalling = startingUserId === `${mId}-video`;

                  return (
                    <div
                      key={mId}
                      className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-muted/40 transition-colors group"
                    >
                      {/* Avatar + Info */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          <Avatar className="size-9 border border-border/50">
                            {member.avatar && (
                              <AvatarImage src={member.avatar} alt={name} />
                            )}
                            <AvatarFallback
                              style={avatarStyle}
                              className="text-xs font-semibold"
                            >
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={cn(
                              "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-background",
                              isOnline ? "bg-emerald-500" : "bg-zinc-400"
                            )}
                            title={isOnline ? "Online" : "Offline"}
                          />
                        </div>

                        <div className="min-w-0 leading-tight">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {name}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {member.email || (isOnline ? "Active now" : "Offline")}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons: Voice Call & Video Call */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={Boolean(startingUserId)}
                          onClick={() => handleDirectCall(member, "audio")}
                          title={`Voice call ${name}`}
                          className="h-8 px-2.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/15 active:scale-95 transition-all text-xs font-medium gap-1 cursor-pointer"
                        >
                          {isAudioCalling ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Phone className="size-3.5" />
                          )}
                          <span className="hidden sm:inline text-[11px]">Audio</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={Boolean(startingUserId)}
                          onClick={() => handleDirectCall(member, "video")}
                          title={`Video call ${name}`}
                          className="h-8 px-2.5 rounded-lg text-indigo-600 hover:text-indigo-700 hover:bg-indigo-500/15 active:scale-95 transition-all text-xs font-medium gap-1 cursor-pointer"
                        >
                          {isVideoCalling ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Video className="size-3.5" />
                          )}
                          <span className="hidden sm:inline text-[11px]">Video</span>
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Instant Call & Join by Code */}
        {activeTab === "instant" && (
          <div className="p-5 flex flex-col gap-4">
            {/* Quick 1-Click Cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Instant Audio Room */}
              <button
                type="button"
                disabled={isStartingInstant}
                onClick={() => handleInstantMeeting("audio")}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all text-center cursor-pointer group active:scale-95 shadow-xs"
              >
                <div className="size-11 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-500 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Phone className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    Instant Voice Call
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Microphone only, no camera
                  </p>
                </div>
              </button>

              {/* Instant Video Room */}
              <button
                type="button"
                disabled={isStartingInstant}
                onClick={() => handleInstantMeeting("video")}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500/50 transition-all text-center cursor-pointer group active:scale-95 shadow-xs"
              >
                <div className="size-11 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-500 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Video className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    Instant Video Call
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    HD Video & screen sharing
                  </p>
                </div>
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                <span className="bg-card px-2 text-muted-foreground">
                  Or Join Existing Call
                </span>
              </div>
            </div>

            {/* Join with Code */}
            <form onSubmit={handleJoinByCode} className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-foreground">
                Enter Meeting / Call Code
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  placeholder="e.g. abc-defg-hij"
                  className="flex-1 px-3 py-2 rounded-xl bg-muted/40 border border-input text-xs text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!joinCodeInput.trim()}
                  className="rounded-xl px-4 text-xs font-semibold h-9 gap-1 shadow-xs"
                >
                  <span>Join</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QuickCallModal;
