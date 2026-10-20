import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
    <div className="grid gap-1.5">
      <label className="text-xs font-medium text-foreground" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          className={trailing ? 'pr-11' : ''}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...inputProps}
          {...registration}
        />
        {trailing && <span className="absolute inset-y-0 right-1 flex items-center">{trailing}</span>}
      </div>
      {error && (
        <p className="text-xs text-destructive" id={`${id}-error`} role="alert">
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
        <Button
          className="text-muted-foreground hover:text-foreground"
          size="icon"
          variant="ghost"
          type="button"
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </Button>
      }
    />
  )
}
