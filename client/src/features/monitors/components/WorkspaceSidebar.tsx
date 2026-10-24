import { Activity, LoaderCircle, LogOut } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import type { AuthUser } from '@/features/auth/api/authApiSchema'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'

export function WorkspaceSidebar({
  user,
  onSignOut,
  isSigningOut,
}: {
  user: AuthUser | null
  onSignOut: () => void
  isSigningOut: boolean
}) {
  const location = useLocation()
  const initials =
    user?.name.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'PW'

  return (
    <aside className="flex items-center justify-between gap-4 border-b border-sidebar-border bg-sidebar px-4 py-3 text-sidebar-foreground md:sticky md:top-0 md:h-screen md:w-60 md:flex-col md:items-stretch md:justify-start md:border-b-0 md:border-r md:px-4 md:py-6">
      <div className="flex items-center justify-between gap-2">
        <Link className="flex items-center gap-2.5 text-lg font-semibold tracking-tight" to="/dashboard">
          <span className="grid size-8 place-items-center rounded-lg border border-sidebar-primary/20 bg-sidebar-primary/10 text-sidebar-primary">
            <Activity size={18} />
          </span>
          pulsewatch
        </Link>
        <ThemeToggle />
      </div>

      <nav className="flex items-center gap-1 md:mt-12 md:flex-col md:items-stretch" aria-label="Main navigation">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium ${
            isActive || location.pathname.startsWith('/analytics/')
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'
          }`}
        >
          <Activity size={16} />
          Monitors
        </NavLink>
      </nav>

      <Card className="hidden border-sidebar-border bg-sidebar-accent/50 text-sidebar-foreground shadow-none md:mt-auto md:block">
        <CardContent className="flex items-center gap-3 p-3">
          <span className="size-2 shrink-0 rounded-full bg-sidebar-primary" />
          <div className="min-w-0">
            <p className="text-xs font-medium">Monitoring active</p>
            <p className="mt-1 text-[11px] text-sidebar-foreground/60">Checks run automatically</p>
          </div>
        </CardContent>
      </Card>

      <div className="hidden border-t border-sidebar-border pt-4 md:block">
        <div className="mb-3 flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-primary/10 text-xs font-semibold text-sidebar-primary">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium">{user?.name}</p>
            <p className="truncate text-[11px] text-sidebar-foreground/60">{user?.email}</p>
          </div>
        </div>
        <Button
          className="w-full justify-start text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          variant="ghost"
          onClick={onSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? <LoaderCircle className="animate-spin" /> : <LogOut />}
          {isSigningOut ? 'Signing out…' : 'Sign out'}
        </Button>
      </div>
      <Button
        className="md:hidden"
        size="icon"
        variant="ghost"
        aria-label="Sign out"
        onClick={onSignOut}
        disabled={isSigningOut}
      >
        {isSigningOut ? <LoaderCircle className="animate-spin" /> : <LogOut />}
      </Button>
    </aside>
  )
}
