import {
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileArchive,
  FileSpreadsheet,
  File,
} from "lucide-react";

export function getFileIcon(mimeType = "", fileName = "") {
  const ext = fileName.split(".").pop()?.toLowerCase();

  if (mimeType.startsWith("image/") || ["png", "jpg", "jpeg", "svg", "webp", "gif"].includes(ext)) {
    return { icon: FileImage, color: "text-blue-500", bg: "bg-blue-500/10" };
  }
  if (mimeType.startsWith("video/") || ["mp4", "webm", "mkv", "mov"].includes(ext)) {
    return { icon: FileVideo, color: "text-purple-500", bg: "bg-purple-500/10" };
  }
  if (mimeType.startsWith("audio/") || ["mp3", "wav", "ogg", "m4a"].includes(ext)) {
    return { icon: FileAudio, color: "text-amber-500", bg: "bg-amber-500/10" };
  }
  if (mimeType === "application/pdf" || ext === "pdf") {
    return { icon: FileText, color: "text-red-500", bg: "bg-red-500/10" };
  }
  if (["js", "jsx", "ts", "tsx", "html", "css", "json", "py", "rs", "go"].includes(ext)) {
    return { icon: FileCode, color: "text-emerald-500", bg: "bg-emerald-500/10" };
  }
  if (["zip", "tar", "gz", "7z", "rar"].includes(ext)) {
    return { icon: FileArchive, color: "text-orange-500", bg: "bg-orange-500/10" };
  }
  if (["csv", "xlsx", "xls"].includes(ext)) {
    return { icon: FileSpreadsheet, color: "text-green-500", bg: "bg-green-500/10" };
  }

  return { icon: File, color: "text-muted-foreground", bg: "bg-muted" };
}

export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function formatShortDate(iso) {
  if (!iso) return "Recently";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "Recently";
  }
}

