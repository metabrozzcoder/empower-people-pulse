import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  UserCheck, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Shield, 
  Users, 
  Mail, 
  Phone,
  Calendar,
  Building2
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { useUsers } from '@/context/UserContext'
import { User, CreateUserRequest } from '@/services/api'
import { useToast } from '@/hooks/use-toast'

// Define all available sections
const ALL_SECTIONS = [
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

// Role-based default sections
const ROLE_DEFAULT_SECTIONS = {
  Admin: ALL_SECTIONS,
  HR: [
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
    'Documentation',
    'Settings'
  ],
  Guest: ['Chat'] // Only chat by default, can be expanded
}

export default function UserManagement() {
  const { users, addUser, updateUser, deleteUser } = useUsers()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    phone: '',
    role: '',
    organization: '',
    department: '',
    linkedEmployee: ''
  })
  const [selectedSections, setSelectedSections] = useState<string[]>([])
  const [generatedCredentials, setGeneratedCredentials] = useState({ username: '', password: '', guestId: '' })

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === 'all' || user.role === selectedRole
    return matchesSearch && matchesRole
  })

  // Get users with custom permissions (those with allowedSections or sectionAccess)
  const usersWithCustomPermissions = users.filter(user => 
    (user.sectionAccess && user.sectionAccess.length > 0) || 
    (user.allowedSections && user.allowedSections.length > 0)
  )

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-red-100 text-red-800 hover:bg-red-200'
      case 'HR': return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
      case 'Guest': return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800'
      case 'Inactive': return 'bg-gray-100 text-gray-800'
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const generateCredentials = (name: string, surname: string, role: string) => {
    if (!name || !surname) return { username: '', password: '', guestId: '' }
    const username = `${name.toLowerCase()}.${surname.toLowerCase()}`.replace(/\s+/g, '')
    const password = `${name.toLowerCase()}123`
    const guestId = role === 'Guest' ? `GUEST${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}` : ''
    return { username, password, guestId }
  }

  const handleAddUser = () => {
    setSelectedUser(null)
    setFormData({
      name: '',
      surname: '',
      email: '',
      phone: '',
      role: '',
      organization: '',
      department: '',
      linkedEmployee: ''
    })
    setSelectedSections([])
    setGeneratedCredentials({ username: '', password: '', guestId: '' })
    setIsDialogOpen(true)
  }

  const handleFormChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value }
    setFormData(newFormData)
    
    // Auto-generate credentials when name, surname, or role are filled
    if (field === 'name' || field === 'surname' || field === 'role') {
      if (newFormData.name && newFormData.surname) {
        const credentials = generateCredentials(newFormData.name, newFormData.surname, newFormData.role || formData.role)
        setGeneratedCredentials(credentials)
      }
    }

    // Auto-select sections based on role
    if (field === 'role' && value) {
      const defaultSections = ROLE_DEFAULT_SECTIONS[value as keyof typeof ROLE_DEFAULT_SECTIONS] || []
      setSelectedSections(defaultSections)
    }
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setFormData({
      name: user.name.split(' ')[0] || '',
      surname: user.name.split(' ')[1] || '',
      email: user.email,
      phone: user.phone,
      role: user.role,
      organization: user.organization || '',
      department: user.department || '',
      linkedEmployee: user.linkedEmployee || ''
    })
    setSelectedSections(user.allowedSections || [])
    setGeneratedCredentials({ username: user.username, password: user.password, guestId: user.guestId || '' })
    setIsDialogOpen(true)
  }

  const handleDeleteUser = (id: string) => {
    deleteUser(id)
    toast({
      title: "User Deleted",
      description: "User has been successfully deleted.",
    })
  }

  const toggleSection = (section: string) => {
    setSelectedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const handleSaveUser = () => {
    if (!formData.name || !formData.surname || !formData.email || !formData.role) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    if (formData.role === 'Guest' && !formData.linkedEmployee) {
      toast({
        title: "Validation Error",
        description: "Guest role requires a linked employee.",
        variant: "destructive"
      })
      return
    }

    const fullName = `${formData.name} ${formData.surname}`
    const userPermissions = formData.role === 'Admin' 
      ? ['full_access', 'user_management', 'system_settings']
      : formData.role === 'HR' 
      ? ['employee_management', 'recruitment', 'performance_review'] 
      : ['chat_access']

    if (selectedUser) {
      // Update existing user
      updateUser(selectedUser.id, {
        name: fullName,
        email: formData.email,
        phone: formData.phone || '',
        role: formData.role as 'Admin' | 'HR' | 'Guest',
        department: formData.department,
        organization: formData.organization,
        linkedEmployee: formData.linkedEmployee,
        permissions: userPermissions,
        username: generatedCredentials.username,
        password: generatedCredentials.password,
        guestId: generatedCredentials.guestId,
        allowedSections: selectedSections,
        sectionAccess: [] // Clear any restrictions when updating allowed sections
      })
      
      toast({
        title: "User Updated Successfully",
        description: `User ${fullName} has been updated with section access.`,
      })
    } else {
      // Create new user
      const newUser = {
        name: fullName,
        email: formData.email,
        phone: formData.phone || '',
        role: formData.role as 'Admin' | 'HR' | 'Guest',
        status: 'Active' as const,
        department: formData.department,
        organization: formData.organization,
        linkedEmployee: formData.linkedEmployee,
        permissions: userPermissions,
        username: generatedCredentials.username,
        password: generatedCredentials.password,
        guestId: generatedCredentials.guestId,
        sectionAccess: [], // No restrictions by default
        allowedSections: selectedSections // Granted sections
      }

      addUser(newUser)
      
      toast({
        title: "User Created Successfully",
        description: `User created successfully! Username: ${generatedCredentials.username}, Password: ${generatedCredentials.password}${generatedCredentials.guestId ? `, Guest ID: ${generatedCredentials.guestId}` : ''}. This user is now stored as an initial user.`,
      })
    }

    setIsDialogOpen(false)
    setFormData({
      name: '',
      surname: '',
      email: '',
      phone: '',
      role: '',
      organization: '',
      department: '',
      linkedEmployee: ''
    })
    setSelectedSections([])
    setGeneratedCredentials({ username: '', password: '', guestId: '' })
  }

  const exportUserList = () => {
    const userData = users.map(user => ({
      Name: user.name,
      Email: user.email,
      Phone: user.phone,
      Role: user.role,
      Status: user.status,
      Department: user.department || 'N/A',
      Organization: user.organization || 'N/A',
      Username: user.username,
      LastLogin: user.lastLogin,
      CreatedDate: user.createdDate
    }))
    
    const csvContent = [
      Object.keys(userData[0]).join(','),
      ...userData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `user_list_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "User List Exported",
      description: "User list has been exported successfully.",
    })
  }
  const roleStats = {
    admin: users.filter(u => u.role === 'Admin').length,
    hr: users.filter(u => u.role === 'HR').length,
    guest: users.filter(u => u.role === 'Guest').length,
    active: users.filter(u => u.status === 'Active').length
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users, roles, and section permissions</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportUserList}>
            <Download className="w-4 h-4 mr-2" />
            Export Users
          </Button>
          <Button onClick={handleAddUser} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{roleStats.admin}</p>
                <p className="text-sm text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{roleStats.hr}</p>
                <p className="text-sm text-muted-foreground">HR Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-gray-500" />
              <div>
                <p className="text-2xl font-bold">{roleStats.guest}</p>
                <p className="text-sm text-muted-foreground">Guests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{roleStats.active}</p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="Admin">Admin</SelectItem>
            <SelectItem value="HR">HR</SelectItem>
            <SelectItem value="Guest">Guest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users with Custom Permissions */}
      {usersWithCustomPermissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Users with Custom Permissions</CardTitle>
            <CardDescription>Users who have custom section access or restrictions applied</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {usersWithCustomPermissions.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.role} • {user.email}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {user.sectionAccess?.map((section) => (
                          <Badge key={section} variant="destructive" className="text-xs">
                            Restricted: {section}
                          </Badge>
                        ))}
                        {user.allowedSections?.map((section) => (
                          <Badge key={section} className="bg-green-100 text-green-800 hover:bg-green-200 text-xs">
                            Allowed: {section}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Permissions
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Manage all system users and their access levels</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => {
                toast({
                  title: "Bulk Actions",
                  description: "Bulk user management options opened.",
                })
              }}>
                Bulk Actions
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                toast({
                  title: "Import Users",
                  description: "User import functionality opened.",
                })
              }}>
                Import
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{user.name}</h3>
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                      <Badge className={getStatusColor(user.status)}>
                        {user.status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Mail className="w-3 h-3" />
                        <span>{user.email}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Phone className="w-3 h-3" />
                        <span>{user.phone}</span>
                      </div>
                      {user.department && (
                        <div className="flex items-center space-x-1">
                          <Building2 className="w-3 h-3" />
                          <span>{user.department}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">Access:</span>
                      <div className="flex flex-wrap gap-1">
                        {(user.allowedSections || []).slice(0, 3).map((section) => (
                          <Badge key={section} variant="outline" className="text-xs">
                            {section}
                          </Badge>
                        ))}
                        {(user.allowedSections || []).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{(user.allowedSections || []).length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Last login: {user.lastLogin} | Username: {user.username}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const userData = {
                        Name: user.name,
                        Email: user.email,
                        Phone: user.phone,
                        Role: user.role,
                        Status: user.status,
                        Department: user.department || 'N/A',
                        Username: user.username,
                        LastLogin: user.lastLogin,
                        CreatedDate: user.createdDate,
                        Permissions: (user.permissions || []).join(', '),
                        AllowedSections: (user.allowedSections || []).join(', ')
                      }
                      
                      const content = Object.entries(userData)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join('\n')
                      
                      const blob = new Blob([content], { type: 'text/plain' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `${user.name.replace(/\s+/g, '_')}_profile.txt`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                      
                      toast({
                        title: "User Profile Exported",
                        description: `${user.name}'s profile has been exported.`,
                      })
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditUser(user)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No users found matching your criteria</p>
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {filteredUsers.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {filteredUsers.length} of {users.length} users
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled>Previous</Button>
                <Button variant="outline" size="sm" disabled>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Dialog - Combined Basic Info and Permissions */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser ? 'Update user information and section permissions' : 'Create a new user account with role and section permissions'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">First Name *</Label>
                  <Input 
                    id="name" 
                    placeholder="Enter first name" 
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surname">Surname *</Label>
                  <Input 
                    id="surname" 
                    placeholder="Enter surname" 
                    value={formData.surname}
                    onChange={(e) => handleFormChange('surname', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Enter email address" 
                    value={formData.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    placeholder="Enter phone number" 
                    value={formData.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select 
                    value={formData.role}
                    onValueChange={(value) => handleFormChange('role', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Guest">Guest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization</Label>
                  <Select
                    value={formData.organization}
                    onValueChange={(value) => handleFormChange('organization', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MediaTech Solutions">MediaTech Solutions</SelectItem>
                      <SelectItem value="Creative Studios">Creative Studios</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => handleFormChange('department', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {formData.role === 'Guest' && (
                  <div className="space-y-2">
                    <Label>Linked Employee (Required for Guest role)</Label>
                    <Select
                      value={formData.linkedEmployee}
                      onValueChange={(value) => handleFormChange('linkedEmployee', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select linked employee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sarah Wilson">Sarah Wilson</SelectItem>
                        <SelectItem value="John Smith">John Smith</SelectItem>
                        <SelectItem value="Emily Davis">Emily Davis</SelectItem>
                        <SelectItem value="Michael Johnson">Michael Johnson</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              {/* Auto-generated credentials display */}
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Auto-generated Credentials</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Username</Label>
                    <div className="font-mono bg-background p-2 rounded border">
                      {generatedCredentials.username || 'Enter name and surname to generate'}
                    </div>
                  </div>
                  <div>
                    <Label>Password</Label>
                    <div className="font-mono bg-background p-2 rounded border">
                      {generatedCredentials.password || 'Enter name and surname to generate'}
                    </div>
                  </div>
                  {formData.role === 'Guest' && (
                    <div className="col-span-2">
                      <Label>Guest ID</Label>
                      <div className="font-mono bg-background p-2 rounded border">
                        {generatedCredentials.guestId || 'Enter name, surname and select Guest role to generate'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Section Permissions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Section Access Permissions</h3>
                <div className="text-sm text-muted-foreground">
                  {selectedSections.length} of {ALL_SECTIONS.length} sections selected
                </div>
              </div>
              
              {formData.role && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>{formData.role} Role:</strong> Default sections have been automatically selected. 
                    You can manually adjust permissions by checking/unchecking sections below.
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-3 border rounded-lg">
                {ALL_SECTIONS.map((section) => (
                  <div key={section} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded">
                    <Checkbox 
                      id={section}
                      checked={selectedSections.includes(section)}
                      onCheckedChange={() => toggleSection(section)}
                    />
                    <Label htmlFor={section} className="text-sm font-normal cursor-pointer">
                      {section}
                    </Label>
                  </div>
                ))}
              </div>
              
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Selected Permissions Preview</h4>
                {selectedSections.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedSections.map((section) => (
                      <Badge key={section} className="text-xs">
                        {section}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No sections selected - user will have no access</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser}>
              {selectedUser ? 'Update' : 'Create'} User
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}