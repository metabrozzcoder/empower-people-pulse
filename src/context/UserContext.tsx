import React, { createContext, useContext, useState, useEffect } from 'react'
import { usersAPI, User as ApiUser, CreateUserRequest } from '@/services/api'
import { useAuth } from './AuthContext'

export interface User extends ApiUser {}

interface UserContextType {
  users: User[]
  addUser: (user: CreateUserRequest) => Promise<void>
  updateUser: (id: string, updates: Partial<CreateUserRequest>) => Promise<void>
  deleteUser: (id: string) => Promise<void>
  refreshUsers: () => Promise<void>
  isLoading: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { isAuthenticated, currentUser } = useAuth()

  const refreshUsers = async () => {
    if (!isAuthenticated || !currentUser) return
    
    // Only Admin and HR can fetch all users
    if (!['Admin', 'HR'].includes(currentUser.role)) return

    setIsLoading(true)
    try {
      const fetchedUsers = await usersAPI.getAll()
      setUsers(fetchedUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      refreshUsers()
    } else {
      setUsers([])
    }
  }, [isAuthenticated, currentUser])

  const addUser = async (userData: CreateUserRequest) => {
    try {
      const newUser = await usersAPI.create(userData)
      setUsers(prev => [...prev, newUser])
    } catch (error: any) {
      console.error('Error creating user:', error)
      throw new Error(error.response?.data?.error || 'Failed to create user')
    }
  }

  const updateUser = async (id: string, updates: Partial<CreateUserRequest>) => {
    try {
      const updatedUser = await usersAPI.update(id, updates)
      setUsers(prev => prev.map(user => user.id === id ? updatedUser : user))
    } catch (error: any) {
      console.error('Error updating user:', error)
      throw new Error(error.response?.data?.error || 'Failed to update user')
    }
  }

  const deleteUser = async (id: string) => {
    try {
      await usersAPI.delete(id)
      setUsers(prev => prev.filter(user => user.id !== id))
    } catch (error: any) {
      console.error('Error deleting user:', error)
      throw new Error(error.response?.data?.error || 'Failed to delete user')
    }
  }

  return (
    <UserContext.Provider value={{ 
      users, 
      addUser, 
      updateUser, 
      deleteUser, 
      refreshUsers,
      isLoading 
    }}>
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