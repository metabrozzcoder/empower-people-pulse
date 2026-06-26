import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { Session } from '@supabase/supabase-js'
import type { User } from '@/context/UserContext'
import i18n from '@/i18n'

interface AuthContextType {
  currentUser: User | null
  session: Session | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ error: string | null }>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function capitalize(role: string): User['role'] {
  if (role === 'admin') return 'Admin'
  if (role === 'hr') return 'HR'
  if (role === 'employee') return 'Employee'
  return 'Guest'
}

async function loadUserProfile(userId: string, email: string): Promise<User | null> {
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('user_roles').select('role').eq('user_id', userId),
  ])

  if (!profile) return null

  // Pick highest role: admin > hr > employee > guest
  const roleSet = new Set((roles ?? []).map((r) => r.role))
  const dbRole = roleSet.has('admin') ? 'admin' : roleSet.has('hr') ? 'hr' : roleSet.has('employee') ? 'employee' : 'guest'

  const pref = (profile as { preferred_language?: string }).preferred_language
  if (pref && ['en', 'ru', 'uz'].includes(pref) && i18n.language !== pref) {
    i18n.changeLanguage(pref)
  }


  return {
    id: profile.id,
    name: profile.name,
    email: profile.email ?? email,
    phone: profile.phone ?? '',
    avatar: profile.avatar_url ?? undefined,
    role: capitalize(dbRole),
    position: profile.position ?? undefined,
    status: (profile.status as User['status']) ?? 'Active',
    department: profile.department ?? undefined,
    organization: profile.organization ?? undefined,
    lastLogin: new Date().toLocaleString(),
    createdDate: profile.created_at?.split('T')[0] ?? '',
    permissions: Array.isArray(profile.permissions) ? profile.permissions : (dbRole === 'admin' ? ['full_access', 'user_management', 'system_settings'] : []),
    allowedSections: Array.isArray(profile.allowed_sections) ? profile.allowed_sections : [],
    sectionAccess: Array.isArray(profile.section_access) ? profile.section_access : [],
    guestId: profile.guest_id ?? undefined,
    linkedEmployee: profile.linked_employee ?? undefined,
    username: profile.username ?? profile.email ?? email,
    password: '',
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Subscribe first to avoid missing events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession?.user) {
        // Defer DB calls
        setTimeout(() => {
          loadUserProfile(newSession.user.id, newSession.user.email ?? '').then(setCurrentUser)
        }, 0)
      } else {
        setCurrentUser(null)
      }
    })

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      if (s?.user) {
        loadUserProfile(s.user.id, s.user.email ?? '').then((u) => {
          setCurrentUser(u)
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setCurrentUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider
      value={{ currentUser, session, loading, login, logout, isAuthenticated: !!session }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
