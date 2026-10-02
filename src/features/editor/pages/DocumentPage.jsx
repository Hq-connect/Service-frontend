import React, { useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Loader2 } from "lucide-react";
import NotionEditor from "../components/NotionEditor";
import DocumentHeader from "../components/document/DocumentHeader";
import DocumentCover from "../components/document/DocumentCover";
import DocumentIconPicker from "../components/document/DocumentIconPicker";
import DocumentTitleInput from "../components/document/DocumentTitleInput";
import { useDocumentSession } from "../hooks/useDocumentSession";
import { setSaveStatus } from "../states/document.slice";
import { Button } from "@/components/ui/button";

export default function DocumentPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [liveContent, setLiveContent] = useState(null);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const saveStatusTimerRef = useRef(null);

  const {
    doc,
    isLoading,
    isError,
    isDocReady,
    isCollabReady,
    canEdit,
    updateMetadata,
    commentsData,
    activePeers,
    awareness,
    currentUserId,
    currentUserName,
    currentProfile,
    yjsXmlFragment,
    currentContent,
    getSnapshot,
  } = useDocumentSession(documentId);

  // Reset live content buffer when document switches
  React.useEffect(() => {
    setLiveContent(null);
  }, [documentId]);

  const effectiveContent = liveContent ?? currentContent;

  const handleEditorChange = useCallback((html) => {
    if (html) {
      setLiveContent(html);
    }
    dispatch(setSaveStatus("saving"));
    if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
    saveStatusTimerRef.current = setTimeout(() => {
      dispatch(setSaveStatus("saved"));
    }, 1500);
  }, [dispatch]);

  if (isLoading || !isDocReady) {
    return (
      <div className="flex-1 flex items-center justify-center h-full text-muted-foreground gap-2">
        <Loader2 className="size-5 animate-spin text-primary" />
        <span className="text-sm font-medium">Loading document...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
        <p className="text-sm">Failed to load document or access denied.</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigate("/docs")}
        >
          Return to Docs
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-background text-foreground">
      <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar relative">
        {/* Top Header with breadcrumb, collaborator presence, and modals */}
        <DocumentHeader
          documentId={documentId}
          title={doc?.title}
          icon={doc?.icon}
          canEdit={canEdit}
          activePeers={activePeers}
          currentContent={effectiveContent}
          getSnapshot={getSnapshot}
          onNavigateBack={() => navigate("/docs")}
        />

        {/* Optional Cover Banner and Gradient Picker */}
        <DocumentCover
          documentId={documentId}
          initialCover={doc?.coverImage}
          canEdit={canEdit}
          showCoverPicker={showCoverPicker}
          setShowCoverPicker={setShowCoverPicker}
          onUpdateMetadata={updateMetadata}
        />

        {/* Document Header Controls: Icon & Title */}
        <div className="max-w-4xl w-full mx-auto px-6 sm:px-12 md:px-16 pt-8 pb-4">
          <DocumentIconPicker
            documentId={documentId}
            initialIcon={doc?.icon}
            canEdit={canEdit}
            hasCover={Boolean(doc?.coverImage)}
            onUpdateMetadata={updateMetadata}
            onOpenCoverPicker={() => setShowCoverPicker(true)}
          />

          <DocumentTitleInput
            documentId={documentId}
            initialTitle={doc?.title}
            canEdit={canEdit}
            onUpdateMetadata={updateMetadata}
          />
        </div>

        {/* Real-time Collaborative Notion Editor Canvas */}
        {isCollabReady && isDocReady ? (
          <NotionEditor
            key={documentId}
            readOnly={!canEdit}
            content={currentContent}
            onChange={handleEditorChange}
            awareness={awareness}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            currentUserProfile={currentProfile}
            yjsXmlFragment={yjsXmlFragment}
            onCreateComment={commentsData.createComment}
            comments={commentsData.comments}
            onResolveComment={commentsData.resolveComment}
            onReopenComment={commentsData.reopenComment}
            onAddReply={commentsData.addReply}
            onDeleteComment={commentsData.deleteComment}
          />
        ) : (
          <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span className="text-sm">Connecting…</span>
          </div>
        )}
      </div>
    </div>
  );
}
