import React from "react";
import { FilePlus, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DocsDashboardHeader({
  onNewFolder,
  onNewDocument,
  isCreating = false,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-foreground tracking-tight">
          Docs & Knowledge Hub
        </h1>
        <p className="text-xs text-muted-foreground">
          Create, organize, and co-author technical specs, meeting notes, and wikis in real time.
        </p>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onNewFolder}
          className="gap-1.5 text-xs h-8 cursor-pointer"
        >
          <FolderPlus className="size-3.5 text-muted-foreground" />
          <span>New Folder</span>
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={isCreating}
          onClick={onNewDocument}
          className="gap-1.5 text-xs h-8 cursor-pointer"
        >
          <FilePlus className="size-3.5" />
          <span>{isCreating ? "Creating…" : "New Document"}</span>
        </Button>
      </div>
    </div>
  );
}
