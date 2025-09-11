import * as React from "react"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`
    
    return (
      <div className="relative">
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id={checkboxId}
            ref={ref}
            className={cn(
              "h-4 w-4 rounded border transition-default focus-ring",
              "checked:bg-primary checked:border-primary",
              error ? "border-[var(--color-danger)]" : "border-[var(--color-border)]",
              className
            )}
            style={{
              accentColor: 'var(--color-primary)'
            }}
            {...props}
          />
          {label && (
            <label 
              htmlFor={checkboxId} 
              className="text-sm font-medium cursor-pointer"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {label}
            </label>
          )}
        </div>
        {error && (
          <div className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>
            {error}
          </div>
        )}
        {helperText && !error && (
          <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {helperText}
          </div>
        )}
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }