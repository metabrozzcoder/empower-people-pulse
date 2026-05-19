
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
import type { Employee } from "@/types/employee"

interface DbEmployee {
  id: string
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
}

const toViewEmployee = (e: DbEmployee, idx: number): Employee => ({
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
})

export default function Employees() {
  const { toast } = useToast()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [employeeData, setEmployeeData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    salary: '',
    location: '',
    manager: ''
  })

  const loadEmployees = async () => {
    const { data } = await supabase.from('employees').select('*').order('created_at', { ascending: false })
    setEmployees(((data ?? []) as DbEmployee[]).map(toViewEmployee))
  }

  useEffect(() => { loadEmployees() }, [])

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
      return matchesSearch && matchesDepartment && matchesStatus
    })
  }, [employees, searchTerm, departmentFilter, statusFilter])

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
    })
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
      return
    }
    toast({ title: "Employee Added", description: `${employeeData.firstName} ${employeeData.lastName} has been added.` })
    setIsAddDialogOpen(false)
    setEmployeeData({ firstName: '', lastName: '', email: '', phone: '', position: '', department: '', salary: '', location: '', manager: '' })
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
              <Input id="position" placeholder="Enter job position" value={employeeData.position} onChange={(e) => setEmployeeData({...employeeData, position: e.target.value})} />
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
            <div className="space-y-2 col-span-2">
              <Label htmlFor="manager">Manager</Label>
              <Input id="manager" placeholder="Manager name" value={employeeData.manager} onChange={(e) => setEmployeeData({...employeeData, manager: e.target.value})} />
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
