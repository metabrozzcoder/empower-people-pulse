import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/context/AuthContext'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  role: 'Admin' | 'HR' | 'Employee' | 'Guest'
  position?: string
  status: 'Active' | 'Inactive' | 'Pending'
  department?: string
  organization?: string
  linkedEmployee?: string
  lastLogin: string
  createdDate: string
  permissions: string[]
  username: string
  password: string
  guestId?: string
  generatedPassword?: string
  sectionAccess?: string[]
  allowedSections?: string[]
  birthday?: string
}

interface UserContextType {
  users: User[]
  loading: boolean
  refresh: () => Promise<void>
  addUser: (user: Omit<User, 'id' | 'createdDate' | 'lastLogin'>) => Promise<void>
  updateUser: (id: string, updates: Partial<User>) => Promise<void>
  deleteUser: (id: string) => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

function capitalize(role: string): User['role'] {
  if (role === 'admin') return 'Admin'
  if (role === 'hr') return 'HR'
  if (role === 'employee') return 'Employee'
  return 'Guest'
}

function mapRole(r: string): 'admin' | 'hr' | 'employee' | 'guest' {
  if (r === 'Admin') return 'admin'
  if (r === 'HR') return 'hr'
  if (r === 'Employee') return 'employee'
  return 'guest'
}

const roleRank = (role: string) => (role === 'admin' ? 4 : role === 'hr' ? 3 : role === 'employee' ? 2 : 1)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at'),
      supabase.from('user_roles').select('user_id, role'),
    ])
    const credMap = new Map<string, string>()

    const roleMap = new Map<string, string>()
    ;(roles ?? []).forEach((r) => {
      const cur = roleMap.get(r.user_id)
      if (!cur || roleRank(r.role) > roleRank(cur)) roleMap.set(r.user_id, r.role)
    })
    const list: User[] = (profiles ?? []).map((p: any) => ({
      id: p.id,
      name: p.name,
      email: p.email ?? '',
      phone: p.phone ?? '',
      avatar: p.avatar_url ?? undefined,
      role: capitalize(roleMap.get(p.id) ?? 'guest'),
      position: p.position ?? undefined,
      status: (p.status as User['status']) ?? 'Active',
      department: p.department ?? undefined,
      organization: p.organization ?? undefined,
      linkedEmployee: p.linked_employee ?? undefined,
      lastLogin: '—',
      createdDate: p.created_at?.split('T')[0] ?? '',
      generatedPassword: credMap.get(p.id) ?? undefined,
      permissions: Array.isArray(p.permissions) ? p.permissions : [],
      allowedSections: Array.isArray(p.allowed_sections) ? p.allowed_sections : [],
      sectionAccess: Array.isArray(p.section_access) ? p.section_access : [],
      guestId: p.guest_id ?? undefined,
      username: p.username ?? p.email ?? '',
      password: '',
      birthday: p.birthday ?? undefined,
    }))
    setUsers(list)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!session) { setUsers([]); setLoading(false); return }
    refresh()
    let t: ReturnType<typeof setTimeout> | null = null
    const debounced = () => {
      if (t) clearTimeout(t)
      t = setTimeout(() => { refresh() }, 300)
    }
    const channel = supabase
      .channel('users-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, debounced)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, debounced)
      .subscribe()
    return () => {
      if (t) clearTimeout(t)
      supabase.removeChannel(channel)
    }
  }, [session, refresh])

  const addUser = async (user: Omit<User, 'id' | 'createdDate' | 'lastLogin'>) => {
    const role = mapRole(user.role)
    const password = user.password && user.password.length >= 6 ? user.password : Math.random().toString(36).slice(2, 10) + 'A1'
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: {
        email: user.email,
        password,
        name: user.name,
        username: user.username,
        role,
        phone: user.phone,
        department: user.department,
        position: user.position,
        birthday: user.birthday,
      },
    })
    if (error) throw error
    if (data && (data as { error?: string }).error) throw new Error((data as { error: string }).error)
    const newId = (data as { user?: { id?: string } } | null)?.user?.id
    if (newId) {
      // If organization not provided but department is, auto-derive from departments table
      let orgName = user.organization ?? null
      if (!orgName && user.department) {
        const { data: dept } = await supabase
          .from('departments')
          .select('organization_id, organizations(name)')
          .eq('name', user.department)
          .maybeSingle()
        orgName = ((dept as any)?.organizations?.name) ?? null
      }
      await supabase.from('profiles').update({
        permissions: (user.permissions ?? []) as never,
        allowed_sections: (user.allowedSections ?? []) as never,
        section_access: (user.sectionAccess ?? []) as never,
        guest_id: user.guestId ?? null,
        linked_employee: user.linkedEmployee ?? null,
        organization: orgName,
        birthday: user.birthday ?? null,
      } as never).eq('id', newId)
    }
    await refresh()
  }

  const updateUser = async (id: string, updates: Partial<User>) => {
    const patch: Record<string, unknown> = {}
    if (updates.name !== undefined) patch.name = updates.name
    if (updates.phone !== undefined) patch.phone = updates.phone
    if (updates.avatar !== undefined) patch.avatar_url = updates.avatar
    if (updates.position !== undefined) patch.position = updates.position
    if (updates.department !== undefined) patch.department = updates.department
    if (updates.organization !== undefined) patch.organization = updates.organization
    if (updates.status !== undefined) patch.status = updates.status
    if (updates.permissions !== undefined) patch.permissions = updates.permissions
    if (updates.allowedSections !== undefined) patch.allowed_sections = updates.allowedSections
    if (updates.sectionAccess !== undefined) patch.section_access = updates.sectionAccess
    if (updates.guestId !== undefined) patch.guest_id = updates.guestId
    if (updates.linkedEmployee !== undefined) patch.linked_employee = updates.linkedEmployee
    if (updates.birthday !== undefined) patch.birthday = updates.birthday || null
    if (Object.keys(patch).length) {
      const { error } = await supabase.from('profiles').update(patch as never).eq('id', id)
      if (error) { console.error('profiles update failed', error); throw new Error(`Profile update failed: ${error.message}`) }
    }
    if (updates.role !== undefined) {
      const newRole = mapRole(updates.role)
      const { error } = await (supabase as any).rpc('set_user_system_role', {
        _user_id: id,
        _role: newRole,
      })
      if (error) { console.error('user_roles update failed', error); throw new Error(`Role update failed: ${error.message}`) }
    }
    await refresh()
  }

  const deleteUser = async (id: string) => {
    await supabase.from('profiles').delete().eq('id', id)
    await refresh()
  }

  return (
    <UserContext.Provider value={{ users, loading, refresh, addUser, updateUser, deleteUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUsers() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUsers must be used within UserProvider')
  return ctx
}
