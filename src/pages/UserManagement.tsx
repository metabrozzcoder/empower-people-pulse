import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { useUsers } from '@/context/UserContext'
import { User } from '@/context/UserContext'
import { useToast } from '@/hooks/use-toast'
import CustomRolesBox from '@/components/CustomRolesBox'

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
  'Role Management',
  'Access Control',
  'Documentation',
  'Security System',
  'Payment Commission',
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
  const navigate = useNavigate()
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
    linkedEmployee: '',
    birthday: ''
  })
  const [selectedSections, setSelectedSections] = useState<string[]>([])
  const [selectedAccessRules, setSelectedAccessRules] = useState<string[]>([])
  const [generatedCredentials, setGeneratedCredentials] = useState({ username: '', password: '', guestId: '' })
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(true)
  const [orgOptions, setOrgOptions] = useState<string[]>([])
  const [deptOptions, setDeptOptions] = useState<string[]>([])
  const [employeeOptions, setEmployeeOptions] = useState<string[]>([])
  const [customRoles, setCustomRoles] = useState<Array<{ id: string; name: string; allowed_sections: string[] }>>([])
  const [customRoleId, setCustomRoleId] = useState<string>('')
  const [userCustomRoleMap, setUserCustomRoleMap] = useState<Record<string, string>>({})

  const loadCustomRoles = async () => {
    const { data } = await supabase.from('custom_roles').select('id, name, allowed_sections').order('name')
    setCustomRoles(((data ?? []) as any[]).map(r => ({
      id: r.id, name: r.name,
      allowed_sections: Array.isArray(r.allowed_sections) ? r.allowed_sections : [],
    })))
  }

  const loadUserCustomRoles = async () => {
    const { data } = await supabase.from('user_custom_roles').select('user_id, custom_role_id')
    const map: Record<string, string> = {}
    ;((data ?? []) as any[]).forEach(r => { map[r.user_id] = r.custom_role_id })
    setUserCustomRoleMap(map)
  }

  useEffect(() => {
    loadCustomRoles()
    loadUserCustomRoles()
    const ch = supabase
      .channel('custom_roles_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_roles' }, () => loadCustomRoles())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_custom_roles' }, () => loadUserCustomRoles())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])


  useEffect(() => {
    (async () => {
      const [{ data: orgs }, { data: depts }, { data: emps }] = await Promise.all([
        supabase.from('organizations').select('name').order('name'),
        supabase.from('departments').select('name').order('name'),
        supabase.from('employees').select('name').order('name'),
      ])
      setOrgOptions((orgs ?? []).map((o: { name: string }) => o.name))
      setDeptOptions(Array.from(new Set((depts ?? []).map((d: { name: string }) => d.name))))
      setEmployeeOptions((emps ?? []).map((e: { name: string }) => e.name))
    })()
  }, [isDialogOpen])

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

  const LOGIN_DOMAIN = 'sevimlitv.uz'

  const buildLoginEmail = (name: string, surname: string) => {
    const cyrMap: Record<string, string> = {
      а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',
      н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'sch',
      ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',ў:'u',қ:'q',ғ:'g',ҳ:'h',
    }
    const clean = (s: string) => (s || '')
      .toLowerCase()
      .split('').map(ch => cyrMap[ch] ?? ch).join('')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '')
    const n = clean(name)
    const s = clean(surname)
    const local = n && s ? `${n}.${s}` : (n || s || `user${Math.floor(1000 + Math.random() * 9000)}`)
    return `${local}@${LOGIN_DOMAIN}`
  }

  const handleAddUser = () => {
    setSelectedUser(null)
    setFormData({
      name: '', surname: '', email: '', phone: '',
      role: '', position: '', organization: '', department: '', linkedEmployee: '', birthday: ''
    })
    setSelectedSections([])
    setGeneratedCredentials({
      username: buildLoginEmail('', ''),
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
    // Custom role chosen from the same Role dropdown
    if (field === 'role' && value.startsWith('custom:')) {
      const id = value.slice('custom:'.length)
      const cr = customRoles.find(c => c.id === id)
      setCustomRoleId(id)
      const newFormData = { ...formData, role: 'Employee' }
      setFormData(newFormData)
      setSelectedSections(cr?.allowed_sections?.length ? cr.allowed_sections : ROLE_DEFAULT_SECTIONS.Employee)
      setGeneratedCredentials(prev => ({
        username: prev.username || buildLoginEmail(newFormData.name, newFormData.surname),
        password: prev.password || generateStrongPassword(),
        guestId: '',
      }))
      return
    }

    if (field === 'role') setCustomRoleId('')

    const newFormData = { ...formData, [field]: value }
    setFormData(newFormData)

    // Re-generate login email when name/surname changes; keep password unless none.
    if (field === 'name' || field === 'surname' || field === 'role') {
      setGeneratedCredentials(prev => ({
        username: (field === 'name' || field === 'surname')
          ? buildLoginEmail(newFormData.name, newFormData.surname)
          : prev.username || buildLoginEmail(newFormData.name, newFormData.surname),
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
      linkedEmployee: user.linkedEmployee || '',
      birthday: (user as any).birthday || ''
    })
    setSelectedSections(user.allowedSections || [])
    setGeneratedCredentials({ username: user.email || user.username, password: user.generatedPassword || '', guestId: user.guestId || '' })
    // Load any existing custom role assignment for this user
    supabase.from('user_custom_roles').select('custom_role_id').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setCustomRoleId((data as any)?.custom_role_id ?? ''))
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

    // Login email and password are auto-generated; user has no manual control
    let loginEmail = generatedCredentials.username || buildLoginEmail(formData.name, formData.surname)
    const password = generatedCredentials.password || generateStrongPassword()
    // Ensure uniqueness of the generated login email against existing profiles
    if (!selectedUser) {
      const [local, domain] = loginEmail.split('@')
      let candidate = loginEmail
      let n = 1
      // Try base, then base2, base3, ... until unused
      while (true) {
        const { data: existing } = await supabase.from('profiles').select('id').eq('email', candidate).maybeSingle()
        if (!existing) break
        n += 1
        candidate = `${local}${n}@${domain}`
        if (n > 50) { candidate = `${local}.${Math.floor(1000 + Math.random() * 9000)}@${domain}`; break }
      }
      loginEmail = candidate
    }
    if (!generatedCredentials.username || !generatedCredentials.password) {
      setGeneratedCredentials(prev => ({ ...prev, username: loginEmail, password }))
    }
    // The generated email IS the Supabase login email
    formData.email = loginEmail

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
      try {
        await updateUser(selectedUser.id, {
          name: fullName,
          email: formData.email,
          phone: formData.phone || '',
          role: formData.role as 'Admin' | 'HR' | 'Employee' | 'Guest',
          position: formData.position,
          department: formData.department,
          organization: formData.organization,
          linkedEmployee: formData.linkedEmployee,
          permissions: userPermissions,
          username: generatedCredentials.username,
          password: generatedCredentials.password,
          guestId: generatedCredentials.guestId,
          allowedSections: selectedSections,
          sectionAccess: [],
          birthday: formData.birthday || undefined,
        } as any)
        toast({
          title: "User Updated Successfully",
          description: `User ${fullName} has been updated with section access.`,
        })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update user'
        toast({ title: 'Update failed', description: msg, variant: 'destructive' })
        return
      }
    } else {
      // Create new user
      const newUser = {
        name: fullName,
        email: formData.email,
        phone: formData.phone || '',
        position: formData.position,
        role: formData.role as 'Admin' | 'HR' | 'Employee' | 'Guest',
        status: 'Active' as const,
        department: formData.department,
        organization: formData.organization,
        linkedEmployee: formData.linkedEmployee,
        permissions: userPermissions,
        username: loginEmail,
        password,
        accessRules: selectedAccessRules,
        guestId: generatedCredentials.guestId,
        sectionAccess: [], // No restrictions by default
        allowedSections: selectedSections, // Granted sections
        birthday: formData.birthday || undefined,
      } as any

      try {
        await addUser(newUser)
        toast({
          title: "User Created Successfully",
          description: `Login: ${loginEmail} • Password: ${password}${generatedCredentials.guestId ? ` • Guest ID: ${generatedCredentials.guestId}` : ''}. Synced to Supabase — share credentials with the user.`,
        })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to create user'
        toast({ title: 'Failed to create user', description: msg, variant: 'destructive' })
        return
      }
    }

    // Sync custom role assignment for this user
    try {
      let targetUserId = selectedUser?.id as string | undefined
      if (!targetUserId) {
        const { data: prof } = await supabase.from('profiles').select('id').eq('email', formData.email).maybeSingle()
        targetUserId = (prof as any)?.id
      }
      if (targetUserId) {
        await supabase.from('user_custom_roles').delete().eq('user_id', targetUserId)
        if (customRoleId) {
          await supabase.from('user_custom_roles').insert({ user_id: targetUserId, custom_role_id: customRoleId })
        }
      }
    } catch (e) {
      console.warn('Custom role sync failed', e)
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
      linkedEmployee: '',
      birthday: ''
    })
    setSelectedSections([])
    setGeneratedCredentials({ username: '', password: '', guestId: '' })
    setCustomRoleId('')
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
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/role-management')} className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Manage Roles</span>
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
                        {Array.from(new Set([...(user.allowedSections ?? []), ...(user.sectionAccess ?? [])])).map((section) => (
                          <Badge key={section} className="bg-green-100 text-green-800 hover:bg-green-200 text-xs">
                            {section}
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
                      {userCustomRoleMap[user.id] && (
                        <Badge variant="secondary" className="text-xs">
                          {customRoles.find(c => c.id === userCustomRoleMap[user.id])?.name ?? 'Custom Role'}
                        </Badge>
                      )}
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

      {/* Custom Roles Box */}
      <CustomRolesBox />

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
                  <Label htmlFor="email">Login Email <span className="text-xs text-muted-foreground">(auto-generated)</span></Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={generatedCredentials.username}
                    readOnly
                    className="bg-muted/40 font-mono text-sm"
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
                  <Label htmlFor="birthday">Date of Birth {formData.birthday && (<span className="text-xs text-muted-foreground">(age {Math.max(0, Math.floor((Date.now() - new Date(formData.birthday).getTime())/(365.25*24*3600*1000)))})</span>)}</Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => handleFormChange('birthday', e.target.value)}
                    max={new Date().toISOString().slice(0,10)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select 
                    value={customRoleId ? `custom:${customRoleId}` : formData.role}
                    onValueChange={(value) => handleFormChange('role', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>System Roles</SelectLabel>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="Guest">Guest</SelectItem>
                        <SelectItem value="Employee">Employee</SelectItem>
                      </SelectGroup>
                      {customRoles.length > 0 && (
                        <>
                          <SelectSeparator />
                          <SelectGroup>
                            <SelectLabel>Custom Roles</SelectLabel>
                            {customRoles.map(cr => (
                              <SelectItem key={cr.id} value={`custom:${cr.id}`}>{cr.name}</SelectItem>
                            ))}
                          </SelectGroup>
                        </>
                      )}
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
                      {orgOptions.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">No organizations yet</div>
                      ) : orgOptions.map(o => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
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
                      {deptOptions.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">No departments yet</div>
                      ) : deptOptions.map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
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
                        {employeeOptions.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">No employees yet</div>
                        ) : employeeOptions.map(e => (
                          <SelectItem key={e} value={e}>{e}</SelectItem>
                        ))}
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
              
              {/* Auto-generated password box — visible until the user changes it themselves */}
              {(!selectedUser || generatedCredentials.password) && (
                <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {selectedUser ? 'Initial password' : 'Auto-generated password'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedUser
                      ? 'This is the password set by an admin. It stays visible here until the user changes it from their own profile.'
                      : 'Share this temporary password with the user. They can change it later from their profile.'}
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={generatedCredentials.password}
                      className="font-mono text-sm bg-background"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={regeneratePassword}
                      title="Generate new password"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(generatedCredentials.password, 'password')}
                      title="Copy password"
                    >
                      {copiedField === 'password' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
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