import React, { useState, useEffect, useRef } from "react";
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
import { Lock, Globe } from "lucide-react";

export default function CreateFolderModal({
  isOpen,
  onClose,
  onCreateFolder,
  isPending,
  error,
}) {
  const [folderName, setFolderName] = useState("Untitled folder");
  const [isPublic, setIsPublic] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setFolderName("Untitled folder");
      setIsPublic(false);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = folderName.trim() || "Untitled folder";
    onCreateFolder(trimmed, isPublic);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">New Folder</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="folder-name" className="text-xs font-medium text-muted-foreground">
              Folder name
            </Label>
            <Input
              ref={inputRef}
              id="folder-name"
              placeholder="Untitled folder"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              autoFocus
              className={`text-sm ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
            />
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>

          {/* Visibility selector: Private (default) vs Public */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Visibility & Access
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`flex items-start gap-2 p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  !isPublic
                    ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/30"
                    : "border-border hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <Lock className="size-4 shrink-0 mt-0.5 text-primary" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Private</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">Only you and people you invite</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`flex items-start gap-2 p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  isPublic
                    ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/30"
                    : "border-border hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <Globe className="size-4 shrink-0 mt-0.5 text-blue-500" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Public</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">Everyone in this company</p>
                </div>
              </button>
            </div>
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
              disabled={isPending}
            >
              {isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
