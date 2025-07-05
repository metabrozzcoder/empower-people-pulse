
import { Employee } from "@/types/employee"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Mail, Phone, MapPin, TrendingUp } from "lucide-react"

interface EmployeeCardProps {
  employee: Employee
}

export function EmployeeCard({ employee }: EmployeeCardProps) {
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
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
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
    </Card>
  )
}
