import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, Film, Volume2, Image as ImageIcon, Loader2, Table } from "lucide-react";
import { getFileTypeConfig } from "../utils/fileTypeConfig";
import { cn } from "@/lib/utils";

function CsvTableViewer({ content }) {
  const rows = useMemo(() => {
    if (!content) return [];
    return content
      .trim()
      .split(/\r?\n/)
      .map((line) => line.split(",").map((cell) => cell.trim().replace(/^"(.*)"$/, "$1")));
  }, [content]);

  if (rows.length === 0) {
    return <p className="text-xs text-muted-foreground">Empty CSV file</p>;
  }

  const header = rows[0];
  const bodyRows = rows.slice(1);

  return (
    <div className="w-full h-[72vh] overflow-auto border border-border rounded-lg bg-background shadow-inner">
      <table className="w-full text-xs text-left border-collapse">
        <thead className="bg-muted border-b border-border sticky top-0 font-semibold text-foreground z-10">
          <tr>
            <th className="p-2.5 border-r border-border text-[10px] text-muted-foreground w-10 text-center font-mono">
              #
            </th>
            {header.map((col, idx) => (
              <th key={idx} className="p-2.5 border-r border-border min-w-[120px] truncate font-medium">
                {col || `Col ${idx + 1}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {bodyRows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-muted/30 transition-colors">
              <td className="p-2 border-r border-border text-[10px] text-muted-foreground text-center bg-muted/20 font-mono">
                {rIdx + 1}
              </td>
              {header.map((_, cIdx) => (
                <td key={cIdx} className="p-2 border-r border-border truncate max-w-[240px]">
                  {row[cIdx] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FileViewerModal({ open, onOpenChange, attachment }) {
  const [textContent, setTextContent] = useState("");
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [textError, setTextError] = useState(false);

  const { type, url, name, size, mimeType = "" } = attachment || {};
  const fileName = name || "Attachment";
  const sizeKb = size ? (size / 1024).toFixed(0) : null;

  const lowerName = fileName.toLowerCase();
  const lowerUrl = (url || "").toLowerCase();

  const isPdf =
    mimeType === "application/pdf" ||
    lowerName.endsWith(".pdf") ||
    lowerUrl.includes(".pdf");

  const isCsv =
    mimeType === "text/csv" ||
    lowerName.endsWith(".csv") ||
    lowerUrl.includes(".csv");

  const isText =
    isCsv ||
    mimeType.startsWith("text/") ||
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".json") ||
    lowerName.endsWith(".md") ||
    lowerName.endsWith(".log");

  const isImage = type === "image" || mimeType.startsWith("image/");
  const isVideo = type === "video" || mimeType.startsWith("video/");
  const isAudio = type === "audio" || mimeType.startsWith("audio/");

  useEffect(() => {
    if (open && isText && url) {
      setIsLoadingText(true);
      setTextError(false);
      setTextContent("");

      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch file content");
          return res.text();
        })
        .then((data) => {
          setTextContent(data);
          setIsLoadingText(false);
        })
        .catch((err) => {
          console.error("Error fetching text file:", err);
          setTextError(true);
          setIsLoadingText(false);
        });
    }
  }, [open, isText, url]);

  if (!attachment) return null;

  const renderTextBody = () => {
    if (isLoadingText) {
      return (
        <div className="flex flex-col items-center justify-center p-12 gap-2 text-muted-foreground">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="text-xs">Loading file preview...</p>
        </div>
      );
    }

    if (textError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 p-8 bg-background rounded-xl border border-border text-center max-w-md">
          <FileText className="size-10 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Unable to render file directly. You can download it to view.
          </p>
          <a href={url} target="_blank" rel="noopener noreferrer" download={fileName}>
            <Button size="sm" className="gap-1.5 text-xs">
              <Download className="size-3.5" />
              Download File
            </Button>
          </a>
        </div>
      );
    }

    if (isCsv) {
      return <CsvTableViewer content={textContent} />;
    }

    let formattedText = textContent;
    if (lowerName.endsWith(".json")) {
      try {
        formattedText = JSON.stringify(JSON.parse(textContent), null, 2);
      } catch {
        // keep raw text if JSON parse fails
      }
    }

    return (
      <pre className="w-full h-[72vh] overflow-auto font-mono text-xs p-4 bg-background rounded-lg border border-border leading-relaxed text-foreground whitespace-pre-wrap select-text">
        {formattedText}
      </pre>
    );
  };

  const config = getFileTypeConfig(fileName, mimeType, type, url);
  const ModalIcon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] w-[92vw] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background border-border shadow-xl">
        {/* Header - pr-14 ensures Download button never overlaps the absolute X close icon */}
        <DialogHeader className="p-3 px-4 pr-14 border-b border-border flex flex-row items-center justify-between space-y-0 shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className={cn("size-8 rounded-lg flex items-center justify-center shrink-0", config.bgColor)}>
              <ModalIcon className={cn("size-4", config.iconColor)} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-sm font-semibold truncate">
                  {config.displayName}
                </DialogTitle>
                <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider shrink-0", config.badgeColor)}>
                  {config.label}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {config.subtext} {sizeKb ? `• ${sizeKb} KB` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              download={fileName}
            >
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                <Download className="size-3.5" />
                Download
              </Button>
            </a>
          </div>
        </DialogHeader>

        {/* Viewer Content Body */}
        <div className="flex-1 flex items-center justify-center p-3 bg-muted/20 min-h-[350px] max-h-[78vh] overflow-hidden">
          {/* PDF Viewer */}
          {isPdf ? (
            <iframe
              src={`${url}#toolbar=1`}
              title={fileName}
              className="w-full h-[75vh] rounded-lg border border-border bg-white"
            />
          ) : isText ? (
            renderTextBody()
          ) : isImage ? (
            /* Image Viewer */
            <div className="overflow-auto max-h-[75vh] flex items-center justify-center">
              <img
                src={url}
                alt={fileName}
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-sm border border-border/40"
              />
            </div>
          ) : isVideo ? (
            /* Video Player */
            <video
              controls
              autoPlay
              src={url}
              className="max-w-full max-h-[75vh] rounded-lg shadow-sm"
            >
              Your browser does not support the video tag.
            </video>
          ) : isAudio ? (
            /* Audio Player */
            <div className="flex flex-col items-center justify-center gap-4 p-8 bg-background rounded-xl border border-border shadow-sm w-full max-w-md">
              <div className="size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Volume2 className="size-8" />
              </div>
              <p className="text-sm font-medium text-foreground text-center truncate max-w-full">
                {fileName}
              </p>
              <audio controls autoPlay src={url} className="w-full">
                Your browser does not support the audio element.
              </audio>
            </div>
          ) : (
            /* Generic Binary File Card (zip, exe, etc.) */
            <div className="flex flex-col items-center justify-center gap-4 p-8 bg-background rounded-xl border border-border shadow-sm max-w-md w-full text-center">
              <div className="size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <FileText className="size-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground truncate max-w-[280px]">
                  {fileName}
                </h4>
                {sizeKb && (
                  <p className="text-xs text-muted-foreground">{sizeKb} KB</p>
                )}
              </div>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                download={fileName}
                className="w-full"
              >
                <Button className="w-full gap-2 text-xs">
                  <Download className="size-4" />
                  Download File
                </Button>
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
