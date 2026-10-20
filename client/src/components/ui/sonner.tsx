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
          success: 'border-emerald-600 bg-emerald-600 text-white',
          info: 'border-sky-600 bg-sky-600 text-white',
          warning: 'border-amber-500 bg-amber-500 text-slate-950',
          error: 'border-red-600 bg-red-600 text-white',
          description: 'text-current/80',
          actionButton: 'bg-black/10 text-inherit hover:bg-black/20',
          cancelButton: 'bg-black/10 text-inherit hover:bg-black/20',
        },
      }}
    />
  )
}

export { Toaster }
