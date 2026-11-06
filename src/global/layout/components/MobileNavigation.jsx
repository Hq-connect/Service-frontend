import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  User,
  Settings,
  LogOut,
  SlidersHorizontal,
  Building2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
  SheetDescription,
} from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PRIMARY_NAV_ITEMS } from "./navigation";
import Logo from "@/components/ui/Logo";
import NotificationBell from "@/features/notifications/components/NotificationBell";
import { ProductivitySidebar } from "@/features/productivity/components/ProductivitySidebar";
import DocsSidebarTree from "@/features/editor/components/sidebar/DocsSidebarTree";
import { MeetsSidebar } from "@/features/meets/components/MeetsSidebar";
import { extractUser } from "@/global/utils/user";
import { cn } from "@/lib/utils";

function MobileNavigation({
  tenant,
  user,
  logout,
  secondaryNav,
  selectedSpaceIdx,
  setSelectedSpaceIdx,
  currentPath,
  getInitials,
  getUserName,
  getAvatarStyle,
  mobileDrawerOpen,
  setMobileDrawerOpen,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const normalizedUser = extractUser(user);
  const role = normalizedUser?.role || "member";
  const isAdminOrOwner = role === "owner" || role === "admin";

  const isDocsRoute = currentPath.startsWith("/docs");
  const isTasksRoute = currentPath.startsWith("/tasks");
  const isMeetsRoute =
    currentPath.startsWith("/meets") ||
    currentPath.startsWith("/calendar") ||
    currentPath.startsWith("/calander");

  const renderSecondaryItems = () => {
    return (
      <div className="flex flex-col gap-0.5 px-3 py-1">
        {secondaryNav.items.map((item, idx) => {
          const Icon = item.icon;
          const currentUrl = location.pathname + location.search;
          const searchParams = new URLSearchParams(location.search);
          const currentView = searchParams.get("view");

          let isSelected = false;
          if (item.path) {
            if (item.path.includes("?")) {
              isSelected = currentUrl === item.path;
            } else if (item.id === "inbox" || item.label === "Inbox") {
              isSelected =
                (!currentView || currentView === "inbox") &&
                location.pathname === item.path;
            } else {
              isSelected =
                location.pathname === item.path ||
                (item.path !== "/home" &&
                  item.path !== "/meets" &&
                  !location.pathname.startsWith("/tasks") &&
                  location.pathname.startsWith(item.path));
            }
          } else {
            isSelected = selectedSpaceIdx === idx;
          }

          const baseClass = cn(
            "relative flex items-center justify-between w-full px-2.5 py-2 text-[13px] rounded-lg transition-colors duration-150 group cursor-pointer",
            isSelected
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
                  <Icon className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
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

          if (item.path) {
            return (
              <Link
                key={idx}
                to={item.path}
                onClick={() => setMobileDrawerOpen(false)}
                className={baseClass}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSelectedSpaceIdx(idx);
                setMobileDrawerOpen(false);
              }}
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
    <>
      {/* Top Header Bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-background/90 backdrop-blur-md border-b border-border flex items-center justify-between px-4 z-40">
        {/* Hamburger Menu & Page Title */}
        <div className="flex items-center gap-2.5">
          <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
            <SheetTrigger className="md:hidden cursor-pointer size-8 inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent hover:bg-muted hover:text-foreground outline-none select-none transition-all">
              <Menu className="size-4" />
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 p-0 flex flex-col h-full bg-sidebar text-sidebar-foreground"
            >
              <SheetHeader className="px-4 py-3.5 border-b border-sidebar-border">
                <SheetTitle className="sr-only">Workspace Navigation</SheetTitle>
                <SheetDescription className="sr-only">
                  Sub-navigation for the selected workspace module.
                </SheetDescription>
                <div className="flex items-center justify-between gap-2 pr-6">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {tenant?.name || "HQ Workspace"}
                  </span>
                  <Badge variant="outline" className="capitalize text-[10px] h-5 px-2 shrink-0">
                    {role}
                  </Badge>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto py-2">
                {isTasksRoute ? (
                  <ProductivitySidebar />
                ) : isDocsRoute ? (
                  <DocsSidebarTree />
                ) : isMeetsRoute ? (
                  <MeetsSidebar />
                ) : (
                  <>
                    <div className="px-5 py-1.5">
                      <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {secondaryNav.title}
                      </h3>
                    </div>
                    {renderSecondaryItems()}
                  </>
                )}
              </div>

              {/* Mobile Drawer Footer: Settings link */}
              <div className="p-3 border-t border-sidebar-border mt-auto flex flex-col gap-1 bg-sidebar shrink-0">
                <Link
                  to="/settings/profile"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-medium rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors group cursor-pointer"
                >
                  <Settings className="size-4 text-muted-foreground group-hover:text-foreground" />
                  <span>Workspace & Account Settings</span>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
          <span className="font-semibold text-sm text-foreground tracking-tight capitalize">
            {secondaryNav.title}
          </span>
        </div>

        {/* User Dropdown & Settings on Mobile */}
        <div className="flex items-center gap-1.5">
          <Link
            to="/settings/profile"
            aria-label="Settings"
            title="Settings"
            className="cursor-pointer size-8 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Settings className="size-4" />
          </Link>
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-hidden cursor-pointer rounded-full">
              <Avatar className="size-7 ring-1 ring-border">
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
            <DropdownMenuContent className="w-52" align="end">
              <div className="px-2.5 py-2 flex flex-col min-w-0">
                <span className="font-semibold text-xs text-foreground truncate">
                  {getUserName(user)}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground truncate">
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
                <SlidersHorizontal className="size-3.5" /> Preferences
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

      {/* Bottom Nav Bar (Mobile Primary Links using primary-sidebar tokens) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-primary-sidebar border-t border-primary-sidebar-border flex items-center justify-around px-1 z-40 select-none">
        {PRIMARY_NAV_ITEMS.slice(0, 6).map((item) => {
          const Icon = item.icon;
          const isActive =
            currentPath === item.path || currentPath.startsWith(item.path + "/");
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 py-1.5 rounded-lg transition-all duration-150",
                isActive
                  ? "text-primary-sidebar-active-text font-semibold before:absolute before:top-0 before:left-1/2 before:-translate-x-1/2 before:w-5 before:h-0.5 before:rounded-full before:bg-primary-sidebar-marker"
                  : "text-primary-sidebar-text hover:text-primary-sidebar-active-text"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="text-[10px] mt-1 tracking-tight select-none truncate">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export default MobileNavigation;
