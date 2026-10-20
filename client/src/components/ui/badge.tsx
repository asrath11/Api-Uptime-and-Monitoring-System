import type { HTMLAttributes } from 'react'
import { cn } from 'cn'

function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      data-slot="badge"
      className={cn(
        'inline-flex w-fit shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        className,
      )}
      {...props}
    />
  )
}

export { Badge }
