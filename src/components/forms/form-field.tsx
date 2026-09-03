import * as React from "react"

import { cn } from "@/lib/utils/format"
import { Label } from "@/components/ui/label"

interface FormFieldProps {
  label: string
  name: string
  error?: string
  required?: boolean
  children: React.ReactNode
}

function FormField({ label, name, error, required, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className={cn(error && "text-destructive")}>
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-sm font-medium text-destructive">{error}</p>
      )}
    </div>
  )
}

export { FormField }
export type { FormFieldProps }
