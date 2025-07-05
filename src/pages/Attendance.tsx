
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Calendar, Users, CheckCircle, XCircle, AlertTriangle, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const Attendance = () => {
  const { toast } = useToast()
  const [selectedPeriod, setSelectedPeriod] = useState("week")

  const attendanceData = [
    {
      id: "1",
      employeeId: "sarah",
      name: "Sarah Chen",
      department: "Production",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b25d0a63?w=80&h=80&fit=crop&crop=face",
      todayStatus: "Present",
      checkInTime: "08:45",
      checkOutTime: "17:30",
      weeklyHours: 38.5,
      targetHours: 40,
      attendanceRate: 95,
      lateCount: 1,
      absenceCount: 0
    },
    {
      id: "2",
      employeeId: "john",
      name: "John Smith",
      department: "Technical",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
      todayStatus: "Late",
      checkInTime: "09:15",
      checkOutTime: "-",
      weeklyHours: 35.2,
      targetHours: 40,
      attendanceRate: 88,
      lateCount: 3,
      absenceCount: 1
    },
    {
      id: "3",
      employeeId: "lisa",
      name: "Lisa Wang",
      department: "Content",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
      todayStatus: "Absent",
      checkInTime: "-",
      checkOutTime: "-",
      weeklyHours: 32.0,
      targetHours: 40,
      attendanceRate: 92,
      lateCount: 0,
      absenceCount: 2
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present': return 'bg-green-100 text-green-800'
      case 'Late': return 'bg-yellow-100 text-yellow-800'
      case 'Absent': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Present': return CheckCircle
      case 'Late': return AlertTriangle
      case 'Absent': return XCircle
      default: return Clock
    }
  }

  const totalEmployees = attendanceData.length
  const presentToday = attendanceData.filter(emp => emp.todayStatus === 'Present').length
  const lateToday = attendanceData.filter(emp => emp.todayStatus === 'Late').length
  const absentToday = attendanceData.filter(emp => emp.todayStatus === 'Absent').length
  const attendanceRate = Math.round((presentToday / totalEmployees) * 100)

  const markAttendance = (employeeId: string, status: string) => {
    toast({
      title: "Attendance Updated",
      description: `Employee status marked as ${status}`,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance Tracking</h1>
        <p className="text-muted-foreground">
          Real-time attendance monitoring and workforce analytics.
        </p>
      </div>

      {/* Today's Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{presentToday}</div>
            <p className="text-xs text-muted-foreground">{attendanceRate}% attendance rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lateToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{absentToday}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="today" className="space-y-6">
        <TabsList>
          <TabsTrigger value="today">Today's Attendance</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Report</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Today's Attendance</CardTitle>
                  <CardDescription>
                    Real-time attendance status for {new Date().toLocaleDateString()}
                  </CardDescription>
                </div>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {attendanceData.map((employee) => {
                  const StatusIcon = getStatusIcon(employee.todayStatus)
                  return (
                    <Card key={employee.id} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={employee.avatar} />
                              <AvatarFallback>
                                {employee.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold">{employee.name}</h3>
                              <p className="text-muted-foreground">{employee.department}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-6">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Check In</p>
                              <p className="font-medium">{employee.checkInTime}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Check Out</p>
                              <p className="font-medium">{employee.checkOutTime}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <StatusIcon className="h-5 w-5" />
                              <Badge className={getStatusColor(employee.todayStatus)}>
                                {employee.todayStatus}
                              </Badge>
                            </div>
                            <Select
                              onValueChange={(value) => markAttendance(employee.employeeId, value)}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Update" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Present">Present</SelectItem>
                                <SelectItem value="Late">Late</SelectItem>
                                <SelectItem value="Absent">Absent</SelectItem>
                              </SelectContent>
                            </Select>
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

        <TabsContent value="weekly" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Weekly Attendance Report</CardTitle>
                  <CardDescription>Detailed weekly attendance and hours tracking</CardDescription>
                </div>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="lastweek">Last Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {attendanceData.map((employee) => (
                  <Card key={employee.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={employee.avatar} />
                            <AvatarFallback>
                              {employee.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{employee.name}</h3>
                            <p className="text-muted-foreground">{employee.department}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-6 text-center">
                          <div>
                            <p className="text-sm text-muted-foreground">Hours Worked</p>
                            <p className="font-semibold">{employee.weeklyHours}h</p>
                            <Progress 
                              value={(employee.weeklyHours / employee.targetHours) * 100} 
                              className="mt-1 h-2"
                            />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Attendance Rate</p>
                            <p className="font-semibold">{employee.attendanceRate}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Late Count</p>
                            <p className="font-semibold text-yellow-600">{employee.lateCount}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Absent Days</p>
                            <p className="font-semibold text-red-600">{employee.absenceCount}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Department Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Production</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={95} className="w-20 h-2" />
                      <span className="text-sm font-medium">95%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Technical</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={88} className="w-20 h-2" />
                      <span className="text-sm font-medium">88%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Content</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={92} className="w-20 h-2" />
                      <span className="text-sm font-medium">92%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Average Check-in Time</span>
                    <span className="font-medium">8:47 AM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Average Hours/Week</span>
                    <span className="font-medium">37.2 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Most Productive Day</span>
                    <span className="font-medium">Tuesday</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Peak Hours</span>
                    <span className="font-medium">10 AM - 2 PM</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Attendance
