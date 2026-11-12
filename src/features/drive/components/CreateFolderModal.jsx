import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CreateFolderModal({
  isOpen,
  onClose,
  onCreateFolder,
  isPending,
}) {
  const [folderName, setFolderName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    onCreateFolder(folderName.trim());
    setFolderName("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">New Folder</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="folder-name" className="text-xs font-medium text-muted-foreground">
              Folder name
            </Label>
            <Input
              id="folder-name"
              placeholder="e.g. Design Assets, Project Docs"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              autoFocus
              className="text-sm"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!folderName.trim() || isPending}
            >
              {isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

