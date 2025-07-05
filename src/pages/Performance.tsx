
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, Star, Target, Award, Plus, Calendar, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const Performance = () => {
  const { toast } = useToast()
  const [selectedPeriod, setSelectedPeriod] = useState("quarter")

  const performanceData = [
    {
      id: "1",
      employeeId: "sarah",
      name: "Sarah Chen",
      position: "Senior Producer",
      department: "Production",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b25d0a63?w=80&h=80&fit=crop&crop=face",
      overallScore: 92,
      goals: [
        { name: "Project Delivery", target: 95, achieved: 98, status: "Exceeded" },
        { name: "Team Leadership", target: 85, achieved: 90, status: "Exceeded" },
        { name: "Innovation", target: 80, achieved: 85, status: "Exceeded" }
      ],
      skills: [
        { name: "Leadership", level: 90 },
        { name: "Technical Skills", level: 85 },
        { name: "Communication", level: 95 }
      ],
      feedback: {
        positive: 15,
        constructive: 3,
        lastReview: "2024-01-10"
      },
      achievements: [
        "Led successful morning show rebrand",
        "Improved team productivity by 23%",
        "Mentored 3 junior staff members"
      ]
    },
    {
      id: "2",
      employeeId: "john",
      name: "John Smith",
      position: "Camera Operator",
      department: "Technical",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
      overallScore: 78,
      goals: [
        { name: "Technical Proficiency", target: 80, achieved: 82, status: "Exceeded" },
        { name: "Equipment Maintenance", target: 90, achieved: 75, status: "Below Target" },
        { name: "Collaboration", target: 75, achieved: 80, status: "Exceeded" }
      ],
      skills: [
        { name: "Camera Operation", level: 88 },
        { name: "Equipment Setup", level: 75 },
        { name: "Problem Solving", level: 82 }
      ],
      feedback: {
        positive: 8,
        constructive: 5,
        lastReview: "2024-01-05"
      },
      achievements: [
        "Completed advanced camera training",
        "Reduced setup time by 15%"
      ]
    }
  ]

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-blue-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getGoalStatusColor = (status: string) => {
    switch (status) {
      case 'Exceeded': return 'bg-green-100 text-green-800'
      case 'Met': return 'bg-blue-100 text-blue-800'
      case 'Below Target': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const scheduleReview = (employeeId: string) => {
    toast({
      title: "Review Scheduled",
      description: "Performance review has been scheduled and employee will be notified.",
    })
  }

  const addGoal = (employeeId: string) => {
    toast({
      title: "Goal Added",
      description: "New performance goal has been added for the employee.",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance Management</h1>
        <p className="text-muted-foreground">
          Track employee performance, set goals, and conduct reviews.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="goals">Goals & KPIs</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">85%</div>
                <p className="text-xs text-muted-foreground">+5% from last quarter</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Goals Met</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">73%</div>
                <p className="text-xs text-muted-foreground">4 of 6 team goals</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reviews Due</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">Exceeding targets</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Employee Performance</CardTitle>
                  <CardDescription>Individual performance scores and progress</CardDescription>
                </div>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {performanceData.map((employee) => (
                  <Card key={employee.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-start space-x-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={employee.avatar} />
                            <AvatarFallback>
                              {employee.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg">{employee.name}</h3>
                            <p className="text-muted-foreground">{employee.position}</p>
                            <p className="text-sm text-muted-foreground">{employee.department}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${getScoreColor(employee.overallScore)}`}>
                            {employee.overallScore}%
                          </div>
                          <p className="text-sm text-muted-foreground">Overall Score</p>
                          <div className="flex gap-2 mt-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => scheduleReview(employee.employeeId)}
                            >
                              <Calendar className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                            <Button variant="outline" size="sm">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Feedback
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <h4 className="font-medium mb-3">Performance Goals</h4>
                          <div className="space-y-3">
                            {employee.goals.map((goal, index) => (
                              <div key={index} className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium">{goal.name}</span>
                                  <Badge className={getGoalStatusColor(goal.status)}>
                                    {goal.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Progress value={(goal.achieved / goal.target) * 100} className="flex-1 h-2" />
                                  <span className="text-sm text-muted-foreground">
                                    {goal.achieved}/{goal.target}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-3">Skills Assessment</h4>
                          <div className="space-y-3">
                            {employee.skills.map((skill, index) => (
                              <div key={index} className="space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-sm font-medium">{skill.name}</span>
                                  <span className="text-sm text-muted-foreground">{skill.level}%</span>
                                </div>
                                <Progress value={skill.level} className="h-2" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t">
                        <div className="grid gap-4 md:grid-cols-3">
                          <div>
                            <h5 className="font-medium text-sm">Recent Achievements</h5>
                            <ul className="mt-2 space-y-1">
                              {employee.achievements.slice(0, 2).map((achievement, index) => (
                                <li key={index} className="text-sm text-muted-foreground flex items-start">
                                  <Star className="h-3 w-3 text-yellow-500 mt-0.5 mr-1 flex-shrink-0" />
                                  {achievement}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium text-sm">Feedback Score</h5>
                            <div className="mt-2 text-sm text-muted-foreground">
                              <div>Positive: {employee.feedback.positive}</div>
                              <div>Constructive: {employee.feedback.constructive}</div>
                            </div>
                          </div>
                          <div>
                            <h5 className="font-medium text-sm">Last Review</h5>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {new Date(employee.feedback.lastReview).toLocaleDateString()}
                            </p>
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

        <TabsContent value="goals" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Performance Goals</CardTitle>
                  <CardDescription>Set and track performance objectives</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Goal
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData.map((employee) => (
                  <Card key={employee.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={employee.avatar} />
                            <AvatarFallback>
                              {employee.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{employee.name}</CardTitle>
                            <CardDescription>{employee.position}</CardDescription>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => addGoal(employee.employeeId)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Goal
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {employee.goals.map((goal, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{goal.name}</h4>
                                <Badge className={getGoalStatusColor(goal.status)}>
                                  {goal.status}
                                </Badge>
                              </div>
                              <Progress value={(goal.achieved / goal.target) * 100} className="h-2" />
                              <div className="flex justify-between mt-1 text-sm text-muted-foreground">
                                <span>Progress: {goal.achieved}/{goal.target}</span>
                                <span>{Math.round((goal.achieved / goal.target) * 100)}%</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Reviews</CardTitle>
              <CardDescription>Schedule and manage performance reviews</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={employee.avatar} />
                        <AvatarFallback>
                          {employee.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{employee.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Last Review: {new Date(employee.feedback.lastReview).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        Due: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => scheduleReview(employee.employeeId)}
                      >
                        Schedule Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Team Average</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={85} className="w-20 h-2" />
                      <span className="text-sm font-medium">85%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Goal Achievement Rate</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={73} className="w-20 h-2" />
                      <span className="text-sm font-medium">73%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Review Completion</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={90} className="w-20 h-2" />
                      <span className="text-sm font-medium">90%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceData
                    .sort((a, b) => b.overallScore - a.overallScore)
                    .map((employee, index) => (
                      <div key={employee.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                            {index + 1}
                          </div>
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={employee.avatar} />
                            <AvatarFallback className="text-xs">
                              {employee.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{employee.name}</span>
                        </div>
                        <span className={`font-bold ${getScoreColor(employee.overallScore)}`}>
                          {employee.overallScore}%
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Performance
