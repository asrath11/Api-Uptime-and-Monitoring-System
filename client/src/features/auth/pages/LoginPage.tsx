import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, AlertCircle, Zap } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AuthApiError } from '@/features/auth/api/authApi'
import { AuthField, PasswordField } from '@/features/auth/components/AuthField'
import AuthShell from '@/features/auth/components/AuthShell'
import { useAuth } from '@/features/auth/context/useAuth'
import { loginSchema, type LoginValues } from '@/features/auth/schemas/authSchemas'

export default function LoginPage() {
  const { login, sessionError } = useAuth()
  const navigate = useNavigate()
  const [notice, setNotice] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: true },
  })

  const onSubmit = handleSubmit(async (values) => {
    setNotice('')
    try {
      await login(values)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setNotice(
        error instanceof AuthApiError
          ? error.message
          : 'Unable to sign in. Please try again.',
      )
    }
  })

  return (
    <AuthShell mode="login">
      <Card className="border-border/80 shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <form className="grid gap-5" onSubmit={onSubmit} noValidate>
            <AuthField
              id="login-email"
              label="Work email"
              error={errors.email?.message}
              registration={register('email')}
              inputProps={{
                type: 'email',
                autoComplete: 'email',
                placeholder: 'you@company.com',
              }}
            />
            <PasswordField
              id="login-password"
              label="Password"
              error={errors.password?.message}
              autoComplete="current-password"
              registration={register('password')}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <input className="size-4 rounded border-input accent-primary" type="checkbox" {...register('remember')} />
                Remember me
              </label>
              <Button
                className="h-auto p-0 text-xs text-primary"
                variant="link"
                type="button"
                onClick={() => setNotice('Password reset is not connected yet. Please contact your workspace administrator.')}
              >
                Forgot password?
              </Button>
            </div>
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
              {isSubmitting ? <Zap className="animate-pulse" /> : <ArrowRight />}
            </Button>
            {(notice || sessionError) && (
              <Alert><AlertCircle className="mt-0.5 size-4 shrink-0" /><span>{notice || sessionError}</span></Alert>
            )}
          </form>
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        New to Pulsewatch? <Link className="font-semibold text-primary hover:underline" to="/signup">Create an account <span aria-hidden="true">↗</span></Link>
      </p>
      <div className="mt-8 flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <span>Trusted by teams that keep things running</span>
        <span className="h-px flex-1 bg-border" />
      </div>
    </AuthShell>
  )
}
