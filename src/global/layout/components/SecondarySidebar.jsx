import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

function SecondarySidebar({ tenantName, secondaryNav, selectedSpaceIdx, setSelectedSpaceIdx }) {
  const location = useLocation();

  const renderSecondaryItems = () => {
    return (
      <div className="flex flex-col gap-0.5 p-2">
        {secondaryNav.items.map((item, idx) => {
          const Icon = item.icon;

          // If the item has a path, use a Link and derive active from URL
          const isActive = item.path
            ? location.pathname.startsWith(item.path)
            : selectedSpaceIdx === idx;

          const baseClass = cn(
            "flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 group cursor-pointer",
            isActive
              ? "bg-accent/80 text-foreground"
              : "text-foreground/80 hover:bg-accent/40 hover:text-foreground"
          );

          const content = (
            <>
              <div className="flex items-center gap-3">
                {typeof Icon === "string" ? (
                  <span
                    className="flex items-center justify-center size-5 text-[10px] font-bold text-white rounded-md shadow-xs shrink-0 select-none"
                    style={{ backgroundColor: item.color || "#00c2ff" }}
                  >
                    {Icon}
                  </span>
                ) : (
                  <Icon className="size-[18px] shrink-0 text-muted-foreground group-hover:text-foreground" />
                )}
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && (
                <span className="px-1.5 py-0.5 text-xs font-semibold rounded-md bg-muted text-muted-foreground group-hover:bg-accent-foreground/10 group-hover:text-accent-foreground">
                  {item.count}
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
    <aside className="hidden md:flex flex-col w-[240px] bg-[#f8f9fa] border-r border-[#eef0f2] shrink-0 z-20 animate-in fade-in slide-in-from-left-4 duration-150">
      {/* Tenant Name Selector */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-[#eef0f2] gap-2">
        <span className="text-sm font-bold text-foreground truncate select-none">
          {tenantName || "Hq"}
        </span>
      </div>

      {/* Dynamic Nav list */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Header */}
        <div className="px-4 py-2 flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {secondaryNav.title}
          </span>
        </div>
        {renderSecondaryItems()}
      </div>
    </aside>
  );
}

export default SecondarySidebar;

