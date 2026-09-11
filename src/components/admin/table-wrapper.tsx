"use client"

import * as React from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faInbox } from "@fortawesome/free-solid-svg-icons"

import { cn } from "@/lib/utils/format"

interface AdminTableWrapperProps {
  title?: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  empty?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  className?: string
}

function AdminTableWrapper({
  title,
  description,
  actions,
  children,
  empty = false,
  emptyTitle = "No results",
  emptyDescription = "No records found.",
  emptyAction,
  className,
}: AdminTableWrapperProps) {
  return (
    <div className={cn("rounded-2xl border border-black/5 bg-white shadow-sm", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-black/[0.05] px-6 py-4">
          <div className="space-y-0.5">
            {title && <h3 className="text-base font-bold text-foreground">{title}</h3>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-0">
        {empty ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60">
              <FontAwesomeIcon icon={faInbox} className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-foreground">{emptyTitle}</h3>
            {emptyDescription && (
              <p className="mt-1 text-xs text-muted-foreground">{emptyDescription}</p>
            )}
            {emptyAction && <div className="mt-4">{emptyAction}</div>}
          </div>
        ) : (
          <div className="overflow-x-auto">{children}</div>
        )}
      </div>
    </div>
  )
}

export { AdminTableWrapper }
export type { AdminTableWrapperProps }
