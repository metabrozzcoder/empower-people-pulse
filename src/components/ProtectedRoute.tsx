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

  // Check section access using unified permissions logic
  if (sectionName) {
    // For users with specific allowed sections defined, only allow those sections
    if (currentUser.allowedSections && currentUser.allowedSections.length > 0) {
      if (!currentUser.allowedSections.includes(sectionName)) {
        return (
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Access denied. You don't have permission to access the {sectionName} section.
            </AlertDescription>
          </Alert>
        )
      }
    } else if (currentUser.role === 'Guest') {
      // Default guest behavior: no access unless specifically granted
      return (
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Access denied. Guest users need specific permissions to access sections.
          </AlertDescription>
        </Alert>
      )
    }
    // Admin and HR users have access to all sections by default (unless restricted)
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    // Exception: if user is Guest and has specific section access, bypass role check
    if (currentUser.role === 'Guest' && sectionName && currentUser.allowedSections?.includes(sectionName)) {
      // Allow access for guest with specific permissions
    } else {
      return (
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Access denied. Your role ({currentUser.role}) does not have permission to access this page.
          </AlertDescription>
        </Alert>
      )
    }
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