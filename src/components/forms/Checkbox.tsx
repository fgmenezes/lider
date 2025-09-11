import React from 'react';
import { UseFormRegister, FieldError } from 'react-hook-form';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  register?: UseFormRegister<any> | any;
  error?: FieldError;
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  name,
  register,
  error,
  className,
  ...rest
}) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center">
        <input
          id={name}
          type="checkbox"
          {...(typeof register === 'function' ? register(name) : {})}
          className={
            `h-4 w-4 text-blue-600 border-[var(--color-border)] rounded focus:ring-blue-500
            ${error ? 'border-red-500' : ''}
            ${className || ''}`
          }
          {...rest}
        />
        <label htmlFor={name} className="ml-2 block text-sm text-gray-900">
          {label}
        </label>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error.message}</p>
      )}
    </div>
  );
};

export default Checkbox;