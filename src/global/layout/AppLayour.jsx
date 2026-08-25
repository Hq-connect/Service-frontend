import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import useTenant from "@/global/hooks/useTenant";
import useAuth from "@/features/auth/hooks/useAuth";

// Import layout sub-components
import { SECONDARY_NAV_DATA } from "./components/navigation";
import PrimarySidebar from "./components/PrimarySidebar";
import SecondarySidebar from "./components/SecondarySidebar";
import DesktopHeader from "./components/DesktopHeader";
import MobileNavigation from "./components/MobileNavigation";

function AppLayout() {
  const { tenant } = useTenant();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [selectedSpaceIdx, setSelectedSpaceIdx] = useState(0);
  const [isSecondarySidebarOpen, setIsSecondarySidebarOpen] = useState(true);

  // Normalize pathname (e.g. "/" goes to "/home")
  const currentPath = location.pathname === "/" ? "/home" : location.pathname;
  const secondaryNav = SECONDARY_NAV_DATA[currentPath] || SECONDARY_NAV_DATA["/home"];

  // Helper to extract the actual user object if it is nested or wrapped in API response
  const extractUser = (u) => {
    if (!u) return null;
    if (u.user && typeof u.user === "object") return u.user;
    if (u.data && typeof u.data === "object") return u.data;
    return u;
  };

  // Helper to format full user display name
  const getUserName = (u) => {
    const target = extractUser(u);
    if (!target) return "Workspace User";
    if (target.firstName || target.lastName) {
      return `${target.firstName || ""} ${target.lastName || ""}`.trim();
    }
    return target.fullName || target.name || "Workspace User";
  };

  // Helper to extract initials for user avatar fallback
  const getInitials = (u) => {
    const target = extractUser(u);
    if (!target) return "U";
    if (target.firstName || target.lastName) {
      return `${(target.firstName || "U")[0]}${(target.lastName || "")[0] || ""}`.toUpperCase();
    }
    const name = target.fullName || target.name || target.email || "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // Helper to generate a deterministic pastel theme color based on user's email
  const getAvatarStyle = (u) => {
    const target = extractUser(u);
    const email = target?.email || "default@hq.com";
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return {
      backgroundColor: `hsl(${h}, 65%, 92%)`,
      color: `hsl(${h}, 70%, 30%)`
    };
  };

  return (
    <div className="flex min-h-screen bg-background font-sans">
      {/* 1. Desktop Leftmost Primary Sidebar (Dark Theme) */}
      <PrimarySidebar 
        currentPath={currentPath}
        isSecondarySidebarOpen={isSecondarySidebarOpen}
        setIsSecondarySidebarOpen={setIsSecondarySidebarOpen}
      />

      {/* 2. Desktop Middle Secondary Sidebar (Light Theme) */}
      {isSecondarySidebarOpen && (
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
        <main className="flex-1 min-w-0 bg-[#ffffff] overflow-y-auto px-4 md:px-8 py-6 mt-14 md:mt-0 mb-16 md:mb-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
