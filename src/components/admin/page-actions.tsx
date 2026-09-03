"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { cn } from "@/lib/utils/format"
import { Button } from "@/components/ui/button"

interface PageActionsProps {
  onNew?: () => void
  newLabel?: string
  children?: React.ReactNode
  className?: string
}

function PageActions({
  onNew,
  newLabel = "New",
  children,
  className,
}: PageActionsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {children}
      {onNew && (
        <Button onClick={onNew} size="sm">
          <Plus className="h-4 w-4" />
          {newLabel}
        </Button>
      )}
    </div>
  )
}

export { PageActions }
export type { PageActionsProps }
