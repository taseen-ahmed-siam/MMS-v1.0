"use client"

import * as React from "react"

import { cn } from "@/lib/utils/format"

interface StatusConfig {
  value: string
  label: string
  color: string
}

interface StatusBadgeProps {
  status: string
  statuses: StatusConfig[]
  className?: string
}

const PILL_STYLES: Record<string, string> = {
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  processing: "bg-amber-50 text-amber-700 ring-amber-600/20",
  on_hold: "bg-amber-50 text-amber-700 ring-amber-600/20",
  failed: "bg-red-50 text-red-700 ring-red-600/20",
  refused: "bg-red-50 text-red-700 ring-red-600/20",
  rejected: "bg-red-50 text-red-700 ring-red-600/20",
  inactive: "bg-slate-100 text-slate-600 ring-slate-500/20",
  resolved: "bg-sky-50 text-sky-700 ring-sky-600/20",
  open: "bg-orange-50 text-orange-700 ring-orange-600/20",
  overdue: "bg-red-50 text-red-700 ring-red-600/20",
}

function StatusBadge({ status, statuses, className }: StatusBadgeProps) {
  const config = statuses.find((s) => s.value === status)
  const label = config?.label ?? status
  const style = PILL_STYLES[status] ?? "bg-slate-100 text-slate-600 ring-slate-500/20"

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        style,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      <span className="capitalize">{label}</span>
    </span>
  )
}

export { StatusBadge }
export type { StatusBadgeProps, StatusConfig }
