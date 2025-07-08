
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Calendar, Mail, Phone, MapPin, Building, User, Award, Clock, TrendingUp } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

const Profile = () => {
  const { currentUser } = useAuth()
  
  const userProfile = {
    name: currentUser?.name || "Not provided",
    email: currentUser?.email || "Not provided",
    phone: currentUser?.phone || "Not provided",
    position: currentUser?.role === 'Admin' ? 'Administrator' : currentUser?.role === 'HR' ? 'HR Manager' : currentUser?.role === 'Guest' ? 'Guest' : 'Not assigned',
    department: currentUser?.department || "Not assigned",
    location: "Not provided",
    hireDate: currentUser?.createdDate || "Not provided",
    employeeId: currentUser?.id ? `EMP-${currentUser.id}` : "Not assigned",
    manager: "Not assigned",
    status: currentUser?.status || "Unknown",
    performanceScore: 0
  }

  const stats = [
    { label: "Years of Service", value: "Not calculated", icon: Clock },
    { label: "Performance Score", value: userProfile.performanceScore > 0 ? `${userProfile.performanceScore}%` : "Not evaluated", icon: TrendingUp },
    { label: "Team Size", value: "Not assigned", icon: User },
    { label: "Projects Completed", value: "Not tracked", icon: Award }
  ]

  const recentAchievements = [
    { title: "No achievements recorded", date: "N/A", type: "info" }
  ]

  const skills = [
    { name: "No skills recorded", level: 0 }
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
                <AvatarImage src={currentUser?.avatar} />
                <AvatarFallback>{currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('') : 'U'}</AvatarFallback>
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
