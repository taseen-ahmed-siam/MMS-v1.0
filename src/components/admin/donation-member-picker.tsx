"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Search, UserCheck, X } from "lucide-react";

import { cn } from "@/lib/utils/format";

export type DonationMemberOption = {
  id: string;
  member_code: string;
  full_name: string;
  phone: string | null;
  email: string | null;
};

type LinkedMember = DonationMemberOption | null;

/**
 * Picks the member a counter-recorded donation belongs to.
 *
 * This is the only control that sets `donations.member_id`, which is what event
 * contribution tracking joins on, so leaving it empty is safe: the donation is
 * simply not attributable to a member's assigned target. Picking from a search
 * result -- rather than typing a name that is then matched loosely -- keeps a
 * donation from being attributed to the wrong person when two members share a
 * name or a phone number.
 */
export function DonationMemberPicker({
  value,
  onChange,
  disabled,
}: {
  value: LinkedMember;
  onChange: (member: DonationMemberOption | null) => void;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<DonationMemberOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Debounced so typing does not fire a request per keystroke, with the
  // in-flight request aborted if the term changes again first.
  useEffect(() => {
    if (disabled) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/admin/donations/members?search=${encodeURIComponent(search)}`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error("Could not load members");
        const payload = (await response.json()) as { members?: DonationMemberOption[] };
        setOptions(payload.members ?? []);
        setError(null);
      } catch (fetchError) {
        if ((fetchError as Error).name === "AbortError") return;
        setError("Unable to search members. Please try again.");
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [search, disabled]);

  const select = (member: DonationMemberOption) => {
    onChange(member);
    setSearch("");
    setShowResults(false);
    setOptions([]);
  };

  const clear = () => {
    onChange(null);
    setSearch("");
    setShowResults(false);
  };

  if (value) {
    return (
      <div className="space-y-1.5">
        <span className="text-sm font-medium text-foreground">Member</span>
        <div className="flex items-center justify-between gap-2 rounded-lg border border-[#064E3B]/20 bg-[#064E3B]/[0.04] px-3 py-2">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <UserCheck className="h-3.5 w-3.5 shrink-0 text-[#064E3B]" />
              <span className="truncate">{value.full_name}</span>
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {value.member_code}
              {value.phone ? ` · ${value.phone}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={clear}
            disabled={disabled}
            aria-label="Remove linked member"
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-black/[0.06] hover:text-foreground disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Counts towards this member&apos;s event contribution target.
        </p>
      </div>
    );
  }

  return (
    <div className="relative space-y-1.5">
      <label htmlFor="donation-member" className="text-sm font-medium text-foreground">
        Member <span className="font-normal text-muted-foreground">(optional)</span>
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id="donation-member"
          type="text"
          value={search}
          disabled={disabled}
          onChange={(event) => {
            setSearch(event.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 150)}
          placeholder="Search name, ID or phone"
          autoComplete="off"
          className="h-9 w-full rounded-lg border border-black/[0.1] bg-white pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-[#064E3B]/40 focus:ring-2 focus:ring-[#064E3B]/15 disabled:opacity-50"
        />
      </div>

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}

      {showResults && (
        <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-black/[0.1] bg-white shadow-lg">
          {loading && <p className="px-3 py-2 text-xs text-muted-foreground">Searching…</p>}
          {!loading && options.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              {search.trim().length < 2
                ? "Type at least 2 characters to search."
                : "No members found."}
            </p>
          )}
          {!loading &&
            options.map((member) => (
              <button
                key={member.id}
                type="button"
                // onMouseDown fires before the input's onBlur, so the click is
                // not lost when the results panel unmounts.
                onMouseDown={(event) => {
                  event.preventDefault();
                  select(member);
                }}
                className={cn(
                  "flex w-full flex-col items-start px-3 py-2 text-left transition-colors hover:bg-black/[0.04]"
                )}
              >
                <span className="text-sm font-medium text-foreground">{member.full_name}</span>
                <span className="text-xs text-muted-foreground">
                  {member.member_code}
                  {member.phone ? ` · ${member.phone}` : ""}
                </span>
              </button>
            ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Link a member so this donation counts towards their event contribution.
      </p>
    </div>
  );
}