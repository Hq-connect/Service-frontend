import { useState } from "react";
import {
  Mail,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  Sparkles,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import useWorkspaceInvites from "../hooks/useWorkspaceInvites";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InviteMembersModal() {
  const {
    isInviteModalOpen,
    closeInviteModal,
    inviteUsers,
    isInviting,
  } = useWorkspaceInvites({ fetchList: false });

  const [rows, setRows] = useState([{ email: "", role: "member" }]);
  const [bulkInput, setBulkInput] = useState("");
  const [mode, setMode] = useState("rows"); // "rows" | "bulk"
  const [bulkRole, setBulkRole] = useState("member");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const resetState = () => {
    setRows([{ email: "", role: "member" }]);
    setBulkInput("");
    setMode("rows");
    setBulkRole("member");
    setError("");
    setResult(null);
  };

  const handleOpenChange = (open) => {
    if (!open) {
      closeInviteModal();
      setTimeout(resetState, 150);
    }
  };

  const handleAddRow = () => {
    if (rows.length >= 20) return;
    setRows((prev) => [...prev, { email: "", role: "member" }]);
  };

  const handleRemoveRow = (index) => {
    if (rows.length <= 1) {
      setRows([{ email: "", role: "member" }]);
      return;
    }
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index, field, value) => {
    setError("");
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    let invitesPayload = [];

    if (mode === "rows") {
      const filled = rows
        .map((r) => ({ email: r.email.trim().toLowerCase(), role: r.role }))
        .filter((r) => r.email.length > 0);

      if (filled.length === 0) {
        setError("Enter at least one work email address.");
        return;
      }

      const invalid = filled.find((r) => !EMAIL_REGEX.test(r.email));
      if (invalid) {
        setError(`"${invalid.email}" is not a valid email address.`);
        return;
      }

      invitesPayload = filled;
    } else {
      const emails = bulkInput
        .split(/[\s,;]+/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      const uniqueEmails = [...new Set(emails)];
      if (uniqueEmails.length === 0) {
        setError("Paste at least one email address.");
        return;
      }
      if (uniqueEmails.length > 20) {
        setError("You can invite up to 20 members at a time.");
        return;
      }
      const invalid = uniqueEmails.find((em) => !EMAIL_REGEX.test(em));
      if (invalid) {
        setError(`"${invalid}" is not a valid email address.`);
        return;
      }

      invitesPayload = uniqueEmails.map((email) => ({
        email,
        role: bulkRole,
      }));
    }

    try {
      const res = await inviteUsers(invitesPayload);
      setResult(res?.data || res || { invited: [], skipped: [] });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to send invitations. Please check email addresses and try again."
      );
    }
  };

  return (
    <Dialog open={isInviteModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg p-5">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-muted border border-border flex items-center justify-center text-foreground">
              <UserPlus className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Invite people to workspace
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Invited teammates receive a single-use link valid for 48 hours.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {result ? (
          <div className="space-y-4 py-2">
            {result.invited?.length > 0 && (
              <div className="rounded-lg border border-status-live-border bg-status-live/50 p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-status-live-foreground text-xs font-medium">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>
                    Sent <span className="tabular-nums font-semibold">{result.invited.length}</span>{" "}
                    {result.invited.length === 1 ? "invitation" : "invitations"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.invited.map((item) => (
                    <Badge
                      key={item.id || item.email}
                      variant="secondary"
                      className="font-mono text-[11px]"
                    >
                      {item.email} · {item.role}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {result.skipped?.length > 0 && (
              <div className="rounded-lg border border-status-warn-border bg-status-warn/50 p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-status-warn-foreground text-xs font-medium">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>
                    Skipped <span className="tabular-nums font-semibold">{result.skipped.length}</span>{" "}
                    {result.skipped.length === 1 ? "address" : "addresses"}
                  </span>
                </div>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {result.skipped.map((s, idx) => (
                    <li key={idx} className="flex items-center justify-between gap-2">
                      <span className="font-mono text-foreground truncate">{s.email}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0">{s.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <DialogFooter className="mt-4">
              <Button variant="outline" size="sm" onClick={resetState}>
                Invite more
              </Button>
              <Button size="sm" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {/* Mode switcher */}
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="inline-flex rounded-lg bg-muted p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setMode("rows");
                    setError("");
                  }}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    mode === "rows"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Individual rows
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("bulk");
                    setError("");
                  }}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    mode === "bulk"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Bulk paste
                </button>
              </div>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                Max 20 per batch
              </span>
            </div>

            {mode === "rows" ? (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {rows.map((row, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Mail className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        type="email"
                        placeholder="colleague@company.com"
                        value={row.email}
                        onChange={(e) =>
                          handleRowChange(index, "email", e.target.value)
                        }
                        className="pl-8"
                      />
                    </div>

                    <Select
                      value={row.role}
                      onValueChange={(val) =>
                        handleRowChange(index, "role", val)
                      }
                    >
                      <SelectTrigger className="w-28 capitalize">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemoveRow(index)}
                      disabled={rows.length === 1 && !row.email}
                      aria-label="Remove row"
                    >
                      <Trash2 className="size-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                ))}

                {rows.length < 20 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAddRow}
                    className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
                  >
                    <Plus className="size-3.5" /> Add another email
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Email addresses (comma, space, or newline separated)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="alex@company.com, priya@company.com, sam@company.com"
                    value={bulkInput}
                    onChange={(e) => {
                      setError("");
                      setBulkInput(e.target.value);
                    }}
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Assign role to all pasted addresses
                  </span>
                  <Select value={bulkRole} onValueChange={setBulkRole}>
                    <SelectTrigger className="w-32 capitalize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

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
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isInviting}>
                <Sparkles className="size-3.5 mr-1" />
                {isInviting ? "Sending invites…" : "Send invitations"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default InviteMembersModal;

