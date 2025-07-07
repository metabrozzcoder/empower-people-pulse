
import { Employee } from "@/types/employee"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Mail, Phone, MapPin, TrendingUp, Clock, Calendar } from "lucide-react"
import { useState } from "react"

interface EmployeeCardProps {
  employee: Employee
}

export function EmployeeCard({ employee }: EmployeeCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const getStatusColor = (status: Employee['status']) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 hover:bg-green-100'
      case 'On Leave':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
      case 'Inactive':
        return 'bg-red-100 text-red-800 hover:bg-red-100'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
    }
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setIsDetailOpen(true)}>
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={employee.avatar} alt={employee.name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {employee.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold truncate">{employee.name}</h3>
                <Badge className={getStatusColor(employee.status)}>
                  {employee.status}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-1">{employee.position}</p>
              <p className="text-sm font-medium text-primary mb-3">{employee.department}</p>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="w-4 h-4 mr-2" />
                  <span className="truncate">{employee.email}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Phone className="w-4 h-4 mr-2" />
                  <span>{employee.phone}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{employee.location}</span>
                </div>
                <div className="flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  <span className={`font-medium ${getPerformanceColor(employee.performanceScore)}`}>
                    Performance: {employee.performanceScore}%
                  </span>
                </div>
              </div>
              
              {employee.manager && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    Reports to: <span className="font-medium">{employee.manager}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>

        {/* Attendance Section */}
        <CardHeader className="pb-2 pt-0">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Attendance</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
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

      {/* Employee Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={employee.avatar} alt={employee.name} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {employee.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold">{employee.name}</h2>
                <p className="text-sm text-muted-foreground">{employee.position}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{employee.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{employee.phone}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{employee.location}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Hire Date</p>
                    <p className="text-sm text-muted-foreground">{employee.hireDate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Work Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Work Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium">Department</p>
                  <p className="text-sm text-muted-foreground">{employee.department}</p>
                </div>
                <div>
                  <p className="font-medium">Position</p>
                  <p className="text-sm text-muted-foreground">{employee.position}</p>
                </div>
                <div>
                  <p className="font-medium">Status</p>
                  <Badge className={getStatusColor(employee.status)}>
                    {employee.status}
                  </Badge>
                </div>
                <div>
                  <p className="font-medium">Performance Score</p>
                  <p className={`text-sm font-medium ${getPerformanceColor(employee.performanceScore)}`}>
                    {employee.performanceScore}%
                  </p>
                </div>
                {employee.manager && (
                  <div>
                    <p className="font-medium">Manager</p>
                    <p className="text-sm text-muted-foreground">{employee.manager}</p>
                  </div>
                )}
                <div>
                  <p className="font-medium">Salary</p>
                  <p className="text-sm text-muted-foreground">${employee.salary.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Attendance */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Attendance Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">95%</div>
                    <div className="text-sm text-muted-foreground">Attendance Rate</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">8:47 AM</div>
                    <div className="text-sm text-muted-foreground">Avg Check-in</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">2</div>
                    <div className="text-sm text-muted-foreground">Late Days</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">1</div>
                    <div className="text-sm text-muted-foreground">Absent Days</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">This Week Progress</span>
                      <span className="text-sm font-medium">38.5 / 40 hours</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-3">
                      <div className="bg-blue-500 h-3 rounded-full" style={{ width: '96%' }}></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span>Today:</span>
                      <span className="text-green-600 font-medium">Present (8:30 AM)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Yesterday:</span>
                      <span className="text-green-600 font-medium">Present (8:45 AM)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>This Month:</span>
                      <span className="font-medium">22/23 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Hours:</span>
                      <span className="font-medium">176 hours</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
