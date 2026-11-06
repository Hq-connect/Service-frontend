import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Search, Plus, ArrowRight, Folder, FileText, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function RecentDocumentsList({
  documents,
  folders = [],
  rootDocuments = [],
  onSelectDocument,
  onNewDocument,
}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Flatten tree automatically while preserving folder name reference
  const allDocuments = useMemo(() => {
    if (Array.isArray(documents)) {
      return documents;
    }
    const list = rootDocuments.map((d) => ({ ...d, _folderName: "Workspace Root" }));
    const extractFromFolder = (f) => {
      if (f.documents) {
        list.push(
          ...f.documents.map((d) => ({
            ...d,
            _folderName: f.name || "In Folder",
          }))
        );
      }
      if (f.subfolders) f.subfolders.forEach(extractFromFolder);
    };
    folders.forEach(extractFromFolder);
    return list.sort(
      (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
    );
  }, [documents, folders, rootDocuments]);

  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return allDocuments;
    const q = searchQuery.toLowerCase();
    return allDocuments.filter(
      (d) =>
        (d.title || "Untitled").toLowerCase().includes(q) ||
        (d._folderName || "").toLowerCase().includes(q)
    );
  }, [allDocuments, searchQuery]);

  const handleSelect = (doc) => {
    if (onSelectDocument) {
      onSelectDocument(doc);
    } else if (doc?._id) {
      navigate(`/docs/${doc._id}`);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card text-card-foreground shadow-(--shadow-card) overflow-hidden">
      {/* Section Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-border">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
              Recent Workspace Documents
            </h2>
            <Badge variant="outline" className="font-mono tabular-nums text-[10px] h-4 px-1.5">
              {filteredDocuments.length}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            All pages ordered by most recent collaborative activity.
          </p>
        </div>

        {/* Inline Search Filter */}
        <div className="relative w-full sm:w-64">
          <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter documents…"
            className="w-full h-8 pl-8 pr-7 rounded-lg border border-input bg-background text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="py-14 px-6 text-center">
          <div className="size-11 rounded-xl bg-muted/70 border border-border flex items-center justify-center mx-auto mb-3 shadow-2xs">
            <BookOpen className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            {searchQuery.trim()
              ? `No documents matching "${searchQuery}"`
              : "No documents in workspace yet"}
          </p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            {searchQuery.trim()
              ? "Try a different keyword or clear the search filter."
              : "Start by creating a blank document or selecting a blueprint above."}
          </p>
          {searchQuery.trim() ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="h-8 text-xs cursor-pointer"
            >
              Clear filter
            </Button>
          ) : (
            onNewDocument && (
              <Button
                size="sm"
                onClick={onNewDocument}
                className="h-8 text-xs gap-1.5 cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>Create Document</span>
              </Button>
            )
          )}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {/* Table-style column header */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-5 py-2.5 bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <div className="col-span-6">Document</div>
            <div className="col-span-3">Location</div>
            <div className="col-span-2">Access</div>
            <div className="col-span-1 text-right">Edited</div>
          </div>

          {filteredDocuments.slice(0, 20).map((doc) => {
            const editedDate = doc.updatedAt
              ? new Date(doc.updatedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                })
              : "Recent";

            return (
              <div
                key={doc._id}
                onClick={() => handleSelect(doc)}
                className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-4 px-5 py-3 hover:bg-muted/40 cursor-pointer transition-colors group"
              >
                {/* Title + Icon */}
                <div className="sm:col-span-6 flex items-center gap-3 min-w-0">
                  <div className="size-8 rounded-lg bg-muted/70 border border-border/70 flex items-center justify-center text-base shrink-0 shadow-2xs">
                    {doc.icon || "📄"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {doc.title || "Untitled"}
                    </p>
                    <p className="text-[11px] text-muted-foreground sm:hidden">
                      {doc._folderName || (doc.folderId ? "In Folder" : "Workspace Root")} · {editedDate}
                    </p>
                  </div>
                </div>

                {/* Folder Location */}
                <div className="hidden sm:flex sm:col-span-3 items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                  {doc.folderId ? (
                    <Folder className="size-3.5 shrink-0 text-muted-foreground" />
                  ) : (
                    <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="truncate">
                    {doc._folderName || (doc.folderId ? "In Folder" : "Workspace Root")}
                  </span>
                </div>

                {/* Access */}
                <div className="hidden sm:flex sm:col-span-2 items-center">
                  <Badge variant="secondary" className="capitalize text-[10px]">
                    {doc.generalAccess
                      ? doc.generalAccess.replace("_", " ")
                      : "workspace"}
                  </Badge>
                </div>

                {/* Last Edited + Arrow */}
                <div className="hidden sm:flex sm:col-span-1 items-center justify-end gap-1.5 text-xs font-mono tabular-nums text-muted-foreground">
                  <span>{editedDate}</span>
                  <ArrowRight className="size-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-foreground shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
