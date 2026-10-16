import React from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Video, ArrowRight, Radio, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Checks if a message text represents an active audio or video call session
 * and extracts the join code and call type.
 */
export const parseCallMessage = (text) => {
  if (!text || typeof text !== "string") return null;

  // Match /meets/room/{joinCode} pattern
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
 * Premium Slack/Teams-style Call Invitation Card rendered inline within chat messages.
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
      className={cn(
        "group/call relative flex flex-col gap-3 p-3.5 rounded-2xl w-[290px] sm:w-[320px] max-w-full border select-none transition-all duration-200 cursor-pointer shadow-md",
        isOwn
          ? "bg-gradient-to-br from-primary/95 to-primary border-primary-foreground/20 text-primary-foreground hover:shadow-primary/25"
          : isAudio
          ? "bg-gradient-to-br from-card/95 via-card/90 to-emerald-950/20 border-emerald-500/30 text-foreground hover:border-emerald-500/50 hover:shadow-emerald-500/10"
          : "bg-gradient-to-br from-card/95 via-card/90 to-indigo-950/20 border-indigo-500/30 text-foreground hover:border-indigo-500/50 hover:shadow-indigo-500/10"
      )}
    >
      {/* Top row: Icon + Title + Live badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "relative size-10 rounded-xl flex items-center justify-center shrink-0 shadow-md transition-transform duration-200 group-hover/call:scale-105",
              isOwn
                ? "bg-black/25 text-white"
                : isAudio
                ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/25"
                : "bg-indigo-500/15 text-indigo-500 border border-indigo-500/25"
            )}
          >
            <Icon className="size-5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span
                className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                  isAudio ? "bg-emerald-400" : "bg-indigo-400"
                )}
              />
              <span
                className={cn(
                  "relative inline-flex rounded-full h-3 w-3 ring-2 ring-background",
                  isAudio ? "bg-emerald-500" : "bg-indigo-500"
                )}
              />
            </span>
          </div>

          <div className="leading-tight">
            <h4
              className={cn(
                "font-semibold text-sm tracking-tight",
                isOwn ? "text-primary-foreground" : "text-foreground"
              )}
            >
              {callTitle}
            </h4>
            <p
              className={cn(
                "text-[11px] font-mono tracking-wide",
                isOwn ? "text-primary-foreground/75" : "text-muted-foreground"
              )}
            >
              {joinCode}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase border",
            isOwn
              ? "bg-black/20 border-white/20 text-white"
              : isAudio
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
              : "bg-indigo-500/10 border-indigo-500/30 text-indigo-500"
          )}
        >
          <Radio className="size-2.5 animate-pulse" />
          <span>Active</span>
        </div>
      </div>

      {/* Action Button & Meta */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
        <button
          type="button"
          onClick={handleJoin}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 shadow-xs cursor-pointer",
            isOwn
              ? "bg-white text-zinc-950 hover:bg-white/90 active:scale-95"
              : isAudio
              ? "bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95 shadow-emerald-600/20"
              : "bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 shadow-indigo-600/20"
          )}
        >
          <span>Join Call</span>
          <ArrowRight className="size-3.5 transition-transform group-hover/call:translate-x-0.5" />
        </button>

        <div
          className={cn(
            "flex items-center gap-1 text-[10px] tabular-nums select-none",
            isOwn ? "text-primary-foreground/75" : "text-muted-foreground"
          )}
        >
          <span>{timeLabel}</span>
          {isOwn && (
            <CheckCheck className="size-3.5 text-primary-foreground/90 shrink-0" />
          )}
        </div>
      </div>
    </div>
  );
};

export default CallCard;
