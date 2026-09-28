import React, { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus, FolderPlus, FilePlus, Search, Loader2 } from "lucide-react";
import { useDocumentTree } from "../../hooks/useDocumentTree";
import FolderTreeItem from "./FolderTreeItem";
import DocumentTreeItem from "./DocumentTreeItem";
import CreateFolderModal from "./CreateFolderModal";
import { Button } from "@/components/ui/button";

export default function DocsSidebarTree() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract active document ID if URL is /docs/:documentId
  const match = location.pathname.match(/\/docs\/([^/?]+)/);
  const activeDocumentId = match ? match[1] : null;

  const {
    folders,
    rootDocuments,
    isLoading,
    createFolder,
    updateFolder,
    deleteFolder,
    createDocument,
    deleteDocument,
    archiveDocument,
  } = useDocumentTree();

  const [searchQuery, setSearchQuery] = useState("");
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [subfolderContext, setSubfolderContext] = useState(null);
  const [isCreatingPage, setIsCreatingPage] = useState(false);

  // Quick page creation at root
  const handleCreateRootPage = async () => {
    try {
      setIsCreatingPage(true);
      const newDoc = await createDocument({
        title: "Untitled",
        icon: "📄",
        folderId: null,
      });
      if (newDoc?._id) {
        navigate(`/docs/${newDoc._id}`);
      }
    } catch (err) {
      console.error("Failed to create document:", err);
    } finally {
      setIsCreatingPage(false);
    }
  };

  // Quick page creation inside a specific folder
  const handleCreateDocInFolder = async (folderId) => {
    try {
      const newDoc = await createDocument({
        title: "Untitled",
        icon: "📄",
        folderId,
      });
      if (newDoc?._id) {
        navigate(`/docs/${newDoc._id}`);
      }
    } catch (err) {
      console.error("Failed to create document in folder:", err);
    }
  };

  // Subfolder modal opener
  const handleOpenSubfolderModal = (parentId, parentName) => {
    setSubfolderContext({ parentId, parentName });
    setIsFolderModalOpen(true);
  };

  // Rename folder
  const handleRenameFolder = async (id, name) => {
    await updateFolder({ id, updates: { name } });
  };

  // Filter tree by search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) {
      return { folders, rootDocuments };
    }
    const q = searchQuery.toLowerCase();

    const filterFolder = (f) => {
      const nameMatches = f.name?.toLowerCase().includes(q);
      const matchingDocs = (f.documents || []).filter((d) =>
        d.title?.toLowerCase().includes(q)
      );
      const matchingSubs = (f.subfolders || [])
        .map(filterFolder)
        .filter(Boolean);

      if (nameMatches || matchingDocs.length > 0 || matchingSubs.length > 0) {
        return {
          ...f,
          documents: matchingDocs,
          subfolders: matchingSubs,
        };
      }
      return null;
    };

    const matchingFolders = folders.map(filterFolder).filter(Boolean);
    const matchingRootDocs = rootDocuments.filter((d) =>
      d.title?.toLowerCase().includes(q)
    );

    return {
      folders: matchingFolders,
      rootDocuments: matchingRootDocs,
    };
  }, [folders, rootDocuments, searchQuery]);

  const isEmpty =
    filteredData.folders.length === 0 && filteredData.rootDocuments.length === 0;

  return (
    <div className="flex flex-col h-full overflow-hidden text-sidebar-foreground">
      {/* Top Header Actions */}
      <div className="px-3 pt-3 pb-2 flex items-center justify-between border-b border-sidebar-border">
        <span className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider">
          Docs
        </span>
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title="New Folder"
            onClick={() => {
              setSubfolderContext(null);
              setIsFolderModalOpen(true);
            }}
            className="text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
          >
            <FolderPlus className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title="New Page"
            disabled={isCreatingPage}
            onClick={handleCreateRootPage}
            className="text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
          >
            {isCreatingPage ? (
              <Loader2 className="size-3.5 animate-spin text-primary" />
            ) : (
              <FilePlus className="size-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Quick Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search docs..."
            className="w-full pl-7 pr-2.5 py-1 text-xs rounded-md bg-sidebar-accent/50 border border-sidebar-border/60 text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 transition-all"
          />
        </div>
      </div>

      {/* Scrollable Tree View */}
      <div className="flex-1 overflow-y-auto px-1.5 py-1 space-y-0.5 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-xs gap-2">
            <Loader2 className="size-3.5 animate-spin text-primary" />
            <span>Loading workspace...</span>
          </div>
        ) : isEmpty ? (
          <div className="px-3 py-8 text-center text-xs text-muted-foreground">
            {searchQuery ? (
              <p>No results matching "{searchQuery}"</p>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <p>No documents or folders yet</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCreateRootPage}
                  className="text-primary hover:text-primary hover:bg-primary/10 gap-1 text-xs"
                >
                  <Plus className="size-3" />
                  <span>Create first page</span>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Folders List */}
            {filteredData.folders.map((folder) => (
              <FolderTreeItem
                key={folder._id}
                folder={folder}
                depth={0}
                activeDocumentId={activeDocumentId}
                onCreateDocInFolder={handleCreateDocInFolder}
                onCreateSubfolder={handleOpenSubfolderModal}
                onRenameFolder={handleRenameFolder}
                onDeleteFolder={deleteFolder}
                onDeleteDoc={deleteDocument}
                onArchiveDoc={archiveDocument}
              />
            ))}

            {/* Root Documents */}
            {filteredData.rootDocuments.map((doc) => (
              <DocumentTreeItem
                key={doc._id}
                doc={doc}
                depth={0}
                isActive={doc._id === activeDocumentId}
                onDelete={deleteDocument}
                onArchive={archiveDocument}
              />
            ))}
          </>
        )}
      </div>

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={isFolderModalOpen}
        onClose={() => {
          setIsFolderModalOpen(false);
          setSubfolderContext(null);
        }}
        onCreate={createFolder}
        parentId={subfolderContext?.parentId || null}
        parentName={subfolderContext?.parentName || null}
      />
    </div>
  );
}
