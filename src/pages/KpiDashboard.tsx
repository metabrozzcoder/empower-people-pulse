
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { TrendingUp, TrendingDown, Target, Plus, Settings, Minus } from "lucide-react"
import { KPI } from "@/types/hrms"
import { useToast } from "@/hooks/use-toast"

const KpiDashboard = () => {
  const { toast } = useToast()
  const [selectedPeriod, setSelectedPeriod] = useState("monthly")

  const [kpis, setKpis] = useState<KPI[]>([
    {
      id: "1",
      name: "Employee Satisfaction",
      value: 87,
      target: 85,
      unit: "%",
      department: "HR",
      period: "Monthly",
      trend: "up"
    },
    {
      id: "2",
      name: "Time to Fill Positions",
      value: 18,
      target: 21,
      unit: "days",
      department: "Recruitment",
      period: "Monthly",
      trend: "down"
    },
    {
      id: "3",
      name: "Training Completion Rate",
      value: 92,
      target: 90,
      unit: "%",
      department: "Learning",
      period: "Quarterly",
      trend: "up"
    },
    {
      id: "4",
      name: "Employee Turnover",
      value: 3.2,
      target: 5.0,
      unit: "%",
      department: "HR",
      period: "Monthly",
      trend: "down"
    },
    {
      id: "5",
      name: "Attendance Rate",
      value: 94.5,
      target: 95.0,
      unit: "%",
      department: "Operations",
      period: "Weekly",
      trend: "stable"
    },
    {
      id: "6",
      name: "Performance Rating",
      value: 4.2,
      target: 4.0,
      unit: "/5",
      department: "Performance",
      period: "Quarterly",
      trend: "up"
    }
  ])

  const trendData = [
    { month: 'Jan', satisfaction: 82, turnover: 4.1, attendance: 92.5, performance: 3.8 },
    { month: 'Feb', satisfaction: 84, turnover: 3.8, attendance: 93.2, performance: 3.9 },
    { month: 'Mar', satisfaction: 85, turnover: 3.5, attendance: 94.1, performance: 4.0 },
    { month: 'Apr', satisfaction: 86, turnover: 3.4, attendance: 94.3, performance: 4.1 },
    { month: 'May', satisfaction: 87, turnover: 3.2, attendance: 94.5, performance: 4.2 },
    { month: 'Jun', satisfaction: 87, turnover: 3.2, attendance: 94.5, performance: 4.2 }
  ]

  const departmentKpis = [
    { department: 'HR', score: 89, kpis: 4 },
    { department: 'Recruitment', score: 85, kpis: 3 },
    { department: 'Learning', score: 92, kpis: 2 },
    { department: 'Operations', score: 87, kpis: 3 },
    { department: 'Performance', score: 91, kpis: 2 }
  ]

  const getTrendIcon = (trend: KPI['trend']) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />
      default: return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = (trend: KPI['trend']) => {
    switch (trend) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getKpiStatus = (kpi: KPI) => {
    const percentage = (kpi.value / kpi.target) * 100
    if (percentage >= 100) return { status: 'exceeds', color: 'bg-green-100 text-green-800' }
    if (percentage >= 80) return { status: 'on-track', color: 'bg-blue-100 text-blue-800' }
    return { status: 'below-target', color: 'bg-red-100 text-red-800' }
  }

  const addKpi = () => {
    toast({
      title: "KPI Added",
      description: "New KPI has been added to the dashboard.",
    })
  }

  const updateKpiTarget = (kpiId: string, newTarget: number) => {
    setKpis(prevKpis => 
      prevKpis.map(kpi => 
        kpi.id === kpiId ? { ...kpi, target: newTarget } : kpi
      )
    )
    toast({
      title: "KPI Target Updated",
      description: "KPI target has been successfully updated.",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">KPI Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor and track key performance indicators across all HR functions.
        </p>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total KPIs</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.length}</div>
            <p className="text-xs text-muted-foreground">Across 5 departments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Target</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {kpis.filter(kpi => (kpi.value / kpi.target) * 100 >= 80).length}
            </div>
            <p className="text-xs text-muted-foreground">KPIs meeting targets</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exceeding</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {kpis.filter(kpi => (kpi.value / kpi.target) * 100 >= 100).length}
            </div>
            <p className="text-xs text-muted-foreground">KPIs above target</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground">Of target achievement</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="goals">Goal Setting</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All KPIs</CardTitle>
                  <CardDescription>Current performance against targets</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={addKpi}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add KPI
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {kpis.map((kpi) => {
                  const status = getKpiStatus(kpi)
                  const percentage = (kpi.value / kpi.target) * 100
                  return (
                    <Card key={kpi.id} className="border-l-4 border-l-primary">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{kpi.name}</CardTitle>
                          {getTrendIcon(kpi.trend)}
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{kpi.department}</Badge>
                          <Badge className={status.color}>{status.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-end justify-between">
                          <div>
                            <div className={`text-2xl font-bold ${getTrendColor(kpi.trend)}`}>
                              {kpi.value}{kpi.unit}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Target: {kpi.target}{kpi.unit}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {percentage.toFixed(0)}%
                            </div>
                            <p className="text-xs text-muted-foreground">of target</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Progress value={Math.min(percentage, 100)} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{kpi.period}</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-auto p-0 text-xs"
                            >
                              <Settings className="h-3 w-3 mr-1" />
                              Edit
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

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>KPI Trends Over Time</CardTitle>
              <CardDescription>Historical performance of key metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="satisfaction" stroke="#8884d8" strokeWidth={2} name="Satisfaction %" />
                  <Line type="monotone" dataKey="turnover" stroke="#82ca9d" strokeWidth={2} name="Turnover %" />
                  <Line type="monotone" dataKey="attendance" stroke="#ffc658" strokeWidth={2} name="Attendance %" />
                  <Line type="monotone" dataKey="performance" stroke="#ff7300" strokeWidth={2} name="Performance /5" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing KPIs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {kpis
                    .sort((a, b) => (b.value / b.target) - (a.value / a.target))
                    .slice(0, 5)
                    .map((kpi, index) => (
                      <div key={kpi.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{kpi.name}</p>
                            <p className="text-sm text-muted-foreground">{kpi.department}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            {Math.round((kpi.value / kpi.target) * 100)}%
                          </p>
                          <p className="text-xs text-muted-foreground">of target</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Needs Attention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {kpis
                    .filter(kpi => (kpi.value / kpi.target) * 100 < 80)
                    .map((kpi) => (
                      <div key={kpi.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{kpi.name}</p>
                          <p className="text-sm text-muted-foreground">{kpi.department}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600">
                            {Math.round((kpi.value / kpi.target) * 100)}%
                          </p>
                          <Badge variant="outline" className="text-xs">
                            Action Required
                          </Badge>
                        </div>
                      </div>
                    ))}
                  {kpis.filter(kpi => (kpi.value / kpi.target) * 100 < 80).length === 0 && (
                    <p className="text-center text-muted-foreground">All KPIs are on track! 🎉</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
              <CardDescription>KPI performance by department</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentKpis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" fill="#8884d8" name="Average Score" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {departmentKpis.map((dept) => (
              <Card key={dept.department}>
                <CardHeader>
                  <CardTitle className="text-lg">{dept.department}</CardTitle>
                  <CardDescription>{dept.kpis} KPIs tracked</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Overall Score</span>
                      <span className="font-bold text-lg">{dept.score}%</span>
                    </div>
                    <Progress value={dept.score} className="h-2" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Department KPIs</span>
                      <span>{dept.kpis} metrics</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Goal Setting & Targets</CardTitle>
              <CardDescription>Set and adjust KPI targets for better performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {kpis.map((kpi) => (
                  <div key={kpi.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{kpi.name}</h3>
                      <p className="text-sm text-muted-foreground">{kpi.department} • {kpi.period}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Current</p>
                        <p className="font-medium">{kpi.value}{kpi.unit}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Target</p>
                        <p className="font-medium">{kpi.target}{kpi.unit}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Achievement</p>
                        <p className="font-medium">{Math.round((kpi.value / kpi.target) * 100)}%</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Adjust Target
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default KpiDashboard
