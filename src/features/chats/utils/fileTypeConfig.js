import {
  FileText,
  FileCode,
  Table,
  Film,
  Volume2,
  Image as ImageIcon,
  FolderArchive,
  File,
  FileSpreadsheet,
  FileCode2,
  Globe,
} from "lucide-react";

export const getFileTypeConfig = (name = "", mimeType = "", type = "", url = "") => {
  let lower = (name || "").toLowerCase();
  
  // Fallback: extract filename from URL if name is not explicitly passed
  if (!lower && url) {
    try {
      const decoded = decodeURIComponent(url);
      lower = decoded.split("/").pop().split("?")[0].toLowerCase();
    } catch (e) {
      lower = (url || "").toLowerCase();
    }
  }

  const lowerMime = (mimeType || "").toLowerCase();
  const displayName = name || (url ? url.split("/").pop().split("?")[0] : "File");

  // Image
  if (type === "image" || lowerMime.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(lower)) {
    return {
      category: "image",
      icon: ImageIcon,
      iconColor: "text-blue-500 dark:text-blue-400",
      bgColor: "bg-blue-500/15 dark:bg-blue-500/25",
      borderAccent: "border border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/50 dark:hover:bg-blue-900/30",
      badgeColor: "bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold border border-blue-500/30",
      label: "IMAGE",
      subtext: "Image File",
      displayName,
    };
  }

  // Video
  if (
    type === "video" ||
    lowerMime.startsWith("video/") ||
    /\.(mp4|mov|mkv|webm|avi|flv)$/i.test(lower)
  ) {
    return {
      category: "video",
      icon: Film,
      iconColor: "text-pink-500 dark:text-pink-400",
      bgColor: "bg-pink-500/15 dark:bg-pink-500/25",
      borderAccent: "border border-pink-500/30 bg-pink-50/50 dark:bg-pink-950/20 hover:bg-pink-100/50 dark:hover:bg-pink-900/30",
      badgeColor: "bg-pink-500/20 text-pink-700 dark:text-pink-300 font-bold border border-pink-500/30",
      label: "VIDEO",
      subtext: "Video Clip",
      displayName,
    };
  }

  // Audio
  if (
    type === "audio" ||
    lowerMime.startsWith("audio/") ||
    /\.(mp3|wav|m4a|ogg|flac|aac)$/i.test(lower)
  ) {
    return {
      category: "audio",
      icon: Volume2,
      iconColor: "text-indigo-500 dark:text-indigo-400",
      bgColor: "bg-indigo-500/15 dark:bg-indigo-500/25",
      borderAccent: "border border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30",
      badgeColor: "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-500/30",
      label: "AUDIO",
      subtext: "Audio Track",
      displayName,
    };
  }

  // PDF
  if (lowerMime === "application/pdf" || lower.endsWith(".pdf")) {
    return {
      category: "pdf",
      icon: FileText,
      iconColor: "text-red-500 dark:text-red-400",
      bgColor: "bg-red-500/15 dark:bg-red-500/25",
      borderAccent: "border border-red-500/30 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100/50 dark:hover:bg-red-900/30",
      badgeColor: "bg-red-500/20 text-red-700 dark:text-red-300 font-bold border border-red-500/30",
      label: "PDF",
      subtext: "PDF Document",
      displayName,
    };
  }

  // CSV / Spreadsheet
  if (
    lowerMime === "text/csv" ||
    /\.(csv|xls|xlsx|ods)$/i.test(lower)
  ) {
    const isCsv = lower.endsWith(".csv");
    return {
      category: "csv",
      icon: FileSpreadsheet || Table,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/15 dark:bg-emerald-500/25",
      borderAccent: "border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30",
      badgeColor: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30",
      label: isCsv ? "CSV" : "EXCEL",
      subtext: isCsv ? "CSV Data Table" : "Spreadsheet",
      displayName,
    };
  }

  // Code / JSON / Web
  if (
    /\.(json|js|jsx|ts|tsx|py|html|css|java|cpp|c|cs|go|rs|php|sh|bash)$/i.test(lower)
  ) {
    const parts = lower.split(".");
    const ext = parts.length > 1 ? parts.pop().toUpperCase() : "CODE";
    return {
      category: "code",
      icon: FileCode2 || FileCode,
      iconColor: "text-amber-500 dark:text-amber-400",
      bgColor: "bg-amber-500/15 dark:bg-amber-500/25",
      borderAccent: "border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/50 dark:hover:bg-amber-900/30",
      badgeColor: "bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30",
      label: ext,
      subtext: `${ext} Source File`,
      displayName,
    };
  }

  // Text / Markdown / Word Documents
  if (
    /\.(md|markdown|txt|doc|docx|rtf|log)$/i.test(lower)
  ) {
    let label = "DOC";
    let subtext = "Document";
    if (lower.endsWith(".md") || lower.endsWith(".markdown")) {
      label = "MARKDOWN";
      subtext = "Markdown Document";
    } else if (lower.endsWith(".txt")) {
      label = "TEXT";
      subtext = "Text File";
    } else if (lower.endsWith(".log")) {
      label = "LOG";
      subtext = "Log File";
    } else if (lower.endsWith(".doc") || lower.endsWith(".docx")) {
      label = "WORD";
      subtext = "Word Document";
    }

    return {
      category: "doc",
      icon: FileText,
      iconColor: "text-sky-500 dark:text-sky-400",
      bgColor: "bg-sky-500/15 dark:bg-sky-500/25",
      borderAccent: "border border-sky-500/30 bg-sky-50/50 dark:bg-sky-950/20 hover:bg-sky-100/50 dark:hover:bg-sky-900/30",
      badgeColor: "bg-sky-500/20 text-sky-700 dark:text-sky-300 font-bold border border-sky-500/30",
      label,
      subtext,
      displayName,
    };
  }

  // Archives
  if (
    /\.(zip|rar|7z|tar|gz|bz2|xz)$/i.test(lower)
  ) {
    return {
      category: "archive",
      icon: FolderArchive,
      iconColor: "text-purple-500 dark:text-purple-400",
      bgColor: "bg-purple-500/15 dark:bg-purple-500/25",
      borderAccent: "border border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-100/50 dark:hover:bg-purple-900/30",
      badgeColor: "bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold border border-purple-500/30",
      label: "ZIP",
      subtext: "Archive Package",
      displayName,
    };
  }

  // Fallback
  return {
    category: "file",
    icon: File,
    iconColor: "text-muted-foreground",
    bgColor: "bg-muted",
    borderAccent: "border border-border bg-muted/30 hover:bg-muted/60",
    badgeColor: "bg-muted-foreground/15 text-muted-foreground font-bold border border-muted-foreground/20",
    label: "FILE",
    subtext: "Attachment",
    displayName,
  };
};

