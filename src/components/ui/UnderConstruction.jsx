import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Video,
  Calendar,
  Plus,
  Sparkles,
  Folder,
  CheckCircle2,
  CheckSquare,
  Layers,
  ShieldCheck,
  Send,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import useAuth from "@/features/auth/hooks/useAuth";
import useTenant from "@/global/hooks/useTenant";
import { getUserDisplayName, getInitials, getAvatarStyle } from "@/global/utils/user";
import { useMyAssignedTasks } from "@/features/productivity/queries/task.queries";
import meetingService from "@/features/meets/services/meeting.service";
import { useDocumentTree } from "@/features/editor/hooks/useDocumentTree";

const AI_QUICK_PROMPTS = [
  "Summarize my latest document",
  "Create a task",
  "Schedule an appointment",
  "What are my priorities this week?",
  "Research my competitors",
];

function formatRelativeTime(dateInput) {
  if (!dateInput) return "Recently";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "Recently";
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 14) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks} week${diffWeeks === 1 ? "" : "s"} ago`;
}

function formatTimeRange(scheduledAt, durationMinutes = 30) {
  if (!scheduledAt) return "Instant room";
  const start = new Date(scheduledAt);
  if (isNaN(start.getTime())) return "Instant room";
  const end = new Date(start.getTime() + (durationMinutes || 30) * 60000);
  const fmt = (d) =>
    d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  return `${fmt(start)} – ${fmt(end)}`;
}

function WorkspaceHomeOverview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tenant } = useTenant();
  const displayName = getUserDisplayName(user);
  const firstName = displayName?.split(" ")[0] || "there";
  const workspaceName = tenant?.name || "HQ Workspace";

  const [aiPrompt, setAiPrompt] = useState("");
  const [homeMeetings, setHomeMeetings] = useState([]);
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(true);

  // 1. Assigned tasks across projects from dedicated backend route (/api/projects/my-tasks)
  const { data: myTasksResponse, isLoading: isLoadingTasks } = useMyAssignedTasks();
  const assignedTasks = myTasksResponse?.data?.tasks || [];

  // 2. Documents for Recent Activity
  const { folders = [], rootDocuments = [], isLoading: isLoadingDocs } = useDocumentTree();

  // 3. Today & Tomorrow boundaries
  const { todayStart, todayEnd, tomorrowStart, tomorrowEnd, todayHeader, tomorrowHeader } =
    useMemo(() => {
      const now = new Date();
      const tStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const tEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const tmStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        0,
        0
      );
      const tmEnd = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        23,
        59,
        59,
        999
      );

      const fmtHeader = (d) =>
        d
          .toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })
          .toUpperCase();

      return {
        todayStart: tStart,
        todayEnd: tEnd,
        tomorrowStart: tmStart,
        tomorrowEnd: tmEnd,
        todayHeader: `TODAY · ${fmtHeader(tStart)}`,
        tomorrowHeader: `TOMORROW · ${fmtHeader(tmStart)}`,
      };
    }, []);

  // Fetch today & tomorrow meetings from dedicated backend route (/api/meetings/upcoming-home)
  useEffect(() => {
    let isMounted = true;
    const loadHomeMeetings = async () => {
      try {
        setIsLoadingMeetings(true);
        const res = await meetingService.getUpcomingHomeMeetings({
          startDate: todayStart.toISOString(),
          endDate: tomorrowEnd.toISOString(),
        });
        if (isMounted) {
          setHomeMeetings(res?.data?.meetings || []);
        }
      } catch {
        if (isMounted) setHomeMeetings([]);
      } finally {
        if (isMounted) setIsLoadingMeetings(false);
      }
    };
    loadHomeMeetings();
    return () => {
      isMounted = false;
    };
  }, [todayStart, tomorrowEnd]);

  // Split meetings strictly into Today (including live) and Tomorrow
  const { todayMeetings, tomorrowMeetings } = useMemo(() => {
    const todayList = [];
    const tomorrowList = [];

    for (const m of homeMeetings) {
      if (m.status === "cancelled" || m.status === "completed") continue;
      if (m.status === "ongoing") {
        todayList.push(m);
        continue;
      }
      if (!m.scheduledAt) continue;
      const d = new Date(m.scheduledAt);
      if (isNaN(d.getTime())) continue;

      if (d >= todayStart && d <= todayEnd) {
        todayList.push(m);
      } else if (d >= tomorrowStart && d <= tomorrowEnd) {
        tomorrowList.push(m);
      }
    }

    return {
      todayMeetings: todayList,
      tomorrowMeetings: tomorrowList,
    };
  }, [homeMeetings, todayStart, todayEnd, tomorrowStart, tomorrowEnd]);

  const recentDocuments = useMemo(() => {
    const list = [...rootDocuments];
    const extractFromFolder = (f) => {
      if (f.documents) list.push(...f.documents);
      if (f.subfolders) f.subfolders.forEach(extractFromFolder);
    };
    folders.forEach(extractFromFolder);
    return list
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
      .slice(0, 4);
  }, [folders, rootDocuments]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const handleAiSubmit = (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    toast.info("Ask AI v2 is coming soon — your prompt has been noted.");
  };

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 space-y-10 animate-fade-in">
      {/* 1. Centered Hero & Dummy AI Input Box (until v2) */}
      <div className="text-center space-y-5">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {greeting}, {firstName}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Ask anything or tell {workspaceName} what you need
          </p>
        </div>

        {/* AI Input Pill */}
        <form
          onSubmit={handleAiSubmit}
          className="max-w-2xl mx-auto rounded-2xl border border-border bg-card shadow-(--shadow-card) px-4 py-2.5 flex items-center gap-3 focus-within:border-foreground/30 transition-all"
        >
          <div className="grid grid-cols-2 gap-0.5 shrink-0 p-1">
            <span className="size-1.5 rounded-full bg-rose-500" />
            <span className="size-1.5 rounded-full bg-amber-400" />
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span className="size-1.5 rounded-full bg-sky-500" />
          </div>
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Ask HQ AI anything..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden"
          />
          <button
            type="submit"
            title="Ask HQ AI (v2 preview)"
            className="size-8 rounded-xl inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
          >
            <Send className="size-4" />
          </button>
        </form>

        {/* Quick Prompt Suggestion Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
          {AI_QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setAiPrompt(prompt)}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/80 transition-colors cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Two-Column Lightweight Grid: YOUR WORK & UPCOMING EVENTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Column: YOUR WORK */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <CheckSquare className="size-3.5" />
              <span>Your Work</span>
              <Info className="size-3 text-muted-foreground/60" />
            </div>
            <Link
              to="/tasks?view=assigned"
              className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
            </Link>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-(--shadow-card) divide-y divide-border overflow-hidden">
            {isLoadingTasks ? (
              [1, 2, 3, 4].map((n) => (
                <div key={n} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-1">
                    <div className="size-4 rounded-full bg-muted animate-pulse shrink-0" />
                    <div className="h-3.5 w-40 rounded bg-muted animate-pulse" />
                  </div>
                  <div className="h-3.5 w-20 rounded bg-muted/60 animate-pulse" />
                </div>
              ))
            ) : assignedTasks.length === 0 ? (
              <div className="px-5 py-10 text-center space-y-2">
                <p className="text-xs font-medium text-foreground">
                  No tasks assigned to you right now
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Tasks assigned to you across your project spaces will appear here.
                </p>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => navigate("/tasks")}
                  className="mt-1 cursor-pointer"
                >
                  <Plus className="size-3 mr-1" />
                  Open Projects
                </Button>
              </div>
            ) : (
              assignedTasks.slice(0, 6).map((task) => {
                const projInitial = getInitials(task.projectName || "P").charAt(0);
                const projStyle = getAvatarStyle(task.projectId || task.projectName);
                const dateObj = task.dueDate
                  ? new Date(task.dueDate)
                  : task.createdAt
                  ? new Date(task.createdAt)
                  : null;
                const isDueSoonOrOverdue =
                  task.dueDate && new Date(task.dueDate).getTime() <= Date.now() + 86400000;
                const dateLabel =
                  dateObj && !isNaN(dateObj.getTime())
                    ? dateObj.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })
                    : "";

                return (
                  <Link
                    key={task._id}
                    to={`/tasks/projects/${task.projectId}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/40 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="size-4 rounded-full border-2 border-muted-foreground/40 group-hover:border-primary transition-colors shrink-0" />
                      <span className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1.5 max-w-[115px]">
                        <span
                          style={projStyle}
                          className="size-4 rounded text-[9px] font-bold flex items-center justify-center shrink-0 select-none"
                        >
                          {projInitial}
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate">
                          {task.projectName}
                        </span>
                      </div>

                      {dateLabel && (
                        <span
                          className={`text-[11px] font-mono tabular-nums min-w-[42px] text-right ${
                            isDueSoonOrOverdue
                              ? "text-destructive font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          {dateLabel}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: UPCOMING EVENTS (Today & Tomorrow Only) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Calendar className="size-3.5" />
              <span>Upcoming Events</span>
              <Info className="size-3 text-muted-foreground/60" />
            </div>
            <Link
              to="/meets"
              className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              All meets
            </Link>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-(--shadow-card) overflow-hidden divide-y divide-border">
            {isLoadingMeetings ? (
              <div className="p-4 space-y-3">
                {[1, 2].map((n) => (
                  <div key={n} className="flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-muted animate-pulse shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 w-36 rounded bg-muted animate-pulse" />
                      <div className="h-2.5 w-24 rounded bg-muted/60 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : todayMeetings.length === 0 && tomorrowMeetings.length === 0 ? (
              <div className="px-5 py-10 text-center space-y-2">
                <p className="text-xs font-medium text-foreground">
                  No meetings for today or tomorrow
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Meetings scheduled for today and tomorrow will appear here.
                </p>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => navigate("/meets?action=schedule")}
                  className="mt-1 cursor-pointer"
                >
                  <Plus className="size-3 mr-1" />
                  Schedule Meet
                </Button>
              </div>
            ) : (
              <>
                {/* TODAY GROUP */}
                {todayMeetings.length > 0 && (
                  <div>
                    <div className="px-4 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {todayHeader}
                    </div>
                    <div className="divide-y divide-border/60">
                      {todayMeetings.map((m, idx) => {
                        const participants = m.participants || [];
                        return (
                          <div
                            key={m._id}
                            className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="size-9 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                                <Video className="size-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate">
                                  {m.title}
                                </p>
                                <p className="text-[11px] text-muted-foreground font-mono tabular-nums mt-0.5">
                                  {formatTimeRange(m.scheduledAt, m.duration)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              {participants.length > 0 && (
                                <div className="flex items-center -space-x-1.5">
                                  {participants.slice(0, 3).map((p, pIdx) => (
                                    <Avatar
                                      key={p.userId || pIdx}
                                      className="size-6 border-2 border-card"
                                    >
                                      <AvatarFallback
                                        style={getAvatarStyle(p.userId || p.userName)}
                                        className="text-[9px] font-semibold"
                                      >
                                        {getInitials(p.userName || "U")}
                                      </AvatarFallback>
                                    </Avatar>
                                  ))}
                                </div>
                              )}

                              {(idx === 0 || m.status === "ongoing") && (
                                <Button
                                  size="xs"
                                  onClick={() => navigate(`/meets/room/${m.joinCode}`)}
                                  className="h-7 px-2.5 text-[11px] gap-1 cursor-pointer"
                                >
                                  <Video className="size-3" />
                                  <span>Join</span>
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TOMORROW GROUP */}
                {tomorrowMeetings.length > 0 && (
                  <div>
                    <div className="px-4 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {tomorrowHeader}
                    </div>
                    <div className="divide-y divide-border/60">
                      {tomorrowMeetings.map((m) => {
                        const participants = m.participants || [];
                        return (
                          <div
                            key={m._id}
                            onClick={() => navigate("/meets")}
                            className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="size-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                <Video className="size-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate">
                                  {m.title}
                                </p>
                                <p className="text-[11px] text-muted-foreground font-mono tabular-nums mt-0.5">
                                  {formatTimeRange(m.scheduledAt, m.duration)}
                                </p>
                              </div>
                            </div>

                            {participants.length > 0 && (
                              <div className="flex items-center -space-x-1.5 shrink-0">
                                {participants.slice(0, 3).map((p, pIdx) => (
                                  <Avatar
                                    key={p.userId || pIdx}
                                    className="size-6 border-2 border-card"
                                  >
                                    <AvatarFallback
                                      style={getAvatarStyle(p.userId || p.userName)}
                                      className="text-[9px] font-semibold"
                                    >
                                      {getInitials(p.userName || "U")}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. Lightweight RECENT ACTIVITY (Matches Screenshot 3) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <FileText className="size-3.5" />
            <span>Recent Activity</span>
            <Info className="size-3 text-muted-foreground/60" />
          </div>
          <Link
            to="/docs"
            className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Open Docs
          </Link>
        </div>

        {isLoadingDocs ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <div className="h-20 bg-muted/50 animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-3.5 w-24 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-16 rounded bg-muted/60 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : recentDocuments.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-xs text-muted-foreground">
              Recent documents and files you work on will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {recentDocuments.map((doc) => (
              <Link
                key={doc._id}
                to={`/docs/${doc._id}`}
                className="group rounded-xl border border-border bg-card shadow-(--shadow-card) overflow-hidden hover:border-foreground/20 transition-all"
              >
                <div className="h-20 bg-muted/40 border-b border-border/60 flex items-center justify-center text-3xl group-hover:scale-105 transition-transform">
                  {doc.icon || "📄"}
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {doc.title || "Untitled"}
                  </p>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary mt-1.5">
                    Doc
                  </span>
                  <span className="block text-[11px] text-muted-foreground mt-1">
                    {formatRelativeTime(doc.updatedAt || doc.createdAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const MODULE_PREVIEWS = {
  files: {
    badge: "Storage & Assets",
    title: "Files & Cloud Drive",
    subtitle:
      "Centralized asset management for project attachments, shared media, and versioned deliverables.",
    icon: Folder,
    highlights: [
      {
        title: "Unified Attachment Index",
        desc: "Automatically indexes files shared across Direct Messages, Channels, and Task cards.",
        icon: Layers,
      },
      {
        title: "Granular Workspace Permissions",
        desc: "Role-based access controls aligned with your organization's security policies.",
        icon: ShieldCheck,
      },
      {
        title: "Instant Media Preview",
        desc: "High-speed inline preview for documents, images, and recorded session clips.",
        icon: CheckCircle2,
      },
    ],
  },
  "ask-ai": {
    badge: "Workspace Intelligence",
    title: "HQ Ask AI Copilot",
    subtitle:
      "Context-aware assistant trained on your workspace documents, project boards, and meeting transcripts.",
    icon: Sparkles,
    highlights: [
      {
        title: "Cross-Workspace Semantic Search",
        desc: "Ask natural-language questions across Docs, Kanban issues, and meeting notes.",
        icon: Layers,
      },
      {
        title: "Automated Sprint & Meeting Summaries",
        desc: "Turn long threads and recorded syncs into structured action items in one click.",
        icon: CheckCircle2,
      },
      {
        title: "Tenant-Isolated Privacy",
        desc: "Your workspace data never leaves your organization's security boundary.",
        icon: ShieldCheck,
      },
    ],
  },
};

function UnderConstruction() {
  const location = useLocation();
  const navigate = useNavigate();
  const pageKey = location.pathname.substring(1).split("/")[0] || "home";

  if (pageKey === "home") {
    return <WorkspaceHomeOverview />;
  }

  const meta = MODULE_PREVIEWS[pageKey] || {
    badge: "Workspace Module",
    title: `${pageKey.charAt(0).toUpperCase() + pageKey.slice(1)} Module`,
    subtitle:
      "This workspace surface is currently being provisioned for your tenant.",
    icon: Layers,
    highlights: MODULE_PREVIEWS.files.highlights,
  };
  const Icon = meta.icon;

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6 animate-fade-in">
      <section className="rounded-xl border border-border bg-card text-card-foreground shadow-(--shadow-card) overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="size-10 rounded-xl bg-muted border border-border flex items-center justify-center text-foreground shrink-0 shadow-2xs">
              <Icon className="size-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold tracking-tight text-foreground">
                  {meta.title}
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-status-warn-border bg-status-warn px-2 py-0.5 text-[10px] font-medium text-status-warn-foreground">
                  <span className="size-1.5 rounded-full bg-status-warn-foreground" />
                  Early Access Preview
                </span>
              </div>
              <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                {meta.subtitle}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {meta.highlights.map((item) => {
            const ItemIcon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2"
              >
                <div className="size-7 rounded-lg bg-card border border-border flex items-center justify-center text-foreground shadow-2xs">
                  <ItemIcon className="size-3.5" />
                </div>
                <h3 className="text-xs font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-3.5 border-t border-border bg-muted/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            Need to share files or draft content right now? Use Docs or Direct Messages.
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              onClick={() => navigate(-1)}
              className="gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="size-3" />
              Go Back
            </Button>
            <Button
              size="xs"
              onClick={() => navigate("/home")}
              className="gap-1.5 cursor-pointer"
            >
              <span>Workspace Overview</span>
              <ArrowRight className="size-3" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default UnderConstruction;
