import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UploadCloud, File, CheckCircle2, AlertCircle } from "lucide-react";

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function UploadModal({
  isOpen,
  onClose,
  onUploadFile,
  isUploading,
  uploadProgress,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleStartUpload = () => {
    if (!selectedFile) return;
    onUploadFile(selectedFile, () => {
      setSelectedFile(null);
    });
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFile(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Upload to Cloudflare R2
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {!selectedFile ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer ${
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/40 bg-card"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="p-3 rounded-full bg-muted text-muted-foreground">
                <UploadCloud className="size-6 text-foreground" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-foreground">
                  Click to browse or drag & drop
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Any safe file up to 500MB
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <File className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatBytes(selectedFile.size)}
                  </p>
                </div>
              </div>

              {isUploading && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                    <span>Direct R2 Transfer</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-1.5" />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  disabled={isUploading}
                >
                  Change file
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleStartUpload}
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading..." : "Start Upload"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

