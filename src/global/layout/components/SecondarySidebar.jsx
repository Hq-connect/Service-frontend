import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  LayoutGrid,
  UserCheck,
  Video,
  FileText,
  MessageCircle,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import useTenant from "@/global/hooks/useTenant";
import useAuth from "@/features/auth/hooks/useAuth";
import { extractUser, getInitials, getAvatarStyle } from "@/global/utils/user";
import DocsSidebarTree from "@/features/editor/components/sidebar/DocsSidebarTree";
import { ProductivitySidebar } from "@/features/productivity/components/ProductivitySidebar";
import { MeetsSidebar } from "@/features/meets/components/MeetsSidebar";
import { useProjects } from "@/features/productivity/queries/project.queries";
import { useMyAssignedTasks } from "@/features/productivity/queries/task.queries";
import { usePrimaryNavUnread } from "@/global/layout/hooks/usePrimaryNavUnread";

function HomeSidebarContent() {
  const location = useLocation();
  const navigate = useNavigate();

  const { data: projectsData, isLoading: isLoadingProjects } = useProjects({
    status: "active",
  });
  const projects =
    projectsData?.data?.projects ||
    (Array.isArray(projectsData?.data) ? projectsData.data : []);

  const { data: myTasksData } = useMyAssignedTasks();
  const assignedTasksCount = myTasksData?.data?.tasks?.length || 0;
  const { totalUnread = 0 } = usePrimaryNavUnread();

  const quickLinks = [
    { label: "Overview", icon: LayoutGrid, path: "/home" },
    {
      label: "My Tasks",
      icon: UserCheck,
      path: "/tasks?view=assigned",
      count: assignedTasksCount,
    },
    { label: "Meets & Schedule", icon: Video, path: "/meets" },
    { label: "Knowledge Docs", icon: FileText, path: "/docs" },
    {
      label: "Direct Messages",
      icon: MessageCircle,
      path: "/chats/dm",
      count: totalUnread,
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto py-3 space-y-5">
      {/* Quick Navigation */}
      <div>
        <div className="px-4 pb-1.5 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Workspace
          </span>
        </div>
        <div className="flex flex-col gap-0.5 px-3">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === "/home" &&
              (location.pathname === "/home" || location.pathname === "/");
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex items-center justify-between w-full px-2.5 py-2 text-[13px] rounded-lg transition-colors duration-150 group cursor-pointer",
                  isActive
                    ? "bg-muted text-foreground font-medium before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-full before:bg-primary-sidebar-marker"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-colors",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.count > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-mono tabular-nums font-semibold rounded-md bg-muted text-muted-foreground border border-border/60">
                    {item.count > 99 ? "99+" : item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Real Project Spaces */}
      <div>
        <div className="px-4 pb-1.5 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Your Spaces
          </span>
          <button
            type="button"
            onClick={() => navigate("/tasks")}
            title="View or create projects"
            className="size-5 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <Plus className="size-3.5" />
          </button>
        </div>

        <div className="flex flex-col gap-0.5 px-3">
          {isLoadingProjects ? (
            [1, 2, 3].map((n) => (
              <div key={n} className="px-2.5 py-2 flex items-center gap-2.5">
                <div className="size-4 rounded bg-muted animate-pulse shrink-0" />
                <div className="h-3 w-28 rounded bg-muted animate-pulse" />
              </div>
            ))
          ) : projects.length === 0 ? (
            <button
              type="button"
              onClick={() => navigate("/tasks")}
              className="flex items-center gap-2 px-2.5 py-2 text-xs text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/60 transition-colors cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Create first project space</span>
            </button>
          ) : (
            projects.map((project) => {
              const initial = getInitials(project.name || project.key || "P").charAt(0);
              const badgeStyle = getAvatarStyle(project._id || project.name);
              return (
                <Link
                  key={project._id}
                  to={`/tasks/projects/${project._id}`}
                  className="flex items-center justify-between gap-2 px-2.5 py-2 text-[13px] rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      style={badgeStyle}
                      className="flex items-center justify-center size-4 text-[9px] font-bold rounded shrink-0 select-none"
                    >
                      {initial}
                    </span>
                    <span className="truncate">{project.name}</span>
                  </div>
                  {project.key && (
                    <span className="text-[10px] font-mono text-muted-foreground/70 shrink-0">
                      {project.key}
                    </span>
                  )}
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function SecondarySidebar({ tenantName, secondaryNav, selectedSpaceIdx, setSelectedSpaceIdx }) {
  const location = useLocation();
  const { tenant } = useTenant();
  const { user } = useAuth();
  const brandingIdentity = useSelector((state) => state.settings?.branding?.identity);

  const normalizedUser = extractUser(user);
  const role = normalizedUser?.role || "member";
  const workspaceDisplayName =
    brandingIdentity?.companyName || tenantName || tenant?.name || "HQ Workspace";

  const isHomeRoute =
    location.pathname === "/" || location.pathname.startsWith("/home");
  const isDocsRoute = location.pathname.startsWith("/docs");
  const isTasksRoute = location.pathname.startsWith("/tasks");
  const isMeetsRoute =
    location.pathname.startsWith("/meets") ||
    location.pathname.startsWith("/calendar") ||
    location.pathname.startsWith("/calander");

  const renderSecondaryItems = () => {
    return (
      <div className="flex flex-col gap-0.5 px-3 py-1">
        {secondaryNav.items.map((item, idx) => {
          const Icon = item.icon;

          const currentUrl = location.pathname + location.search;
          const searchParams = new URLSearchParams(location.search);
          const currentView = searchParams.get("view");

          let isActive = false;
          if (item.path) {
            if (item.path.includes("?")) {
              isActive = currentUrl === item.path;
            } else if (item.id === "inbox" || item.label === "Inbox") {
              isActive =
                (!currentView || currentView === "inbox") &&
                location.pathname === item.path;
            } else {
              isActive =
                location.pathname === item.path ||
                (item.path !== "/home" &&
                  item.path !== "/meets" &&
                  !location.pathname.startsWith("/tasks") &&
                  location.pathname.startsWith(item.path));
            }
          } else {
            isActive = selectedSpaceIdx === idx;
          }

          const baseClass = cn(
            "relative flex items-center justify-between w-full px-2.5 py-2 text-[13px] rounded-lg transition-colors duration-150 group cursor-pointer",
            isActive
              ? "bg-muted text-foreground font-medium before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-full before:bg-primary-sidebar-marker"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          );

          const content = (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                {typeof Icon === "string" ? (
                  <span
                    className="flex items-center justify-center size-4 text-[9px] font-bold text-white rounded shrink-0 select-none"
                    style={{ backgroundColor: item.color || "#00c2ff" }}
                  >
                    {Icon}
                  </span>
                ) : (
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-colors",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                )}
                <span className="truncate">{item.label}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-mono tabular-nums font-semibold rounded-md bg-muted text-muted-foreground border border-border/60">
                  {item.count > 99 ? "99+" : item.count}
                </span>
              )}
            </>
          );

          return item.path ? (
            <Link key={idx} to={item.path} className={baseClass}>
              {content}
            </Link>
          ) : (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedSpaceIdx(idx)}
              className={baseClass}
            >
              {content}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <aside className="hidden md:flex flex-col w-[248px] bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0 z-20 select-none animate-in fade-in slide-in-from-left-2 duration-150">
      {/* Minimal Workspace Header: Workspace Name + User Role only */}
      <div className="h-14 px-4 border-b border-sidebar-border flex items-center justify-between gap-2 shrink-0">
        <span className="text-sm font-semibold text-foreground truncate">
          {workspaceDisplayName}
        </span>
        <Badge variant="outline" className="capitalize text-[10px] h-5 px-2 shrink-0">
          {role}
        </Badge>
      </div>

      {/* Dynamic Nav list or Feature Sidebar Tree */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {isHomeRoute ? (
          <HomeSidebarContent />
        ) : isDocsRoute ? (
          <DocsSidebarTree />
        ) : isTasksRoute ? (
          <ProductivitySidebar />
        ) : isMeetsRoute ? (
          <MeetsSidebar />
        ) : (
          <div className="flex-1 overflow-y-auto py-3">
            <div className="px-5 pb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {secondaryNav.title}
              </span>
            </div>
            {renderSecondaryItems()}
          </div>
        )}
      </div>
    </aside>
  );
}

export default SecondarySidebar;
