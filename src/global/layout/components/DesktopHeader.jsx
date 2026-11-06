import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  Search,
  Calendar,
  LogOut,
  User,
  SlidersHorizontal,
  Building2,
  CheckSquare,
  FileText,
  Folder,
  Video,
  Sparkles,
  MessageSquare,
  Home,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import NotificationBell from "@/features/notifications/components/NotificationBell";
import { extractUser } from "@/global/utils/user";
import useTenant from "@/global/hooks/useTenant";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ROUTE_META = {
  "/home": { label: "Overview", subtitle: "Command Center", icon: Home },
  "/tasks": { label: "Tasks & Projects", subtitle: "Execution", icon: CheckSquare },
  "/docs": { label: "Docs & Wiki", subtitle: "Knowledge Base", icon: FileText },
  "/files": { label: "Files & Assets", subtitle: "Storage", icon: Folder },
  "/meets": { label: "Meets", subtitle: "Conferencing", icon: Video },
  "/calendar": { label: "Calendar", subtitle: "Schedule", icon: Calendar },
  "/ask-ai": { label: "Ask AI", subtitle: "Copilot", icon: Sparkles },
  "/chats": { label: "Messages", subtitle: "Real-time", icon: MessageSquare },
};

const QUICK_JUMP_ITEMS = [
  { label: "Workspace Overview", section: "Navigation", path: "/home", icon: Home, shortcut: "G H" },
  { label: "Projects & Kanban Boards", section: "Navigation", path: "/tasks", icon: CheckSquare, shortcut: "G T" },
  { label: "Documents & Knowledge Hub", section: "Navigation", path: "/docs", icon: FileText, shortcut: "G D" },
  { label: "Video Meetings & Rooms", section: "Navigation", path: "/meets", icon: Video, shortcut: "G M" },
  { label: "Workspace Calendar", section: "Navigation", path: "/calendar", icon: Calendar, shortcut: "G C" },
  { label: "Direct Messages", section: "Messaging", path: "/chats/dm", icon: MessageSquare, shortcut: "G I" },
  { label: "Start Instant Meeting", section: "Quick Actions", path: "/meets?action=instant", icon: Video, shortcut: "⌘ M" },
  { label: "Account & Workspace Settings", section: "Preferences", path: "/settings/profile", icon: SlidersHorizontal, shortcut: "⌘ ," },
];

