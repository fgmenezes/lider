import React from 'react';

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  required?: boolean;
  error?: string;
  className?: string;
}

const RadioGroup = React.forwardRef<HTMLInputElement, RadioGroupProps>(
  (
    {
      label,
      value,
      onChange,
      options,
      required = false,
      error,
      className,
    },
    ref
  ) => {
    return (
      <fieldset className={`space-y-2 ${className || ''}`}>
        <legend className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </legend>
        <div className="mt-1 space-y-2">
          {options.map((option, idx) => (
            <div key={option.value} className="flex items-center">
              <input
                id={`${label}-${option.value}`}
                type="radio"
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                className={\`h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 \${error ? 'border-red-500' : ''}\`}
                required={required}
                ref={idx === 0 ? ref : undefined}
              />
              <label htmlFor={`${label}-${option.value}`} className="ml-2 block text-sm text-gray-900">
                {option.label}
              </label>
            </div>
          ))}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </fieldset>
    );
  }
);

RadioGroup.displayName = "RadioGroup";

export default RadioGroup;