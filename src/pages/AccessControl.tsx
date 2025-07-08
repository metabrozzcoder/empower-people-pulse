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
  Lock,
  Unlock,
  Clock,
  MapPin,
  Wifi,
  Smartphone
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { useUsers } from '@/context/UserContext'

interface AccessRule {
  id: string
  name: string
  type: 'IP_RESTRICTION' | 'TIME_RESTRICTION' | 'LOCATION_RESTRICTION' | 'DEVICE_RESTRICTION'
  description: string
  isActive: boolean
  users: string[]
  rules: any
  createdDate: string
}

const mockAccessRules: AccessRule[] = [
  {
    id: '1',
    name: 'Office IP Only',
    type: 'IP_RESTRICTION',
    description: 'Allow access only from office IP addresses',
    isActive: true,
    users: ['admin', 'hr_manager'],
    rules: {
      allowedIPs: ['192.168.1.0/24', '10.0.0.0/8'],
      blockedIPs: []
    },
    createdDate: '2023-01-15'
  },
  {
    id: '2',
    name: 'Business Hours Only',
    type: 'TIME_RESTRICTION',
    description: 'Restrict access to business hours only',
    isActive: true,
    users: ['hr_assistant', 'guest'],
    rules: {
      allowedHours: { start: '09:00', end: '18:00' },
      allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      timezone: 'UTC'
    },
    createdDate: '2023-02-01'
  },
  {
    id: '3',
    name: 'Secure Location Access',
    type: 'LOCATION_RESTRICTION',
    description: 'Allow access only from specific geographic locations',
    isActive: false,
    users: ['admin'],
    rules: {
      allowedCountries: ['US', 'CA'],
      blockedCountries: [],
      allowedRegions: ['New York', 'California']
    },
    createdDate: '2023-02-15'
  },
  {
    id: '4',
    name: 'Trusted Devices Only',
    type: 'DEVICE_RESTRICTION',
    description: 'Allow access only from registered devices',
    isActive: true,
    users: ['admin', 'hr_manager'],
    rules: {
      requireDeviceRegistration: true,
      maxDevicesPerUser: 3,
      deviceTypes: ['desktop', 'mobile']
    },
    createdDate: '2023-03-01'
  }
]

