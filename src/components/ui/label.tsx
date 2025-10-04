import * as React from "react"
import { cn } from "@/lib/utils"

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          "text-[var(--color-text-primary)]",
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="ml-1 text-[var(--color-danger)]">*</span>}
      </label>
    )
  }
)
Label.displayName = "Label"

export { Label }