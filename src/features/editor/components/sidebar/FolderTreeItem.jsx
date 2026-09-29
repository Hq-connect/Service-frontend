import React, { useState, useRef, useEffect } from "react";
import { ChevronRight, ChevronDown, Plus, MoreHorizontal, FolderPlus, Trash2, Edit3 } from "lucide-react";
import DocumentTreeItem from "./DocumentTreeItem";
import { cn } from "@/lib/utils";

export default function FolderTreeItem({
  folder,
  depth = 0,
  activeDocumentId,
  onCreateDocInFolder,
  onCreateSubfolder,
  onRenameFolder,
  onDeleteFolder,
  onDeleteDoc,
  onArchiveDoc,
  onDuplicateDoc,
}) {
  const [isExpanded, setIsExpanded] = useState(() => {
    const hasActiveDoc = folder.documents?.some((d) => d._id === activeDocumentId);
    return hasActiveDoc ?? true;
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameInput, setNameInput] = useState(folder.name || "");
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

  const handleToggle = (e) => {
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  };

  const handleCreateDoc = (e) => {
    e.stopPropagation();
    setIsExpanded(true);
    onCreateDocInFolder?.(folder._id);
  };

  const handleCreateSub = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    onCreateSubfolder?.(folder._id, folder.name);
  };

  const handleStartRename = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    setIsRenaming(true);
  };

  const handleSaveRename = async (e) => {
    e.stopPropagation();
    if (nameInput.trim() && nameInput.trim() !== folder.name) {
      await onRenameFolder?.(folder._id, nameInput.trim());
    }
    setIsRenaming(false);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (window.confirm(`Delete folder "${folder.name}" and move documents to root?`)) {
      onDeleteFolder?.(folder._id);
    }
  };

  const subfolders = folder.subfolders || [];
  const documents = folder.documents || [];
  const hasChildren = subfolders.length > 0 || documents.length > 0;

  return (
    <div className="flex flex-col select-none">
      <div
        onClick={handleToggle}
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
        className="group relative flex items-center justify-between py-1.5 pr-2 rounded-md text-xs font-semibold text-sidebar-foreground/90 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-1.5 truncate min-w-0 flex-1">
          <button
            type="button"
            onClick={handleToggle}
            className="p-0.5 rounded hover:bg-sidebar-accent text-muted-foreground hover:text-sidebar-foreground transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
          </button>

          <span className="text-sm shrink-0 leading-none">
            {folder.icon || "📁"}
          </span>

          {isRenaming ? (
            <input
              type="text"
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleSaveRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveRename(e);
                if (e.key === "Escape") setIsRenaming(false);
              }}
              onClick={(e) => e.stopPropagation()}
              className="px-1 py-0.5 text-xs bg-background text-foreground border border-ring rounded focus:outline-none"
            />
          ) : (
            <span className="truncate text-sidebar-foreground font-medium">
              {folder.name}
            </span>
          )}
        </div>

        {/* Hover quick action buttons */}
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-0.5" ref={menuRef}>
          <button
            type="button"
            title="Create page in folder"
            onClick={handleCreateDoc}
            className="p-1 rounded text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <Plus className="size-3.5" />
          </button>

          <button
            type="button"
            title="Folder actions"
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
              className="absolute right-0 top-6 z-50 w-40 py-1 bg-popover text-popover-foreground border border-border rounded-lg shadow-md text-xs animate-in fade-in zoom-in-95 duration-100"
            >
              <button
                type="button"
                onClick={handleCreateSub}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-left"
              >
                <FolderPlus className="size-3.5 text-muted-foreground" />
                <span>New Subfolder</span>
              </button>
              <button
                type="button"
                onClick={handleStartRename}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-left"
              >
                <Edit3 className="size-3.5 text-muted-foreground" />
                <span>Rename</span>
              </button>
              <div className="h-px my-1 bg-border" />
              <button
                type="button"
                onClick={handleDelete}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-destructive hover:bg-destructive/10 transition-colors text-left"
              >
                <Trash2 className="size-3.5" />
                <span>Delete Folder</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Children: Subfolders and Documents */}
      {isExpanded && (
        <div className="flex flex-col">
          {subfolders.map((sub) => (
            <FolderTreeItem
              key={sub._id}
              folder={sub}
              depth={depth + 1}
              activeDocumentId={activeDocumentId}
              onCreateDocInFolder={onCreateDocInFolder}
              onCreateSubfolder={onCreateSubfolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onDeleteDoc={onDeleteDoc}
              onArchiveDoc={onArchiveDoc}
              onDuplicateDoc={onDuplicateDoc}
            />
          ))}

          {documents.map((doc) => (
            <DocumentTreeItem
              key={doc._id}
              doc={doc}
              depth={depth + 1}
              isActive={doc._id === activeDocumentId}
              onDelete={onDeleteDoc}
              onArchive={onArchiveDoc}
              onDuplicate={onDuplicateDoc}
            />
          ))}

          {isExpanded && !hasChildren && (
            <div
              style={{ paddingLeft: `${(depth + 1) * 14 + 10}px` }}
              className="py-1 text-[11px] text-muted-foreground italic"
            >
              No pages inside
            </div>
          )}
        </div>
      )}
    </div>
  );
}
