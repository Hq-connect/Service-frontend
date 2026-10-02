import React, { useState, useEffect } from "react";
import { Image, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { socket } from "@/socket/config/socket.config";
import { EMOJI_CATEGORIES } from "../../constants/coversAndEmojis";

export default function DocumentIconPicker({
  documentId,
  initialIcon = "📄",
  canEdit = true,
  hasCover = false,
  onUpdateMetadata,
  onOpenCoverPicker,
}) {
  const [customIcon, setCustomIcon] = useState(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearch, setIconSearch] = useState("");

  useEffect(() => {
    setCustomIcon(null);
    setShowIconPicker(false);
    setIconSearch("");
  }, [documentId]);

  // Listen for remote icon updates
  useEffect(() => {
    if (!socket || !documentId) return;

    const handleRemoteMetadata = ({ documentId: remoteDocId, updates }) => {
      if (remoteDocId === documentId && updates?.icon !== undefined) {
        setCustomIcon(updates.icon);
      }
    };

    socket.on("doc:metadata:updated", handleRemoteMetadata);
    return () => {
      socket.off("doc:metadata:updated", handleRemoteMetadata);
    };
  }, [documentId]);

  const displayIcon = customIcon ?? (initialIcon || "📄");

  const handleSelectIcon = async (newIcon) => {
    if (!canEdit) return;
    setCustomIcon(newIcon);
    setShowIconPicker(false);
    setIconSearch("");

    if (socket && documentId) {
      socket.emit("doc:metadata:update", {
        documentId,
        updates: { icon: newIcon },
      });
    }

    try {
      if (onUpdateMetadata) {
        await onUpdateMetadata({ icon: newIcon });
      }
    } catch (err) {
      console.error("Failed to update icon:", err);
    }
  };

  return (
    <>
      {/* Quick Header Controls (Add Cover / Change Icon) */}
      {canEdit && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 opacity-60 hover:opacity-100 transition-opacity">
          {!hasCover && (
            <button
              type="button"
              onClick={onOpenCoverPicker}
              className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
            >
              <Image className="size-3.5" />
              <span>Add cover</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowIconPicker(true)}
            className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
          >
            <Smile className="size-3.5" />
            <span>Change icon</span>
          </button>
        </div>
      )}

      {/* Large Document Icon */}
      <div className="relative inline-block mb-3">
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => canEdit && setShowIconPicker((prev) => !prev)}
          className={`text-5xl transition-transform ${
            canEdit ? "hover:scale-105 active:scale-95 cursor-pointer" : "cursor-default"
          }`}
          title={canEdit ? "Click to change icon" : ""}
        >
          {displayIcon}
        </button>

        {/* Icon Picker Popover */}
        {showIconPicker && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => {
                setShowIconPicker(false);
                setIconSearch("");
              }}
            />
            <div className="absolute left-0 top-full mt-2 z-40 w-80 max-h-96 p-3 bg-popover text-popover-foreground border border-border rounded-xl shadow-2xl flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-100">
              {/* Search and Quick Actions */}
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  placeholder="Paste or search emoji..."
                  className="flex-1 px-2.5 py-1 text-xs rounded-md bg-accent/40 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
                {iconSearch.trim() && (
                  <Button
                    type="button"
                    size="xs"
                    variant="default"
                    onClick={() => handleSelectIcon(iconSearch.trim())}
                  >
                    Use
                  </Button>
                )}
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() => handleSelectIcon("📄")}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Reset
                </Button>
              </div>

              {/* Categorized Emoji Grid */}
              <div className="flex-1 overflow-y-auto space-y-2.5 max-h-64 pr-1 custom-scrollbar">
                {EMOJI_CATEGORIES.map((cat) => {
                  const visibleEmojis = iconSearch.trim()
                    ? cat.emojis.filter((e) => e.includes(iconSearch.trim()))
                    : cat.emojis;
                  if (iconSearch.trim() && visibleEmojis.length === 0) return null;
                  return (
                    <div key={cat.category} className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                        {cat.category}
                      </span>
                      <div className="grid grid-cols-7 gap-1">
                        {visibleEmojis.map((emoji, idx) => (
                          <button
                            key={`${cat.category}-${idx}`}
                            type="button"
                            onClick={() => handleSelectIcon(emoji)}
                            className="size-8 text-lg flex items-center justify-center rounded-lg hover:bg-accent hover:scale-110 active:scale-95 transition-all cursor-pointer select-none"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
