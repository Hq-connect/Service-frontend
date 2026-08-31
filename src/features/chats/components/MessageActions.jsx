import React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SmilePlus, Reply, Pencil, Trash2, MoreHorizontal } from "lucide-react";

/**
 * Hover action toolbar shown over a message.
 * TooltipProvider must be provided by a parent (shadcn auto-wraps via App).
 *
 * @param {boolean}  isOwn    - Whether this message belongs to the current user
 * @param {Function} onReply
 * @param {Function} onReact
 * @param {Function} onEdit   - Only shown for own messages
 * @param {Function} onDelete - Only shown for own messages
 * @param {boolean}  showEmojiPicker
 * @param {Function} setShowEmojiPicker
 */
function MessageActions({
  isOwn = false,
  onReply,
  onReact,
  onEdit,
  onDelete,
  showEmojiPicker = false,
  setShowEmojiPicker,
}) {
  const actions = [
    { icon: Reply,          label: "Reply",         onClick: onReply,  show: true },
    { icon: Pencil,         label: "Edit",          onClick: onEdit,   show: isOwn },
    { icon: Trash2,         label: "Delete",        onClick: onDelete, show: isOwn, destructive: true },
    { icon: MoreHorizontal, label: "More",          onClick: () => {}, show: true },
  ].filter((a) => a.show);

  return (
    <div className="flex items-center gap-0.5 bg-background border border-border rounded-lg shadow-sm px-1 py-0.5">
      {/* Reaction Button with Popover */}
      <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
        <Tooltip>
          <PopoverTrigger render={
            <TooltipTrigger render={
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground"
              >
                <SmilePlus className="size-3.5" />
              </Button>
            } />
          } />
          <TooltipContent side="top" className="text-xs">
            Add reaction
          </TooltipContent>
        </Tooltip>
        <PopoverContent
          side="top"
          align="center"
          className="w-fit flex flex-row items-center gap-1.5 p-1 bg-background border border-border rounded-full shadow-md z-50 pointer-events-auto"
        >
          {["👍", "❤️", "😂", "😮", "🎉", "🔥"].map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onReact?.(emoji);
              }}
              className="hover:scale-125 transition-transform duration-100 p-0.5 text-base cursor-pointer focus:outline-none"
            >
              {emoji}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      {/* Other actions */}
      {actions.map(({ icon: Icon, label, onClick, destructive }) => (
        <Tooltip key={label}>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                onClick={onClick}
                className={`size-7 text-muted-foreground ${
                  destructive
                    ? "hover:text-destructive hover:bg-destructive/10"
                    : "hover:text-foreground"
                }`}
              >
                <Icon className="size-3.5" />
              </Button>
            }
          />
          <TooltipContent side="top" className="text-xs">
            {label}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

export default MessageActions;
