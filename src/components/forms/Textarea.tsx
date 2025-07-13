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
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <textarea
        id={name}
        {...register(name)} // Integração com React Hook Form
        className={
          `w-full px-3 py-2 mt-1 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none sm:text-sm
          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
          ${className || ''}` // Adiciona classes customizadas
        }
        {...rest}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error.message}</p>
      )}
    </div>
  );
};

export default Textarea; 