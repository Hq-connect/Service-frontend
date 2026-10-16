import React, { useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { PRIMARY_NAV_ITEMS, EXTRA_NAV_ITEMS } from "./navigation";
import QuickCallModal from "@/features/meets/components/QuickCallModal";

function PrimarySidebar({ currentPath, isSecondarySidebarOpen, setIsSecondarySidebarOpen, chatUnreadCount = 0 }) {
  const [quickCallOpen, setQuickCallOpen] = useState(false);
  const [quickCallMode, setQuickCallMode] = useState("direct");
  return (
    <aside className="hidden md:flex flex-col items-center w-[72px] bg-primary-sidebar border-r border-primary-sidebar-border text-primary-sidebar-active-text shrink-0 z-30 select-none">
      {/* Logo Icon Only */}
      <div className="flex items-center justify-center h-14 w-full mt-2">
        <Logo iconOnly={true} isDark={true} className="w-8 h-8" />
      </div>

      {/* Divider beneath the logo */}
      <div className="w-8 h-[1px] bg-primary-sidebar-border mx-auto mb-1" />

      {/* Primary Navigation Links */}
      <nav className="flex-1 flex flex-col items-center gap-1.5 py-2 w-full overflow-y-auto">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.path === currentPath || currentPath.startsWith(item.path + "/");
          const hasUnread = item.path === "/chats" && chatUnreadCount > 0;

          return (
            <Link
              key={item.path}
              to={item.path}
              title={item.label}
              className={`relative flex flex-col items-center justify-center w-[58px] h-[52px] rounded-lg transition-all duration-150 group ${
                isActive
                  ? "bg-primary-sidebar-active text-primary-sidebar-active-text font-semibold shadow-xs before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3.5px] before:rounded-r-full before:bg-primary-sidebar-marker"
                  : "text-primary-sidebar-text hover:bg-primary-sidebar-active/60 hover:text-primary-sidebar-active-text"
              }`}
            >
              <Icon className={`size-[20px] transition-transform duration-150 group-hover:scale-105 ${
                isActive ? "text-primary-sidebar-active-text" : "text-primary-sidebar-text group-hover:text-primary-sidebar-active-text"
              }`} />
              <span className="text-[10px] mt-0.5 tracking-wide select-none opacity-70">{item.label}</span>
              {hasUnread && (
                <span className="absolute top-1 right-2 min-w-4 h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[8px] font-bold flex items-center justify-center ring-2 ring-primary-sidebar">
                  {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                </span>
              )}
            </Link>
          );
        })}

        {/* Extra Nav Items: Video & Calls */}
        {EXTRA_NAV_ITEMS.map((item, index) => {
          const Icon = item.icon;
          const isVideo = item.label === "Video" || item.id === "video";
          const handleClick = () => {
            if (item.onClick) {
              item.onClick();
              return;
            }
            setQuickCallMode(isVideo ? "instant" : "direct");
            setQuickCallOpen(true);
          };

          return (
            <button
              key={index}
              title={isVideo ? "Start instant video meeting" : "Start or join a voice call"}
              onClick={handleClick}
              className="relative flex flex-col items-center justify-center w-[58px] h-[52px] rounded-lg text-primary-sidebar-text hover:bg-primary-sidebar-active/60 hover:text-primary-sidebar-active-text active:scale-95 transition-all duration-150 group cursor-pointer"
            >
              <Icon className="size-[20px] transition-transform duration-150 group-hover:scale-105 text-primary-sidebar-text group-hover:text-primary-sidebar-active-text" />
              <span className="text-[10px] mt-0.5 tracking-wide select-none opacity-70">{item.label}</span>
              {item.badge ? (
                <span className="absolute top-1 right-2 min-w-4 h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[8px] font-bold flex items-center justify-center ring-2 ring-primary-sidebar">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Profile / Bottom Controls */}
      <div className="flex flex-col items-center gap-2 py-4 w-full border-t border-primary-sidebar-border">
        {/* Invite User Button */}
        <button
          title="Invite user"
          className="flex items-center justify-center size-10 rounded-lg text-primary-sidebar-text hover:bg-primary-sidebar-active hover:text-primary-sidebar-active-text transition-all duration-150 cursor-pointer"
        >
          <UserPlus className="size-[20px]" />
        </button>

        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setIsSecondarySidebarOpen(!isSecondarySidebarOpen)}
          title="Toggle sidebar"
          className="flex items-center justify-center size-10 rounded-lg text-primary-sidebar-text hover:bg-primary-sidebar-active hover:text-primary-sidebar-active-text transition-all duration-150 cursor-pointer"
        >
          <svg viewBox="0 0 24 24" className="size-[20px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M9 3v16" />
          </svg>
        </button>
      </div>

      {/* Quick Call & Meeting Modal */}
      <QuickCallModal
        open={quickCallOpen}
        onOpenChange={setQuickCallOpen}
        initialMode={quickCallMode}
      />
    </aside>
  );
}

export default PrimarySidebar;
