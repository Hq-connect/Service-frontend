import React, { useState } from "react";
import { BarChart3, CheckCircle2, Lock, CheckCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import chatService from "../services/chat.service";
import { toast } from "sonner";

/**
 * Clean Geist/Linear-style Poll Card rendered inside chat messages.
 */
export const PollCard = ({ message, currentUserId, isOwn, timeLabel }) => {
  const [localPoll, setLocalPoll] = useState(message?.content?.poll || null);
  const [pendingIndex, setPendingIndex] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

  React.useEffect(() => {
    if (message?.content?.poll) {
      setLocalPoll(message.content.poll);
    }
  }, [message?.content?.poll]);

  const poll = localPoll || message?.content?.poll;
  if (!poll || !Array.isArray(poll.options)) return null;

  const myIdStr = String(currentUserId || "");
  const totalVotes = poll.options.reduce(
    (sum, opt) => sum + (Array.isArray(opt.votes) ? opt.votes.length : 0),
    0
  );

  const handleVote = async (optionIndex) => {
    if (poll.isClosed || pendingIndex !== null) return;
    try {
      setPendingIndex(optionIndex);
      const updatedMsg = await chatService.votePoll({
        messageId: message._id || message.messageId,
        optionIndex,
      });
      if (updatedMsg?.content?.poll) {
        setLocalPoll(updatedMsg.content.poll);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit vote");
    } finally {
      setPendingIndex(null);
    }
  };

  const handleClosePoll = async (e) => {
    e.stopPropagation();
    if (poll.isClosed || isClosing) return;
    try {
      setIsClosing(true);
      const updatedMsg = await chatService.closePoll({
        messageId: message._id || message.messageId,
      });
      if (updatedMsg?.content?.poll) {
        setLocalPoll(updatedMsg.content.poll);
      }
      toast.success("Poll closed");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to close poll");
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3.5 rounded-xl w-[285px] sm:w-[330px] max-w-full bg-card text-card-foreground border border-border select-none shadow-(--shadow-card)">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="size-8 rounded-lg bg-muted/70 border border-border/80 flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
            <BarChart3 className="size-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
              {poll.allowMultiple ? "Multi-Choice Poll" : "Poll"}
            </span>
            <h4 className="font-semibold text-[13px] tracking-tight text-foreground leading-snug break-words">
              {poll.question}
            </h4>
          </div>
        </div>

        {poll.isClosed && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/60 border border-border text-[10px] font-mono font-medium text-muted-foreground shrink-0">
            <Lock className="size-2.5" />
            Closed
          </span>
        )}
      </div>

      {/* Options */}
      <div className="flex flex-col gap-1.5">
        {poll.options.map((opt, idx) => {
          const votes = Array.isArray(opt.votes) ? opt.votes : [];
          const count = votes.length;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const hasVoted =
            Boolean(myIdStr) && votes.some((v) => String(v) === myIdStr);
          const isThisPending = pendingIndex === idx;

          return (
            <button
              key={idx}
              type="button"
              disabled={poll.isClosed || pendingIndex !== null}
              onClick={() => handleVote(idx)}
              className={cn(
                "relative overflow-hidden rounded-lg border px-2.5 py-2 text-left text-xs transition-colors cursor-pointer disabled:cursor-default",
                hasVoted
                  ? "border-foreground/30 bg-muted/40 text-foreground font-medium"
                  : "border-border/70 bg-background/40 hover:bg-muted/30 text-foreground/90"
              )}
            >
              {/* Subtle Progress Fill */}
              <div
                style={{ width: `${pct}%` }}
                className={cn(
                  "absolute inset-y-0 left-0 transition-all duration-300 pointer-events-none",
                  hasVoted ? "bg-foreground/[0.08]" : "bg-muted-foreground/[0.06]"
                )}
              />

              <div className="relative flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {isThisPending ? (
                    <Loader2 className="size-3.5 animate-spin text-muted-foreground shrink-0" />
                  ) : hasVoted ? (
                    <CheckCircle2 className="size-3.5 text-foreground shrink-0" />
                  ) : (
                    <span className="size-3.5 rounded-full border border-muted-foreground/40 shrink-0" />
                  )}
                  <span className="truncate">{opt.text}</span>
                </div>
                <span className="text-[10px] font-mono tabular-nums text-muted-foreground shrink-0">
                  {pct}% ({count})
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60 text-[10px]">
        <div className="flex items-center gap-2">
          <span className="font-mono text-muted-foreground">
            {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
          </span>
          {isOwn && !poll.isClosed && (
            <button
              type="button"
              disabled={isClosing}
              onClick={handleClosePoll}
              className="px-2 py-0.5 rounded-md border border-border bg-muted/50 hover:bg-muted text-foreground font-medium transition-colors cursor-pointer"
            >
              {isClosing ? "Closing…" : "Close poll"}
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 font-mono tabular-nums text-muted-foreground">
          <span>{timeLabel}</span>
          {isOwn && <CheckCheck className="size-3.5 text-muted-foreground shrink-0" />}
        </div>
      </div>
    </div>
  );
};

export default PollCard;
