import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import type { UseFormRegisterReturn } from 'react-hook-form'

type AuthFieldProps = {
  id: string
  label: string
  error?: string
  registration?: UseFormRegisterReturn
  inputProps?: InputHTMLAttributes<HTMLInputElement>
  trailing?: ReactNode
}

export function AuthField({
  id,
  label,
  error,
  registration,
  inputProps,
  trailing,
}: AuthFieldProps) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className={`input-wrap${error ? ' has-error' : ''}`}>
        <input
          id={id}
          className="text-input"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...inputProps}
          {...registration}
        />
        {trailing}
      </div>
      {error && (
        <p className="field-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

type PasswordFieldProps = Omit<AuthFieldProps, 'inputProps' | 'trailing'> & {
  autoComplete: string
}

export function PasswordField({ autoComplete, ...fieldProps }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <AuthField
      {...fieldProps}
      inputProps={{
        type: visible ? 'text' : 'password',
        autoComplete,
        placeholder: 'At least 8 characters',
      }}
      trailing={
        <button
          className="password-toggle"
          type="button"
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      }
    />
  )
}
