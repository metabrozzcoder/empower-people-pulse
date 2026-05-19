import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  Building2,
  Download,
  Copy,
  RefreshCw,
  KeyRound,
  AtSign,
  IdCard,
  Check,
  Eye,
  EyeOff
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { useUsers } from '@/context/UserContext'
import { User } from '@/context/UserContext'
import { useToast } from '@/hooks/use-toast'

// Define job positions for the system
const JOB_POSITIONS = [
  'Reporter',
  'Admin',
  'Head of Reporters',
  'Driver',
  'Equipment Department',
  'Initiator',
  'Employee'
]

// Define all available sections
const ALL_SECTIONS = [
  'Dashboard',
  'Shooting Requests',
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

// Mock access control rules
const ACCESS_CONTROL_RULES = [
  {
    id: '1',
    name: 'Office IP Only',
    description: 'Allow access only from office IP addresses',
  },
  {
    id: '2',
    name: 'Business Hours Only',
    description: 'Restrict access to business hours only',
  },
  {
    id: '3',
    name: 'Secure Location Access',
    description: 'Allow access only from specific geographic locations',
  },
  {
    id: '4',
    name: 'Trusted Devices Only',
    description: 'Allow access only from registered devices',
  }
]

// Role-based default sections
const ROLE_DEFAULT_SECTIONS = {
  Admin: ALL_SECTIONS,
  HR: [
    'Dashboard',
    
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
  Guest: ['Chat'], // Only chat by default, can be expanded
  Employee: ['Dashboard', 'Shooting Requests', 'Organizations', 'Chat', 'Scheduling', 'Documentation'] // Default sections for Employee role
}

export default function UserManagement() {
  const { t } = useTranslation()
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
    position: '',
    organization: '',
    department: '',
    linkedEmployee: ''
  })
  const [selectedSections, setSelectedSections] = useState<string[]>([])
  const [selectedAccessRules, setSelectedAccessRules] = useState<string[]>([])
  const [generatedCredentials, setGeneratedCredentials] = useState({ username: '', password: '', guestId: '' })
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(true)

  const copyToClipboard = (value: string, field: string) => {
    if (!value) return
    navigator.clipboard.writeText(value)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 1500)
  }

  const regeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    const specials = '!@#$%&*'
    let pwd = ''
    const arr = new Uint32Array(10)
    crypto.getRandomValues(arr)
    for (let i = 0; i < 10; i++) pwd += chars[arr[i] % chars.length]
    pwd += specials[Math.floor(Math.random() * specials.length)]
    pwd += Math.floor(Math.random() * 10).toString()
    setGeneratedCredentials(prev => ({ ...prev, password: pwd }))
  }
  const [isBulkActionsDialogOpen, setBulkActionsDialogOpen] = useState(false)
  const [isImportDialogOpen, setImportDialogOpen] = useState(false)

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

  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    const specials = '!@#$%&*'
    let pwd = ''
    const arr = new Uint32Array(10)
    crypto.getRandomValues(arr)
    for (let i = 0; i < 10; i++) pwd += chars[arr[i] % chars.length]
    pwd += specials[Math.floor(Math.random() * specials.length)]
    pwd += Math.floor(Math.random() * 10).toString()
    return pwd
  }

  const buildUsername = (name: string, surname: string) => {
    const base = `${(name || '').toLowerCase()}${surname ? '.' + surname.toLowerCase() : ''}`
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9.]/g, '')
    return base || `user${Math.floor(1000 + Math.random() * 9000)}`
  }

  const handleAddUser = () => {
    setSelectedUser(null)
    setFormData({
      name: '', surname: '', email: '', phone: '',
      role: '', position: '', organization: '', department: '', linkedEmployee: ''
    })
    setSelectedSections([])
    setGeneratedCredentials({
      username: `user${Math.floor(1000 + Math.random() * 9000)}`,
      password: generateStrongPassword(),
      guestId: '',
    })
    setIsDialogOpen(true)
  }

  const toggleSection = (section: string) => {
    setSelectedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const toggleAccessRule = (ruleId: string) => {
    setSelectedAccessRules(prev => 
      prev.includes(ruleId) ? prev.filter(id => id !== ruleId) : [...prev, ruleId]
    )
  }

  const handleFormChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value }
    setFormData(newFormData)

    // Always keep username synced to name/surname; keep existing password unless none.
    if (field === 'name' || field === 'surname' || field === 'role') {
      setGeneratedCredentials(prev => ({
        username: buildUsername(newFormData.name, newFormData.surname),
        password: prev.password || generateStrongPassword(),
        guestId: (newFormData.role || formData.role) === 'Guest'
          ? (prev.guestId || `GUEST${Math.floor(1000 + Math.random() * 9000)}`)
          : '',
      }))
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
      position: user.position || '',
      organization: user.organization || '',
      department: user.department || '',
      linkedEmployee: user.linkedEmployee || ''
    })
    setSelectedSections(user.allowedSections || [])
    setGeneratedCredentials({ username: user.username, password: 'password123', guestId: user.guestId || '' })
    setIsDialogOpen(true)
  }

  const handleDeleteUser = (id: string) => {
    deleteUser(id)
    toast({
      title: "User Deleted",
      description: "User has been successfully deleted.",
    })
  }

  const handleSaveUser = async () => {
    if (!formData.name || !formData.surname || !formData.role) {
      toast({
        title: "Validation Error",
        description: "Please fill in name, surname and role.",
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

    // Ensure email is set (auto-fill from username if empty)
    if (!formData.email && generatedCredentials.username) {
      formData.email = `${generatedCredentials.username}@ark.local`
    }

    const fullName = `${formData.name} ${formData.surname}`
    const userPermissions = formData.role === 'Admin' 
      ? ['full_access', 'user_management', 'system_settings']
      : formData.role === 'HR' 
      ? ['employee_management', 'recruitment', 'performance_review'] 
      : formData.role === 'Employee'
      ? ['organization_access', 'chat_access', 'scheduling_access', 'documentation_access', 'shooting_request_access']
      : ['chat_access']

    if (selectedUser) {
      // Update existing user
      updateUser(selectedUser.id, {
        name: fullName,
        email: formData.email,
        phone: formData.phone || '',
        role: formData.role as 'Admin' | 'HR' | 'Guest',
        position: formData.position,
        department: formData.department,
        organization: formData.organization,
        linkedEmployee: formData.linkedEmployee,
        permissions: userPermissions,
        username: generatedCredentials.username,
        password: generatedCredentials.password,
        // Remove accessRules property as it doesn't exist on User type
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
        position: formData.position,
        role: formData.role as 'Admin' | 'HR' | 'Guest',
        status: 'Active' as const,
        department: formData.department,
        organization: formData.organization,
        linkedEmployee: formData.linkedEmployee,
        permissions: userPermissions,
        username: generatedCredentials.username,
        password: generatedCredentials.password,
        accessRules: selectedAccessRules,
        guestId: generatedCredentials.guestId,
        sectionAccess: [], // No restrictions by default
        allowedSections: selectedSections // Granted sections
      }

      try {
        await addUser(newUser)
        toast({
          title: "User Created Successfully",
          description: `Login: ${formData.email} / Password: ${generatedCredentials.password}${generatedCredentials.guestId ? ` / Guest ID: ${generatedCredentials.guestId}` : ''}. Share these credentials with the user — no email verification required.`,
        })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to create user'
        toast({ title: 'Failed to create user', description: msg, variant: 'destructive' })
        return
      }
    }

    setIsDialogOpen(false)
    setFormData({
      name: '',
      surname: '',
      email: '',
      phone: '',
      role: '',
      position: '',
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
          <h1 className="text-3xl font-bold">{t('pages.userManagement.title')}</h1>
          <p className="text-muted-foreground">{t('pages.userManagement.subtitle')}</p>
        </div>
        <div>
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
                setBulkActionsDialogOpen(true)
              }}>
                Bulk Actions
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                setImportDialogOpen(true)
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
                  <Label htmlFor="email">Email <span className="text-xs text-muted-foreground">(optional)</span></Label>
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
                      <SelectItem value="Employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Job Position</Label>
                  <Select
                    value={formData.position}
                    onValueChange={(value) => handleFormChange('position', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select job position" />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_POSITIONS.map(position => (
                        <SelectItem key={position} value={position}>{position}</SelectItem>
                      ))}
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
              
              {/* Access Control Rules */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Access Control Rules</h3>
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Select which access control rules should be applied to this user. These rules will restrict when and how the user can access the system.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto p-3 border rounded-lg">
                  {ACCESS_CONTROL_RULES.map((rule) => (
                    <div key={rule.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded">
                      <Checkbox 
                        id={`rule-${rule.id}`}
                        checked={selectedAccessRules.includes(rule.id)}
                        onCheckedChange={() => toggleAccessRule(rule.id)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={`rule-${rule.id}`} className="text-sm font-medium cursor-pointer">
                          {rule.name}
                        </Label>
                        <p className="text-xs text-muted-foreground">{rule.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedAccessRules.length > 0 && (
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Selected Access Rules</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAccessRules.map((ruleId) => {
                        const rule = ACCESS_CONTROL_RULES.find(r => r.id === ruleId);
                        return rule ? (
                          <Badge key={ruleId} className="text-xs">
                            {rule.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Auto-generated credentials — premium card */}
              <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-5 shadow-sm">
                <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <KeyRound className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold leading-tight">Login Credentials</h4>
                        <p className="text-xs text-muted-foreground">Auto-generated — share with the user</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={regeneratePassword}
                      className="h-8 gap-1.5"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      New password
                    </Button>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { key: 'username', label: 'Username', value: generatedCredentials.username, icon: AtSign, empty: 'Enter a name to generate' },
                      { key: 'password', label: 'Password', value: generatedCredentials.password, icon: KeyRound, empty: 'Will be generated' },
                      ...(formData.role === 'Guest' ? [{ key: 'guestId', label: 'Guest ID', value: generatedCredentials.guestId, icon: IdCard, empty: 'Select Guest role' }] : []),
                    ].map(({ key, label, value, icon: Icon, empty }) => {
                      const isPassword = key === 'password'
                      const displayValue = value
                        ? (isPassword && !showPassword ? '•'.repeat(value.length) : value)
                        : empty
                      return (
                        <div key={key} className="group flex items-center gap-2 rounded-lg border bg-background/80 backdrop-blur-sm p-3 transition-all hover:border-primary/40 hover:shadow-sm">
                          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
                            <div className={`font-mono text-sm truncate ${value ? 'text-foreground' : 'text-muted-foreground/60 italic'}`}>
                              {displayValue}
                            </div>
                          </div>
                          {isPassword && value && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setShowPassword(s => !s)}
                              className="h-8 w-8 shrink-0"
                              title={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={!value}
                            onClick={() => copyToClipboard(value, key)}
                            className="h-8 w-8 shrink-0"
                          >
                            {copiedField === key ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      )
                    })}
                  </div>
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

            <Separator />

            {/* Access Control Rules */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Access Control Rules</h3>
              </div>
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Select which access control rules should be applied to this user. These rules will restrict when and how the user can access the system.
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto p-3 border rounded-lg">
                {ACCESS_CONTROL_RULES.map((rule) => (
                  <div key={rule.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded">
                    <Checkbox 
                      id={`rule-${rule.id}`}
                      checked={selectedAccessRules.includes(rule.id)}
                      onCheckedChange={() => toggleAccessRule(rule.id)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={`rule-${rule.id}`} className="text-sm font-medium cursor-pointer">
                        {rule.name}
                      </Label>
                      <p className="text-xs text-muted-foreground">{rule.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedAccessRules.length > 0 && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Selected Access Rules</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAccessRules.map((ruleId) => {
                      const rule = ACCESS_CONTROL_RULES.find(r => r.id === ruleId);
                      return rule ? (
                        <Badge key={ruleId} className="text-xs">
                          {rule.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
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

      {/* Bulk Actions Dialog */}
      <Dialog open={isBulkActionsDialogOpen} onOpenChange={setBulkActionsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Actions</DialogTitle>
            <DialogDescription>
              Perform actions on multiple users at once
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => {
                exportUserList()
                setBulkActionsDialogOpen(false)
              }}
            >
              Export All Users
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => {
                const activeUsers = users.filter(u => u.status === 'Active')
                activeUsers.forEach(user => {
                  updateUser(user.id, { status: 'Inactive' })
                })
                setBulkActionsDialogOpen(false)
                toast({
                  title: "Bulk Action Complete",
                  description: `${activeUsers.length} users have been deactivated.`,
                })
              }}
            >
              Deactivate All Active Users
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => {
                users.forEach(user => {
                  updateUser(user.id, { 
                    allowedSections: ROLE_DEFAULT_SECTIONS[user.role as keyof typeof ROLE_DEFAULT_SECTIONS] || []
                  })
                })
                setBulkActionsDialogOpen(false)
                toast({
                  title: "Permissions Reset",
                  description: "All users have been reset to default role permissions.",
                })
              }}
            >
              Reset All Permissions to Default
            </Button>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setBulkActionsDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Users Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Users</DialogTitle>
            <DialogDescription>
              Import users from CSV or create sample users
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <div className="space-y-2">
                <h3 className="font-medium">CSV Import</h3>
                <p className="text-sm text-muted-foreground">
                  Upload a CSV file with columns: Name, Email, Phone, Role, Department, Organization
                </p>
                <Button variant="outline">
                  Choose CSV File
                </Button>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}