import React from 'react';
import { UseFormRegister, FieldError } from 'react-hook-form';

// Nota: O tipo para o register de inputs file é FileList ou File
// dependendo se a prop 'multiple' está presente.
// Para simplicidade, usamos 'any' no register aqui, mas em um
// schema Zod, você precisaria validar o tipo FileList/File.
interface FileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  register: UseFormRegister<any>; // Use UseFormRegister<FormValues> com o tipo correto do seu formulário
  error?: FieldError; // Tipo para erros de validação do RHF
}

const FileInput: React.FC<FileInputProps> = ({
  label,
  name,
  register,
  error,
  className, // Permite adicionar classes Tailwind externas ao input
  ...rest // Restante das props do input (accept, multiple, etc.)
}) => {
  // O register para type='file' retorna um objeto com onChange, onBlur, name, ref
  const { onChange, onBlur, name: registeredName, ref } = register(name);

  return (
    <div className="space-y-1">
      <label htmlFor={registeredName} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={registeredName}
        type="file"
        name={registeredName} // Use o nome retornado por register
        ref={ref} // Use a ref retornada por register
        onChange={onChange} // Use o onChange retornado por register
        onBlur={onBlur} // Use o onBlur retornado por register
        className={
          `block w-full text-sm text-gray-900 border rounded-md cursor-pointer bg-gray-50 focus:outline-none
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100
          ${error ? 'border-red-500' : 'border-gray-300'}
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

export default FileInput; 