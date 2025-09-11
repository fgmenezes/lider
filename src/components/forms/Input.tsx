import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  register?: UseFormRegisterReturn;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, required = false, error, helperText, className = '', register, ...props }, ref) => {
    return (
      <div className="relative">
        <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
          {...props}
          {...register}
          ref={register?.ref || ref}
          className={
            `mt-1 block w-full border rounded-md shadow-sm p-3
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${error ? 'border-red-500' : 'border-[var(--color-border)]'}
            ${className}`
          }
        />
        {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
        {helperText && !error && <div className="text-xs text-gray-500 mt-1">{helperText}</div>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;