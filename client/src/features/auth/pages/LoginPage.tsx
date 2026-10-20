import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { AuthApiError } from '../api/authApi'
import { AuthField, PasswordField } from '../components/AuthField'
import AuthShell from '../components/AuthShell'
import { useAuth } from '../context/useAuth'
import { loginSchema, type LoginValues } from '../schemas/authSchemas'

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
      <form className="auth-form" onSubmit={onSubmit} noValidate>
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
        <div className="form-options">
          <label className="check-label">
            <input type="checkbox" {...register('remember')} />
            <span className="custom-check"><span /></span>
            Remember me
          </label>
          <button
            className="text-action"
            type="button"
            onClick={() => setNotice('Password reset is not connected yet. Please contact your workspace administrator.')}
          >
            Forgot password?
          </button>
        </div>
        <button className="submit-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
          <span aria-hidden="true">→</span>
        </button>
        {(notice || sessionError) && (
          <p className="form-notice form-error-notice" role="alert">{notice || sessionError}</p>
        )}
      </form>
      <p className="switch-prompt">
        New to Pulsewatch? <Link to="/signup">Create an account <span aria-hidden="true">↗</span></Link>
      </p>
      <div className="trust-line"><span /><span>Trusted by teams that keep things running</span><span /></div>
    </AuthShell>
  )
}
