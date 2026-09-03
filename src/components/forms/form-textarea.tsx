"use client"

import * as React from "react"
import type { UseFormRegisterReturn } from "react-hook-form"

import { cn } from "@/lib/utils/format"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface FormTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
  label: string
  name: string
  error?: string
  register?: UseFormRegisterReturn
}

function FormTextarea({
  label,
  name,
  error,
  register,
  placeholder,
  required,
  className,
  ...props
}: FormTextareaProps) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={name}
        className={cn(error && "text-destructive")}
      >
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      <Textarea
        id={name}
        placeholder={placeholder}
        className={cn(error && "border-destructive focus-visible:ring-destructive", className)}
        {...register}
        {...props}
      />
      {error && (
        <p className="text-sm font-medium text-destructive">{error}</p>
      )}
    </div>
  )
}

export { FormTextarea }
export type { FormTextareaProps }
