import React from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckSquare,
  ArrowUpRight,
  User,
  Flag,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTask, useUpdateTask } from "@/features/productivity/queries/task.queries";
import { toast } from "sonner";

const STATUS_CYCLE = {
  todo: "in_progress",
  to_do: "in_progress",
  in_progress: "done",
  review: "done",
  in_review: "done",
  done: "todo",
  completed: "todo",
};

const STATUS_META = {
  todo: {
    label: "To Do",
    dot: "bg-muted-foreground/60",
  },
  to_do: {
    label: "To Do",
    dot: "bg-muted-foreground/60",
  },
  in_progress: {
    label: "In Progress",
    dot: "bg-amber-500",
  },
  review: {
    label: "In Review",
    dot: "bg-sky-500",
  },
  in_review: {
    label: "In Review",
    dot: "bg-sky-500",
  },
  done: {
    label: "Done",
    dot: "bg-emerald-500",
  },
  completed: {
    label: "Done",
    dot: "bg-emerald-500",
  },
};

/**
 * Clean Geist/Linear-style Live Task Card rendered inline inside chat messages.
 */
export const ChatTaskCard = ({ message, isOwn, timeLabel }) => {
  const navigate = useNavigate();
  const taskRef = message?.content?.taskRef;

  const projectId = taskRef?.projectId ? String(taskRef.projectId) : null;
  const taskId = taskRef?.taskId ? String(taskRef.taskId) : null;

  const { data: liveTaskResponse } = useTask(projectId, taskId);
  const updateTaskMutation = useUpdateTask();

  if (!taskRef) return null;

  const liveTask = liveTaskResponse?.data?.task || null;
  const title = liveTask?.title || taskRef.title || "Untitled Task";
  const status = (liveTask?.status || taskRef.status || "todo").toLowerCase();
  const priority = (liveTask?.priority || taskRef.priority || "medium").toLowerCase();
  const assigneeName =
    liveTask?.assigneeSnapshot?.name || taskRef.assigneeName || null;
  const projectLabel =
    taskRef.projectKey
      ? `#${taskRef.projectKey}`
      : taskRef.projectName || "Project";

  const statusMeta = STATUS_META[status] || STATUS_META.todo;
  const isDone = status === "done" || status === "completed";

  const handleToggleStatus = (e) => {
    e.stopPropagation();
    if (!projectId || !taskId || updateTaskMutation.isPending) return;
    const nextStatus = STATUS_CYCLE[status] || "in_progress";
    updateTaskMutation.mutate(
      {
        projectId,
        taskId,
        data: { status: nextStatus },
      },
      {
        onSuccess: () => {
          toast.success(
            `Task marked as ${STATUS_META[nextStatus]?.label || nextStatus}`
          );
        },
        onError: (err) => {
          toast.error(
            err?.response?.data?.message || "Could not update task status"
          );
        },
      }
    );
  };

  const handleOpenBoard = (e) => {
    e.stopPropagation();
    if (projectId) {
      navigate(`/tasks/projects/${projectId}`);
    } else {
      navigate("/tasks");
    }
  };

  return (
    <div
      onClick={handleOpenBoard}
      className="group/task flex flex-col gap-2.5 p-3.5 rounded-xl w-[285px] sm:w-[325px] max-w-full bg-card text-card-foreground border border-border hover:border-ring/40 transition-colors cursor-pointer select-none shadow-(--shadow-card)"
    >
      {/* Top Row: Project Identifier + Status Pill */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-8 rounded-lg bg-muted/70 border border-border/80 flex items-center justify-center text-muted-foreground group-hover/task:text-foreground transition-colors shrink-0">
            <CheckSquare className="size-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-mono font-medium text-foreground block truncate leading-tight">
              {projectLabel}
              {taskRef.projectName && taskRef.projectKey
                ? ` · ${taskRef.projectName}`
                : ""}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              Task
            </span>
          </div>
        </div>

        {/* Clickable Live Status Pill */}
        <button
          type="button"
          onClick={handleToggleStatus}
          title="Click to cycle status (To Do → In Progress → Done)"
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/60 hover:bg-muted border border-border text-[10px] font-mono font-medium text-foreground transition-colors cursor-pointer shrink-0"
        >
          {updateTaskMutation.isPending ? (
            <Loader2 className="size-2.5 animate-spin text-muted-foreground" />
          ) : (
            <span className={cn("size-1.5 rounded-full shrink-0", statusMeta.dot)} />
          )}
          <span>{statusMeta.label}</span>
        </button>
      </div>

      {/* Task Title */}
      <div className="px-0.5">
        <h4
          className={cn(
            "font-semibold text-[13px] tracking-tight text-foreground leading-snug break-words",
            isDone && "line-through text-muted-foreground"
          )}
        >
          {title}
        </h4>
      </div>

      {/* Meta Chips: Assignee & Priority */}
      <div className="flex items-center flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border bg-muted/40 border-border/80 text-muted-foreground">
          <User className="size-2.5 shrink-0" />
          <span className="truncate max-w-[130px] text-foreground/90">
            {assigneeName || "Unassigned"}
          </span>
        </span>

        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono capitalize border bg-muted/40 border-border/80 text-muted-foreground">
          <Flag className="size-2.5 shrink-0" />
          <span>{priority}</span>
        </span>
      </div>

      {/* Footer: Open Board + Time */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
        <button
          type="button"
          onClick={handleOpenBoard}
          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium transition-colors cursor-pointer shadow-2xs"
        >
          <span>Open board</span>
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

export default ChatTaskCard;
