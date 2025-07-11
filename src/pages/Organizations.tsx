import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Building2, Plus, Search, Users, Edit, Trash2, MapPin, Phone, Mail, UsersIcon, UserPlus } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'

interface Organization {
  id: string
  name: string
  description: string
  address: string
  phone: string
  email: string
  employeeCount: number
  departments: Department[]
  status: 'Active' | 'Inactive'
  createdDate: string
}

interface Department {
  id: string
  name: string
  description: string
  organizationId: string
  managerId?: string
  managerName?: string
  memberCount: number
  members: DepartmentMember[]
  budget: number
  status: 'Active' | 'Inactive'
  createdDate: string
}

interface DepartmentMember {
  id: string
  name: string
  position: string
  email: string
  avatar?: string
  isManager: boolean
}

const mockMembers: DepartmentMember[] = [
  { id: '1', name: 'John Smith', position: 'Engineering Manager', email: 'john@company.com', isManager: true },
  { id: '2', name: 'Sarah Connor', position: 'Senior Developer', email: 'sarah@company.com', isManager: false },
  { id: '3', name: 'Mike Johnson', position: 'Frontend Developer', email: 'mike@company.com', isManager: false },
  { id: '4', name: 'Emily Davis', position: 'UX Designer', email: 'emily@company.com', isManager: false },
  { id: '5', name: 'Alex Wilson', position: 'Backend Developer', email: 'alex@company.com', isManager: false },
]

const mockOrganizations: Organization[] = [
  {
    id: '1',
    name: 'MediaTech Solutions',
    description: 'Digital media and technology solutions company',
    address: '123 Tech Street, San Francisco, CA 94105',
    phone: '+1 (555) 123-4567',
    email: 'contact@mediatech.com',
    employeeCount: 150,
    status: 'Active',
    createdDate: '2023-01-15',
    departments: [
      {
        id: '1',
        name: 'Engineering',
        description: 'Software development and technical operations',
        organizationId: '1',
        managerId: '1',
        managerName: 'John Smith',
        memberCount: 25,
        members: mockMembers,
        budget: 500000,
        status: 'Active',
        createdDate: '2023-01-15'
      },
      {
        id: '2',
        name: 'Design',
        description: 'User experience and visual design',
        organizationId: '1',
        managerId: '4',
        managerName: 'Emily Davis',
        memberCount: 12,
        members: mockMembers.slice(0, 2),
        budget: 200000,
        status: 'Active',
        createdDate: '2023-02-01'
      }
    ]
  },
  {
    id: '2',
    name: 'Creative Studios',
    description: 'Creative design and content production studio',
    address: '456 Creative Ave, Los Angeles, CA 90210',
    phone: '+1 (555) 987-6543',
    email: 'hello@creativestudios.com',
    employeeCount: 75,
    status: 'Active',
    createdDate: '2023-03-20',
    departments: [
      {
        id: '3',
        name: 'Creative',
        description: 'Creative content production',
        organizationId: '2',
        managerId: '3',
        managerName: 'Mike Johnson',
        memberCount: 18,
        members: mockMembers.slice(0, 3),
        budget: 300000,
        status: 'Active',
        createdDate: '2023-03-20'
      }
    ]
  }
]

