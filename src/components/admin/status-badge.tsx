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

function StatusBadge({ status, statuses, className }: StatusBadgeProps) {
  const config = statuses.find((s) => s.value === status)

  if (!config) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
          className,
        )}
      >
        {status}
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.color.replace(/text-/g, "bg-"))} />
      <span className={config.color}>{config.label}</span>
    </span>
  )
}

export { StatusBadge }
export type { StatusBadgeProps, StatusConfig }
