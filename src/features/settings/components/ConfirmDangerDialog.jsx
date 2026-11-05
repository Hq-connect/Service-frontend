import { useState } from "react";
import { AlertCircle, Eye, EyeOff, TriangleAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Re-authentication dialog for sensitive owner actions.
 * Collects the owner's password (and optionally a type-to-confirm phrase),
 * then calls `onConfirm(password)`. API errors are shown inline.
 */
export function ConfirmDangerDialog({
  open,
  onOpenChange,
  title,
  description,
  consequences = [],
  confirmLabel = "Confirm",
  confirmPhrase,
  isLoading = false,
  onConfirm,
  children,
}) {
  const [password, setPassword] = useState("");
  const [phrase, setPhrase] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setPassword("");
    setPhrase("");
    setShowPassword(false);
    setError("");
  };

  const handleOpenChange = (next) => {
    if (isLoading) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const phraseOk = !confirmPhrase || phrase.trim() === confirmPhrase;
  const canSubmit = password.length > 0 && phraseOk && !isLoading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    try {
      await onConfirm(password);
      reset();
      onOpenChange(false);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center justify-center shrink-0">
                <TriangleAlert className="size-4 text-destructive" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-base font-semibold">
                  {title}
                </DialogTitle>
                {description && (
                  <DialogDescription className="text-xs leading-relaxed">
                    {description}
                  </DialogDescription>
                )}
              </div>
            </div>
          </DialogHeader>

          {consequences.length > 0 && (
            <ul className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 space-y-1.5 text-xs text-muted-foreground list-disc list-inside">
              {consequences.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          )}

          {children}

          {confirmPhrase && (
            <div className="space-y-1.5">
              <Label htmlFor="danger-phrase" className="text-xs">
                Type{" "}
                <span className="font-mono text-foreground">
                  {confirmPhrase}
                </span>{" "}
                to confirm
              </Label>
              <Input
                id="danger-phrase"
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                autoComplete="off"
                className="font-mono text-xs"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="danger-password" className="text-xs">
              Confirm with your password
            </Label>
            <div className="relative">
              <Input
                id="danger-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setError("");
                  setPassword(e.target.value);
                }}
                placeholder="••••••••"
                aria-invalid={!!error}
                className="pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              <AlertCircle className="size-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={!canSubmit}
            >
              {isLoading ? "Working…" : confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmDangerDialog;

