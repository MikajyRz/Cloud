import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { loginApi, meApi, signupApi, type UserMeResponse, type UserRole } from './api'

type AuthState = {
  token: string | null
  me: UserMeResponse | null
  role: UserRole
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, fullName: string) => Promise<void>
  logout: () => void
}

const TOKEN_KEY = 'cloud.auth.token'

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [me, setMe] = useState<UserMeResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const role: UserRole = me?.role ?? 'VISITEUR'

  const refreshMe = useCallback(
    async (t: string | null) => {
      if (!t) {
        setMe(null)
        setLoading(false)
        return
      }

      try {
        const data = await meApi(t)
        setMe(data)
      } catch {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setMe(null)
      } finally {
        setLoading(false)
      }
    },
    [setMe],
  )

  useEffect(() => {
    void refreshMe(token)
  }, [token, refreshMe])

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    const res = await loginApi({ email, password })
    localStorage.setItem(TOKEN_KEY, res.token)
    setToken(res.token)
  }, [])

  const signup = useCallback(async (email: string, password: string, fullName: string) => {
    setLoading(true)
    await signupApi({ email, password, fullName })
    // After signup, force login
    const res = await loginApi({ email, password })
    localStorage.setItem(TOKEN_KEY, res.token)
    setToken(res.token)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setMe(null)
  }, [])

  const value = useMemo<AuthState>(
    () => ({ token, me, role, loading, login, signup, logout }),
    [token, me, role, loading, login, signup, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
