import React, { createContext, useContext, useState, useEffect } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  role: 'Admin' | 'HR' | 'Guest'
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
  sectionAccess?: string[]
  allowedSections?: string[]
}

interface UserContextType {
  users: User[]
  addUser: (user: Omit<User, 'id' | 'createdDate' | 'lastLogin'>) => void
  updateUser: (id: string, updates: Partial<User>) => void
  deleteUser: (id: string) => void
  authenticateUser: (username: string, password: string) => User | null
}

const UserContext = createContext<UserContextType | undefined>(undefined)

const initialUsers: User[] = [
  {
    id: '0001',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@company.com',
    phone: '+1 (555) 123-4567',
    role: 'Admin',
    status: 'Active',
    department: 'HR',
    organization: 'MediaTech Solutions',
    lastLogin: '2 hours ago',
    createdDate: '2023-01-15',
    permissions: ['full_access', 'user_management', 'system_settings'],
    username: 'admin',
    password: 'admin123',
    sectionAccess: []
  },
  {
    id: '0002',
    name: 'John Smith',
    email: 'john.smith@company.com',
    phone: '+1 (555) 234-5678',
    role: 'HR',
    status: 'Active',
    department: 'HR',
    organization: 'MediaTech Solutions',
    lastLogin: '1 day ago',
    createdDate: '2023-02-01',
    permissions: ['employee_management', 'recruitment', 'performance_review'],
    username: 'john.smith',
    password: 'hr123',
    sectionAccess: []
  },
  {
    id: '0003',
    name: 'Abd Rahman',
    email: 'abd@company.com',
    phone: '+1 (555) 345-6789',
    role: 'Guest',
    status: 'Active',
    department: 'Guest',
    organization: 'MediaTech Solutions',
    lastLogin: '3 hours ago',
    createdDate: '2023-03-01',
    permissions: ['limited_access'],
    username: 'abd',
    password: 'guest123',
    sectionAccess: []
  }
]

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useLocalStorage<User[]>('system_users', initialUsers)

  const addUser = (userData: Omit<User, 'id' | 'createdDate' | 'lastLogin'>) => {
    const nextId = String(users.length + 1).padStart(4, '0')
    const newUser: User = {
      ...userData,
      id: nextId,
      createdDate: new Date().toISOString().split('T')[0],
      lastLogin: 'Never',
      status: 'Active'
    }
    setUsers(prevUsers => [...prevUsers, newUser])
  }

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === id ? { ...user, ...updates } : user
      )
    )
  }

  const deleteUser = (id: string) => {
    setUsers(prevUsers => prevUsers.filter(user => user.id !== id))
  }

  const authenticateUser = (username: string, password: string): User | null => {
    const user = users.find(u => u.username === username && u.password === password)
    if (user) {
      updateUser(user.id, { lastLogin: new Date().toLocaleString() })
      return user
    }
    return null
  }

  return (
    <UserContext.Provider value={{ users, addUser, updateUser, deleteUser, authenticateUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUsers() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUsers must be used within a UserProvider')
  }
  return context
}