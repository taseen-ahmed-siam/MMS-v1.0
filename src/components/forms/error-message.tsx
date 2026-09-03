import * as React from "react"

import { cn } from "@/lib/utils/format"
import { AlertCircle } from "lucide-react"

interface ErrorMessageProps {
  message?: string
  className?: string
}

function ErrorMessage({ message, className }: ErrorMessageProps) {
  if (!message) return null

  return (
    <div className={cn("flex items-center gap-1.5 text-sm font-medium text-destructive", className)}>
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

export { ErrorMessage }
export type { ErrorMessageProps }
