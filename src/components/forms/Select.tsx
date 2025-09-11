import React, { forwardRef, useState } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, required = false, error, helperText, options, className = '', ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = props.value && String(props.value).length > 0;

    return (
      <div className="relative">
        <select
          {...props}
          ref={ref}
          className={`
            mt-1 block w-full border rounded-md shadow-sm p-3 pt-5 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${error ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'}
            ${className}
          `}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
        >
          <option value="">Selecione</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <label 
          className={`
            absolute left-3 transition-all duration-200 pointer-events-none
            ${hasValue || isFocused 
              ? 'text-xs text-[var(--color-primary)] -top-1 bg-[var(--bg-primary)] px-1' 
              : 'text-sm text-[var(--text-muted)] top-3'
            }
          `}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
        {helperText && !error && <div className="text-xs text-[var(--text-muted)] mt-1">{helperText}</div>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;