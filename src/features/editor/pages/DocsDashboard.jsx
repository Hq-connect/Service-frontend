import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentTree } from "../hooks/useDocumentTree";
import CreateFolderModal from "../components/sidebar/CreateFolderModal";
import DocsDashboardHeader from "../components/dashboard/DocsDashboardHeader";
import TemplateGrid from "../components/dashboard/TemplateGrid";
import RecentDocumentsList from "../components/dashboard/RecentDocumentsList";

export default function DocsDashboard() {
  const navigate = useNavigate();
  const { folders = [], rootDocuments = [], createDocument, createFolder } = useDocumentTree();
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleNewDocument = async () => {
    try {
      setIsCreating(true);
      const newDoc = await createDocument({
        title: "Untitled",
        icon: "📄",
        content: "<h1></h1><p></p>",
      });
      if (newDoc?._id) {
        navigate(`/docs/${newDoc._id}`);
      }
    } catch (err) {
      console.error("Failed to create document:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const totalDocumentsCount = useMemo(() => {
    let count = rootDocuments.length;
    const countFolder = (f) => {
      if (f.documents) count += f.documents.length;
      if (f.subfolders) f.subfolders.forEach(countFolder);
    };
    folders.forEach(countFolder);
    return count;
  }, [folders, rootDocuments]);

  const kpis = [
    { label: "Total documents", value: totalDocumentsCount, sub: "Knowledge pages" },
    { label: "Folders", value: folders.length, sub: "Collections" },
    { label: "Root pages", value: rootDocuments.length, sub: "Top-level docs" },
    { label: "Sync mode", value: "Live", sub: "Real-time Yjs" },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-background p-5 sm:p-8 custom-scrollbar">
      <div className="max-w-6xl w-full mx-auto space-y-6 animate-fade-in">
        <DocsDashboardHeader
          onNewFolder={() => setIsFolderModalOpen(true)}
          onNewDocument={handleNewDocument}
          isCreating={isCreating}
        />

        {/* KPI Metric Strip (Matches Settings & ProjectsDashboard) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl border border-border bg-card px-4 py-3 shadow-(--shadow-card)"
            >
              <p className="text-[11px] font-medium text-muted-foreground">
                {kpi.label}
              </p>
              <div className="mt-1 flex items-baseline justify-between gap-2">
                <p className="text-xl font-bold tracking-tight text-foreground font-mono tabular-nums">
                  {kpi.value}
                </p>
                <span className="text-[10px] text-muted-foreground truncate">
                  {kpi.sub}
                </span>
              </div>
            </div>
          ))}
        </div>

        <TemplateGrid createDocument={createDocument} />

        <RecentDocumentsList
          folders={folders}
          rootDocuments={rootDocuments}
          onNewDocument={handleNewDocument}
        />
      </div>

      <CreateFolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onCreate={createFolder}
      />
    </div>
  );
}
