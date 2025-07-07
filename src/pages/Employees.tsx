
import { useState, useMemo } from "react"
import { Search, Filter, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmployeeCard } from "@/components/EmployeeCard"
import { mockEmployees } from "@/data/mockEmployees"
import { useToast } from "@/hooks/use-toast"

export default function Employees() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const departments = useMemo(() => {
    const depts = Array.from(new Set(mockEmployees.map(emp => emp.department)))
    return depts.sort()
  }, [])

  const filteredEmployees = useMemo(() => {
    return mockEmployees.filter(employee => {
      const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.position.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesDepartment = departmentFilter === "all" || employee.department === departmentFilter
      const matchesStatus = statusFilter === "all" || employee.status === statusFilter
      
      return matchesSearch && matchesDepartment && matchesStatus
    })
  }, [searchTerm, departmentFilter, statusFilter])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">
            Manage your team of {mockEmployees.length} employees
          </p>
        </div>
        <Button className="mt-4 sm:mt-0" onClick={() => {
          toast({
            title: "Employee Form",
            description: "Add employee form would open here.",
          })
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      {/* Filters */}
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

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredEmployees.length} of {mockEmployees.length} employees
        </p>
      </div>

      {/* Employee Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredEmployees.map(employee => (
          <EmployeeCard key={employee.id} employee={employee} />
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No employees found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}
