import { createContext, useContext } from 'react'
import type { AuthUser, LoginCredentials, SignupCredentials } from '../api/authApi'

export type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
  sessionError: string | null
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: SignupCredentials) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
