
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Calendar, Mail, Phone, MapPin, Building, User, Award, Clock, TrendingUp } from "lucide-react"

const Profile = () => {
  const userProfile = {
    name: "John Doe",
    email: "john.doe@company.com",
    phone: "+1 (555) 123-4567",
    position: "HR Manager",
    department: "Human Resources",
    location: "New York, NY",
    hireDate: "January 15, 2020",
    employeeId: "EMP-001",
    manager: "Sarah Wilson",
    status: "Active",
    performanceScore: 92
  }

  const stats = [
    { label: "Years of Service", value: "4.5", icon: Clock },
    { label: "Performance Score", value: "92%", icon: TrendingUp },
    { label: "Team Size", value: "12", icon: User },
    { label: "Projects Completed", value: "45", icon: Award }
  ]

  const recentAchievements = [
    { title: "Employee of the Month", date: "March 2024", type: "award" },
    { title: "Leadership Training Completion", date: "February 2024", type: "training" },
    { title: "5 Years of Service", date: "January 2024", type: "milestone" },
    { title: "Performance Excellence", date: "December 2023", type: "award" }
  ]

  const skills = [
    { name: "Leadership", level: 90 },
    { name: "Communication", level: 95 },
    { name: "Project Management", level: 85 },
    { name: "Team Building", level: 88 },
    { name: "Strategic Planning", level: 82 }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          View and manage your professional profile.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <Avatar className="w-24 h-24 mx-auto">
                <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=96&h=96&fit=crop&crop=face" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <CardTitle>{userProfile.name}</CardTitle>
              <CardDescription>{userProfile.position}</CardDescription>
              <Badge variant="default" className="w-fit mx-auto">
                {userProfile.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{userProfile.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{userProfile.phone}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  <span>{userProfile.department}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{userProfile.location}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Joined {userProfile.hireDate}</span>
                </div>
              </div>
              <Separator />
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Employee ID</p>
                <p className="font-medium">{userProfile.employeeId}</p>
              </div>
              <Button className="w-full" variant="outline">
                Edit Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <stat.icon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Skills & Competencies</CardTitle>
              <CardDescription>
                Your professional skills and their current levels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {skills.map((skill, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{skill.name}</span>
                    <span className="text-sm text-muted-foreground">{skill.level}%</span>
                  </div>
                  <Progress value={skill.level} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Achievements</CardTitle>
              <CardDescription>
                Your recent accomplishments and milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAchievements.map((achievement, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{achievement.title}</p>
                      <p className="text-sm text-muted-foreground">{achievement.date}</p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {achievement.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Profile
