import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function RecentDocumentsList({
  documents,
  folders = [],
  rootDocuments = [],
  onSelectDocument,
}) {
  const navigate = useNavigate();

  // If pre-flattened documents are provided, use them; otherwise flatten tree automatically
  const allDocuments = useMemo(() => {
    if (Array.isArray(documents)) {
      return documents;
    }
    const list = [...rootDocuments];
    const extractFromFolder = (f) => {
      if (f.documents) list.push(...f.documents);
      if (f.subfolders) f.subfolders.forEach(extractFromFolder);
    };
    folders.forEach(extractFromFolder);
    return list.sort(
      (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
    );
  }, [documents, folders, rootDocuments]);

  const handleSelect = (doc) => {
    if (onSelectDocument) {
      onSelectDocument(doc);
    } else if (doc?._id) {
      navigate(`/docs/${doc._id}`);
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Clock className="size-3.5 text-muted-foreground" />
        <span>Recent Documents</span>
      </h2>

      {allDocuments.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-border bg-card text-card-foreground">
          <BookOpen className="size-8 mx-auto text-muted-foreground/60 mb-2" />
          <p className="text-sm font-semibold text-foreground">
            No documents found
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Start by creating a blank document or using a template above.
          </p>
        </div>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="divide-y divide-border">
            {allDocuments.slice(0, 15).map((doc) => (
              <div
                key={doc._id}
                onClick={() => handleSelect(doc)}
                className="flex items-center justify-between p-3.5 hover:bg-muted/50 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3 truncate min-w-0">
                  <span className="text-xl shrink-0">{doc.icon || "📄"}</span>
                  <div className="truncate">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                      {doc.title || "Untitled"}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {doc.folderId ? "In Folder" : "Workspace Root"} • Last edited{" "}
                      {doc.updatedAt
                        ? new Date(doc.updatedAt).toLocaleDateString()
                        : "recently"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="secondary" className="capitalize text-[10px]">
                    {doc.generalAccess
                      ? doc.generalAccess.replace("_", " ")
                      : "restricted"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
