import { startTransition, useEffect, useMemo, useState } from 'react'
import { getSupabaseConfigError, isSupabaseConfigured, supabase } from '../lib/supabase'
import { AuthContext } from './context.js'

function getProfile(user) {
  if (!user) return null

  return {
    id: user.id,
    email: user.email ?? '',
    name: user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'ENDLESS member',
    profileImage: user.user_metadata?.profile_image ?? '',
    accountType: user.user_metadata?.account_type ?? 'creator',
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured) {
      startTransition(() => setIsLoading(false))
      return undefined
    }

    let mounted = true

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return
      startTransition(() => {
        setSession(data.session)
        setError(sessionError?.message ?? '')
        setIsLoading(false)
      })
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) setSession(nextSession)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(() => ({
    session,
    user: getProfile(session?.user),
    isAuthenticated: Boolean(session?.user),
    isLoading,
    error,
    async signIn({ email, password }) {
      if (!supabase) return { error: new Error(getSupabaseConfigError()) }
      const result = await supabase.auth.signInWithPassword({ email, password })
      return { error: result.error, session: result.data.session }
    },
    async signUp({ name, email, password, accountType }) {
      if (!supabase) return { error: new Error(getSupabaseConfigError()) }
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, account_type: accountType, profile_image: '' },
        },
      })
      return { error: result.error, session: result.data.session }
    },
    async signOut() {
      if (!supabase) return { error: new Error(getSupabaseConfigError()) }
      return supabase.auth.signOut()
    },
    async resetPassword(email) {
      if (!supabase) return { error: new Error(getSupabaseConfigError()) }
      return supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` })
    },
  }), [error, isLoading, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

