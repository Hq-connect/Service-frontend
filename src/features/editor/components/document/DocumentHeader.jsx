import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { ChevronLeft, Cloud, CheckCircle2, AlertCircle, History, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUserProfile } from "../../utils/userProfile";
import VersionHistoryPanel from "../VersionHistoryPanel";
import ShareModal from "../ShareModal";

export default function DocumentHeader({
  documentId,
  title,
  icon,
  canEdit = true,
  activePeers = [],
  currentContent = "",
  getSnapshot = null,
  onNavigateBack,
}) {
  const saveStatus = useSelector((state) => state.document?.saveStatus) || "saved";
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const uniquePeers = useMemo(() => {
    const seen = new Set();
    return activePeers.filter((p) => {
      const profile = getUserProfile(p.user || p);
      const key = profile._id || profile.email || profile.name;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [activePeers]);

  return (
    <>
      <header className="sticky top-0 z-999 flex items-center justify-between h-14 px-6 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onNavigateBack}
            title="All Documents"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{icon || "📄"}</span>
            <span className="font-heading font-medium text-foreground truncate max-w-48 sm:max-w-xs">
              {title || "Untitled"}
            </span>
          </div>

          {/* Auto-save status indicator */}
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground pl-2">
            {saveStatus === "saving" ? (
              <>
                <Cloud className="size-3 animate-pulse text-primary" />
                <span>Saving...</span>
              </>
            ) : saveStatus === "error" ? (
              <>
                <AlertCircle className="size-3 text-destructive" />
                <span className="text-destructive font-medium">Failed to save</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="size-3 text-emerald-500" />
                <span>Saved</span>
              </>
            )}
          </div>

          {!canEdit && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 border-border text-muted-foreground ml-1"
            >
              View only
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Active Collaborator Presence Avatars */}
          {uniquePeers.length > 0 && (
            <div className="flex items-center -space-x-1.5 mr-2">
              {uniquePeers.map((peer, i) => {
                const profile = getUserProfile(peer.user || peer);

                return (
                  <div
                    key={peer.socketId || peer.clientId || profile._id || i}
                    title={`${profile.name} (Active now)`}
                    className="size-7 rounded-full ring-2 ring-background flex items-center justify-center font-heading font-bold text-[10px] shadow-sm cursor-default select-none transition-transform hover:scale-110"
                    style={profile.avatarStyle}
                  >
                    {profile.initials}
                  </div>
                );
              })}
            </div>
          )}

          {/* Version History Button */}
          <Button
            type="button"
            variant={isVersionsOpen ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setIsVersionsOpen((prev) => !prev)}
            className="gap-1.5 text-xs"
            title="Version history"
          >
            <History className="size-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">History</span>
          </Button>

          {/* Share Modal Button */}
          <Button
            type="button"
            size="sm"
            onClick={() => setIsShareOpen(true)}
            className="gap-1.5 text-xs shadow-xs"
          >
            <Share2 className="size-3.5" />
            <span>Share</span>
          </Button>
        </div>
      </header>

      {/* Full-Sized Version History Modal */}
      <VersionHistoryPanel
        isOpen={isVersionsOpen}
        onClose={() => setIsVersionsOpen(false)}
        documentId={documentId}
        currentContent={currentContent}
        getSnapshot={getSnapshot}
        documentTitle={title}
      />

      {/* Collaborator & Share Permissions Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        documentId={documentId}
      />
    </>
  );
}
