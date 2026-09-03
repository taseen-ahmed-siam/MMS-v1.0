"use client"

import * as React from "react"
import type { UseFormRegisterReturn } from "react-hook-form"

import { cn } from "@/lib/utils/format"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface FormInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string
  name: string
  error?: string
  register?: UseFormRegisterReturn
}

function FormInput({
  label,
  name,
  error,
  register,
  type = "text",
  placeholder,
  required,
  className,
  ...props
}: FormInputProps) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={name}
        className={cn(error && "text-destructive")}
      >
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      <Input
        id={name}
        type={type}
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

export { FormInput }
export type { FormInputProps }
