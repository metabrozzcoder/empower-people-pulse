
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { UsersIcon, Plus, Search, User, Edit, Trash2, Building2, UserPlus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'

interface DepartmentMember {
  id: string
  name: string
  position: string
  email: string
  avatar?: string
  isManager: boolean
}

interface Department {
  id: string
  name: string
  description: string
  organizationId: string
  organizationName: string
  managerId: string
  managerName: string
  memberCount: number
  members: DepartmentMember[]
  budget: number
  status: 'Active' | 'Inactive'
  createdDate: string
}

const mockMembers: DepartmentMember[] = [
  { id: '1', name: 'John Smith', position: 'Engineering Manager', email: 'john@company.com', isManager: true },
  { id: '2', name: 'Sarah Connor', position: 'Senior Developer', email: 'sarah@company.com', isManager: false },
  { id: '3', name: 'Mike Johnson', position: 'Frontend Developer', email: 'mike@company.com', isManager: false },
  { id: '4', name: 'Emily Davis', position: 'UX Designer', email: 'emily@company.com', isManager: false },
  { id: '5', name: 'Alex Wilson', position: 'Backend Developer', email: 'alex@company.com', isManager: false },
]

const mockDepartments: Department[] = [
  {
    id: '1',
    name: 'Engineering',
    description: 'Software development and technical operations',
    organizationId: '1',
    organizationName: 'MediaTech Solutions',
    managerId: '1',
    managerName: 'John Smith',
    memberCount: 5,
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
    organizationName: 'MediaTech Solutions',
    managerId: '2',
    managerName: 'Emily Davis',
    memberCount: 12,
    members: [
      { id: '4', name: 'Emily Davis', position: 'Design Manager', email: 'emily@company.com', isManager: true },
      { id: '5', name: 'Alex Wilson', position: 'UX Designer', email: 'alex.design@company.com', isManager: false },
    ],
    budget: 200000,
    status: 'Active',
    createdDate: '2023-02-01'
  },
  {
    id: '3',
    name: 'Marketing',
    description: 'Brand marketing and customer acquisition',
    organizationId: '1',
    organizationName: 'MediaTech Solutions',
    managerId: '3',
    managerName: 'David Brown',
    memberCount: 18,
    members: [
      { id: '6', name: 'David Brown', position: 'Marketing Manager', email: 'david@company.com', isManager: true },
      { id: '7', name: 'Lisa Zhang', position: 'Content Strategist', email: 'lisa@company.com', isManager: false },
    ],
    budget: 300000,
    status: 'Active',
    createdDate: '2023-02-15'
  }
]

export default function Departments() {
  const { toast } = useToast()
  const [departments, setDepartments] = useState<Department[]>(mockDepartments)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDept, setSelectedDept] = useState<Department | null>(null)
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.organizationName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddDepartment = () => {
    setSelectedDept(null)
    setIsDialogOpen(true)
  }

  const handleEditDepartment = (dept: Department) => {
    setSelectedDept(dept)
    setIsDialogOpen(true)
  }

  const handleDeleteDepartment = (id: string) => {
    setDepartments(departments.filter(dept => dept.id !== id))
    toast({
      title: "Department Deleted",
      description: "Department has been successfully deleted.",
    })
  }

  const handleSaveDepartment = () => {
    // In a real app, this would validate and save the department
    setIsDialogOpen(false)
    toast({
      title: selectedDept ? "Department Updated" : "Department Created",
      description: selectedDept ? "Department has been updated successfully." : "New department has been created successfully.",
    })
  }

  const handleSaveMembers = () => {
    // In a real app, this would save the member changes
    setIsMembersDialogOpen(false)
    toast({
      title: "Members Updated",
      description: "Department members have been updated successfully.",
    })
  }

  const handleManageMembers = (dept: Department) => {
    setSelectedDept(dept)
    setSelectedMembers(dept.members.map(m => m.id))
    setIsMembersDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Departments</h1>
          <p className="text-muted-foreground">Manage departments and their members</p>
        </div>
        <Button onClick={handleAddDepartment} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Department</span>
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.map((dept) => (
          <Card key={dept.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <UsersIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{dept.name}</CardTitle>
                    <Badge variant={dept.status === 'Active' ? 'default' : 'secondary'}>
                      {dept.status}
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
                    <UserPlus className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditDepartment(dept)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDepartment(dept.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription>{dept.description}</CardDescription>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  <span>{dept.organizationName}</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>Manager: {dept.managerName}</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <UsersIcon className="w-4 h-4" />
                  <span>{dept.memberCount} members</span>
                </div>
                <div className="text-muted-foreground">
                  Budget: ${dept.budget.toLocaleString()}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-2">Team Members ({dept.members.length})</div>
                <div className="flex -space-x-2">
                  {dept.members.slice(0, 4).map((member) => (
                    <Avatar key={member.id} className="w-8 h-8 border-2 border-background" title={member.name}>
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="text-xs">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {dept.members.length > 4 && (
                    <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                      +{dept.members.length - 4}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Department Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedDept ? 'Edit Department' : 'Add New Department'}
            </DialogTitle>
            <DialogDescription>
              {selectedDept ? 'Update department information and settings' : 'Create a new department with details and assignments'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Department Name</Label>
              <Input id="name" placeholder="Enter department name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">MediaTech Solutions</SelectItem>
                  <SelectItem value="2">Creative Studios</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Enter department description" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager">Department Manager</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">John Smith</SelectItem>
                  <SelectItem value="2">Emily Davis</SelectItem>
                  <SelectItem value="3">David Brown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget</Label>
              <Input id="budget" type="number" placeholder="Enter budget amount" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select>
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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
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
                      <Button variant="ghost" size="sm">
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
            <Button onClick={handleSaveMembers}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