function DesktopHeader({ user, logout, getInitials, getUserName, getAvatarStyle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenant } = useTenant();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchContainerRef = useRef(null);
  const inputRef = useRef(null);

  const normalizedUser = extractUser(user);
  const role = normalizedUser?.role || "member";
  const isAdminOrOwner = role === "owner" || role === "admin";

  const baseSegment = `/${location.pathname.split("/")[1] || "home"}`;
  const activeMeta = ROUTE_META[baseSegment] || {
    label: "Workspace",
    subtitle: "All spaces",
    icon: LayoutGrid,
  };
  const ActiveIcon = activeMeta.icon;

  // Global Cmd+K / Ctrl+K shortcut to focus quick command search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setSearchFocused(true);
      } else if (e.key === "Escape" && searchFocused) {
        setSearchFocused(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchFocused]);

  // Close search popover on outside click
  useEffect(() => {
    if (!searchFocused) return;
    const handleOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [searchFocused]);

  const filteredJumpItems = QUICK_JUMP_ITEMS.filter(
    (item) =>
      !searchQuery.trim() ||
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.section.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="hidden md:flex items-center justify-between h-14 border-b border-border px-6 select-none bg-background/95 backdrop-blur-md shrink-0 z-20">
      {/* Left: Contextual Breadcrumb & Active Surface Indicator */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="size-7 rounded-lg bg-muted/70 border border-border/80 flex items-center justify-center text-foreground shrink-0 shadow-2xs">
          <ActiveIcon className="size-3.5" />
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-muted-foreground truncate hidden lg:inline">
            {tenant?.name || "HQ Workspace"}
          </span>
          <span className="text-muted-foreground/40 text-xs hidden lg:inline">/</span>
          <span className="font-semibold text-foreground text-[13px] tracking-tight truncate">
            {activeMeta.label}
          </span>
          <Badge
            variant="outline"
            className="text-[10px] font-mono font-normal text-muted-foreground h-4 px-1.5 hidden xl:inline-flex"
          >
            {activeMeta.subtitle}
          </Badge>
        </div>
      </div>

      {/* Middle: Command-Palette Style Quick Jump & Search Bar */}
      <div ref={searchContainerRef} className="relative w-80 lg:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onFocus={() => setSearchFocused(true)}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Jump to pages, boards, docs, or actions…"
          className="w-full h-8 pl-8 pr-14 text-xs bg-muted/50 hover:bg-muted/80 focus:bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all border border-border/70 focus:border-border placeholder:text-muted-foreground"
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-5 items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>

        {/* Quick-Jump Dropdown Palette */}
        {searchFocused && (
          <div className="absolute left-0 right-0 top-full mt-1.5 rounded-xl border border-border bg-popover text-popover-foreground shadow-(--shadow-popover) p-1.5 z-50 animate-fade-in">
            <div className="px-2.5 py-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Quick Navigation</span>
              <span className="font-mono text-[10px]">ESC to close</span>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-0.5 mt-0.5 custom-scrollbar">
              {filteredJumpItems.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No matching workspace destinations for &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                filteredJumpItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => {
                        navigate(item.path);
                        setSearchFocused(false);
                        setSearchQuery("");
                      }}
                      className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs text-foreground/85 hover:text-foreground hover:bg-muted transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className="size-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
                        <span className="truncate font-medium">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-muted-foreground hidden sm:inline">
                          {item.section}
                        </span>
                        <ArrowUpRight className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right: Quick actions and user avatar */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate("/meets?action=schedule")}
          className="hidden lg:inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-colors shadow-2xs cursor-pointer"
          title="Schedule a meeting"
        >
          <Plus className="size-3.5 text-muted-foreground" />
          <span>New Meet</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/calendar")}
          className="size-8 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          title="Workspace Calendar"
        >
          <Calendar className="size-4" />
        </button>

        <NotificationBell />

        <div className="h-4 w-px bg-border mx-0.5" />

        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none cursor-pointer group rounded-full flex items-center gap-2 pl-0.5 pr-1 py-0.5 hover:bg-muted/60 transition-colors">
            <Avatar className="size-7 ring-1 ring-border group-hover:ring-ring/40 transition-all duration-150">
              {normalizedUser?.avatar && (
                <AvatarImage src={normalizedUser.avatar} alt={getUserName(user)} />
              )}
              <AvatarFallback
                style={getAvatarStyle(user)}
                className="font-bold text-[10px] font-heading"
              >
                {getInitials(user)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <div className="px-2.5 py-2 flex flex-col min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-xs text-foreground truncate">
                  {getUserName(user)}
                </span>
                <Badge variant="outline" className="capitalize text-[10px] h-4 px-1.5">
                  {role}
                </Badge>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground truncate mt-0.5">
                {normalizedUser?.email}
              </span>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate("/settings/profile")}
              className="cursor-pointer flex items-center gap-2 text-xs"
            >
              <User className="size-3.5" /> Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate("/settings/appearance")}
              className="cursor-pointer flex items-center gap-2 text-xs"
            >
              <SlidersHorizontal className="size-3.5" /> Appearance & Theme
            </DropdownMenuItem>
            {isAdminOrOwner && (
              <DropdownMenuItem
                onClick={() => navigate("/settings/workspace")}
                className="cursor-pointer flex items-center gap-2 text-xs"
              >
                <Building2 className="size-3.5" /> Workspace Settings
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              variant="destructive"
              className="cursor-pointer flex items-center gap-2 text-xs text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="size-3.5" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default DesktopHeader;
