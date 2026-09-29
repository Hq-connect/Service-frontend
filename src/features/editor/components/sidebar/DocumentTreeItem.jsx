import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal, Copy, Archive, Trash2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DocumentTreeItem({
  doc,
  depth = 0,
  isActive = false,
  onDelete,
  onArchive,
  onDuplicate,
}) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const handleClick = (e) => {
    e.stopPropagation();
    navigate(`/docs/${doc._id}`);
  };

  const handleCopyLink = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/docs/${doc._id}`;
    navigator.clipboard.writeText(url);
    setMenuOpen(false);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (window.confirm(`Delete "${doc.title || "Untitled"}"?`)) {
      onDelete?.(doc._id);
    }
  };

  const handleArchive = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    onArchive?.(doc._id);
  };

  const handleDuplicate = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    onDuplicate?.(doc._id);
  };

  return (
    <div
      onClick={handleClick}
      style={{ paddingLeft: `${depth * 14 + 10}px` }}
      className={cn(
        "group relative flex items-center justify-between py-1.5 pr-2 rounded-md text-xs font-medium cursor-pointer transition-colors select-none",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
      )}
    >
      <div className="flex items-center gap-2 truncate min-w-0 flex-1">
        <span className="text-sm shrink-0 leading-none">
          {doc.icon || "📄"}
        </span>
        <span className="truncate">
          {doc.title || "Untitled"}
        </span>
      </div>

      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity relative" ref={menuRef}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((prev) => !prev);
          }}
          className="p-1 rounded text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <MoreHorizontal className="size-3.5" />
        </button>

        {menuOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-6 z-50 w-36 py-1 bg-popover text-popover-foreground border border-border rounded-lg shadow-md text-xs animate-in fade-in zoom-in-95 duration-100"
          >
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-left"
            >
              <Copy className="size-3.5 text-muted-foreground" />
              <span>Copy Link</span>
            </button>
            {onDuplicate && (
              <button
                type="button"
                onClick={handleDuplicate}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-left"
              >
                <ExternalLink className="size-3.5 text-muted-foreground" />
                <span>Duplicate</span>
              </button>
            )}
            {onArchive && (
              <button
                type="button"
                onClick={handleArchive}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-left"
              >
                <Archive className="size-3.5 text-muted-foreground" />
                <span>Archive</span>
              </button>
            )}
            <div className="h-px my-1 bg-border" />
            <button
              type="button"
              onClick={handleDelete}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-destructive hover:bg-destructive/10 transition-colors text-left"
            >
              <Trash2 className="size-3.5" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
