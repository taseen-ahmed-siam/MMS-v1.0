import * as React from "react"

import { cn } from "@/lib/utils/format"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import type { VariantProps } from "class-variance-authority"
import type { buttonVariants } from "@/components/ui/button"

interface FormSubmitButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  children: React.ReactNode
}

function FormSubmitButton({
  loading = false,
  children,
  className,
  variant = "default",
  disabled,
  ...props
}: FormSubmitButtonProps) {
  return (
    <Button
      type="submit"
      variant={variant}
      className={cn(className)}
      disabled={loading || disabled}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </Button>
  )
}

export { FormSubmitButton }
export type { FormSubmitButtonProps }
