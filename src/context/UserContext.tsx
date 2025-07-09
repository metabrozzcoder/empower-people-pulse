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
    password: 'admin',
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
    password: 'john123',
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
    username: 'abd.rahman',
    password: 'abd123',
    sectionAccess: []
  },
  {
    id: '0004',
    name: 'Emma Martinez',
    email: 'emma.martinez@company.com',
    phone: '+1 (555) 456-7890',
    role: 'HR',
    status: 'Active',
    department: 'HR',
    organization: 'MediaTech Solutions',
    lastLogin: '5 hours ago',
    createdDate: '2023-04-10',
    permissions: ['employee_management', 'scheduling', 'attendance'],
    username: 'emma.parttime',
    password: 'emma123',
    sectionAccess: [],
    allowedSections: ['Scheduling', 'Attendance', 'Chat']
  },
  {
    id: '0005',
    name: 'Michael Chen',
    email: 'michael.chen@company.com',
    phone: '+1 (555) 567-8901',
    role: 'Guest',
    status: 'Active',
    department: 'Support',
    organization: 'MediaTech Solutions',
    lastLogin: '2 days ago',
    createdDate: '2023-05-20',
    permissions: ['chat_access', 'documentation_access'],
    username: 'michael.support',
    password: 'michael123',
    sectionAccess: [],
    allowedSections: ['Chat', 'Documentation']
  },
  {
    id: '0006',
    name: 'Lisa Thompson',
    email: 'lisa.thompson@company.com',
    phone: '+1 (555) 678-9012',
    role: 'Guest',
    status: 'Active',
    department: 'Operations',
    organization: 'MediaTech Solutions',
    lastLogin: '1 hour ago',
    createdDate: '2023-06-15',
    permissions: ['tasks_access', 'projects_access'],
    username: 'lisa.ops',
    password: 'lisa123',
    sectionAccess: [],
    allowedSections: ['Tasks', 'Projects', 'Chat']
  },
  {
    id: '0007',
    name: 'Robert Davis',
    email: 'robert.davis@company.com',
    phone: '+1 (555) 789-0123',
    role: 'HR',
    status: 'Active',
    department: 'HR',
    organization: 'MediaTech Solutions',
    lastLogin: '30 minutes ago',
    createdDate: '2023-07-01',
    permissions: ['recruitment', 'analytics', 'employee_management'],
    username: 'robert.hr',
    password: 'robert123',
    sectionAccess: [],
    allowedSections: ['Recruitment', 'Analytics', 'Employees', 'Chat']
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