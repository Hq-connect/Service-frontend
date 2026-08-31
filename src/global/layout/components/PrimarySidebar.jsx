import React from "react";
import { Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { PRIMARY_NAV_ITEMS, EXTRA_NAV_ITEMS } from "./navigation";

function PrimarySidebar({ currentPath, isSecondarySidebarOpen, setIsSecondarySidebarOpen }) {
  return (
    <aside className="hidden md:flex flex-col items-center w-[72px] bg-[#131517] border-r border-[#222528] text-white shrink-0 z-30 select-none">
      {/* Logo Icon Only */}
      <div className="flex items-center justify-center h-14 w-full mt-2">
        <Logo iconOnly={true} isDark={true} className="w-8 h-8" />
      </div>

      {/* Divider beneath the logo */}
      <div className="w-8 h-[1px] bg-[#222528] mx-auto mb-1" />

      {/* Primary Navigation Links */}
      <nav className="flex-1 flex flex-col items-center gap-1.5 py-2 w-full overflow-y-auto">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.path === currentPath || currentPath.startsWith(item.path + "/");
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center w-[58px] h-[52px] rounded-lg transition-all duration-150 group ${
                isActive 
                  ? "bg-[#222528] text-white font-semibold shadow-xs" 
                  : "text-[#8e9297] hover:bg-[#222528]/50 hover:text-white"
              }`}
            >
              <Icon className={`size-[20px] transition-transform duration-150 group-hover:scale-105 ${
                isActive ? "text-white" : "text-[#8e9297] group-hover:text-white"
              }`} />
              <span className="text-[9px] mt-0.5 tracking-wide select-none">{item.label}</span>
            </Link>
          );
        })}

        {/* Extra Call/Video Nav Items from Reference Image */}
        {EXTRA_NAV_ITEMS.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              className="relative flex flex-col items-center justify-center w-[58px] h-[52px] rounded-lg text-[#8e9297] hover:bg-[#222528]/50 hover:text-white transition-all duration-150 group cursor-pointer"
            >
              <Icon className="size-[20px] transition-transform duration-150 group-hover:scale-105 text-[#8e9297] group-hover:text-white" />
              <span className="text-[9px] mt-0.5 tracking-wide select-none">{item.label}</span>
              {item.badge && (
                <span className="absolute top-1 right-2 min-w-4 h-4 px-1 rounded-full bg-[#f23c3c] text-white text-[8px] font-bold flex items-center justify-center ring-2 ring-[#131517]">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Profile / Bottom Controls */}
      <div className="flex flex-col items-center gap-2 py-4 w-full border-t border-[#222528]">
        {/* Invite User Button */}
        <button className="flex items-center justify-center size-10 rounded-lg text-[#8e9297] hover:bg-[#222528] hover:text-white transition-all duration-150 cursor-pointer">
          <UserPlus className="size-[20px]" />
        </button>
        
        {/* Bottom-Most Toggle Sidebar Button */}
        <button 
          onClick={() => setIsSecondarySidebarOpen(!isSecondarySidebarOpen)}
          className="flex items-center justify-center size-10 rounded-lg text-[#8e9297] hover:bg-[#222528] hover:text-white transition-all duration-150 cursor-pointer"
        >
          <svg viewBox="0 0 24 24" className="size-[20px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M9 3v16" />
          </svg>
        </button>
      </div>
    </aside>
  );
}

export default PrimarySidebar;
