import React, { useState } from "react";
import {
  useDriveContents,
  useFolderDetails,
  useCreateFolder,
  useRenameFolder,
  useTrashFolder,
  useUploadFile,
  useRenameFile,
  useToggleStarFile,
  useTrashFile,
} from "../queries/drive.queries";
import driveService from "../services/drive.service";
import DriveHeader from "../components/DriveHeader";
import DriveKpiStrip from "../components/DriveKpiStrip";
import FolderCard from "../components/FolderCard";
import FileCard from "../components/FileCard";
import FileListTable from "../components/FileListTable";
import CreateFolderModal from "../components/CreateFolderModal";
import UploadModal from "../components/UploadModal";
import FilePreviewModal from "../components/FilePreviewModal";
import RenameModal from "../components/RenameModal";
import { Loader2, FolderOpen } from "lucide-react";
import { toast } from "sonner";

export default function FilesPage() {
  // Navigation State
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'

  // Modal States
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [previewFile, setPreviewFile] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null); // { type: 'file' | 'folder', item }

  // React Queries
  const { data: contents, isLoading } = useDriveContents({
    folderId: currentFolderId,
    search: searchQuery,
  });

  const { data: currentFolder } = useFolderDetails(currentFolderId);

  // Mutations
  const createFolderMutation = useCreateFolder();
  const renameFolderMutation = useRenameFolder();
  const trashFolderMutation = useTrashFolder();

  const uploadFileMutation = useUploadFile();
  const renameFileMutation = useRenameFile();
  const toggleStarMutation = useToggleStarFile();
  const trashFileMutation = useTrashFile();

  // Navigation Handlers
  const handleOpenFolder = (folder) => {
    setBreadcrumbs((prev) => [...prev, { _id: folder._id, name: folder.name }]);
    setCurrentFolderId(folder._id);
  };

  const handleNavigateBreadcrumb = (targetFolderId) => {
    if (!targetFolderId) {
      // Go to Root
      setBreadcrumbs([]);
      setCurrentFolderId(null);
      return;
    }

    const index = breadcrumbs.findIndex((b) => b._id === targetFolderId);
    if (index !== -1) {
      setBreadcrumbs((prev) => prev.slice(0, index + 1));
      setCurrentFolderId(targetFolderId);
    }
  };

  // Upload Handler
  const handleUploadFile = (file, onSuccess) => {
    setUploadProgress(0);
    uploadFileMutation.mutate(
      {
        file,
        folderId: currentFolderId,
        onProgress: (percent) => setUploadProgress(percent),
      },
      {
        onSuccess: () => {
          setIsUploadOpen(false);
          onSuccess();
        },
      }
    );
  };

  // Download Handler
  const handleDownloadFile = async (file) => {
    try {
      const data = await driveService.getDownloadUrl(file._id, false);
      window.open(data.downloadUrl, "_blank");
    } catch {
      toast.error("Failed to generate download link");
    }
  };

  // Rename Handler
  const handleConfirmRename = (newName) => {
    if (!renameTarget) return;

    if (renameTarget.type === "folder") {
      renameFolderMutation.mutate(
        { folderId: renameTarget.item._id, name: newName },
        { onSuccess: () => setRenameTarget(null) }
      );
    } else {
      renameFileMutation.mutate(
        { fileId: renameTarget.item._id, name: newName },
        { onSuccess: () => setRenameTarget(null) }
      );
    }
  };

  const folders = contents?.folders || [];
  const files = contents?.files || [];
  const isEmpty = folders.length === 0 && files.length === 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-background p-5 sm:p-8 custom-scrollbar">
      <div className="max-w-6xl w-full mx-auto space-y-6 animate-fade-in">
        {/* Header with Breadcrumbs, Search, View Mode, and Action Buttons */}
        <DriveHeader
          currentFolder={currentFolder}
          breadcrumbs={breadcrumbs}
          onNavigateBreadcrumb={handleNavigateBreadcrumb}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onNewFolder={() => setIsCreateFolderOpen(true)}
          onUploadClick={() => setIsUploadOpen(true)}
        />

        {/* Metric KPI Strip */}
        <DriveKpiStrip folders={folders} files={files} />

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-xs gap-3">
            <Loader2 className="size-6 animate-spin text-primary" />
            <span>Loading files and folders...</span>
          </div>
        ) : isEmpty ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-2xl bg-card/50 text-center p-6">
            <div className="p-3 rounded-2xl bg-muted text-muted-foreground mb-3">
              <FolderOpen className="size-8 text-foreground/70" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">No files here yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              Upload documents, images, or media to store them securely in your Cloudflare R2 bucket.
            </p>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="space-y-6">
            {folders.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Folders ({folders.length})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {folders.map((folder) => (
                    <FolderCard
                      key={folder._id}
                      folder={folder}
                      onOpen={handleOpenFolder}
                      onRename={(f) => setRenameTarget({ type: "folder", item: f })}
                      onTrash={(id) => trashFolderMutation.mutate(id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {files.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Files ({files.length})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {files.map((file) => (
                    <FileCard
                      key={file._id}
                      file={file}
                      onPreview={setPreviewFile}
                      onDownload={handleDownloadFile}
                      onToggleStar={(id) => toggleStarMutation.mutate(id)}
                      onRename={(f) => setRenameTarget({ type: "file", item: f })}
                      onTrash={(id) => trashFileMutation.mutate(id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Table / List View */
          <FileListTable
            folders={folders}
            files={files}
            onOpenFolder={handleOpenFolder}
            onRenameFolder={(f) => setRenameTarget({ type: "folder", item: f })}
            onTrashFolder={(id) => trashFolderMutation.mutate(id)}
            onPreviewFile={setPreviewFile}
            onDownloadFile={handleDownloadFile}
            onToggleStarFile={(id) => toggleStarMutation.mutate(id)}
            onRenameFile={(f) => setRenameTarget({ type: "file", item: f })}
            onTrashFile={(id) => trashFileMutation.mutate(id)}
          />
        )}
      </div>

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        onCreateFolder={(name) =>
          createFolderMutation.mutate(
            { name, parentFolderId: currentFolderId },
            { onSuccess: () => setIsCreateFolderOpen(false) }
          )
        }
        isPending={createFolderMutation.isPending}
      />

      {/* Direct-to-R2 Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadFile={handleUploadFile}
        isUploading={uploadFileMutation.isPending}
        uploadProgress={uploadProgress}
      />

      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
      />

      {/* Rename Modal */}
      <RenameModal
        isOpen={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        initialName={renameTarget?.item?.name || ""}
        itemType={renameTarget?.type === "folder" ? "Folder" : "File"}
        onRename={handleConfirmRename}
        isPending={
          renameFolderMutation.isPending || renameFileMutation.isPending
        }
      />
    </div>
  );
}

