import { useState, useEffect, useCallback } from 'react'
import { getSession, login, logout } from '@/services/auth'
import type { AuthUser } from '@/types'

interface AuthState {
  user: AuthUser | null
  loading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null as AuthUser | null, loading: true })

  useEffect(() => {
    let cancelled = false
    getSession()
      .then(({ user }: { user: AuthUser }) => {
        if (!cancelled) setState({ user, loading: false })
      })
      .catch(() => {
        if (!cancelled) setState({ user: null, loading: false })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const signIn = useCallback(
    async (email: string, password: string) => {
      return login({ email, password })
    },
    []
  )

  const signOut = useCallback(async () => {
    try {
      await logout()
    } catch {
      // ignore logout errors; clear local state regardless
    }
    setState({ user: null, loading: false })
  }, [])

  return { ...state, signIn, signOut }
}

export type { AuthUser }