export default function Organizations() {
  const { toast } = useToast()
  const [organizations, setOrganizations] = useState<Organization[]>(mockOrganizations)
  const [searchTerm, setSearchTerm] = useState('')
  const [isOrgDialogOpen, setIsOrgDialogOpen] = useState(false)
  const [isDeptDialogOpen, setIsDeptDialogOpen] = useState(false)
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [selectedDept, setSelectedDept] = useState<Department | null>(null)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [members, setMembers] = useState<DepartmentMember[]>(mockMembers)

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddOrganization = () => {
    setSelectedOrg(null)
    setIsOrgDialogOpen(true)
  }

  const handleEditOrganization = (org: Organization) => {
    setSelectedOrg(org)
    setIsOrgDialogOpen(true)
  }

  const handleDeleteOrganization = (id: string) => {
    setOrganizations(organizations.filter(org => org.id !== id))
    toast({
      title: "Organization Deleted",
      description: "Organization has been successfully deleted.",
    })
  }

  const handleAddDepartment = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId)
    if (org) {
      setSelectedOrg(org)
      setSelectedDept(null)
      setIsDeptDialogOpen(true)
    }
  }

  const handleEditDepartment = (dept: Department) => {
    const org = organizations.find(o => o.id === dept.organizationId)
    if (org) {
      setSelectedOrg(org)
      setSelectedDept(dept)
      setIsDeptDialogOpen(true)
    }
  }

  const handleDeleteDepartment = (orgId: string, deptId: string) => {
    setOrganizations(organizations.map(org => 
      org.id === orgId 
        ? { ...org, departments: org.departments.filter(dept => dept.id !== deptId) }
        : org
    ))
    toast({
      title: "Department Deleted",
      description: "Department has been successfully deleted.",
    })
  }

  const handleManageMembers = (dept: Department) => {
    const org = organizations.find(o => o.id === dept.organizationId)
    if (org) {
      setSelectedOrg(org)
      setSelectedDept(dept)
      setSelectedMembers(dept.members.map(m => m.id))
      setIsMembersDialogOpen(true)
    }
  }

  const handleSaveOrganization = () => {
    if (selectedOrg && selectedOrg.id && selectedOrg.id !== 'new') {
      // Update existing organization
      toast({
        title: "Organization Updated",
        description: "Organization has been successfully updated.",
      })
    } else {
      // Create new organization
      const newOrg: Organization = {
        id: Date.now().toString(),
        name: "New Organization",
        description: "New organization description",
        address: "New address",
        phone: "+1 (555) 000-0000",
        email: "contact@neworg.com",
        employeeCount: 0,
        departments: [],
        status: 'Active',
        createdDate: new Date().toISOString().split('T')[0]
      }
      setOrganizations([...organizations, newOrg])
      toast({
        title: "Organization Created",
        description: "New organization has been successfully created.",
      })
    }
    setIsOrgDialogOpen(false)
  }

  const handleSaveDepartment = () => {
    if (!selectedOrg) return

    if (selectedDept && selectedDept.id && selectedDept.id !== 'new') {
      // Update existing department
      setOrganizations(organizations.map(org => 
        org.id === selectedOrg.id 
          ? { ...org, departments: org.departments.map(dept => dept.id === selectedDept.id ? selectedDept : dept) }
          : org
      ))
      toast({
        title: "Department Updated",
        description: "Department has been successfully updated.",
      })
    } else {
      // Create new department
      const newDept: Department = {
        id: Date.now().toString(),
        name: "New Department",
        description: "New department description",
        organizationId: selectedOrg.id,
        memberCount: 0,
        members: [],
        budget: 100000,
        status: 'Active',
        createdDate: new Date().toISOString().split('T')[0]
      }
      setOrganizations(organizations.map(org => 
        org.id === selectedOrg.id 
          ? { ...org, departments: [...org.departments, newDept] }
          : org
      ))
      toast({
        title: "Department Created",
        description: "New department has been successfully created.",
      })
    }
    setIsDeptDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Organizations & Departments</h1>
          <p className="text-muted-foreground">Manage your organization structure, departments, and teams</p>
        </div>
        <Button onClick={handleAddOrganization} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Organization</span>
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-8">
        {filteredOrganizations.map((org) => (
          <Card key={org.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{org.name}</CardTitle>
                    <Badge variant={org.status === 'Active' ? 'default' : 'secondary'}>
                      {org.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddDepartment(org.id)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Department
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditOrganization(org)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteOrganization(org.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <CardDescription>{org.description}</CardDescription>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{org.address}</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{org.phone}</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>{org.email}</span>
                </div>
              </div>

              {/* Departments Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Departments ({org.departments.length})</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {org.departments.map((dept) => (
                    <Card key={dept.id} className="bg-muted/30">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                              <UsersIcon className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{dept.name}</CardTitle>
                              <Badge variant="outline" className="text-xs">
                                {dept.memberCount} members
                              </Badge>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleManageMembers(dept)}
                              title="Manage Members"
                            >
                              <UserPlus className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditDepartment(dept)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDepartment(org.id, dept.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-xs text-muted-foreground">{dept.description}</p>
                        {dept.managerName && (
                          <p className="text-xs text-muted-foreground">
                            Manager: {dept.managerName}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Budget: ${dept.budget.toLocaleString()}
                        </p>
                        <div className="flex -space-x-1">
                          {dept.members.slice(0, 3).map((member) => (
                            <Avatar key={member.id} className="w-6 h-6 border-2 border-background" title={member.name}>
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback className="text-xs">
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {dept.members.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                              +{dept.members.length - 3}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Organization Dialog */}
      <Dialog open={isOrgDialogOpen} onOpenChange={setIsOrgDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedOrg ? 'Edit Organization' : 'Add New Organization'}
            </DialogTitle>
            <DialogDescription>
              {selectedOrg ? 'Update organization details' : 'Create a new organization'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input id="name" placeholder="Enter organization name" defaultValue={selectedOrg?.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select defaultValue={selectedOrg?.status?.toLowerCase()}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Enter organization description" defaultValue={selectedOrg?.description} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" placeholder="Enter organization address" defaultValue={selectedOrg?.address} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="Enter phone number" defaultValue={selectedOrg?.phone} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter email address" defaultValue={selectedOrg?.email} />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOrgDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveOrganization}>
              {selectedOrg ? 'Update' : 'Create'} Organization
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Department Dialog */}
      <Dialog open={isDeptDialogOpen} onOpenChange={setIsDeptDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedDept ? 'Edit Department' : 'Add New Department'}
            </DialogTitle>
            <DialogDescription>
              {selectedDept ? 'Update department information' : `Create a new department for ${selectedOrg?.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deptName">Department Name</Label>
              <Input id="deptName" placeholder="Enter department name" defaultValue={selectedDept?.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager">Department Manager</Label>
              <Select defaultValue={selectedDept?.managerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">John Smith</SelectItem>
                  <SelectItem value="2">Emily Davis</SelectItem>
                  <SelectItem value="3">Mike Johnson</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="deptDescription">Description</Label>
              <Textarea id="deptDescription" placeholder="Enter department description" defaultValue={selectedDept?.description} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget</Label>
              <Input id="budget" type="number" placeholder="Enter budget amount" defaultValue={selectedDept?.budget} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deptStatus">Status</Label>
              <Select defaultValue={selectedDept?.status?.toLowerCase()}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeptDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDepartment}>
              {selectedDept ? 'Update' : 'Create'} Department
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Members Management Dialog */}
      <Dialog open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Manage Members - {selectedDept?.name}
            </DialogTitle>
            <DialogDescription>
              Add or remove members from this department
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current">Current Members</TabsTrigger>
              <TabsTrigger value="add">Add Members</TabsTrigger>
            </TabsList>
            <TabsContent value="current" className="space-y-4">
              <div className="space-y-2">
                {selectedDept?.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.position}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {member.isManager && (
                        <Badge variant="secondary">Manager</Badge>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => {
                        setMembers(prev => prev.filter(m => m.id !== member.id))
                        toast({
                          title: "Member Removed",
                          description: `${member.name} has been removed from the department.`,
                        })
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="add" className="space-y-4">
              <div className="space-y-2">
                <Label>Available Employees</Label>
                {mockMembers.map((member) => (
                  <div key={member.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      checked={selectedMembers.includes(member.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedMembers([...selectedMembers, member.id])
                        } else {
                          setSelectedMembers(selectedMembers.filter(id => id !== member.id))
                        }
                      }}
                    />
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.position}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsMembersDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setIsMembersDialogOpen(false)
              toast({
                title: "Members Updated",
                description: "Department members have been successfully updated.",
              })
            }}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}