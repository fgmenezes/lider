import React from 'react';

interface SimpleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const SimpleInput = ({ label, ...props }: SimpleInputProps) => (
  <div>
    <label>
      {label}
      <input {...props} />
    </label>
  </div>
);

export default SimpleInput; 