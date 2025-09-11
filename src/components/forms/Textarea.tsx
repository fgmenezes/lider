import React from 'react';
import { UseFormRegister, FieldError } from 'react-hook-form';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  name: string;
  register: UseFormRegister<any>; // Tipo genérico para registrar com RHF
  error?: FieldError; // Tipo para erros de validação do RHF
}

const Textarea: React.FC<TextareaProps> = ({
  label,
  name,
  register,
  error,
  className, // Permite adicionar classes Tailwind externas
  ...rest // Restante das props do textarea (rows, placeholder, etc.)
}) => {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium text-[var(--text-primary)]">
        {label}
      </label>
      <textarea
        id={name}
        {...register(name)} // Integração com React Hook Form
        className={
          `w-full px-3 py-2 mt-1 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none sm:text-sm
          ${error ? 'border-[var(--color-danger)] focus:ring-[var(--color-danger)] focus:border-[var(--color-danger)]' : 'border-[var(--color-border)] focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]'}
          ${className || ''}` // Adiciona classes customizadas
        }
        {...rest}
      />
      {error && (
        <p className="mt-1 text-sm text-[var(--color-danger)]">{error.message}</p>
      )}
    </div>
  );
};

export default Textarea;