import React from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Video, ArrowUpRight, CheckCheck } from "lucide-react";

/**
 * Checks if a message text represents an active audio or video call session
 * and extracts the join code and call type.
 */
export const parseCallMessage = (text) => {
  if (!text || typeof text !== "string") return null;

  const match = text.match(/\/meets\/room\/([a-z0-9-]+)/i);
  if (!match) return null;

  const joinCode = match[1];
  const isAudio =
    text.includes("callType=audio") ||
    text.toLowerCase().includes("voice") ||
    text.toLowerCase().includes("audio") ||
    text.includes("📞");

  return {
    joinCode,
    isAudio,
    callType: isAudio ? "audio" : "video",
  };
};

/**
 * Clean Geist/Linear-style Call Card rendered inline within chat messages.
 */
export const CallCard = ({ message, isOwn, timeLabel }) => {
  const navigate = useNavigate();
  const text = message.content?.text;
  const callInfo = parseCallMessage(text);

  if (!callInfo) return null;

  const { joinCode, isAudio, callType } = callInfo;
  const Icon = isAudio ? Phone : Video;
  const callTitle = isAudio ? "Voice Call" : "Video Call";

  const handleJoin = (e) => {
    e.stopPropagation();
    navigate(`/meets/room/${joinCode}?callType=${callType}`);
  };

  return (
    <div
      onClick={handleJoin}
      className="group/call flex flex-col gap-3 p-3.5 rounded-xl w-[280px] sm:w-[310px] max-w-full bg-card text-card-foreground border border-border hover:border-ring/40 transition-colors cursor-pointer select-none shadow-(--shadow-card)"
    >
      {/* Top row: Icon + Title + Live status indicator */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-8 rounded-lg bg-muted/70 border border-border/80 flex items-center justify-center text-foreground shrink-0">
            <Icon className="size-4 text-muted-foreground group-hover/call:text-foreground transition-colors" />
          </div>

          <div className="min-w-0">
            <h4 className="font-semibold text-[13px] tracking-tight text-foreground truncate leading-tight">
              {callTitle}
            </h4>
            <p className="text-[11px] font-mono text-muted-foreground truncate mt-0.5">
              {joinCode}
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/60 border border-border text-[10px] font-mono font-medium text-muted-foreground shrink-0">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>

      {/* Footer: Join Button & Timestamp */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
        <button
          type="button"
          onClick={handleJoin}
          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium transition-colors cursor-pointer shadow-2xs"
        >
          <span>Join room</span>
          <ArrowUpRight className="size-3.5" />
        </button>

        <div className="flex items-center gap-1 text-[10px] font-mono tabular-nums text-muted-foreground">
          <span>{timeLabel}</span>
          {isOwn && <CheckCheck className="size-3.5 text-muted-foreground shrink-0" />}
        </div>
      </div>
    </div>
  );
};

export default CallCard;
