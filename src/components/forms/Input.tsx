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
    // Log para depuração
    if (register) {
      console.log('[Input] register:', register);
      if (register.ref) {
        console.log('[Input] register.ref:', register.ref);
      }
    }
    if (ref) {
      console.log('[Input] forwardRef:', ref);
    }

    // Espalhar register por último para garantir que o ref do RHF não seja sobrescrito
    return (
      <div className="relative">
        <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
          ref={ref}
          {...props}
          {...(register ? Object.fromEntries(Object.entries(register).filter(([k]) => k !== 'ref')) : {})}
          className={
            `mt-1 block w-full border rounded-md shadow-sm p-3
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${error ? 'border-red-500' : 'border-gray-300'}
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