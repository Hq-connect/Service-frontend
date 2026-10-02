import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentTree } from "../hooks/useDocumentTree";
import CreateFolderModal from "../components/sidebar/CreateFolderModal";
import DocsDashboardHeader from "../components/dashboard/DocsDashboardHeader";
import TemplateGrid from "../components/dashboard/TemplateGrid";
import RecentDocumentsList from "../components/dashboard/RecentDocumentsList";

export default function DocsDashboard() {
  const navigate = useNavigate();
  const { folders, rootDocuments, createDocument, createFolder } = useDocumentTree();
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

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-background p-6 sm:p-10 custom-scrollbar">
      <div className="max-w-6xl w-full mx-auto space-y-10">
        <DocsDashboardHeader
          onNewFolder={() => setIsFolderModalOpen(true)}
          onNewDocument={handleNewDocument}
          isCreating={isCreating}
        />

        <TemplateGrid createDocument={createDocument} />

        <RecentDocumentsList
          folders={folders}
          rootDocuments={rootDocuments}
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
