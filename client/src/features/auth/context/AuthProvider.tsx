import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AuthContext } from './useAuth'
import {
  AuthApiError,
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from '../api/authApi'
import type { AuthUser, LoginCredentials, SignupCredentials } from '../api/authApiSchema'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    getCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser)
      })
      .catch((error: unknown) => {
        if (!active) return
        setUser(null)
        setSessionError(
          error instanceof AuthApiError
            ? error.message
            : 'Unable to check your sign-in session.',
        )
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    const authenticatedUser = await loginRequest(credentials)
    setUser(authenticatedUser)
    setSessionError(null)
  }, [])

  const register = useCallback(async (credentials: SignupCredentials) => {
    const authenticatedUser = await registerRequest(credentials)
    setUser(authenticatedUser)
    setSessionError(null)
  }, [])

  const logout = useCallback(async () => {
    await logoutRequest()
    setUser(null)
    setSessionError(null)
  }, [])

  const value = useMemo(
    () => ({ user, isLoading, sessionError, login, register, logout }),
    [user, isLoading, sessionError, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
