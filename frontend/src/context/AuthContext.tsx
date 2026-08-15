import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, getAccessToken, setAccessToken } from '../api'
import type { User } from '../types'
import { AuthContext, type AuthContextValue } from './authState'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    function unauthorized() {
      setUser(null)
    }
    window.addEventListener('nourish:unauthorized', unauthorized)

    if (!getAccessToken()) {
      setLoading(false)
      return () =>
        window.removeEventListener('nourish:unauthorized', unauthorized)
    }

    api.auth
      .me()
      .then(setUser)
      .catch(() => {
        setAccessToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))

    return () =>
      window.removeEventListener('nourish:unauthorized', unauthorized)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(email, password) {
        const response = await api.auth.login({ email, password })
        setAccessToken(response.token)
        setUser(response.user)
      },
      async register(email, password, displayName) {
        const response = await api.auth.register({
          email,
          password,
          displayName,
        })
        setAccessToken(response.token)
        setUser(response.user)
      },
      logout() {
        setAccessToken(null)
        setUser(null)
      },
    }),
    [loading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
