
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Users, Target, Clock, DollarSign, Award } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const Analytics = () => {
  const { toast } = useToast()
  
  const performanceData = [
    { month: 'Jan', performance: 85, satisfaction: 78, productivity: 82 },
    { month: 'Feb', performance: 88, satisfaction: 82, productivity: 85 },
    { month: 'Mar', performance: 92, satisfaction: 85, productivity: 90 },
    { month: 'Apr', performance: 87, satisfaction: 80, productivity: 88 },
    { month: 'May', performance: 90, satisfaction: 88, productivity: 92 },
    { month: 'Jun', performance: 94, satisfaction: 92, productivity: 95 }
  ]

  const departmentData = [
    { name: 'Production', employees: 45, performance: 92, budget: 280000 },
    { name: 'Technical', employees: 32, performance: 88, budget: 220000 },
    { name: 'Content', employees: 28, performance: 85, budget: 180000 },
    { name: 'Creative', employees: 22, performance: 90, budget: 160000 },
    { name: 'Admin', employees: 15, performance: 78, budget: 120000 }
  ]

  const recruitmentFunnelData = [
    { stage: 'Applications', count: 450, color: '#8884d8' },
    { stage: 'Screening', count: 120, color: '#82ca9d' },
    { stage: 'Interviews', count: 45, color: '#ffc658' },
    { stage: 'Offers', count: 12, color: '#ff7300' },
    { stage: 'Hired', count: 8, color: '#00ff00' }
  ]

  const attendanceData = [
    { day: 'Mon', present: 95, late: 3, absent: 2 },
    { day: 'Tue', present: 92, late: 5, absent: 3 },
    { day: 'Wed', present: 98, late: 1, absent: 1 },
    { day: 'Thu', present: 89, late: 7, absent: 4 },
    { day: 'Fri', present: 85, late: 8, absent: 7 }
  ]

  const exportReport = (reportType: string) => {
    let data: any[] = []
    let filename = ''
    
    switch (reportType) {
      case 'performance':
        data = performanceData
        filename = 'performance_report'
        break
      case 'departments':
        data = departmentData
        filename = 'department_report'
        break
      case 'recruitment':
        data = recruitmentFunnelData
        filename = 'recruitment_report'
        break
      case 'attendance':
        data = attendanceData
        filename = 'attendance_report'
        break
      default:
        return
    }
    
    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Report Exported",
      description: `${reportType} report has been exported successfully.`,
    })
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">HR Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive analytics and insights for data-driven HR decisions.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89%</div>
            <p className="text-xs text-muted-foreground">+2% from last quarter</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">+1% from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employee Satisfaction</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">+5% from last survey</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turnover Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2%</div>
            <p className="text-xs text-muted-foreground">-1.2% from last year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total HR Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$960K</div>
            <p className="text-xs text-muted-foreground">82% utilized</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="recruitment">Recruitment</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Performance Trends</CardTitle>
                    <CardDescription>Monthly performance, satisfaction, and productivity metrics</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => exportReport('performance')}>
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="performance" stroke="#8884d8" strokeWidth={2} name="Performance" />
                    <Line type="monotone" dataKey="satisfaction" stroke="#82ca9d" strokeWidth={2} name="Satisfaction" />
                    <Line type="monotone" dataKey="productivity" stroke="#ffc658" strokeWidth={2} name="Productivity" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Distribution</CardTitle>
                <CardDescription>Employee performance score ranges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Excellent (90-100%)</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={35} className="w-20 h-2" />
                      <span className="text-sm font-medium">35%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Good (80-89%)</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={45} className="w-20 h-2" />
                      <span className="text-sm font-medium">45%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average (70-79%)</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={15} className="w-20 h-2" />
                      <span className="text-sm font-medium">15%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Below Average (&lt;70%)</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={5} className="w-20 h-2" />
                      <span className="text-sm font-medium">5%</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Top Performer:</span>
                      <p className="font-medium">Sarah Chen (96%)</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Avg Score:</span>
                      <p className="font-medium">84.2%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Department Comparison</CardTitle>
                  <CardDescription>Performance and budget analysis by department</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => exportReport('departments')}>
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="performance" fill="#8884d8" name="Performance %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Department Headcount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departmentData.map((dept) => (
                    <div key={dept.name} className="flex justify-between items-center">
                      <span className="font-medium">{dept.name}</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={(dept.employees / 142) * 100} className="w-20 h-2" />
                        <span className="text-sm font-medium">{dept.employees}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Total Employees:</span>
                    <span className="font-medium">142</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Largest Department:</span>
                    <span className="font-medium">Production (45)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Budget Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departmentData.map((dept) => (
                    <div key={dept.name} className="flex justify-between items-center">
                      <span className="font-medium">{dept.name}</span>
                      <div className="text-right">
                        <div className="font-medium">${(dept.budget / 1000).toFixed(0)}K</div>
                        <div className="text-sm text-muted-foreground">
                          {Math.round((dept.budget / 960000) * 100)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Total Budget:</span>
                    <span className="font-medium">$960K</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Utilization:</span>
                    <span className="font-medium">82%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recruitment" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recruitment Funnel</CardTitle>
                    <CardDescription>Candidate flow through recruitment stages</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => exportReport('recruitment')}>
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={recruitmentFunnelData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ name, count }) => `${name}: ${count}`}
                    >
                      {recruitmentFunnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recruitment Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time to Hire</span>
                    <span className="font-medium">18 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cost per Hire</span>
                    <span className="font-medium">$3,200</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Interview to Offer Ratio</span>
                    <span className="font-medium">3.75:1</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Offer Accept Rate</span>
                    <span className="font-medium">67%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Source Effectiveness</span>
                    <span className="font-medium">LinkedIn 45%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quality of Hire</span>
                    <span className="font-medium">4.2/5</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Open Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">8</div>
                  <p className="text-sm text-muted-foreground">Active Positions</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">3</div>
                  <p className="text-sm text-muted-foreground">Positions Filled</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">2</div>
                  <p className="text-sm text-muted-foreground">Urgent Positions</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <h4 className="font-medium">Recent Hires</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Sarah Chen - Video Editor</span>
                    <span className="text-muted-foreground">2 days ago</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mike Johnson - Camera Operator</span>
                    <span className="text-muted-foreground">1 week ago</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lisa Wang - Content Producer</span>
                    <span className="text-muted-foreground">2 weeks ago</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Weekly Attendance Pattern</CardTitle>
                  <CardDescription>Attendance trends throughout the week</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => exportReport('attendance')}>
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="present" fill="#22c55e" name="Present" />
                  <Bar dataKey="late" fill="#f59e0b" name="Late" />
                  <Bar dataKey="absent" fill="#ef4444" name="Absent" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Check-in</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8:47 AM</div>
                <p className="text-xs text-muted-foreground">7 min earlier than last week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Weekly Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">38.2h</div>
                <p className="text-xs text-muted-foreground">Average per employee</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Overtime Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">127h</div>
                <p className="text-xs text-muted-foreground">Total this week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Perfect Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">89</div>
                <p className="text-xs text-muted-foreground">Employees this month</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Additional Attendance Insights */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">This Month vs Last Month</span>
                    <span className="text-sm font-medium text-green-600">+2.3%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Remote Work Adoption</span>
                    <span className="text-sm font-medium">23%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Sick Leave Usage</span>
                    <span className="text-sm font-medium">4.2 days avg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Vacation Days Taken</span>
                    <span className="text-sm font-medium">12.8 days avg</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Department Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { dept: 'Production', rate: 96 },
                    { dept: 'Technical', rate: 94 },
                    { dept: 'Creative', rate: 91 },
                    { dept: 'Admin', rate: 98 }
                  ].map((item) => (
                    <div key={item.dept} className="flex justify-between items-center">
                      <span className="text-sm">{item.dept}</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={item.rate} className="w-16 h-2" />
                        <span className="text-sm font-medium w-8">{item.rate}%</span>
                      </div>
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

export default Analytics
