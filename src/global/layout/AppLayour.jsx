import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import useTenant from "@/global/hooks/useTenant";
import useAuth from "@/features/auth/hooks/useAuth";
import { useChatUnreadCount } from "@/features/chats/hooks/useChatUnreadCount";
import { usePrimaryNavUnread } from "./hooks/usePrimaryNavUnread";

// Import layout sub-components
import { SECONDARY_NAV_DATA } from "./components/navigation";
import PrimarySidebar from "./components/PrimarySidebar";
import SecondarySidebar from "./components/SecondarySidebar";
import DesktopHeader from "./components/DesktopHeader";
import MobileNavigation from "./components/MobileNavigation";
import { extractUser, getUserDisplayName, getInitials, getAvatarStyle } from "@/global/utils/user";

function AppLayout() {
  const { tenant } = useTenant();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [selectedSpaceIdx, setSelectedSpaceIdx] = useState(0);
  const [isSecondarySidebarOpen, setIsSecondarySidebarOpen] = useState(true);

  // 1. Dedicated hook for Primary Navigation (Chats icon badge) - updates everywhere
  const { totalUnread: primaryChatUnreadCount } = usePrimaryNavUnread();

  // 2. Dedicated hook for Secondary Navigation (breakdown for /chats routes)
  const { data: chatUnread = { total: 0, dm: 0, group: 0, channel: 0 } } = useChatUnreadCount();

  // Dynamic task counts from Redux productivity slice
  const taskCounts = useSelector((state) => state.productivity?.taskCounts);

  // Normalize pathname (e.g. "/" goes to "/home")
  const currentPath = location.pathname === "/" ? "/home" : location.pathname;
  // For secondary nav lookup, use the base route segment (e.g. /chats/dm/xxx -> /chats)
  const navLookupPath = `/${currentPath.split("/")[1]}`;
  const baseSecondaryNav = SECONDARY_NAV_DATA[navLookupPath] || SECONDARY_NAV_DATA["/home"];

  // Dynamically inject live counts & project-aware paths for chat & tasks routes
  const secondaryNav = React.useMemo(() => {
    if (navLookupPath === "/chats") {
      return {
        ...baseSecondaryNav,
        items: baseSecondaryNav.items.map((item) => {
          if (item.path === "/chats/dm") {
            return { ...item, count: chatUnread.dm };
          }
          if (item.path === "/chats/group") {
            return { ...item, count: chatUnread.group };
          }
          if (item.path === "/chats/channel") {
            return { ...item, count: chatUnread.channel };
          }
          return item;
        }),
      };
    }

    if (navLookupPath === "/tasks") {
      const match = location.pathname.match(/\/tasks\/projects\/([^/?]+)/);
      const currentProjectId = match ? match[1] : null;
      const tasksBasePath = currentProjectId ? `/tasks/projects/${currentProjectId}` : "/tasks";

      return {
        ...baseSecondaryNav,
        items: baseSecondaryNav.items.map((item) => {
          const itemPath = item.id === "inbox" 
            ? tasksBasePath 
            : `${tasksBasePath}?view=${item.id}`;
          const count = taskCounts?.[item.id] ?? item.count;
          return {
            ...item,
            path: itemPath,
            count: count > 0 ? count : undefined,
          };
        }),
      };
    }

    return baseSecondaryNav;
  }, [baseSecondaryNav, navLookupPath, chatUnread, location.pathname, taskCounts]);

  // Chat, Docs & Tasks routes need full-height with no padding/scroll so they can manage their own layouts
  const isChatsRoute = currentPath.startsWith("/chats");
  const isDocsRoute = currentPath.startsWith("/docs");
  const isTasksRoute = currentPath.startsWith("/tasks");
  const isCalendarRoute = currentPath.startsWith("/meets/calendar") || currentPath === "/calendar";

  const getUserName = getUserDisplayName;

  return (
    <div className="flex h-screen h-[100dvh] w-screen overflow-hidden bg-background font-sans">
      {/* 1. Desktop Leftmost Primary Sidebar (Dark Theme) */}
      <PrimarySidebar 
        currentPath={currentPath}
        isSecondarySidebarOpen={isSecondarySidebarOpen}
        setIsSecondarySidebarOpen={setIsSecondarySidebarOpen}
        chatUnreadCount={primaryChatUnreadCount}
      />

      {/* 2. Desktop Middle Secondary Sidebar (Light Theme) */}
      {isSecondarySidebarOpen && !isCalendarRoute && (
        <SecondarySidebar 
          tenantName={tenant?.name}
          secondaryNav={secondaryNav}
          selectedSpaceIdx={selectedSpaceIdx}
          setSelectedSpaceIdx={setSelectedSpaceIdx}
        />
      )}

      {/* 3. Mobile Header Bar & Drawer Menu & Bottom Nav */}
      <MobileNavigation 
        tenant={tenant}
        user={user}
        logout={logout}
        secondaryNav={secondaryNav}
        selectedSpaceIdx={selectedSpaceIdx}
        setSelectedSpaceIdx={setSelectedSpaceIdx}
        currentPath={currentPath}
        getInitials={getInitials}
        getUserName={getUserName}
        getAvatarStyle={getAvatarStyle}
        mobileDrawerOpen={mobileDrawerOpen}
        setMobileDrawerOpen={setMobileDrawerOpen}
      />

      {/* 4. Desktop Main Content Viewport & Header Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        <DesktopHeader 
          user={user}
          logout={logout}
          getInitials={getInitials}
          getUserName={getUserName}
          getAvatarStyle={getAvatarStyle}
        />

        {/* Dynamic Nested Viewport */}
        <main className={`flex-1 min-w-0 mt-14 md:mt-0 mb-16 md:mb-0 ${
          isChatsRoute || isDocsRoute || isTasksRoute
            ? "flex flex-col overflow-hidden"
            : "bg-background overflow-y-auto px-4 md:px-8 py-6"
        }`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
