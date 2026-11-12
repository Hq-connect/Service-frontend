import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import driveService from "../services/drive.service";
import { formatBytes, formatShortDate } from "../utils/fileIcons";
import { toast } from "sonner";

export default function FilePreviewModal({ file, isOpen, onClose }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (file && isOpen) {
      setIsLoading(true);
      driveService
        .getDownloadUrl(file._id, true) // isInline = true
        .then((data) => {
          setPreviewUrl(data.downloadUrl);
        })
        .catch((err) => {
          toast.error("Failed to generate preview URL");
          console.error(err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setPreviewUrl(null);
    }
  }, [file, isOpen]);

  const handleDownload = async () => {
    try {
      const data = await driveService.getDownloadUrl(file._id, false);
      window.open(data.downloadUrl, "_blank");
    } catch {
      toast.error("Failed to start download");
    }
  };

  const isImage = file?.mimeType?.startsWith("image/");
  const isPdf = file?.mimeType === "application/pdf" || file?.name?.endsWith(".pdf");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden bg-card">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="min-w-0 pr-4">
            <DialogTitle className="text-sm font-semibold text-foreground truncate">
              {file?.name}
            </DialogTitle>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono mt-0.5">
              <span>{formatBytes(file?.size)}</span>
              <span>•</span>
              <span>{formatShortDate(file?.createdAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              className="h-8 gap-1.5 text-xs cursor-pointer"
            >
              <Download className="size-3.5" />
              <span>Download</span>
            </Button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex items-center justify-center p-6 bg-muted/20 min-h-[300px] overflow-auto">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground text-xs">
              <Loader2 className="size-6 animate-spin text-primary" />
              <span>Loading preview from Cloudflare R2...</span>
            </div>
          ) : isImage && previewUrl ? (
            <img
              src={previewUrl}
              alt={file.name}
              className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-sm"
            />
          ) : isPdf && previewUrl ? (
            <iframe
              src={previewUrl}
              title={file.name}
              className="w-full h-[60vh] rounded-lg border border-border"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-center p-6">
              <p className="text-xs text-muted-foreground max-w-sm">
                Direct in-browser preview is not supported for this file format, but
                your file is safely stored in Cloudflare R2.
              </p>
              <Button size="sm" onClick={handleDownload} className="gap-2 cursor-pointer">
                <Download className="size-3.5" />
                <span>Download file to view</span>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

