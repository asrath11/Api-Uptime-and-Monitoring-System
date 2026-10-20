import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, LoaderCircle } from 'lucide-react'
import { Alert } from '../../../components/ui/alert'
import { Button } from '../../../components/ui/button'
import { Card, CardContent } from '../../../components/ui/card'
import { AuthApiError } from '../api/authApi'
import { AuthField, PasswordField } from '../components/AuthField'
import AuthShell from '../components/AuthShell'
import { useAuth } from '../context/useAuth'
import { signupSchema, type SignupValues } from '../schemas/authSchemas'

export default function SignupPage() {
  const { register: createAccount, sessionError } = useAuth()
  const navigate = useNavigate()
  const [notice, setNotice] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = handleSubmit(async (values) => {
    setNotice('')
    try {
      await createAccount(values)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setNotice(
        error instanceof AuthApiError
          ? error.message
          : 'Unable to create your account. Please try again.',
      )
    }
  })

  return (
    <AuthShell mode="signup">
      <Card className="border-border/80 shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <form className="grid gap-4" onSubmit={onSubmit} noValidate>
            <AuthField
              id="signup-name"
              label="Your name"
              error={errors.name?.message}
              registration={register('name')}
              inputProps={{ autoComplete: 'name', placeholder: 'Alex Morgan' }}
            />
            <AuthField
              id="signup-email"
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
              id="signup-password"
              label="Password"
              error={errors.password?.message}
              autoComplete="new-password"
              registration={register('password')}
            />
            <PasswordField
              id="signup-confirm-password"
              label="Confirm password"
              error={errors.confirmPassword?.message}
              autoComplete="new-password"
              registration={register('confirmPassword')}
            />
            <div>
              <label className="flex cursor-pointer items-start gap-2 text-xs leading-5 text-muted-foreground">
                <input
                  className="mt-0.5 size-4 shrink-0 rounded border-input accent-primary"
                  type="checkbox"
                  aria-invalid={Boolean(errors.terms)}
                  aria-describedby={errors.terms ? 'signup-terms-error' : undefined}
                  {...register('terms')}
                />
                <span>I agree to the <a className="font-medium text-foreground hover:underline" href="#terms">Terms of Service</a> and <a className="font-medium text-foreground hover:underline" href="#privacy">Privacy Policy</a>.</span>
              </label>
              {errors.terms?.message && (
                <p className="mt-1.5 text-xs text-destructive" id="signup-terms-error" role="alert">{errors.terms.message}</p>
              )}
            </div>
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <LoaderCircle className="animate-spin" /> : null}
              {isSubmitting ? 'Creating account…' : 'Create account'}
              {!isSubmitting && <ArrowRight />}
            </Button>
            {(notice || sessionError) && (
              <Alert><AlertCircle className="mt-0.5 size-4 shrink-0" /><span>{notice || sessionError}</span></Alert>
            )}
          </form>
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Already have an account? <Link className="font-semibold text-primary hover:underline" to="/login">Sign in <span aria-hidden="true">↗</span></Link>
      </p>
    </AuthShell>
  )
}
