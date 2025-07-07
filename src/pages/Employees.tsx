
import { useState, useMemo } from "react"
import { Search, Filter, Plus, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmployeeCard } from "@/components/EmployeeCard"
import { mockEmployees } from "@/data/mockEmployees"
import { useToast } from "@/hooks/use-toast"

export default function Employees() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

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
        <Button className="mt-4 sm:mt-0" onClick={() => setIsAddDialogOpen(true)}>
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
          <div key={employee.id} className="space-y-4">
            <EmployeeCard employee={employee} />
            
            {/* Attendance Section */}
            <Card className="border-t-4 border-t-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Attendance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-bold text-green-600">95%</div>
                    <div className="text-xs text-muted-foreground">Attendance Rate</div>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="font-bold text-blue-600">8:47 AM</div>
                    <div className="text-xs text-muted-foreground">Avg Check-in</div>
                  </div>
                  <div className="text-center p-2 bg-orange-50 rounded">
                    <div className="font-bold text-orange-600">2</div>
                    <div className="text-xs text-muted-foreground">Late Days</div>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded">
                    <div className="font-bold text-red-600">1</div>
                    <div className="text-xs text-muted-foreground">Absent Days</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">This Week</span>
                    <span className="font-medium">38.5 hours</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '96%' }}></div>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Today:</span>
                    <span className="text-green-600 font-medium">Present (8:30 AM)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Yesterday:</span>
                    <span className="text-green-600 font-medium">Present (8:45 AM)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No employees found matching your criteria.</p>
        </div>
      )}

      {/* Add Employee Dialog */}
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
              <Input id="firstName" placeholder="Enter first name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" placeholder="Enter last name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter email address" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="Enter phone number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input id="position" placeholder="Enter job position" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">Salary</Label>
              <Input id="salary" type="number" placeholder="Enter salary" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="Enter work location" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager">Manager</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="john-doe">John Doe</SelectItem>
                  <SelectItem value="jane-smith">Jane Smith</SelectItem>
                  <SelectItem value="mike-johnson">Mike Johnson</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Additional notes about the employee" />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setIsAddDialogOpen(false)
              toast({
                title: "Employee Added",
                description: "New employee has been successfully created.",
              })
            }}>
              Create Employee
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
