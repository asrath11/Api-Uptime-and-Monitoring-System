import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { AuthField, PasswordField } from '../components/AuthField'
import AuthShell from '../components/AuthShell'
import { signupSchema, type SignupValues } from '../schemas/authSchemas'

export default function SignupPage() {
  const [notice, setNotice] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = handleSubmit(() => {
    setNotice('Your details are valid. Connect your authentication API to create your account.')
  })

  return (
    <AuthShell mode="signup">
      <form className="auth-form signup-form" onSubmit={onSubmit} noValidate>
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
        <div className="terms-field">
          <label className="check-label">
            <input
              type="checkbox"
              aria-invalid={Boolean(errors.terms)}
              aria-describedby={errors.terms ? 'signup-terms-error' : undefined}
              {...register('terms')}
            />
            <span className="custom-check"><span /></span>
            <span>I agree to the <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>.</span>
          </label>
          {errors.terms?.message && (
            <p className="field-error" id="signup-terms-error" role="alert">{errors.terms.message}</p>
          )}
        </div>
        <button className="submit-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
          <span aria-hidden="true">→</span>
        </button>
        {notice && <p className="form-notice" role="status">{notice}</p>}
      </form>
      <p className="switch-prompt">
        Already have an account? <Link to="/login">Sign in <span aria-hidden="true">↗</span></Link>
      </p>
    </AuthShell>
  )
}
