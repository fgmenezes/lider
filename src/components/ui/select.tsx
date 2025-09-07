import * as React from "react"
import { cn } from "@/lib/utils"

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  options: SelectOption[]
  placeholder?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, required, id, options, placeholder, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`
    
    const selectElement = (
      <select
        id={selectId}
        className={cn(
          "input-base cursor-pointer",
          error && "error",
          className
        )}
        ref={ref}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-help` : undefined}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    )
    
    if (!label) {
      return (
        <div className="relative">
          {selectElement}
          {error && (
            <div id={`${selectId}-error`} className="text-error mt-1">
              {error}
            </div>
          )}
          {helperText && !error && (
            <div id={`${selectId}-help`} className="text-helper mt-1">
              {helperText}
            </div>
          )}
        </div>
      )
    }
    
    return (
      <div className="relative">
        <label htmlFor={selectId} className="text-label mb-1 block">
          {label}
          {required && <span className="ml-1" style={{ color: "var(--color-danger)" }}>*</span>}
        </label>
        {selectElement}
        {error && (
          <div id={`${selectId}-error`} className="text-error mt-1">
            {error}
          </div>
        )}
        {helperText && !error && (
          <div id={`${selectId}-help`} className="text-helper mt-1">
            {helperText}
          </div>
        )}
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }