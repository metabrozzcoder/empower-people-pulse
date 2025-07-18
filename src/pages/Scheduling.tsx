
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, Users, Plus, MoreHorizontal, MapPin } from "lucide-react"
import { Shift } from "@/types/hrms"
import { useToast } from "@/hooks/use-toast"

const Scheduling = () => {
  const { toast } = useToast()
  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false)
  const [isManageShiftDialogOpen, setIsManageShiftDialogOpen] = useState(false)
  const [selectedShift, setSelectedShift] = useState<any>(null)
  const [selectedWeek, setSelectedWeek] = useState("current")
  const [isAddShiftDialogOpen, setIsAddShiftDialogOpen] = useState(false)
  const [isViewScheduleDialogOpen, setIsViewScheduleDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)

  const [shifts, setShifts] = useState<Shift[]>([
    {
      id: "1",
      employeeId: "sarah",
      date: "2024-01-15",
      startTime: "06:00",
      endTime: "14:00",
      role: "Morning Show Producer",
      location: "Studio A",
      status: "Scheduled",
      notes: "Lead producer for morning show"
    },
    {
      id: "2",
      employeeId: "john",
      date: "2024-01-15",
      startTime: "14:00",
      endTime: "22:00",
      role: "Camera Operator",
      location: "Studio B",
      status: "In Progress",
      notes: "Evening news coverage"
    },
    {
      id: "3",
      employeeId: "lisa",
      date: "2024-01-16",
      startTime: "08:00",
      endTime: "16:00",
      role: "Content Editor",
      location: "Edit Suite 1",
      status: "Scheduled"
    }
  ])

  const employees = [
    { id: "sarah", name: "Sarah Chen", role: "Producer", avatar: "https://images.unsplash.com/photo-1494790108755-2616b25d0a63?w=80&h=80&fit=crop&crop=face" },
    { id: "john", name: "John Smith", role: "Camera Operator", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face" },
    { id: "lisa", name: "Lisa Wang", role: "Editor", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face" }
  ]

  const getStatusColor = (status: Shift['status']) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-800'
      case 'In Progress': return 'bg-green-100 text-green-800'
      case 'Completed': return 'bg-gray-100 text-gray-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const updateShiftStatus = (shiftId: string, newStatus: Shift['status']) => {
    setShifts(prevShifts => 
      prevShifts.map(shift => 
        shift.id === shiftId ? { ...shift, status: newStatus } : shift
      )
    )
    toast({
      title: "Shift Updated",
      description: `Shift status changed to ${newStatus}`,
    })
  }

  const exportSchedule = () => {
    const scheduleData = shifts.map(shift => {
      const employee = getEmployeeInfo(shift.employeeId)
      return {
        Employee: employee.name,
        Date: shift.date,
        StartTime: shift.startTime,
        EndTime: shift.endTime,
        Role: shift.role,
        Location: shift.location,
        Status: shift.status,
        Notes: shift.notes || ''
      }
    })
    
    const csvContent = [
      Object.keys(scheduleData[0]).join(','),
      ...scheduleData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `schedule_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Schedule Exported",
      description: "Schedule has been exported successfully.",
    })
  }

  const generateOptimizedSchedule = () => {
    toast({
      title: "AI Schedule Optimization",
      description: "Analyzing employee preferences and workload to create optimized schedule...",
    })
    
    // Simulate AI processing
    setTimeout(() => {
      toast({
        title: "Optimized Schedule Ready",
        description: "AI has generated an optimized schedule that could improve efficiency by 15%.",
      })
    }, 3000)
  }
  const getEmployeeInfo = (employeeId: string) => {
    return employees.find(emp => emp.id === employeeId) || { name: employeeId, role: "Unknown", avatar: "" }
  }

  const weekDays = [
    { day: "Mon", date: "Jan 15", shifts: shifts.filter(s => s.date === "2024-01-15") },
    { day: "Tue", date: "Jan 16", shifts: shifts.filter(s => s.date === "2024-01-16") },
    { day: "Wed", date: "Jan 17", shifts: [] },
    { day: "Thu", date: "Jan 18", shifts: [] },
    { day: "Fri", date: "Jan 19", shifts: [] },
    { day: "Sat", date: "Jan 20", shifts: [] },
    { day: "Sun", date: "Jan 21", shifts: [] }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Smart Scheduling</h1>
        <p className="text-muted-foreground">
          AI-optimized scheduling and shift management for your media team.
        </p>
      </div>

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="shifts">All Shifts</TabsTrigger>
          <TabsTrigger value="employees">Employee Schedules</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Weekly Schedule</CardTitle>
                  <CardDescription>Overview of all scheduled shifts</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">This Week</SelectItem>
                      <SelectItem value="next">Next Week</SelectItem>
                      <SelectItem value="prev">Last Week</SelectItem>
                    </SelectContent>
                  </Select>
                   <Button variant="outline" onClick={generateOptimizedSchedule}>
                     AI Optimize
                   </Button>
                   <Button variant="outline" onClick={exportSchedule}>
                     Export
                   </Button>
                   <Button onClick={() => setIsAddShiftDialogOpen(true)}>
                     <Plus className="h-4 w-4 mr-2" />
                     Add Shift
                   </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-4">
                {weekDays.map((day, index) => (
                  <div key={index} className="space-y-2">
                    <div className="text-center pb-2 border-b">
                      <div className="font-semibold">{day.day}</div>
                      <div className="text-sm text-muted-foreground">{day.date}</div>
                    </div>
                    <div className="space-y-2 min-h-[200px]">
                      {day.shifts.map((shift) => {
                        const employee = getEmployeeInfo(shift.employeeId)
                        return (
                          <Card key={shift.id} className="p-2 text-xs">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <Avatar className="w-4 h-4">
                                  <AvatarImage src={employee.avatar} />
                                  <AvatarFallback className="text-xs">
                                    {employee.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium truncate">{employee.name}</span>
                              </div>
                              <div className="text-muted-foreground">
                                {shift.startTime} - {shift.endTime}
                              </div>
                              <div className="text-muted-foreground truncate">
                                {shift.role}
                              </div>
                              <Badge className={`${getStatusColor(shift.status)} text-xs`}>
                                {shift.status}
                              </Badge>
                            </div>
                          </Card>
                        )
                      })}
                      {day.shifts.length === 0 && (
                        <div className="text-center text-muted-foreground text-xs py-4">
                          No shifts scheduled
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Schedule Summary */}
              <div className="mt-6 pt-4 border-t">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{shifts.length}</div>
                    <div className="text-sm text-muted-foreground">Total Shifts</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{shifts.filter(s => s.status === 'Scheduled').length}</div>
                    <div className="text-sm text-muted-foreground">Scheduled</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{shifts.filter(s => s.status === 'In Progress').length}</div>
                    <div className="text-sm text-muted-foreground">In Progress</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{shifts.filter(s => s.status === 'Completed').length}</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shifts" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Shifts</CardTitle>
                  <CardDescription>Manage all scheduled shifts</CardDescription>
                </div>
                <Button variant="outline" onClick={exportSchedule}>
                  Export Shifts
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shifts.map((shift) => {
                  const employee = getEmployeeInfo(shift.employeeId)
                  return (
                    <Card key={shift.id} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={employee.avatar} />
                              <AvatarFallback>
                                {employee.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-2">
                              <div>
                                <h3 className="font-semibold">{employee.name}</h3>
                                <p className="text-muted-foreground">{shift.role}</p>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(shift.date).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {shift.startTime} - {shift.endTime}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {shift.location}
                                </div>
                              </div>
                              {shift.notes && (
                                <p className="text-sm text-muted-foreground">{shift.notes}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(shift.status)}>
                              {shift.status}
                            </Badge>
                            <Select
                              value={shift.status}
                              onValueChange={(value) => updateShiftStatus(shift.id, value as Shift['status'])}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Scheduled">Scheduled</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                              <Button variant="ghost" size="sm" onClick={() => {
                                setSelectedShift(shift)
                                setIsManageShiftDialogOpen(true)
                              }}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {employees.map((employee) => {
              const employeeShifts = shifts.filter(shift => shift.employeeId === employee.id)
              const totalHours = employeeShifts.reduce((total, shift) => {
                const start = new Date(`2000-01-01 ${shift.startTime}`)
                const end = new Date(`2000-01-01 ${shift.endTime}`)
                const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
                return total + hours
              }, 0)
              
              return (
                <Card key={employee.id}>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={employee.avatar} />
                        <AvatarFallback>
                          {employee.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{employee.name}</CardTitle>
                        <CardDescription>{employee.role}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>This Week</span>
                        <span className="font-medium">{employeeShifts.length} shifts</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Hours</span>
                        <span className="font-medium">{totalHours.toFixed(1)}h</span>
                      </div>
                      {employeeShifts.map((shift) => (
                        <div key={shift.id} className="flex justify-between items-center text-sm">
                          <div>
                            <div className="font-medium">{new Date(shift.date).toLocaleDateString()}</div>
                            <div className="text-muted-foreground">{shift.startTime} - {shift.endTime}</div>
                          </div>
                          <Badge className={getStatusColor(shift.status)}>
                            {shift.status}
                          </Badge>
                        </div>
                      ))}
                       <Button className="w-full" variant="outline" size="sm" onClick={() => {
                         setSelectedEmployee(employee)
                         setIsViewScheduleDialogOpen(true)
                       }}>
                         View Full Schedule
                       </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Shift Dialog */}
      <Dialog open={isAddShiftDialogOpen} onOpenChange={setIsAddShiftDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Shift</DialogTitle>
            <DialogDescription>
              Create a new shift assignment with employee, schedule, and location details
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Employee</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sarah">Sarah Chen</SelectItem>
                  <SelectItem value="john">John Smith</SelectItem>
                  <SelectItem value="lisa">Lisa Wang</SelectItem>
                  <SelectItem value="mike">Mike Johnson</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input id="startTime" type="time" defaultValue="09:00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input id="endTime" type="time" defaultValue="17:00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role/Position</Label>
              <Input id="role" placeholder="Enter role or position" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="studio-a">Studio A</SelectItem>
                  <SelectItem value="studio-b">Studio B</SelectItem>
                  <SelectItem value="edit-suite-1">Edit Suite 1</SelectItem>
                  <SelectItem value="edit-suite-2">Edit Suite 2</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea id="notes" placeholder="Additional notes about this shift" />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAddShiftDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              const newShift: Shift = {
                id: Date.now().toString(),
                employeeId: "sarah",
                date: new Date().toISOString().split('T')[0],
                startTime: "09:00",
                endTime: "17:00",
                role: "New Assignment",
                location: "Office",
                status: "Scheduled"
              }
              setShifts([...shifts, newShift])
              setIsAddShiftDialogOpen(false)
              toast({
                title: "Shift Created",
                description: "New shift has been successfully created.",
              })
            }}>
              Create Shift
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Employee Schedule Dialog */}
      <Dialog open={isViewScheduleDialogOpen} onOpenChange={setIsViewScheduleDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Full Schedule - {selectedEmployee?.name}</DialogTitle>
            <DialogDescription>
              Complete schedule overview for {selectedEmployee?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">8</div>
                <div className="text-sm text-muted-foreground">Total Shifts This Week</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">40h</div>
                <div className="text-sm text-muted-foreground">Total Hours</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">3</div>
                <div className="text-sm text-muted-foreground">Different Locations</div>
              </div>
            </div>
            
            <div className="border rounded-lg">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Weekly Schedule</h3>
              </div>
              <div className="p-4 space-y-3">
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day, index) => (
                  <div key={day} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <div className="font-medium">{day}</div>
                      <div className="text-sm text-muted-foreground">Jan {15 + index}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm">9:00 AM - 5:00 PM</div>
                      <div className="text-xs text-muted-foreground">Studio A</div>
                    </div>
                    <div>
                      <Badge variant="outline">8 hours</Badge>
                    </div>
                  </div>
                ))}
                <div className="p-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Weekly Hours:</span>
                    <span className="font-medium">40 hours</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Overtime:</span>
                    <span className="font-medium">0 hours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsViewScheduleDialogOpen(false)}>
              Close
            </Button>
            <Button variant="outline" onClick={() => {
              exportSchedule()
            }}>
              Export Schedule
            </Button>
            <Button variant="default" onClick={() => {
              setIsViewScheduleDialogOpen(false)
              setIsAddShiftDialogOpen(true)
            }}>
              Add New Shift
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Shift Dialog */}
      <Dialog open={isManageShiftDialogOpen} onOpenChange={setIsManageShiftDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Shift</DialogTitle>
            <DialogDescription>
              Manage shift for {selectedShift ? getEmployeeInfo(selectedShift.employeeId).name : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => {
                if (selectedShift) {
                  updateShiftStatus(selectedShift.id, 'In Progress')
                  setIsManageShiftDialogOpen(false)
                }
              }}
            >
              Mark as In Progress
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => {
                if (selectedShift) {
                  updateShiftStatus(selectedShift.id, 'Completed')
                  setIsManageShiftDialogOpen(false)
                }
              }}
            >
              Mark as Completed
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => {
                if (selectedShift) {
                  setShifts(prev => prev.filter(s => s.id !== selectedShift.id))
                  setIsManageShiftDialogOpen(false)
                  toast({
                    title: "Shift Deleted",
                    description: "Shift has been successfully deleted.",
                  })
                }
              }}
            >
              Delete Shift
            </Button>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsManageShiftDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Scheduling
