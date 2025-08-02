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

const RadioGroup = React.forwardRef<HTMLFieldSetElement, RadioGroupProps>(
  ({ label, value, onChange, options, required = false, error, className }, ref) => {
    return (
      <fieldset ref={ref} className={`space-y-2 ${className || ''}`}>
        <legend className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </legend>

        {options.map((option) => (
          <label key={option.value} className="inline-flex items-center space-x-2">
            <input
              type="radio"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="form-radio"
            />
            <span>{option.label}</span>
          </label>
        ))}

        {error && <p className="text-red-500 text-sm">{error}</p>}
      </fieldset>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';

export default RadioGroup;