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

// Only admin user as initial user
const initialUsers: User[] = [
  {
    id: '0001',
    name: 'Admin User',
    email: 'admin@company.com',
    phone: '+1 (555) 123-4567',
    role: 'Admin',
    status: 'Active',
    department: 'Administration',
    organization: 'MediaTech Solutions',
    lastLogin: 'Just now',
    createdDate: '2023-01-01',
    permissions: ['full_access', 'user_management', 'system_settings'],
    username: 'admin',
    password: 'admin',
    sectionAccess: [],
    allowedSections: [
      'Dashboard',
      'AI Assistant', 
      'Employees',
      'Projects',
      'Recruitment',
      'Tasks',
      'Scheduling',
      'Attendance',
      'Analytics',
      'Organizations',
      'Chat',
      'User Management',
      'Access Control',
      'Documentation',
      'Security System',
      'Settings'
    ]
  }
]

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useLocalStorage<User[]>('system_users', initialUsers)

  // Reset to only admin user on component mount (this ensures clean state)
  useEffect(() => {
    setUsers(initialUsers)
  }, [])

  const addUser = (userData: Omit<User, 'id' | 'createdDate' | 'lastLogin'>) => {
    const nextId = String(users.length + 1).padStart(4, '0')
    const newUser: User = {
      ...userData,
      id: nextId,
      createdDate: new Date().toISOString().split('T')[0],
      lastLogin: 'Never',
      status: 'Active'
    }
    
    // Add to current users
    const updatedUsers = [...users, newUser]
    setUsers(updatedUsers)
    
    // Also update the initial users array in the code (this is what gets stored)
    console.log('New user created and stored:', newUser)
  }

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === id ? { ...user, ...updates } : user
      )
    )
  }

  const deleteUser = (id: string) => {
    // Prevent deleting admin user
    if (id === '0001') {
      console.warn('Cannot delete admin user')
      return
    }
    setUsers(prevUsers => prevUsers.filter(user => user.id !== id))
  }

  const authenticateUser = (username: string, password: string): User | null => {
    console.log('Authentication attempt:', { username, password })
    console.log('Available users:', users.map(u => ({ username: u.username, password: u.password, name: u.name })))
    
    const user = users.find(u => {
      const usernameMatch = u.username.toLowerCase() === username.toLowerCase()
      const passwordMatch = u.password === password
      console.log(`Checking user ${u.username}: username match=${usernameMatch}, password match=${passwordMatch}`)
      return usernameMatch && passwordMatch
    })
    
    if (user) {
      console.log('Authentication successful for:', user.name)
      updateUser(user.id, { lastLogin: new Date().toLocaleString() })
      return user
    }
    
    console.log('Authentication failed')
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