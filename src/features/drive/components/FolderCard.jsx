import React from "react";
import { Folder, MoreVertical, Trash2, Edit2, Share2, RotateCcw, Lock, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function FolderCard({
  folder,
  onOpen,
  onRename,
  onTrash,
  onShare,
  onToggleVisibility,
  isTrashView = false,
  onRestore,
  onDeletePermanent,
}) {
  return (
    <div
      onClick={() => onOpen(folder)}
      className="group relative flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-muted/40 transition-all duration-150 cursor-pointer shadow-(--shadow-card)"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 group-hover:scale-105 transition-transform">
          <Folder className="size-4 fill-primary/20" />
        </div>
        <div className="min-w-0 flex items-center gap-1.5">
          <span className="text-xs font-semibold text-foreground truncate max-w-[120px] sm:max-w-[150px]">
            {folder.name}
          </span>
          {!isTrashView && (
            folder.isPublic ? (
              <span title="Public to workspace">
                <Globe className="size-3 text-blue-500 shrink-0" />
              </span>
            ) : (
              <span title="Private">
                <Lock className="size-3 text-muted-foreground/60 shrink-0" />
              </span>
            )
          )}
        </div>
      </div>

      {/* Quick Action Dropdown */}
      <div onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <MoreVertical className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {isTrashView ? (
              <>
                <DropdownMenuItem
                  onClick={() => onRestore && onRestore(folder._id)}
                  className="text-xs gap-2 cursor-pointer"
                >
                  <RotateCcw className="size-3" />
                  <span>Restore</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDeletePermanent && onDeletePermanent(folder._id)}
                  className="text-xs gap-2 text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="size-3" />
                  <span>Delete permanently</span>
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem
                  onClick={() => onShare && onShare(folder)}
                  className="text-xs gap-2 cursor-pointer"
                >
                  <Share2 className="size-3" />
                  <span>Share</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onToggleVisibility && onToggleVisibility(folder._id, !folder.isPublic)}
                  className="text-xs gap-2 cursor-pointer"
                >
                  {folder.isPublic ? <Lock className="size-3" /> : <Globe className="size-3" />}
                  <span>{folder.isPublic ? "Make Private" : "Make Public"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onRename(folder)}
                  className="text-xs gap-2 cursor-pointer"
                >
                  <Edit2 className="size-3" />
                  <span>Rename</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onTrash(folder._id)}
                  className="text-xs gap-2 text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="size-3" />
                  <span>Move to Trash</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
