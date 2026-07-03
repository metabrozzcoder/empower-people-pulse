
import { useState, useMemo, useEffect } from "react"
import { useTranslation } from 'react-i18next'
import { Search, Filter, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { EmployeeCard } from "@/components/EmployeeCard"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/AuthContext"
import type { Employee } from "@/types/employee"

interface DbEmployee {
  id: string
  profile_id: string | null
  name: string
  email: string | null
  position: string | null
  department: string | null
  hire_date: string | null
  birthday: string | null
  salary: number | null
  status: string | null
  avatar: string | null
  phone: string | null
  location: string | null
  manager: string | null
  performance_score: number | null
  organization_id: string | null
}

interface OrgLite { id: string; name: string }

type EmployeeView = Employee & { organizationId?: string; organizationName?: string }

const toViewEmployee = (e: DbEmployee, idx: number, orgName?: string): EmployeeView => ({
  id: idx + 1,
  name: e.name,
  email: e.email ?? '',
  position: e.position ?? '',
  department: e.department ?? 'General',
  hireDate: e.hire_date ?? '',
  birthday: e.birthday ?? '',
  salary: e.salary ?? 0,
  status: ((e.status as Employee['status']) ?? 'Active'),
  avatar: e.avatar ?? undefined,
  phone: e.phone ?? '',
  location: e.location ?? '',
  manager: e.manager ?? undefined,
  performanceScore: e.performance_score ?? 0,
  organizationId: e.organization_id ?? undefined,
  organizationName: orgName,
})

const POSITION_PRESETS = [
  'Software Engineer', 'Senior Engineer', 'Product Manager', 'Designer',
  'HR Manager', 'Accountant', 'Operations Manager', 'Marketing Specialist',
  'Sales Representative', 'Director', 'Driver', 'Technician',
]

interface CustomRoleLite { id: string; name: string }
interface DepartmentLite { id: string; name: string }
interface ProfileLite { id: string; name: string | null; email: string | null; position: string | null; department: string | null }

export default function Employees() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { currentUser } = useAuth()
  const canView = currentUser?.role === 'Admin' || currentUser?.role === 'HR'
  const [employees, setEmployees] = useState<EmployeeView[]>([])
  const [organizations, setOrganizations] = useState<OrgLite[]>([])
  const [customRoles, setCustomRoles] = useState<CustomRoleLite[]>([])
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentLite[]>([])
  const [profiles, setProfiles] = useState<ProfileLite[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [orgFilter, setOrgFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [positionMode, setPositionMode] = useState<'preset' | 'custom'>('preset')
  const [departmentMode, setDepartmentMode] = useState<'preset' | 'custom'>('preset')
  const [employeeData, setEmployeeData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    salary: '',
    location: '',
    manager: '',
    organizationId: '',
    birthday: '',
  })

  const loadEmployees = async () => {
    const [{ data: emps }, { data: orgs }, { data: profs }, { data: paidOrders }, { data: roles }, { data: depts }] = await Promise.all([
      supabase.from('employees').select('*').order('created_at', { ascending: false }),
      supabase.from('organizations').select('id, name').order('name'),
      supabase.from('profiles').select('id, name, email, position, department').order('name'),
      supabase.from('payment_orders').select('budget, created_by').eq('status', 'paid'),
      supabase.from('custom_roles').select('id, name').order('name'),
      supabase.from('departments').select('id, name').order('name'),
    ])
    const orgList = (orgs ?? []) as OrgLite[]
    setOrganizations(orgList)
    setCustomRoles((roles ?? []) as CustomRoleLite[])
    setDepartmentOptions((depts ?? []) as DepartmentLite[])
    const orgMap = new Map(orgList.map(o => [o.id, o.name]))

    // Map paid payment totals → user_id → total
    const paidByUser = new Map<string, number>()
    ;((paidOrders ?? []) as { budget: number | null; created_by: string }[]).forEach(p => {
      paidByUser.set(p.created_by, (paidByUser.get(p.created_by) ?? 0) + Number(p.budget ?? 0))
    })
    // Map user_id → email via profiles
    const profilesList = (profs ?? []) as { id: string; name: string | null; email: string | null; position: string | null; department: string | null }[]
    const emailToBonus = new Map<string, number>()
    profilesList.forEach(p => {
      const bonus = paidByUser.get(p.id) ?? 0
      if (bonus > 0 && p.email) emailToBonus.set(p.email.toLowerCase(), bonus)
    })

    const fromEmps = ((emps ?? []) as DbEmployee[]).map((e, i) => {
      const v = toViewEmployee(e, i, e.organization_id ? orgMap.get(e.organization_id) : undefined)
      v.bonusPayments = emailToBonus.get((e.email ?? '').toLowerCase()) ?? 0
      return v
    })
    // Surface assigned users (profiles) that don't already have an employee record (by email)
    const knownEmails = new Set(fromEmps.map(e => (e.email || '').toLowerCase()).filter(Boolean))
    const fromProfiles: EmployeeView[] = profilesList
      .filter(p => p.email && !knownEmails.has(String(p.email).toLowerCase()))
      .map((p, i) => ({
        id: fromEmps.length + i + 1,
        name: p.name || p.email!,
        email: p.email || '',
        position: p.position || 'Team Member',
        department: p.department || 'General',
        hireDate: '',
        birthday: '',
        salary: 0,
        status: 'Active' as Employee['status'],
        avatar: undefined,
        phone: '',
        location: '',
        manager: undefined,
        performanceScore: 0,
        bonusPayments: paidByUser.get(p.id) ?? 0,
      }))
    setEmployees([...fromEmps, ...fromProfiles])
  }


  useEffect(() => {
    if (!canView) return

    loadEmployees()
    let refreshTimer: ReturnType<typeof setTimeout> | null = null
    const refreshEmployees = () => {
      if (refreshTimer) clearTimeout(refreshTimer)
      refreshTimer = setTimeout(() => { loadEmployees() }, 300)
    }

    const channel = supabase
      .channel('employees-page-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, refreshEmployees)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, refreshEmployees)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, refreshEmployees)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'organizations' }, refreshEmployees)
      .subscribe()

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer)
      supabase.removeChannel(channel)
    }
  }, [canView])

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h1 className="text-2xl font-bold mb-2">Access restricted</h1>
        <p className="text-muted-foreground max-w-md">
          The Employees section is only available to Admin and HR users.
        </p>
      </div>
    )
  }

  const departments = useMemo(
    () => Array.from(new Set(employees.map(e => e.department).filter(Boolean))).sort(),
    [employees]
  )

  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.position.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesDepartment = departmentFilter === "all" || employee.department === departmentFilter
      const matchesStatus = statusFilter === "all" || employee.status === statusFilter
      const matchesOrg = orgFilter === "all" || employee.organizationId === orgFilter
      return matchesSearch && matchesDepartment && matchesStatus && matchesOrg
    })
  }, [employees, searchTerm, departmentFilter, statusFilter, orgFilter])

  const handleAddEmployeeSubmit = async () => {
    if (!employeeData.firstName || !employeeData.lastName || !employeeData.email || !employeeData.position) {
      toast({ title: "Validation Error", description: "Please fill in all required fields.", variant: "destructive" })
      return
    }
    const { error } = await supabase.from('employees').insert({
      name: `${employeeData.firstName} ${employeeData.lastName}`,
      email: employeeData.email,
      position: employeeData.position,
      department: employeeData.department || 'General',
      hire_date: new Date().toISOString().split('T')[0],
      salary: parseInt(employeeData.salary) || null,
      status: 'Active',
      phone: employeeData.phone || null,
      location: employeeData.location || null,
      manager: employeeData.manager || null,
      organization_id: employeeData.organizationId || null,
      birthday: employeeData.birthday || null,
    })
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
      return
    }
    toast({ title: "Employee Added", description: `${employeeData.firstName} ${employeeData.lastName} has been added.` })
    setIsAddDialogOpen(false)
    setEmployeeData({ firstName: '', lastName: '', email: '', phone: '', position: '', department: '', salary: '', location: '', manager: '', organizationId: '', birthday: '' })
    loadEmployees()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('pages.employees.title')}</h1>
          <p className="text-muted-foreground">{t('pages.employees.subtitle')}</p>
        </div>
        <Button className="mt-4 sm:mt-0" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(dept => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={orgFilter} onValueChange={setOrgFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Organization" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Organizations</SelectItem>
            {organizations.map(o => (
              <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="On Leave">On Leave</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredEmployees.length} of {employees.length} employees
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredEmployees.map(employee => (
          <EmployeeCard key={employee.id} employee={employee} />
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No employees found.</p>
        </div>
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>
              Create a new employee profile with personal and professional details
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" placeholder="Enter first name" value={employeeData.firstName} onChange={(e) => setEmployeeData({...employeeData, firstName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" placeholder="Enter last name" value={employeeData.lastName} onChange={(e) => setEmployeeData({...employeeData, lastName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter email address" value={employeeData.email} onChange={(e) => setEmployeeData({...employeeData, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="Enter phone number" value={employeeData.phone} onChange={(e) => setEmployeeData({...employeeData, phone: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              {positionMode === 'preset' ? (
                <Select
                  value={employeeData.position}
                  onValueChange={(v) => {
                    if (v === '__custom__') {
                      setPositionMode('custom')
                      setEmployeeData({ ...employeeData, position: '' })
                    } else {
                      setEmployeeData({ ...employeeData, position: v })
                    }
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                  <SelectContent>
                    {POSITION_PRESETS.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                    <SelectItem value="__custom__">+ Add custom position…</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex gap-2">
                  <Input
                    id="position"
                    placeholder="Enter custom position"
                    value={employeeData.position}
                    onChange={(e) => setEmployeeData({ ...employeeData, position: e.target.value })}
                    autoFocus
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => { setPositionMode('preset'); setEmployeeData({ ...employeeData, position: '' }) }}>
                    Presets
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input id="department" placeholder="Enter department" value={employeeData.department} onChange={(e) => setEmployeeData({...employeeData, department: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">Salary</Label>
              <Input id="salary" type="number" placeholder="Enter salary" value={employeeData.salary} onChange={(e) => setEmployeeData({...employeeData, salary: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="Enter work location" value={employeeData.location} onChange={(e) => setEmployeeData({...employeeData, location: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthday">
                Date of Birth {employeeData.birthday && (
                  <span className="text-xs text-muted-foreground">
                    (age {Math.max(0, Math.floor((Date.now() - new Date(employeeData.birthday).getTime())/(365.25*24*3600*1000)))})
                  </span>
                )}
              </Label>
              <Input
                id="birthday"
                type="date"
                value={employeeData.birthday}
                max={new Date().toISOString().slice(0,10)}
                onChange={(e) => setEmployeeData({...employeeData, birthday: e.target.value})}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="manager">Manager</Label>
              <Input id="manager" placeholder="Manager name" value={employeeData.manager} onChange={(e) => setEmployeeData({...employeeData, manager: e.target.value})} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="organization">Organization</Label>
              <Select value={employeeData.organizationId} onValueChange={(v) => setEmployeeData({...employeeData, organizationId: v})}>
                <SelectTrigger><SelectValue placeholder="Select organization" /></SelectTrigger>
                <SelectContent>
                  {organizations.map(o => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Additional notes about the employee" />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddEmployeeSubmit}>Create Employee</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
