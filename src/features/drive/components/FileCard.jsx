import React from "react";
import { Star, MoreVertical, Download, Eye, Trash2, Edit2 } from "lucide-react";
import { getFileIcon, formatBytes, formatShortDate } from "../utils/fileIcons";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function FileCard({
  file,
  onPreview,
  onDownload,
  onToggleStar,
  onRename,
  onTrash,
}) {
  const { icon: Icon, color, bg } = getFileIcon(file.mimeType, file.name);

  return (
    <div
      onClick={() => onPreview(file)}
      className="group relative flex flex-col justify-between p-3.5 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all duration-150 cursor-pointer shadow-(--shadow-card)"
    >
      {/* Top Row: Icon, Star, Menu */}
      <div className="flex items-center justify-between">
        <div className={`p-2.5 rounded-lg ${bg} ${color}`}>
          <Icon className="size-5" />
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onToggleStar(file._id)}
            className={`p-1 rounded-md transition-colors cursor-pointer ${
              file.isStarred
                ? "text-amber-500 fill-amber-500"
                : "text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100"
            }`}
            title={file.isStarred ? "Unstar" : "Star"}
          >
            <Star className={`size-3.5 ${file.isStarred ? "fill-amber-500" : ""}`} />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <MoreVertical className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                onClick={() => onPreview(file)}
                className="text-xs gap-2 cursor-pointer"
              >
                <Eye className="size-3" />
                <span>Preview</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDownload(file)}
                className="text-xs gap-2 cursor-pointer"
              >
                <Download className="size-3" />
                <span>Download</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onRename(file)}
                className="text-xs gap-2 cursor-pointer"
              >
                <Edit2 className="size-3" />
                <span>Rename</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onTrash(file._id)}
                className="text-xs gap-2 text-destructive focus:text-destructive cursor-pointer"
              >
                <Trash2 className="size-3" />
                <span>Move to Trash</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Middle: File Name */}
      <div className="mt-3">
        <p className="text-xs font-semibold text-foreground truncate" title={file.name}>
          {file.name}
        </p>
      </div>

      {/* Bottom: Size & Date */}
      <div className="mt-2 pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground font-mono">
        <span>{formatBytes(file.size)}</span>
        <span>{formatShortDate(file.createdAt)}</span>
      </div>
    </div>
  );
}

