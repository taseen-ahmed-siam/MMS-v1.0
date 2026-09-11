"use client"

import * as React from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPlus } from "@fortawesome/free-solid-svg-icons"

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
          <FontAwesomeIcon icon={faPlus} className="mr-1.5 h-3.5 w-3.5" />
          {newLabel}
        </Button>
      )}
    </div>
  )
}

export { PageActions }
export type { PageActionsProps }
