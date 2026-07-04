
import { Employee } from "@/types/employee"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Mail, Phone, MapPin, TrendingUp, Calendar, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface EmployeeListItemProps {
  employee: Employee
  onCreateLogin?: (employee: Employee) => void
}

export function EmployeeListItem({ employee, onCreateLogin }: EmployeeListItemProps) {
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
      <div
        className="grid grid-cols-[48px_1fr] sm:grid-cols-[48px_1.5fr_1fr_100px] md:grid-cols-[48px_1.75fr_1.25fr_1fr_110px_120px_auto] gap-4 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer border-b last:border-b-0 items-center"
        onClick={() => setIsDetailOpen(true)}
      >
        <Avatar className="w-10 h-10 shrink-0">
          <AvatarImage src={employee.avatar} alt={employee.name} />
          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
            {employee.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <p className="font-medium truncate">{employee.name}</p>
          <p className="text-xs text-muted-foreground truncate">{employee.email}</p>
        </div>
        <div className="min-w-0 hidden sm:block">
          <p className="text-sm truncate">{employee.position}</p>
        </div>
        <div className="min-w-0 hidden md:block">
          <p className="text-sm text-muted-foreground truncate">{employee.department}</p>
        </div>
        <div>
          <Badge className={getStatusColor(employee.status)}>{employee.status}</Badge>
        </div>
        <div className="hidden md:flex items-center text-sm">
          <TrendingUp className="w-4 h-4 mr-1.5 text-muted-foreground" />
          <span className={`font-medium ${getPerformanceColor(employee.performanceScore)}`}>
            {employee.performanceScore}%
          </span>
        </div>

        <div className="hidden md:flex justify-end">
          {onCreateLogin && !employee.profileId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={(event) => {
                event.stopPropagation()
                onCreateLogin(employee)
              }}
            >
              <KeyRound className="mr-2 h-4 w-4" />
              Create login
            </Button>
          )}
        </div>
      </div>

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
                  <Badge className={getStatusColor(employee.status)}>{employee.status}</Badge>
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
                {(employee.bonusPayments ?? 0) > 0 && (
                  <div>
                    <p className="font-medium">Bonus Payments (paid)</p>
                    <p className="text-sm text-green-600 font-medium">
                      +${(employee.bonusPayments ?? 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total earnings: ${(employee.salary + (employee.bonusPayments ?? 0)).toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          {onCreateLogin && !employee.profileId && (
            <div className="flex justify-end pt-4">
              <Button
                type="button"
                onClick={() => {
                  setIsDetailOpen(false)
                  onCreateLogin(employee)
                }}
              >
                <KeyRound className="mr-2 h-4 w-4" />
                Create login for this employee
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
