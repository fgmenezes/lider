'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const LoginSchema = z.object({
  email: z.string().email({
    message: 'Por favor, insira um email válido.'
  }),
  password: z.string().min(1, {
    message: 'A senha é obrigatória.'
  }),
});

type LoginFormData = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError('')
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
        callbackUrl: '/dashboard'
      })
      if (result?.error) {
        setError(result.error)
      } else if (result?.ok) {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError('Falha ao fazer login. Verifique suas credenciais.')
    }
  }

  return (
    <div 
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <div 
        className="w-full max-w-md p-8 space-y-6 rounded shadow-md"
        style={{ 
          backgroundColor: 'var(--color-background)',
          borderColor: 'var(--color-border)',
          border: '1px solid'
        }}
      >
        <h2 
          className="text-2xl font-bold text-center" 
          style={{ color: 'var(--color-text-primary)' }}
        >
          Entrar
        </h2>
        {error && (
          <div 
            className="p-3 text-sm rounded-md"
            style={{
              color: 'var(--color-danger)',
              backgroundColor: 'var(--color-danger-bg)',
              borderColor: 'var(--color-danger)',
              border: '1px solid'
            }}
          >
            {error}
          </div>
        )}
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} autoComplete="on">
          <Input
            id="email"
            type="email"
            label="Email"
            autoComplete="email"
            {...register('email')}
            disabled={isSubmitting}
            error={errors.email?.message}
            required
          />
          <Input
            id="password"
            type="password"
            label="Senha"
            autoComplete="current-password"
            {...register('password')}
            disabled={isSubmitting}
            error={errors.password?.message}
            required
          />
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  )
}