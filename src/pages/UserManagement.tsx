
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUsers, User } from '@/context/UserContext'
import { useToast } from '@/hooks/use-toast'

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
  const [generatedCredentials, setGeneratedCredentials] = useState({ username: '', password: '', guestId: '' })

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === 'all' || user.role === selectedRole
    return matchesSearch && matchesRole
  })

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
    const username = `${name.toLowerCase()}.${surname.toLowerCase()}${Math.floor(Math.random() * 1000)}`
    const password = Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 100)
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
        guestId: generatedCredentials.guestId
      })
      
      toast({
        title: "User Updated Successfully",
        description: `User ${fullName} has been updated.`,
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
        sectionAccess: []
      }

      addUser(newUser)
      
      toast({
        title: "User Created Successfully",
        description: `Username: ${generatedCredentials.username}, Password: ${generatedCredentials.password}${generatedCredentials.guestId ? `, Guest ID: ${generatedCredentials.guestId}` : ''}`,
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
    setGeneratedCredentials({ username: '', password: '', guestId: '' })
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
          <p className="text-muted-foreground">Manage users, roles, and permissions</p>
        </div>
        <Button onClick={handleAddUser} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </Button>
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

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Manage all system users and their access levels</CardDescription>
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
                    <p className="text-xs text-muted-foreground">
                      Last login: {user.lastLogin}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
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
          </div>
        </CardContent>
      </Card>

      {/* User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser ? 'Update user information and permissions' : 'Create a new user account with role and permissions'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">First Name</Label>
                <Input 
                  id="name" 
                  placeholder="Enter first name" 
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surname">Surname</Label>
                <Input 
                  id="surname" 
                  placeholder="Enter surname" 
                  value={formData.surname}
                  onChange={(e) => handleFormChange('surname', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
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
                <Label htmlFor="role">Role</Label>
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
            
            {/* Current User Restrictions Display */}
            {selectedUser && selectedUser.sectionAccess && selectedUser.sectionAccess.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">Current Restrictions</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.sectionAccess.map((section) => (
                    <Badge key={section} variant="destructive" className="text-xs">
                      {section}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-red-600 mt-2">
                  To modify restrictions, use the Access Control page.
                </p>
              </div>
            )}
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
          <div className="flex justify-end space-x-2">
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
