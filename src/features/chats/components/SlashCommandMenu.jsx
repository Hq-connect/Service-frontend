import React, { useEffect, useRef } from "react";
import {
  CheckSquare,
  BarChart3,
  Video,
  Sparkles,
  Smile,
  FolderKanban,
  User,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CMD_ICONS = {
  task: CheckSquare,
  poll: BarChart3,
  meet: Video,
  ai: Sparkles,
  shrug: Smile,
};

/**
 * Floating Menu above MessageInput for:
 * 1. `mode === "commands"`: `/` command selector
 * 2. `mode === "projects"`: `#PROJECT` selector when inside `/task`
 * 3. `mode === "task-preview"`: Live parsed preview of the `/task` command
 */
export const SlashCommandMenu = ({
  mode,
  options = [],
  selectedIndex = 0,
  onSelect,
  onHoverIndex,
  parsedTaskPreview = null,
}) => {
  const listRef = useRef(null);

  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector(
      `[data-index="${selectedIndex}"]`
    );
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, mode]);

  if (!mode) return null;

  if (mode === "task-preview" && parsedTaskPreview) {
    const { project, assignee, priority, title } = parsedTaskPreview;
    return (
      <div className="mb-2 w-full bg-popover/95 backdrop-blur-md border border-border rounded-xl px-3 py-2 shadow-(--shadow-popover) z-30 animate-in fade-in slide-in-from-bottom-1 duration-100">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted border border-border text-foreground text-[10px] font-mono font-medium">
              <CheckSquare className="size-3 text-muted-foreground" />
              /task
            </span>
            <span className="text-xs font-medium text-foreground truncate">
              {title ? title : "Type task title… (use # for project, @ for assignee, !high)"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono border",
                project
                  ? "bg-muted/60 text-foreground border-border"
                  : "bg-destructive/10 text-destructive border-destructive/25"
              )}
              title="Type # to pick a project"
            >
              <FolderKanban className="size-2.5 text-muted-foreground" />
              {project ? `#${project.key || project.name}` : "No Project"}
            </span>

            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border bg-muted/60 text-foreground border-border"
              title="Type @ to assign a member"
            >
              <User className="size-2.5 text-muted-foreground" />
              {assignee ? `@${assignee.displayName}` : "Unassigned"}
            </span>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono capitalize border bg-muted/60 text-muted-foreground border-border">
              <Flag className="size-2.5" />
              {priority}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (options.length === 0) return null;

  return (
    <div className="mb-2 w-full sm:w-96 bg-popover border border-border rounded-xl shadow-(--shadow-popover) p-1.5 z-30 animate-in fade-in slide-in-from-bottom-1 duration-100">
      <div className="px-2.5 py-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span>
          {mode === "commands" ? "Slash Commands" : "Select Project (#)"}
        </span>
        <span className="font-mono text-[10px]">↑↓ · Enter/Tab · ESC</span>
      </div>

      <div
        ref={listRef}
        className="max-h-60 overflow-y-auto space-y-0.5 mt-0.5 custom-scrollbar"
      >
        {mode === "commands" &&
          options.map((cmd, idx) => {
            const Icon = CMD_ICONS[cmd.id] || CheckSquare;
            const isHighlighted = idx === selectedIndex;

            return (
              <button
                key={cmd.id}
                data-index={idx}
                type="button"
                onMouseEnter={() => onHoverIndex?.(idx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect?.(cmd);
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer group",
                  isHighlighted
                    ? "bg-muted text-foreground"
                    : "text-foreground/85 hover:bg-muted hover:text-foreground"
                )}
              >
                <div className="size-7 rounded-md bg-muted/70 border border-border/80 flex items-center justify-center shrink-0 text-muted-foreground group-hover:text-foreground">
                  <Icon className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground font-mono">
                      {cmd.command}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground truncate">
                      {cmd.usage}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {cmd.description}
                  </p>
                </div>
              </button>
            );
          })}

        {mode === "projects" &&
          options.map((proj, idx) => {
            const isHighlighted = idx === selectedIndex;
            return (
              <button
                key={proj._id}
                data-index={idx}
                type="button"
                onMouseEnter={() => onHoverIndex?.(idx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect?.(proj);
                }}
                className={cn(
                  "w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer group",
                  isHighlighted
                    ? "bg-muted text-foreground"
                    : "text-foreground/85 hover:bg-muted hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-6 rounded-md bg-muted/70 border border-border/80 text-foreground flex items-center justify-center shrink-0 font-mono text-[10px] font-semibold">
                    #{proj.key || proj.name?.slice(0, 3)?.toUpperCase()}
                  </div>
                  <span className="font-medium text-foreground truncate">
                    {proj.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                  #{proj.key}
                </span>
              </button>
            );
          })}
      </div>
    </div>
  );
};

export default SlashCommandMenu;
