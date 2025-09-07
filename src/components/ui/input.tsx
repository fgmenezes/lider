import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, required, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    
    const inputElement = (
      <input
        id={inputId}
        type={type}
        className={cn(
          "input-base",
          error && "error",
          className
        )}
        ref={ref}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined}
        {...props}
      />
    )
    
    if (!label) {
      return (
        <div className="relative">
          {inputElement}
          {error && (
            <div id={`${inputId}-error`} className="text-error mt-1">
              {error}
            </div>
          )}
          {helperText && !error && (
            <div id={`${inputId}-help`} className="text-helper mt-1">
              {helperText}
            </div>
          )}
        </div>
      )
    }
    
    return (
      <div className="relative">
        <label htmlFor={inputId} className="text-label mb-1 block">
          {label}
          {required && <span className="ml-1" style={{ color: "var(--color-danger)" }}>*</span>}
        </label>
        {inputElement}
        {error && (
          <div id={`${inputId}-error`} className="text-error mt-1">
            {error}
          </div>
        )}
        {helperText && !error && (
          <div id={`${inputId}-help`} className="text-helper mt-1">
            {helperText}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }