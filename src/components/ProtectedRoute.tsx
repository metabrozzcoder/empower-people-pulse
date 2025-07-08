import React from 'react'
import { useAuth } from '@/context/AuthContext'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermissions?: string[]
  allowedRoles?: string[]
  sectionName?: string
}

export function ProtectedRoute({ 
  children, 
  requiredPermissions = [], 
  allowedRoles = [],
  sectionName 
}: ProtectedRouteProps) {
  const { currentUser } = useAuth()

  if (!currentUser) {
    return (
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          You must be logged in to access this page.
        </AlertDescription>
      </Alert>
    )
  }

  // Check section access restrictions
  if (sectionName && currentUser.sectionAccess && currentUser.sectionAccess.includes(sectionName)) {
    return (
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Access denied. You don't have permission to access the {sectionName} section.
        </AlertDescription>
      </Alert>
    )
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    return (
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Access denied. Your role ({currentUser.role}) does not have permission to access this page.
        </AlertDescription>
      </Alert>
    )
  }

  // Check permission-based access
  if (requiredPermissions.length > 0) {
    const hasPermission = requiredPermissions.some(permission => 
      currentUser.permissions.includes(permission)
    )
    
    if (!hasPermission) {
      return (
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Access denied. You don't have the required permissions to access this page.
          </AlertDescription>
        </Alert>
      )
    }
  }

  return <>{children}</>
}