export default function AccessControl() {
  const { toast } = useToast()
  const { users, updateUser } = useUsers()
  const [accessRules, setAccessRules] = useState<AccessRule[]>(mockAccessRules)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<AccessRule | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [restrictedSections, setRestrictedSections] = useState<string[]>([])

  const filteredRules = accessRules.filter(rule =>
    rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddRule = () => {
    setSelectedRule(null)
    setIsDialogOpen(true)
  }

  const handleEditRule = (rule: AccessRule) => {
    setSelectedRule(rule)
    setIsDialogOpen(true)
  }

  const handleDeleteRule = (id: string) => {
    setAccessRules(accessRules.filter(rule => rule.id !== id))
    toast({
      title: "Access Rule Deleted",
      description: "Access control rule has been successfully deleted.",
    })
  }

  const toggleRuleStatus = (id: string) => {
    setAccessRules(accessRules.map(rule =>
      rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
    ))
    toast({
      title: "Rule Status Updated",
      description: "Access control rule status has been updated.",
    })
  }

  const getTypeIcon = (type: AccessRule['type']) => {
    switch (type) {
      case 'IP_RESTRICTION': return Wifi
      case 'TIME_RESTRICTION': return Clock
      case 'LOCATION_RESTRICTION': return MapPin
      case 'DEVICE_RESTRICTION': return Smartphone
      default: return Shield
    }
  }

  const getTypeColor = (type: AccessRule['type']) => {
    switch (type) {
      case 'IP_RESTRICTION': return 'bg-blue-100 text-blue-800'
      case 'TIME_RESTRICTION': return 'bg-green-100 text-green-800'
      case 'LOCATION_RESTRICTION': return 'bg-purple-100 text-purple-800'
      case 'DEVICE_RESTRICTION': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const activeRules = accessRules.filter(rule => rule.isActive).length
  const totalUsers = new Set(accessRules.flatMap(rule => rule.users)).size

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Access Control</h1>
          <p className="text-muted-foreground">Manage access restrictions and security policies</p>
        </div>
        <Button onClick={handleAddRule} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Rule</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{accessRules.length}</p>
                <p className="text-sm text-muted-foreground">Total Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Lock className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{activeRules}</p>
                <p className="text-sm text-muted-foreground">Active Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{totalUsers}</p>
                <p className="text-sm text-muted-foreground">Affected Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Unlock className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{accessRules.length - activeRules}</p>
                <p className="text-sm text-muted-foreground">Inactive Rules</p>
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
            placeholder="Search access rules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Employee Permissions Section */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Section Permissions</CardTitle>
          <CardDescription>Manually select employees and restrict specific sections</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Employee</Label>
                <Select 
                  value={selectedEmployee} 
                  onValueChange={(value) => {
                    setSelectedEmployee(value)
                    const user = users.find(u => u.id === value)
                    setRestrictedSections(user?.sectionAccess || [])
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedEmployee && (
                <div className="space-y-3">
                  <Label>Restricted Sections</Label>
                  <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                    {[
                      'Dashboard', 'Employees', 'Projects', 'Recruitment', 'Tasks', 
                      'Scheduling', 'Attendance', 'Analytics', 'Organizations', 
                      'Chat', 'User Management', 'Access Control', 'Documentation',
                      'AI Assistant', 'Profile', 'Account Settings', 'Security System',
                      'Settings', 'KPI Dashboard', 'Role Management', 'Performance'
                    ].map((section) => (
                      <div key={section} className="flex items-center space-x-2">
                        <Checkbox 
                          id={section}
                          checked={restrictedSections.includes(section)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setRestrictedSections([...restrictedSections, section])
                            } else {
                              setRestrictedSections(restrictedSections.filter(s => s !== section))
                            }
                          }}
                        />
                        <Label htmlFor={section} className="text-sm font-normal">
                          {section}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {selectedEmployee && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Current Restrictions</h4>
                  {restrictedSections.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {restrictedSections.map((section) => (
                        <Badge key={section} variant="destructive" className="text-xs">
                          {section}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No restrictions applied</p>
                  )}
                </div>
              )}
              
              <Button 
                onClick={() => {
                  if (selectedEmployee) {
                    updateUser(selectedEmployee, { sectionAccess: restrictedSections })
                    toast({
                      title: "Permissions Updated",
                      description: "Employee section permissions have been updated successfully.",
                    })
                  }
                }}
                disabled={!selectedEmployee}
                className="w-full"
              >
                Apply Restrictions
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => {
                  if (selectedEmployee) {
                    setRestrictedSections([])
                    updateUser(selectedEmployee, { sectionAccess: [] })
                    toast({
                      title: "Restrictions Cleared",
                      description: "All section restrictions have been removed for this employee.",
                    })
                  }
                }}
                disabled={!selectedEmployee || restrictedSections.length === 0}
                className="w-full"
              >
                Clear All Restrictions
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Access Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Access Control Rules</CardTitle>
          <CardDescription>Configure and manage access restrictions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRules.map((rule) => {
              const TypeIcon = getTypeIcon(rule.type)
              return (
                <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <TypeIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{rule.name}</h3>
                        <Badge className={getTypeColor(rule.type)}>
                          {rule.type.replace('_', ' ')}
                        </Badge>
                        <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Users: {rule.users.length}</span>
                        <span>Created: {new Date(rule.createdDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={rule.isActive}
                      onCheckedChange={() => toggleRuleStatus(rule.id)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditRule(rule)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Rule Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRule ? 'Edit Access Rule' : 'Create New Access Rule'}
            </DialogTitle>
            <DialogDescription>
              {selectedRule ? 'Modify access control rule settings and restrictions' : 'Create a new access control rule with specific restrictions'}
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="rules">Rules</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Rule Name</Label>
                  <Input 
                    id="name" 
                    placeholder="Enter rule name" 
                    defaultValue={selectedRule?.name}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Rule Type</Label>
                  <Select defaultValue={selectedRule?.type}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rule type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IP_RESTRICTION">IP Restriction</SelectItem>
                      <SelectItem value="TIME_RESTRICTION">Time Restriction</SelectItem>
                      <SelectItem value="LOCATION_RESTRICTION">Location Restriction</SelectItem>
                      <SelectItem value="DEVICE_RESTRICTION">Device Restriction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input 
                    id="description" 
                    placeholder="Enter rule description" 
                    defaultValue={selectedRule?.description}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch defaultChecked={selectedRule?.isActive ?? true} />
                  <Label>Enable this rule</Label>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="rules" className="space-y-4">
              <div className="space-y-4">
                <h4 className="font-medium">Rule Configuration</h4>
                <p className="text-sm text-muted-foreground">
                  Configure the specific restrictions for this access control rule.
                </p>
                {/* Rule-specific configuration would go here based on type */}
                <div className="p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    Rule configuration options will be displayed here based on the selected rule type.
                  </p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="users" className="space-y-4">
              <div className="space-y-4">
                <h4 className="font-medium">Affected Users</h4>
                <p className="text-sm text-muted-foreground">
                  Select which users this access control rule applies to.
                </p>
                <div className="p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    User selection interface will be displayed here.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsDialogOpen(false)}>
              {selectedRule ? 'Update' : 'Create'} Rule
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}