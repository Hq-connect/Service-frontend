import React from "react";
import { Folder, MoreVertical, Trash2, Edit2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export default function FolderCard({ folder, onOpen, onRename, onTrash }) {
  return (
    <div
      onClick={() => onOpen(folder)}
      className="group relative flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-muted/40 transition-all duration-150 cursor-pointer shadow-(--shadow-card)"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 group-hover:scale-105 transition-transform">
          <Folder className="size-4 fill-primary/20" />
        </div>
        <span className="text-xs font-semibold text-foreground truncate max-w-[140px] sm:max-w-[170px]">
          {folder.name}
        </span>
      </div>

      {/* Quick Action Dropdown */}
      <div onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <MoreVertical className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem
              onClick={() => onRename(folder)}
              className="text-xs gap-2 cursor-pointer"
            >
              <Edit2 className="size-3" />
              <span>Rename</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onTrash(folder._id)}
              className="text-xs gap-2 text-destructive focus:text-destructive cursor-pointer"
            >
              <Trash2 className="size-3" />
              <span>Move to Trash</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

