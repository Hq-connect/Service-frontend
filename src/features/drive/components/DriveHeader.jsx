import React from "react";
import {
  FolderPlus,
  Upload,
  Search,
  LayoutGrid,
  List,
  ChevronRight,
  Folder,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DriveHeader({
  currentFolder,
  breadcrumbs = [],
  onNavigateBreadcrumb,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onNewFolder,
  onUploadClick,
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-border">
      {/* Left: Breadcrumbs & Title */}
      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
        <button
          onClick={() => onNavigateBreadcrumb(null)}
          className="flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <Folder className="size-4 text-muted-foreground" />
          <span>My Drive</span>
        </button>

        {breadcrumbs.map((crumb) => (
          <React.Fragment key={crumb._id}>
            <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
            <button
              onClick={() => onNavigateBreadcrumb(crumb._id)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors truncate max-w-[150px] cursor-pointer"
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}

        {currentFolder && (
          <>
            <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-sm font-semibold text-foreground truncate max-w-[180px]">
              {currentFolder.name}
            </span>
          </>
        )}
      </div>

      {/* Right: Search, View Mode Toggle, Action Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search Input */}
        <div className="relative w-44 sm:w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search files..."
            className="pl-8 h-8 text-xs bg-card"
          />
        </div>

        {/* View Mode Toggle (Grid vs List) */}
        <div className="flex items-center border border-border rounded-lg p-0.5 bg-card">
          <button
            onClick={() => onViewModeChange("grid")}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              viewMode === "grid"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Grid view"
          >
            <LayoutGrid className="size-3.5" />
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              viewMode === "list"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="List view"
          >
            <List className="size-3.5" />
          </button>
        </div>

        {/* New Folder Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onNewFolder}
          className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
        >
          <FolderPlus className="size-3.5" />
          <span>New Folder</span>
        </Button>

        {/* Upload File Button */}
        <Button
          size="sm"
          onClick={onUploadClick}
          className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
        >
          <Upload className="size-3.5" />
          <span>Upload</span>
        </Button>
      </div>
    </div>
  );
}

