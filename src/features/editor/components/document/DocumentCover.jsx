import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { socket } from "@/socket/config/socket.config";
import { PRESET_COVERS } from "../../constants/coversAndEmojis";

export default function DocumentCover({
  documentId,
  initialCover,
  canEdit = true,
  showCoverPicker,
  setShowCoverPicker,
  onUpdateMetadata,
}) {
  const [customCover, setCustomCover] = useState(undefined);

  useEffect(() => {
    setCustomCover(undefined);
  }, [documentId]);

  // Listen for remote cover updates
  useEffect(() => {
    if (!socket || !documentId) return;

    const handleRemoteMetadata = ({ documentId: remoteDocId, updates }) => {
      if (remoteDocId === documentId && updates?.coverImage !== undefined) {
        setCustomCover(updates.coverImage);
      }
    };

    socket.on("doc:metadata:updated", handleRemoteMetadata);
    return () => {
      socket.off("doc:metadata:updated", handleRemoteMetadata);
    };
  }, [documentId]);

  const displayCover = customCover !== undefined ? customCover : initialCover;

  const handleSelectCover = async (cover) => {
    if (!canEdit) return;
    setCustomCover(cover);
    if (setShowCoverPicker) setShowCoverPicker(false);

    if (socket && documentId) {
      socket.emit("doc:metadata:update", {
        documentId,
        updates: { coverImage: cover },
      });
    }

    try {
      if (onUpdateMetadata) {
        await onUpdateMetadata({ coverImage: cover });
      }
    } catch (err) {
      console.error("Failed to update cover:", err);
    }
  };

  const handleRemoveCover = async () => {
    if (!canEdit) return;
    setCustomCover(null);
    if (setShowCoverPicker) setShowCoverPicker(false);

    if (socket && documentId) {
      socket.emit("doc:metadata:update", {
        documentId,
        updates: { coverImage: null },
      });
    }

    try {
      if (onUpdateMetadata) {
        await onUpdateMetadata({ coverImage: null });
      }
    } catch (err) {
      console.error("Failed to remove cover:", err);
    }
  };

  return (
    <>
      {/* Cover Banner if image/gradient is set */}
      {displayCover && (
        <div
          className="w-full h-44 sm:h-52 relative group"
          style={{ background: displayCover }}
        >
          {canEdit && (
            <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowCoverPicker && setShowCoverPicker(true)}
              >
                Change Cover
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleRemoveCover}
              >
                Remove
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Cover Picker Popover */}
      {showCoverPicker && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setShowCoverPicker && setShowCoverPicker(false)}
          />
          <div className="relative z-40 mb-4 p-3 bg-popover text-popover-foreground border border-border rounded-xl shadow-xl space-y-2 max-w-4xl mx-auto">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
              <span>Choose a cover gradient</span>
              <button
                type="button"
                onClick={() => setShowCoverPicker && setShowCoverPicker(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COVERS.map((cov, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectCover(cov)}
                  style={{ background: cov }}
                  className="h-12 rounded-lg border border-border/40 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                />
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
