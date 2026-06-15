import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Building2, Plus, Search, Edit, Trash2, MapPin, Phone, Mail, UsersIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface Organization {
  id: string
  name: string
  description: string | null
  address: string | null
  phone: string | null
  email: string | null
  status: string
}

interface Department {
  id: string
  organization_id: string
  name: string
  description: string | null
  manager_id: string | null
  manager_name: string | null
  budget: number | null
  status: string
}

interface ProfileLite { id: string; name: string | null; email: string | null }
interface EmployeeLite { id: string; name: string; position: string | null; department: string | null; organization_id: string | null }

const emptyOrg = { name: '', description: '', address: '', phone: '', email: '', status: 'Active' }
const emptyDept = { name: '', description: '', manager_id: '', manager_name: '', budget: 0, status: 'Active' }

export default function Organizations() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [profiles, setProfiles] = useState<ProfileLite[]>([])
  const [employees, setEmployees] = useState<EmployeeLite[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  const [isOrgDialogOpen, setIsOrgDialogOpen] = useState(false)
  const [isDeptDialogOpen, setIsDeptDialogOpen] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null)
  const [orgForm, setOrgForm] = useState({ ...emptyOrg })
  const [deptForm, setDeptForm] = useState({ ...emptyDept })

  const load = async () => {
    setLoading(true)
    const [{ data: orgs, error: orgErr }, { data: depts, error: deptErr }, { data: profs }, { data: emps }] = await Promise.all([
      supabase.from('organizations').select('*').order('created_at', { ascending: false }),
      supabase.from('departments').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, name, email').order('name'),
      supabase.from('employees').select('id, name, position, department, organization_id').order('name'),
    ])
    if (orgErr) toast({ title: 'Failed to load organizations', description: orgErr.message, variant: 'destructive' })
    if (deptErr) toast({ title: 'Failed to load departments', description: deptErr.message, variant: 'destructive' })
    setOrganizations((orgs as Organization[]) ?? [])
    setDepartments((depts as Department[]) ?? [])
    setProfiles((profs as ProfileLite[]) ?? [])
    setEmployees((emps as EmployeeLite[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCreateOrg = () => {
    setEditingOrg(null)
    setOrgForm({ ...emptyOrg })
    setIsOrgDialogOpen(true)
  }
  const openEditOrg = (org: Organization) => {
    setEditingOrg(org)
    setOrgForm({
      name: org.name,
      description: org.description ?? '',
      address: org.address ?? '',
      phone: org.phone ?? '',
      email: org.email ?? '',
      status: org.status,
    })
    setIsOrgDialogOpen(true)
  }

  const saveOrganization = async () => {
    if (!orgForm.name.trim()) {
      toast({ title: 'Name required', description: 'Please enter an organization name.', variant: 'destructive' })
      return
    }
    if (editingOrg) {
      const { error } = await supabase.from('organizations').update(orgForm).eq('id', editingOrg.id)
      if (error) return toast({ title: 'Update failed', description: error.message, variant: 'destructive' })
      toast({ title: 'Organization updated' })
    } else {
      const { error } = await supabase.from('organizations').insert(orgForm)
      if (error) return toast({ title: 'Create failed', description: error.message, variant: 'destructive' })
      toast({ title: 'Organization created' })
    }
    setIsOrgDialogOpen(false)
    await load()
  }

  const deleteOrganization = async (id: string) => {
    const { error } = await supabase.from('organizations').delete().eq('id', id)
    if (error) return toast({ title: 'Delete failed', description: error.message, variant: 'destructive' })
    toast({ title: 'Organization deleted' })
    await load()
  }

  const openCreateDept = (orgId: string) => {
    setActiveOrgId(orgId)
    setEditingDept(null)
    setDeptForm({ ...emptyDept })
    setIsDeptDialogOpen(true)
  }
  const openEditDept = (dept: Department) => {
    setActiveOrgId(dept.organization_id)
    setEditingDept(dept)
    setDeptForm({
      name: dept.name,
      description: dept.description ?? '',
      manager_id: dept.manager_id ?? '',
      manager_name: dept.manager_name ?? '',
      budget: Number(dept.budget ?? 0),
      status: dept.status,
    })
    setIsDeptDialogOpen(true)
  }

  const saveDepartment = async () => {
    if (!activeOrgId) return
    if (!deptForm.name.trim()) {
      toast({ title: 'Name required', description: 'Please enter a department name.', variant: 'destructive' })
      return
    }
    if (editingDept) {
      const { error } = await supabase.from('departments').update(deptForm).eq('id', editingDept.id)
      if (error) return toast({ title: 'Update failed', description: error.message, variant: 'destructive' })
      toast({ title: 'Department updated' })
    } else {
      const { error } = await supabase.from('departments').insert({ ...deptForm, organization_id: activeOrgId })
      if (error) return toast({ title: 'Create failed', description: error.message, variant: 'destructive' })
      toast({ title: 'Department created' })
    }
    setIsDeptDialogOpen(false)
    await load()
  }

  const deleteDepartment = async (id: string) => {
    const { error } = await supabase.from('departments').delete().eq('id', id)
    if (error) return toast({ title: 'Delete failed', description: error.message, variant: 'destructive' })
    toast({ title: 'Department deleted' })
    await load()
  }

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (org.description ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('pages.organizations.title')}</h1>
          <p className="text-muted-foreground">{t('pages.organizations.subtitle')}</p>
        </div>
        <Button onClick={openCreateOrg} className="flex items-center space-x-2">
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

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : filteredOrganizations.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No organizations yet. Click "Add Organization" to create one.</CardContent></Card>
      ) : (
        <div className="space-y-8">
          {filteredOrganizations.map((org) => {
            const orgDepts = departments.filter(d => d.organization_id === org.id)
            return (
              <Card key={org.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{org.name}</CardTitle>
                        <Badge variant={org.status === 'Active' ? 'default' : 'secondary'}>{org.status}</Badge>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="outline" size="sm" onClick={() => openCreateDept(org.id)}>
                        <Plus className="w-4 h-4 mr-1" />Add Department
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditOrg(org)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteOrganization(org.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {org.description && <CardDescription>{org.description}</CardDescription>}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {org.address && <div className="flex items-center space-x-2 text-muted-foreground"><MapPin className="w-4 h-4" /><span>{org.address}</span></div>}
                    {org.phone && <div className="flex items-center space-x-2 text-muted-foreground"><Phone className="w-4 h-4" /><span>{org.phone}</span></div>}
                    {org.email && <div className="flex items-center space-x-2 text-muted-foreground"><Mail className="w-4 h-4" /><span>{org.email}</span></div>}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Departments ({orgDepts.length})</h3>
                    {orgDepts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No departments yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {orgDepts.map((dept) => (
                          <Card key={dept.id} className="bg-muted/30">
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <UsersIcon className="w-4 h-4 text-primary" />
                                  </div>
                                  <CardTitle className="text-base">{dept.name}</CardTitle>
                                </div>
                                <div className="flex space-x-1">
                                  <Button variant="ghost" size="sm" onClick={() => openEditDept(dept)}><Edit className="w-3 h-3" /></Button>
                                  <Button variant="ghost" size="sm" onClick={() => deleteDepartment(dept.id)}><Trash2 className="w-3 h-3" /></Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-1">
                              {dept.description && <p className="text-xs text-muted-foreground">{dept.description}</p>}
                              {dept.manager_name && <p className="text-xs text-muted-foreground">Manager: {dept.manager_name}</p>}
                              <p className="text-xs text-muted-foreground">Budget: ${Number(dept.budget ?? 0).toLocaleString()}</p>
                              <Badge variant="outline" className="text-xs">{dept.status}</Badge>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Organization Dialog */}
      <Dialog open={isOrgDialogOpen} onOpenChange={setIsOrgDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingOrg ? 'Edit Organization' : 'Add New Organization'}</DialogTitle>
            <DialogDescription>{editingOrg ? 'Update organization details' : 'Create a new organization'}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Organization Name</Label>
              <Input value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={orgForm.status} onValueChange={(v) => setOrgForm({ ...orgForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea value={orgForm.description} onChange={(e) => setOrgForm({ ...orgForm, description: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Address</Label>
              <Textarea value={orgForm.address} onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={orgForm.phone} onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={orgForm.email} onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOrgDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveOrganization}>{editingOrg ? 'Update' : 'Create'} Organization</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Department Dialog */}
      <Dialog open={isDeptDialogOpen} onOpenChange={setIsDeptDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingDept ? 'Edit Department' : 'Add New Department'}</DialogTitle>
            <DialogDescription>{editingDept ? 'Update department information' : 'Create a new department'}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Department Name</Label>
              <Input value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Manager</Label>
              <Select
                value={deptForm.manager_id || 'none'}
                onValueChange={(v) => {
                  if (v === 'none') {
                    setDeptForm({ ...deptForm, manager_id: '', manager_name: '' })
                  } else {
                    const p = profiles.find(x => x.id === v)
                    setDeptForm({ ...deptForm, manager_id: v, manager_name: p?.name || p?.email || '' })
                  }
                }}
              >
                <SelectTrigger><SelectValue placeholder="Select manager from users" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— No manager —</SelectItem>
                  {profiles.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name || p.email || p.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea value={deptForm.description} onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Budget</Label>
              <Input type="number" value={deptForm.budget} onChange={(e) => setDeptForm({ ...deptForm, budget: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={deptForm.status} onValueChange={(v) => setDeptForm({ ...deptForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeptDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveDepartment}>{editingDept ? 'Update' : 'Create'} Department</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
