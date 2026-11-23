import React from "react";
import { Folder, HardDrive, Star, FileText } from "lucide-react";

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export default function DriveKpiStrip({ folders = [], files = [] }) {
  const totalFiles = files.length;
  const totalFolders = folders.length;
  const totalBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const starredCount = files.filter((f) => f.isStarred).length;

  const kpis = [
    {
      label: "Total Files",
      value: totalFiles,
      sub: "Active objects",
      icon: FileText,
    },
    {
      label: "Folders",
      value: totalFolders,
      sub: "Collections",
      icon: Folder,
    },
    {
      label: "Storage Used",
      value: formatBytes(totalBytes),
      sub: "Cloudflare R2",
      icon: HardDrive,
    },
    {
      label: "Starred",
      value: starredCount,
      sub: "Quick access",
      icon: Star,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.label}
            className="rounded-xl border border-border bg-card px-4 py-3 shadow-(--shadow-card)"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium text-muted-foreground">
                {kpi.label}
              </p>
              <Icon className="size-3.5 text-muted-foreground" />
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <p className="text-xl font-bold tracking-tight text-foreground font-mono tabular-nums">
                {kpi.value}
              </p>
              <span className="text-[10px] text-muted-foreground truncate">
                {kpi.sub}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

