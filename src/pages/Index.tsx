
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, MessageCircle, CheckSquare, Gift } from "lucide-react"
import { mockEmployees } from "@/data/mockEmployees"
import { format, isToday, isTomorrow } from "date-fns"

const quickActions = [
  {
    title: "Chat",
    description: "Start a conversation",
    icon: MessageCircle,
    href: "/chat",
    color: "bg-blue-50 text-blue-600 border-blue-200"
  },
  {
    title: "Calendar",
    description: "View schedule",
    icon: Calendar,
    href: "/scheduling",
    color: "bg-green-50 text-green-600 border-green-200"
  },
  {
    title: "Tasks",
    description: "Manage tasks",
    icon: CheckSquare,
    href: "/tasks",
    color: "bg-purple-50 text-purple-600 border-purple-200"
  }
]

const upcomingEvents = [
  {
    id: 1,
    title: "All Hands Meeting",
    date: "Today, 2:00 PM",
    type: "meeting"
  },
  {
    id: 2,
    title: "New Employee Orientation",
    date: "Tomorrow, 9:00 AM",
    type: "orientation"
  },
  {
    id: 3,
    title: "Performance Review Deadline",
    date: "Jul 15, 2025",
    type: "deadline"
  }
]

const getTodayAndTomorrowBirthdays = () => {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  return mockEmployees.filter(employee => {
    const birthday = new Date(employee.birthday)
    return isToday(birthday) || isTomorrow(birthday)
  }).map(employee => ({
    ...employee,
    isToday: isToday(new Date(employee.birthday)),
    formattedDate: format(new Date(employee.birthday), "MMM dd")
  }))
}

const Index = () => {
  const birthdayEmployees = getTodayAndTomorrowBirthdays()
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your workspace overview.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        {quickActions.map((action, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center p-6">
              <div className={`p-3 rounded-lg ${action.color} mr-4`}>
                <action.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">{action.title}</h3>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Upcoming Events
            </CardTitle>
            <CardDescription>Important dates and deadlines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">{event.date}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {event.type}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Events
            </Button>
          </CardContent>
        </Card>

        {/* Employee Birthdays */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Gift className="mr-2 h-5 w-5" />
              Employee Birthdays
            </CardTitle>
            <CardDescription>Today and tomorrow celebrations</CardDescription>
          </CardHeader>
          <CardContent>
            {birthdayEmployees.length > 0 ? (
              <div className="space-y-4">
                {birthdayEmployees.map((employee) => (
                  <div key={employee.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={employee.avatar} />
                      <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{employee.name}</p>
                      <p className="text-sm text-muted-foreground">{employee.position}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{employee.formattedDate}</p>
                      <Badge variant={employee.isToday ? "default" : "secondary"} className="text-xs">
                        {employee.isToday ? "Today" : "Tomorrow"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Gift className="mx-auto h-12 w-12 mb-4 opacity-30" />
                <p>No birthdays today or tomorrow</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Index
