
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { supabase } from '@/integrations/supabase/client'
import { DollarSign } from 'lucide-react'

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
  totalSpent: number
  status: 'Active' | 'Inactive'
  createdDate: string
}

const mockMembers: DepartmentMember[] = []

const mockDepartments: Department[] = []

export default function Departments() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [departments, setDepartments] = useState<Department[]>(mockDepartments)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDept, setSelectedDept] = useState<Department | null>(null)
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  React.useEffect(() => {
    const load = async () => {
      const [{ data: deptRows }, { data: orgs }, { data: emps }, { data: paid }] = await Promise.all([
        supabase.from('departments').select('id, name, description, organization_id, manager_id, budget, status, created_at').order('name'),
        supabase.from('organizations').select('id, name'),
        supabase.from('employees').select('id, name, email, position, department, avatar, salary, status'),
        supabase.from('payment_orders').select('budget, department_id, department_name').eq('status', 'paid'),
      ])
      if (!deptRows) return
      const orgMap = new Map(((orgs ?? []) as { id: string; name: string }[]).map(o => [o.id, o.name]))
      const empList = (emps ?? []) as { id: string; name: string; email: string | null; position: string | null; department: string | null; avatar: string | null; salary: number | null; status: string | null }[]

      // Build spent map: by department_id first, then by department_name
      const spentById = new Map<string, number>()
      const spentByName = new Map<string, number>()
      ;((paid ?? []) as { budget: number | null; department_id: string | null; department_name: string | null }[]).forEach(p => {
        const amt = Number(p.budget ?? 0)
        if (p.department_id) spentById.set(p.department_id, (spentById.get(p.department_id) ?? 0) + amt)
        else if (p.department_name) spentByName.set(p.department_name, (spentByName.get(p.department_name) ?? 0) + amt)
      })

      const mapped: Department[] = (deptRows as Array<{
        id: string; name: string; description: string | null; organization_id: string | null;
        manager_id: string | null; budget: number | null; status: string | null; created_at: string
      }>).map(d => {
        const members: DepartmentMember[] = empList
          .filter(e => (e.department ?? '').toLowerCase() === d.name.toLowerCase())
          .map(e => ({
            id: e.id,
            name: e.name,
            position: e.position ?? '',
            email: e.email ?? '',
            avatar: e.avatar ?? undefined,
            isManager: d.manager_id ? e.id === d.manager_id : false,
          }))
        return {
          id: d.id,
          name: d.name,
          description: d.description ?? '',
          organizationId: d.organization_id ?? '',
          organizationName: d.organization_id ? (orgMap.get(d.organization_id) ?? '') : '',
          managerId: d.manager_id ?? '',
          managerName: members.find(m => m.isManager)?.name ?? '—',
          memberCount: members.length,
          members,
          budget: Number(d.budget ?? 0),
          totalSpent: (spentById.get(d.id) ?? 0) + (spentByName.get(d.name) ?? 0),
          status: (d.status === 'Inactive' ? 'Inactive' : 'Active'),
          createdDate: d.created_at,
        }
      })
      setDepartments(mapped)
    }
    load()

    const ch = supabase
      .channel('departments-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_orders' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'departments' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.organizationName.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <h1 className="text-3xl font-bold">{t('pages.departments.title')}</h1>
          <p className="text-muted-foreground">{t('pages.departments.subtitle')}</p>
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
