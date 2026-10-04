import { useEffect, useRef, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "sonner";
import { useDocument } from "./useDocument";
import { useDocumentSync } from "./useDocumentSync";
import { useDocumentComments } from "./useDocumentComments";
import {
  setActiveDocumentId,
  clearActiveDocumentId,
  setIsCollabReady,
} from "../states/document.slice";
import { getUserProfile, extractUser, getUserDisplayName } from "../utils/userProfile";
import useAuth from "@/features/auth/hooks/useAuth";

/**
 * Custom hook to orchestrate document lifecycle, Redux active state,
 * collaborative Yjs CRDT session, awareness, and comments for a document page.
 */
export function useDocumentSession(documentId) {
  const dispatch = useDispatch();

  const activeDocumentId = useSelector((state) => state.document?.activeDocumentId);
  const isCollabReady = useSelector((state) => state.document?.isCollabReady) ?? false;
  const saveStatus = useSelector((state) => state.document?.saveStatus) || "saved";

  const {
    document: doc,
    isLoading,
    isError,
    updateMetadata: rawUpdateMetadata,
  } = useDocument(documentId);

  const commentsData = useDocumentComments(documentId);

  const { user: authUser } = useAuth();
  const currentUser = extractUser(authUser);
  const currentUserName = getUserDisplayName(currentUser);
  const authUserId = currentUser?._id || currentUser?.id;

  const appliedDocIdRef = useRef(null);

  const canEdit = Boolean(doc?.userRole === "owner" || doc?.userRole === "editor");

  const {
    activePeers,
    awareness,
    currentUserId: syncUserId,
    yjsXmlFragment,
    applyServerSnapshot,
    getSnapshot,
  } = useDocumentSync(documentId, canEdit);

  const currentUserId = authUserId || syncUserId || "";

  const updateMetadata = useCallback(
    async (updates) => {
      if (!canEdit) {
        toast.error("You have view-only access. You cannot edit this document.");
        return;
      }
      return await rawUpdateMetadata(updates);
    },
    [canEdit, rawUpdateMetadata]
  );

  // Manage active document id lifecycle in Redux store
  useEffect(() => {
    dispatch(setActiveDocumentId(documentId));
    appliedDocIdRef.current = null;

    return () => {
      dispatch(clearActiveDocumentId());
      appliedDocIdRef.current = null;
    };
  }, [documentId, dispatch]);

  // Apply server snapshot strictly when documentId matches active state and query doc
  useEffect(() => {
    if (
      !activeDocumentId ||
      activeDocumentId !== documentId ||
      !yjsXmlFragment ||
      !doc ||
      String(doc._id) !== String(documentId)
    ) {
      if (isCollabReady) {
        dispatch(setIsCollabReady(false));
      }
      return;
    }

    if (appliedDocIdRef.current === documentId) {
      if (!isCollabReady) {
        dispatch(setIsCollabReady(true));
      }
      return;
    }

    if (doc.yjsSnapshot) {
      applyServerSnapshot(doc.yjsSnapshot);
    }

    appliedDocIdRef.current = documentId;
    dispatch(setIsCollabReady(true));
  }, [
    activeDocumentId,
    documentId,
    yjsXmlFragment,
    doc,
    applyServerSnapshot,
    dispatch,
    isCollabReady,
  ]);

  const currentProfile = useMemo(() => {
    return getUserProfile(authUser || currentUser || { name: currentUserName, _id: currentUserId });
  }, [authUser, currentUser, currentUserName, currentUserId]);

  const resolvedContent = useMemo(() => {
    if (!doc?.content) return "<p></p>";
    if (typeof doc.content === "string") return doc.content;
    if (doc.content?.html) return doc.content.html;
    if (doc.content?.type === "doc" && doc.content?.content?.length > 0) return doc.content;
    return "<p></p>";
  }, [doc?.content]);

  const isDocReady = Boolean(
    activeDocumentId &&
    String(activeDocumentId) === String(documentId) &&
    doc &&
    String(doc._id) === String(documentId)
  );

  return {
    doc,
    isLoading,
    isError,
    isDocReady,
    isCollabReady,
    saveStatus,
    canEdit,
    activeDocumentId,
    updateMetadata,
    commentsData,
    activePeers,
    awareness,
    currentUserId,
    currentUserName,
    currentProfile,
    yjsXmlFragment,
    currentContent: resolvedContent,
    getSnapshot,
  };
}

export default useDocumentSession;
