import { Toaster as Sonner } from 'sonner'
import { useTheme } from '@/context/theme-context'

function Toaster() {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'group toast shadow-lg',
          success: 'border-success/30 bg-success/10 text-success',
          info: 'border-info/30 bg-info/10 text-info',
          warning: 'border-warning/30 bg-warning/10 text-warning',
          error: 'border-destructive/30 bg-destructive/10 text-destructive',
          description: 'text-current/75',
          actionButton: 'bg-black/5 text-inherit hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15',
          cancelButton: 'bg-black/5 text-inherit hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15',
        },
      }}
    />
  )
}

export { Toaster }
