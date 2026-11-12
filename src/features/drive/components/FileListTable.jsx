import React from "react";
import { Star, Download, Eye, Trash2, Edit2, MoreVertical, Folder } from "lucide-react";
import { getFileIcon, formatBytes, formatShortDate } from "../utils/fileIcons";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function FileListTable({
  folders = [],
  files = [],
  onOpenFolder,
  onRenameFolder,
  onTrashFolder,
  onPreviewFile,
  onDownloadFile,
  onToggleStarFile,
  onRenameFile,
  onTrashFile,
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-(--shadow-card)">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 text-muted-foreground border-b border-border uppercase tracking-wider font-medium text-[10px]">
            <tr>
              <th className="py-2.5 px-4 font-semibold">Name</th>
              <th className="py-2.5 px-4 font-semibold w-24">Size</th>
              <th className="py-2.5 px-4 font-semibold w-28">Modified</th>
              <th className="py-2.5 px-4 font-semibold w-16 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {/* Folders first */}
            {folders.map((folder) => (
              <tr
                key={folder._id}
                onClick={() => onOpenFolder(folder)}
                className="hover:bg-muted/40 transition-colors cursor-pointer group"
              >
                <td className="py-2.5 px-4 flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
                    <Folder className="size-3.5 fill-primary/20" />
                  </div>
                  <span className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-xs">
                    {folder.name}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-muted-foreground font-mono">—</td>
                <td className="py-2.5 px-4 text-muted-foreground font-mono">
                  {formatShortDate(folder.createdAt)}
                </td>
                <td className="py-2.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer">
                        <MoreVertical className="size-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem
                        onClick={() => onRenameFolder(folder)}
                        className="text-xs gap-2 cursor-pointer"
                      >
                        <Edit2 className="size-3" />
                        <span>Rename</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onTrashFolder(folder._id)}
                        className="text-xs gap-2 text-destructive focus:text-destructive cursor-pointer"
                      >
                        <Trash2 className="size-3" />
                        <span>Move to Trash</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}

            {/* Files */}
            {files.map((file) => {
              const { icon: Icon, color, bg } = getFileIcon(file.mimeType, file.name);
              return (
                <tr
                  key={file._id}
                  onClick={() => onPreviewFile(file)}
                  className="hover:bg-muted/40 transition-colors cursor-pointer group"
                >
                  <td className="py-2.5 px-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-md ${bg} ${color} shrink-0`}>
                        <Icon className="size-3.5" />
                      </div>
                      <span className="font-medium text-foreground truncate max-w-[200px] sm:max-w-xs">
                        {file.name}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStarFile(file._id);
                      }}
                      className={`p-1 rounded transition-colors cursor-pointer shrink-0 ${
                        file.isStarred
                          ? "text-amber-500 fill-amber-500"
                          : "text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <Star className={`size-3 ${file.isStarred ? "fill-amber-500" : ""}`} />
                    </button>
                  </td>
                  <td className="py-2.5 px-4 text-muted-foreground font-mono">
                    {formatBytes(file.size)}
                  </td>
                  <td className="py-2.5 px-4 text-muted-foreground font-mono">
                    {formatShortDate(file.createdAt)}
                  </td>
                  <td className="py-2.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer">
                          <MoreVertical className="size-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem
                          onClick={() => onPreviewFile(file)}
                          className="text-xs gap-2 cursor-pointer"
                        >
                          <Eye className="size-3" />
                          <span>Preview</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDownloadFile(file)}
                          className="text-xs gap-2 cursor-pointer"
                        >
                          <Download className="size-3" />
                          <span>Download</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onRenameFile(file)}
                          className="text-xs gap-2 cursor-pointer"
                        >
                          <Edit2 className="size-3" />
                          <span>Rename</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onTrashFile(file._id)}
                          className="text-xs gap-2 text-destructive focus:text-destructive cursor-pointer"
                        >
                          <Trash2 className="size-3" />
                          <span>Move to Trash</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

