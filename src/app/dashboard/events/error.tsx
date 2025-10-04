'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erro na página de eventos:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Algo deu errado!</h2>
      <p className="text-gray-600 mb-6 text-center max-w-md">
        Ocorreu um erro ao carregar a página de eventos. Por favor, tente novamente.
      </p>
      <Button onClick={() => reset()} variant="primary">
        Tentar novamente
      </Button>
    </div>
  );
}