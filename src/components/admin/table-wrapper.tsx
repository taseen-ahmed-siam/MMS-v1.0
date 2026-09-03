"use client"

import * as React from "react"
import { Inbox } from "lucide-react"

import { cn } from "@/lib/utils/format"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

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
    <Card className={cn("rounded-2xl border shadow-sm", className)}>
      {(title || actions) && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            {title && <CardTitle className="text-lg">{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </CardHeader>
      )}
      <CardContent className="p-0">
        {empty ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">{emptyTitle}</h3>
            {emptyDescription && (
              <p className="mt-1 text-sm text-muted-foreground">{emptyDescription}</p>
            )}
            {emptyAction && <div className="mt-4">{emptyAction}</div>}
          </div>
        ) : (
          <div className="overflow-x-auto">{children}</div>
        )}
      </CardContent>
    </Card>
  )
}

export { AdminTableWrapper }
export type { AdminTableWrapperProps }
