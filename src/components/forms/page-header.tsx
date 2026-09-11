import * as React from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core"

import { cn } from "@/lib/utils/format"

interface PageHeaderProps {
  title: string
  description?: string
  icon?: IconDefinition
  children?: React.ReactNode
  className?: string
}

function PageHeader({ title, description, icon, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#064E3B]/10">
            <FontAwesomeIcon icon={icon} className="h-5 w-5 text-[#064E3B]" />
          </div>
        )}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}

export { PageHeader }
export type { PageHeaderProps }
