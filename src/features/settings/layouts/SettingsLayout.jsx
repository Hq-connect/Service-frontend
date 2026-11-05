import { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  User,
  ShieldCheck,
  SlidersHorizontal,
  Building2,
  Users,
  Palette,
  ScrollText,
  TriangleAlert,
  Menu,
  LogOut,
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import useAuth from "@/features/auth/hooks/useAuth";
import useTenant from "@/global/hooks/useTenant";
import {
  extractUser,
  getInitials,
  getUserDisplayName as getUserName,
  getAvatarStyle,
} from "@/global/utils/user";
import InviteMembersModal from "../components/InviteMembersModal";

const ACCOUNT_NAV_ITEMS = [
  {
    label: "Profile",
    path: "/settings/profile",
    icon: User,
  },
  {
    label: "Security & sessions",
    path: "/settings/security",
    icon: ShieldCheck,
  },
  {
    label: "Appearance",
    path: "/settings/appearance",
    icon: SlidersHorizontal,
  },
];

const WORKSPACE_NAV_ITEMS = [
  {
    label: "General",
    path: "/settings/workspace",
    icon: Building2,
  },
  {
    label: "Members & invites",
    path: "/settings/members",
    icon: Users,
  },
  {
    label: "Branding & theme",
    path: "/settings/branding",
    icon: Palette,
  },
  {
    label: "Audit logs",
    path: "/settings/audit-logs",
    icon: ScrollText,
  },
];

const OWNER_NAV_ITEMS = [
  {
    label: "Danger zone",
    path: "/settings/danger",
    icon: TriangleAlert,
  },
];

export function SettingsLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { tenant } = useTenant();
  const brandingIdentity = useSelector(
    (state) => state.settings?.branding?.identity
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const normalizedUser = extractUser(user);
  const role = normalizedUser?.role || "member";
  const isAdminOrOwner = role === "owner" || role === "admin";
  const isOwner = role === "owner";

  const workspaceDisplayName =
    brandingIdentity?.companyName || tenant?.name || "HQ Workspace";

  const allItems = [
    ...ACCOUNT_NAV_ITEMS,
    ...(isAdminOrOwner ? WORKSPACE_NAV_ITEMS : []),
    ...(isOwner ? OWNER_NAV_ITEMS : []),
  ];
  const currentItem =
    allItems.find((item) => location.pathname.startsWith(item.path)) ||
    ACCOUNT_NAV_ITEMS[0];

  const renderSidebarContent = (onItemClick) => (
    <div className="flex flex-col h-full select-none">
      {/* Top Back to Workspace bar */}
      <div className="px-3 pt-4 pb-3 border-b border-sidebar-border space-y-3">
        <button
          type="button"
          onClick={() => {
            onItemClick?.();
            navigate("/home");
          }}
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-muted w-full cursor-pointer group"
        >
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to workspace</span>
        </button>

        {/* Workspace identity pill */}
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-muted/50 border border-border/60">
          <div className="size-7 rounded-md bg-primary-sidebar text-primary-sidebar-active-text flex items-center justify-center shrink-0 p-1">
            <Logo iconOnly isDark className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate">
              {workspaceDisplayName}
            </p>
            <p className="text-[11px] text-muted-foreground font-mono truncate">
              {tenant?.slug || "workspace"}
            </p>
          </div>
          <Badge variant="outline" className="capitalize text-[10px] h-4 px-1.5">
            {role}
          </Badge>
        </div>
      </div>

      {/* Navigation groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div className="space-y-1">
          <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Account
          </p>
          {ACCOUNT_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onItemClick?.()}
                className={({ isActive }) =>
                  `relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors ${
                    isActive
                      ? "bg-muted text-foreground font-medium before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-full before:bg-primary-sidebar-marker"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`
                }
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {isAdminOrOwner && (
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2.5 pb-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Workspace
              </p>
              <span className="text-[10px] font-mono text-muted-foreground">
                Admin
              </span>
            </div>
            {WORKSPACE_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => onItemClick?.()}
                  className={({ isActive }) =>
                    `relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors ${
                      isActive
                        ? "bg-muted text-foreground font-medium before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-full before:bg-primary-sidebar-marker"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }`
                  }
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        )}

        {isOwner && (
          <div className="space-y-1">
            <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Owner
            </p>
            {OWNER_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => onItemClick?.()}
                  className={({ isActive }) =>
                    `relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors ${
                      isActive
                        ? "bg-destructive/10 text-destructive font-medium before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-full before:bg-destructive"
                        : "text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                    }`
                  }
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        )}
      </nav>

      {/* Bottom current user card */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
          <Avatar size="sm">
            {normalizedUser?.avatar && (
              <AvatarImage
                src={normalizedUser.avatar}
                alt={getUserName(user)}
              />
            )}
            <AvatarFallback
              style={getAvatarStyle(user)}
              className="font-bold text-[10px] font-heading"
            >
              {getInitials(user)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-foreground truncate">
              {getUserName(user)}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {normalizedUser?.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            title="Sign out"
            onClick={logout}
            className="text-muted-foreground hover:text-destructive shrink-0"
          >
            <LogOut className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-background text-foreground font-sans">
      {/* Desktop Settings Sidebar */}
      <aside className="hidden md:flex w-[252px] border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex-col shrink-0">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Settings Drawer */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[268px] p-0 bg-sidebar">
          <SheetHeader className="sr-only">
            <SheetTitle>Settings navigation</SheetTitle>
          </SheetHeader>
          {renderSidebarContent(() => setMobileMenuOpen(false))}
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex md:hidden items-center justify-between h-13 px-4 border-b border-border bg-background shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open settings menu"
            >
              <Menu className="size-4" />
            </Button>
            <span className="text-sm font-semibold text-foreground">
              {currentItem?.label || "Settings"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => navigate("/home")}
            className="gap-1 text-muted-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Workspace
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-10 py-6 md:py-9">
          <div className="mx-auto w-full max-w-4xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Invite Modal so it can be triggered inside Settings */}
      <InviteMembersModal />
    </div>
  );
}

export default SettingsLayout;