export const getLastMessageInfo = (lastMessage) => {
  if (!lastMessage) return { text: "No messages yet", icon: null, iconColor: "" };
  if (lastMessage.deletedAt) return { text: "This message was deleted.", icon: null, iconColor: "" };

  const content = lastMessage.content;
  if (typeof content === "string") {
    return { text: content.trim() || "No messages yet", icon: null, iconColor: "" };
  }

  const text = content?.text?.trim();
  if (text) return { text, icon: null, iconColor: "" };

  const attachments = content?.attachments || [];
  if (attachments.length > 0) {
    const first = attachments[0];
    const config = getFileTypeConfig(first.name, first.mimeType, first.type, first.url);

    if (config.category === "image") {
      return { text: "Photo", icon: config.icon, iconColor: config.iconColor };
    }
    if (config.category === "video") {
      return { text: "Video", icon: config.icon, iconColor: config.iconColor };
    }
    if (config.category === "audio") {
      return { text: "Audio Track", icon: config.icon, iconColor: config.iconColor };
    }
    return { text: config.displayName, icon: config.icon, iconColor: config.iconColor };
  }

  if (content?.linkPreview) {
    return {
      text: content.linkPreview.title || content.linkPreview.hostname || "Link",
      icon: Globe,
      iconColor: "text-blue-500",
    };
  }

  return { text: "No messages yet", icon: null, iconColor: "" };
};
