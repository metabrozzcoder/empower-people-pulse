import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  Settings,
  Eye,
  Lock,
  Unlock
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'

interface Permission {
  id: string
  name: string
  description: string
  category: string
}

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  userCount: number
  isSystem: boolean
  createdDate: string
}

const mockPermissions: Permission[] = [
  { id: 'employee_read', name: 'View Employees', description: 'Can view employee information', category: 'Employee Management' },
  { id: 'employee_write', name: 'Manage Employees', description: 'Can create, edit, and delete employees', category: 'Employee Management' },
  { id: 'recruitment_read', name: 'View Recruitment', description: 'Can view recruitment data', category: 'Recruitment' },
  { id: 'recruitment_write', name: 'Manage Recruitment', description: 'Can manage recruitment process', category: 'Recruitment' },
  { id: 'performance_read', name: 'View Performance', description: 'Can view performance data', category: 'Performance' },
  { id: 'performance_write', name: 'Manage Performance', description: 'Can manage performance reviews', category: 'Performance' },
  { id: 'analytics_read', name: 'View Analytics', description: 'Can view analytics and reports', category: 'Analytics' },
  { id: 'user_management', name: 'User Management', description: 'Can manage system users', category: 'System' },
  { id: 'role_management', name: 'Role Management', description: 'Can manage roles and permissions', category: 'System' },
  { id: 'system_settings', name: 'System Settings', description: 'Can modify system settings', category: 'System' }
]

const mockRoles: Role[] = [
  {
    id: '1',
    name: 'Administrator',
    description: 'Full system access with all permissions',
    permissions: mockPermissions.map(p => p.id),
    userCount: 2,
    isSystem: true,
    createdDate: '2023-01-01'
  },
  {
    id: '2',
    name: 'HR Manager',
    description: 'HR department management with employee and recruitment access',
    permissions: ['employee_read', 'employee_write', 'recruitment_read', 'recruitment_write', 'performance_read', 'performance_write', 'analytics_read'],
    userCount: 5,
    isSystem: false,
    createdDate: '2023-01-15'
  },
  {
    id: '3',
    name: 'HR Assistant',
    description: 'Limited HR access for daily operations',
    permissions: ['employee_read', 'recruitment_read', 'performance_read'],
    userCount: 8,
    isSystem: false,
    createdDate: '2023-02-01'
  },
  {
    id: '4',
    name: 'Guest',
    description: 'Limited access for external users',
    permissions: ['employee_read'],
    userCount: 3,
    isSystem: true,
    createdDate: '2023-01-01'
  }
]

export default function RoleManagement() {
  const { toast } = useToast()
  const [roles, setRoles] = useState<Role[]>(mockRoles)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddRole = () => {
    setSelectedRole(null)
    setSelectedPermissions([])
    setIsDialogOpen(true)
  }

  const handleEditRole = (role: Role) => {
    setSelectedRole(role)
    setSelectedPermissions(role.permissions)
    setIsDialogOpen(true)
  }

  const handleDeleteRole = (id: string) => {
    const role = roles.find(r => r.id === id)
    if (role?.isSystem) {
      toast({
        title: "Cannot Delete System Role",
        description: "System roles cannot be deleted.",
        variant: "destructive"
      })
      return
    }
    setRoles(roles.filter(role => role.id !== id))
    toast({
      title: "Role Deleted",
      description: "Role has been successfully deleted.",
    })
  }

  const handleSaveRole = () => {
    if (selectedRole) {
      // Update existing role
      setRoles(roles.map(role => 
        role.id === selectedRole.id 
          ? { ...role, permissions: selectedPermissions }
          : role
      ))
      toast({
        title: "Role Updated",
        description: "Role permissions have been updated.",
      })
    } else {
      // Create new role
      const newRole: Role = {
        id: Date.now().toString(),
        name: "New Role",
        description: "New role description",
        permissions: selectedPermissions,
        userCount: 0,
        isSystem: false,
        createdDate: new Date().toISOString().split('T')[0]
      }
      setRoles([...roles, newRole])
      toast({
        title: "Role Created",
        description: "New role has been created.",
      })
    }
    setIsDialogOpen(false)
  }

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  const permissionCategories = Array.from(new Set(mockPermissions.map(p => p.category)))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Role Management</h1>
          <p className="text-muted-foreground">Manage user roles and permissions</p>
        </div>
        <Button onClick={handleAddRole} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Role</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{roles.length}</p>
                <p className="text-sm text-muted-foreground">Total Roles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{roles.reduce((sum, role) => sum + role.userCount, 0)}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Lock className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{roles.filter(r => r.isSystem).length}</p>
                <p className="text-sm text-muted-foreground">System Roles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Settings className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{mockPermissions.length}</p>
                <p className="text-sm text-muted-foreground">Permissions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map((role) => (
          <Card key={role.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      {role.isSystem && (
                        <Badge variant="secondary">
                          <Lock className="w-3 h-3 mr-1" />
                          System
                        </Badge>
                      )}
                      <Badge variant="outline">
                        <Users className="w-3 h-3 mr-1" />
                        {role.userCount} users
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditRole(role)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {!role.isSystem && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRole(role.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription>{role.description}</CardDescription>
              
              <div>
                <div className="text-sm font-medium mb-2">Permissions ({role.permissions.length})</div>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.slice(0, 3).map((permId) => {
                    const permission = mockPermissions.find(p => p.id === permId)
                    return permission ? (
                      <Badge key={permId} variant="outline" className="text-xs">
                        {permission.name}
                      </Badge>
                    ) : null
                  })}
                  {role.permissions.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{role.permissions.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Created: {new Date(role.createdDate).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRole ? 'Edit Role' : 'Create New Role'}
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Role Name</Label>
                  <Input 
                    id="name" 
                    placeholder="Enter role name" 
                    defaultValue={selectedRole?.name}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Enter role description" 
                    defaultValue={selectedRole?.description}
                  />
                </div>
                {selectedRole?.isSystem && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Lock className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">System Role</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      This is a system role. Some properties cannot be modified.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="permissions" className="space-y-4">
              <div className="space-y-6">
                {permissionCategories.map((category) => (
                  <div key={category} className="space-y-3">
                    <h4 className="font-medium text-sm text-gray-900">{category}</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {mockPermissions
                        .filter(p => p.category === category)
                        .map((permission) => (
                          <div key={permission.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                            <Checkbox
                              checked={selectedPermissions.includes(permission.id)}
                              onCheckedChange={() => togglePermission(permission.id)}
                            />
                            <div className="flex-1">
                              <div className="font-medium text-sm">{permission.name}</div>
                              <div className="text-xs text-muted-foreground">{permission.description}</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRole}>
              {selectedRole ? 'Update' : 'Create'} Role
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}