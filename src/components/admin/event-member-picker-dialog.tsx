"use client";

import * as React from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, UserPlus, Users } from "lucide-react";

import { cn, formatCurrency } from "@/lib/utils/format";
import { addEventMembers } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ErrorMessage } from "@/components/forms/error-message";
import { EmptyState } from "@/components/forms/empty-state";

type AssignableMember = {
  id: string;
  member_code: string | null;
  full_name: string;
  phone: string | null;
  email: string | null;
};

/**
 * Assigns existing members to an event. Only ids travel to the server, so member
 * personal data is never duplicated, and the assignable list is searched through
 * the server so a large members table does not have to be shipped to the browser.
 */
export function EventMemberPickerDialog({
  open,
  onOpenChange,
  eventId,
  defaultAssignedAmount,
  onAssigned,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  defaultAssignedAmount: number;
  onAssigned?: () => void;
}) {
  const [members, setMembers] = useState<AssignableMember[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaveTransition] = useTransition();

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/admin/events/${eventId}/assignable-members?search=${encodeURIComponent(search)}`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error("Could not load members");
        const payload = (await response.json()) as { members?: AssignableMember[] };
        setMembers(payload.members ?? []);
        setError(null);
      } catch (fetchError) {
        if ((fetchError as Error).name === "AbortError") return;
        setError("Unable to load members. Please try again.");
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [open, eventId, search]);

  const allSelected = members.length > 0 && members.every((member) => selected.has(member.id));

  const effectiveAmount = amount.trim() === "" ? defaultAssignedAmount : Number(amount);
  const effectiveTotal = effectiveAmount * selected.size;

  const toggle = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((current) => {
      if (allSelected) {
        const next = new Set(current);
        members.forEach((member) => next.delete(member.id));
        return next;
      }
      const next = new Set(current);
      members.forEach((member) => next.add(member.id));
      return next;
    });
  };

  const handleSubmit = () => {
    if (selected.size === 0) {
      setError("Select at least one member to assign.");
      return;
    }
    if (Number.isNaN(effectiveAmount) || effectiveAmount < 0) {
      setError("Assigned amount cannot be negative.");
      return;
    }

    const formData = new FormData();
    formData.set("event_id", eventId);
    formData.set("assigned_amount", String(effectiveAmount));
    selected.forEach((id) => formData.append("member_ids", id));

    startSaveTransition(async () => {
      const result = await addEventMembers(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Members assigned");
      setSelected(new Set());
      setSearch("");
      setAmount("");
      onAssigned?.();
      onOpenChange(false);
    });
  };

  const selectionSummary = useMemo(
    () => `${selected.size} selected · ${formatCurrency(effectiveTotal)}`,
    [selected.size, effectiveTotal]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>Add Members</DialogTitle>
          <DialogDescription>
            Members already assigned to this event are not listed. Assigning a member sets their
            contribution target from the per-head amount below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_11rem]">
            <div className="space-y-1.5">
              <Label htmlFor="member-search">Search members</Label>
              <Input
                id="member-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, ID or phone..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="assigned-amount">Assigned amount</Label>
              <Input
                id="assigned-amount"
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder={String(defaultAssignedAmount || 0)}
              />
            </div>
          </div>

          <div className="rounded-xl border border-black/[0.06]">
            <div className="flex items-center justify-between gap-2 border-b border-black/[0.06] px-3 py-2">
              <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  disabled={members.length === 0}
                  aria-label="Select all listed members"
                />
                {loading ? "Loading..." : `Select all (${members.length})`}
              </label>
              <span className="text-xs text-muted-foreground">{selectionSummary}</span>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {members.length === 0 && !loading ? (
                <div className="p-4">
                  <EmptyState
                    icon={Users}
                    title="No available members"
                    description={
                      search
                        ? "No members match this search."
                        : "Every active member is already assigned to this event."
                    }
                  />
                </div>
              ) : (
                members.map((member) => (
                  <label
                    key={member.id}
                    className="flex cursor-pointer items-center gap-3 border-b border-black/[0.04] px-3 py-2.5 last:border-0 hover:bg-black/[0.02]"
                  >
                    <Checkbox
                      checked={selected.has(member.id)}
                      onCheckedChange={() => toggle(member.id)}
                      aria-label={`Assign ${member.full_name}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {member.full_name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {member.member_code ? `${member.member_code} · ` : ""}
                        {member.phone ?? "No phone"}
                      </span>
                    </span>
                    {member.email ? (
                      <span className="hidden shrink-0 truncate text-xs text-muted-foreground sm:block">
                        {member.email}
                      </span>
                    ) : (
                      <span className="shrink-0 text-[10px] font-medium uppercase text-amber-700">
                        No email
                      </span>
                    )}
                  </label>
                ))
              )}
            </div>
          </div>

          <ErrorMessage message={error ?? undefined} />
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving || loading || selected.size === 0}
            className={cn("bg-[#064E3B] text-white hover:bg-[#065F46]")}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Assign {selected.size || ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}