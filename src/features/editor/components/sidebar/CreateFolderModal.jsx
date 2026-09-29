import React, { useState } from "react";
import { Folder, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PRESET_ICONS = ["📁", "🚀", "💡", "📊", "🎨", "📝", "⚙️", "📚", "💼", "🔬", "🎯", "🔒", "🌐", "⚡", "✨", "📌"];

export default function CreateFolderModal({ isOpen, onClose, onCreate, parentId = null, parentName = null }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📁");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Folder name cannot be empty");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await onCreate({
        name: name.trim(),
        icon,
        parentId,
      });
      setName("");
      setIcon("📁");
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to create folder");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md p-6 bg-card text-card-foreground rounded-xl shadow-2xl border border-border transition-all scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Folder className="size-4" />
            </span>
            <h3 className="text-base font-heading font-semibold text-foreground">
              {parentId ? `New Subfolder in "${parentName}"` : "New Folder"}
            </h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="p-2.5 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Folder Name
            </label>
            <Input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Engineering Specs, Product Roadmap..."
              className="w-full text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Select Icon
            </label>
            <div className="grid grid-cols-8 gap-1.5 p-2 bg-muted/50 rounded-lg border border-border">
              {PRESET_ICONS.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => setIcon(emoji)}
                  className={`size-8 text-base rounded-md flex items-center justify-center transition-all ${
                    icon === emoji
                      ? "bg-card shadow-xs ring-2 ring-primary scale-110"
                      : "hover:bg-card/70 hover:scale-105"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? "Creating..." : "Create Folder"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
