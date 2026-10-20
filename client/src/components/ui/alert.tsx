import type { HTMLAttributes } from 'react'
import { cn } from 'cn'

function Alert({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="alert"
      data-slot="alert"
      className={cn(
        'relative flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Alert }
