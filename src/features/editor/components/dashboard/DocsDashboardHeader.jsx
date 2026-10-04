import React from "react";
import { FilePlus, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DocsDashboardHeader({
  onNewFolder,
  onNewDocument,
  isCreating = false,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">
          Docs & Knowledge Hub
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create, organize, and collaborate in real-time across your workspace.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onNewFolder}
          className="gap-1.5"
        >
          <FolderPlus className="size-4 text-muted-foreground" />
          <span>New Folder</span>
        </Button>
        <Button
          type="button"
          disabled={isCreating}
          onClick={onNewDocument}
          className="gap-1.5"
        >
          <FilePlus className="size-4" />
          <span>New Document</span>
        </Button>
      </div>
    </div>
  );
}
