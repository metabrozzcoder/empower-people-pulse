import { useEffect, useMemo, useState } from "react"
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Users, Target, Clock, DollarSign, Award } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface EmployeeRow { id: string; department: string | null; salary: number | null; performance_score: number | null; status: string | null; name: string; hire_date: string | null }
interface ProjectRow { id: string; status: string | null; progress: number | null }
interface TaskRow { id: string; status: string | null; priority: string | null }
interface ShootingRow { id: string; status: string | null }
interface AttendanceRow { id: string; date: string; status: string | null; hours: number | null }
interface ProfileRow { id: string; department: string | null }
interface PaidOrderRow { id: string; budget: number | null; department_id: string | null; department_name: string | null; status: string }
interface DeptRow { id: string; name: string }

const COLORS = ['hsl(var(--primary))', '#82ca9d', '#ffc658', '#ff7300', '#8884d8']

const downloadCsv = (rows: Record<string, unknown>[], filename: string) => {
  if (!rows.length) return
  const csv = [Object.keys(rows[0]).join(','), ...rows.map(r => Object.values(r).map(v => `"${v ?? ''}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const Analytics = () => {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<EmployeeRow[]>([])
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [shootings, setShootings] = useState<ShootingRow[]>([])
  const [attendance, setAttendance] = useState<AttendanceRow[]>([])
  const [paidOrders, setPaidOrders] = useState<PaidOrderRow[]>([])
  const [deptList, setDeptList] = useState<DeptRow[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [e, pr, p, t, sr, a, po, dl] = await Promise.all([
        supabase.from('employees').select('id,department,salary,performance_score,status,name,hire_date'),
        supabase.from('profiles_public' as never).select('id,department'),
        supabase.from('projects').select('id,status,progress'),
        supabase.from('tasks').select('id,status,priority'),
        supabase.from('shooting_requests').select('id,status'),
        supabase.from('attendance').select('id,date,status,hours'),
        supabase.from('payment_orders').select('id,budget,department_id,department_name,status').eq('status', 'paid'),
        supabase.from('departments').select('id,name'),
      ])
      setEmployees((e.data ?? []) as EmployeeRow[])
      setProfiles((pr.data ?? []) as ProfileRow[])
      setProjects((p.data ?? []) as ProjectRow[])
      setTasks((t.data ?? []) as TaskRow[])
      setShootings((sr.data ?? []) as ShootingRow[])
      setAttendance((a.data ?? []) as AttendanceRow[])
      setPaidOrders((po.data ?? []) as PaidOrderRow[])
      setDeptList((dl.data ?? []) as DeptRow[])
      setLoading(false)
    }
    load()
  }, [])

  const totalEmployees = employees.length || profiles.length
  const avgPerformance = useMemo(() => {
    const scores = employees.map(e => e.performance_score ?? 0).filter(s => s > 0)
    return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  }, [employees])

  const departmentData = useMemo(() => {
    const map = new Map<string, { name: string; employees: number; performance: number; budget: number; spent: number; perfCount: number }>()
    const deptNameById = new Map(deptList.map(d => [d.id, d.name]))
    const source = employees.length > 0
      ? employees.map(e => ({ dept: e.department || 'General', perf: e.performance_score ?? 0, salary: e.salary ?? 0 }))
      : profiles.map(p => ({ dept: p.department || 'General', perf: 0, salary: 0 }))
    source.forEach(({ dept, perf, salary }) => {
      const cur = map.get(dept) ?? { name: dept, employees: 0, performance: 0, budget: 0, spent: 0, perfCount: 0 }
      cur.employees += 1
      cur.budget += salary
      if (perf > 0) { cur.performance += perf; cur.perfCount += 1 }
      map.set(dept, cur)
    })
    // Add payment commission spend per department (paid orders)
    paidOrders.forEach(o => {
      const name = o.department_name ?? (o.department_id ? deptNameById.get(o.department_id) : null) ?? 'General'
      const cur = map.get(name) ?? { name, employees: 0, performance: 0, budget: 0, spent: 0, perfCount: 0 }
      cur.spent += Number(o.budget ?? 0)
      map.set(name, cur)
    })
    return Array.from(map.values()).map(d => ({
      name: d.name,
      employees: d.employees,
      performance: d.perfCount ? Math.round(d.performance / d.perfCount) : 0,
      budget: d.budget,
      spent: d.spent,
    }))
  }, [employees, profiles, paidOrders, deptList])

  const totalBudget = departmentData.reduce((s, d) => s + d.budget, 0)
  const totalSpent = useMemo(
    () => paidOrders.reduce((s, o) => s + Number(o.budget ?? 0), 0),
    [paidOrders]
  )

  const attendanceRate = useMemo(() => {
    if (!attendance.length) return 0
    const present = attendance.filter(a => (a.status ?? 'present') === 'present').length
    return Math.round((present / attendance.length) * 100)
  }, [attendance])

  const weeklyAttendance = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const buckets = days.map(day => ({ day, present: 0, late: 0, absent: 0 }))
    attendance.forEach(a => {
      const d = new Date(a.date).getDay()
      const status = (a.status ?? 'present').toLowerCase()
      if (status === 'late') buckets[d].late += 1
      else if (status === 'absent') buckets[d].absent += 1
      else buckets[d].present += 1
    })
    // Show Mon-Fri
    return [buckets[1], buckets[2], buckets[3], buckets[4], buckets[5]]
  }, [attendance])

  const recruitmentFunnel = useMemo(() => {
    const stages = [
      { stage: 'Draft', color: '#8884d8' },
      { stage: 'Submitted', color: '#82ca9d' },
      { stage: 'Admin Approved', color: '#ffc658' },
      { stage: 'Completed', color: '#00C49F' },
    ]
    return stages.map(s => ({ ...s, count: shootings.filter(sh => sh.status === s.stage).length }))
  }, [shootings])

  const projectStats = useMemo(() => {
    const total = projects.length
    const inProgress = projects.filter(p => p.status === 'In Progress').length
    const completed = projects.filter(p => p.status === 'Completed').length
    const avgProgress = total ? Math.round(projects.reduce((s, p) => s + (p.progress ?? 0), 0) / total) : 0
    return { total, inProgress, completed, avgProgress }
  }, [projects])

  const taskStats = useMemo(() => {
    const total = tasks.length
    const done = tasks.filter(t => t.status === 'done' || t.status === 'Done').length
    const open = total - done
    const critical = tasks.filter(t => (t.priority ?? '').toLowerCase() === 'critical').length
    return { total, done, open, critical }
  }, [tasks])

  const performanceDist = useMemo(() => {
    const scored = employees.filter(e => (e.performance_score ?? 0) > 0)
    const bucket = (min: number, max: number) => scored.filter(e => (e.performance_score ?? 0) >= min && (e.performance_score ?? 0) <= max).length
    const total = scored.length || 1
    return [
      { label: 'Excellent (90-100%)', pct: Math.round((bucket(90, 100) / total) * 100) },
      { label: 'Good (80-89%)', pct: Math.round((bucket(80, 89) / total) * 100) },
      { label: 'Average (70-79%)', pct: Math.round((bucket(70, 79) / total) * 100) },
      { label: 'Below Average (<70%)', pct: Math.round((bucket(0, 69) / total) * 100) },
    ]
  }, [employees])

  const topPerformer = useMemo(() => {
    if (!employees.length) return null
    return [...employees].sort((a, b) => (b.performance_score ?? 0) - (a.performance_score ?? 0))[0]
  }, [employees])

  const recentHires = useMemo(() => {
    return [...employees]
      .filter(e => e.hire_date)
      .sort((a, b) => (b.hire_date ?? '').localeCompare(a.hire_date ?? ''))
      .slice(0, 5)
  }, [employees])

  const exportReport = (type: string) => {
    let data: Record<string, unknown>[] = []
    switch (type) {
      case 'departments': data = departmentData; break
      case 'recruitment': data = recruitmentFunnel; break
      case 'attendance': data = weeklyAttendance; break
      case 'performance': data = departmentData.map(d => ({ department: d.name, avg_performance: d.performance })); break
    }
    if (!data.length) {
      toast({ title: 'No data', description: 'Nothing to export yet.', variant: 'destructive' })
      return
    }
    downloadCsv(data, type + '_report')
    toast({ title: 'Report exported', description: `${type} report downloaded.` })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('pages.analytics.title')}</h1>
        <p className="text-muted-foreground">{t('pages.analytics.subtitle')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total People</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">{employees.length} employees · {profiles.length} accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPerformance}%</div>
            <p className="text-xs text-muted-foreground">Across scored employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">{attendance.length} records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats.inProgress}</div>
            <p className="text-xs text-muted-foreground">{projectStats.total} total · {projectStats.avgProgress}% avg progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tasks</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.open}</div>
            <p className="text-xs text-muted-foreground">{taskStats.critical} critical · {taskStats.done} done</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalBudget / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground">
              Salaries · Paid commissions: ${(totalSpent / 1000).toFixed(1)}K
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="departments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="recruitment">Shooting Requests</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="work">Projects & Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Department Comparison</CardTitle>
                  <CardDescription>Average performance per department</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => exportReport('departments')}>Export</Button>
              </div>
            </CardHeader>
            <CardContent>
              {departmentData.length ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={departmentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="performance" fill="hsl(var(--primary))" name="Performance %" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyState loading={loading} message="No department data yet." />}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Headcount</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {departmentData.map(d => (
                    <div key={d.name} className="flex justify-between items-center">
                      <span className="font-medium">{d.name}</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={totalEmployees ? (d.employees / totalEmployees) * 100 : 0} className="w-20 h-2" />
                        <span className="text-sm font-medium w-6 text-right">{d.employees}</span>
                      </div>
                    </div>
                  ))}
                  {!departmentData.length && <EmptyState loading={loading} message="No employees yet." />}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Payroll & Spend</CardTitle>
                <CardDescription>Salaries + paid payment commission per department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {departmentData.map(d => (
                    <div key={d.name} className="flex justify-between items-center">
                      <span className="font-medium">{d.name}</span>
                      <div className="text-right">
                        <div className="font-medium">
                          ${(d.budget / 1000).toFixed(1)}K
                          {d.spent > 0 && (
                            <span className="text-green-600 ml-2">
                              +${(d.spent / 1000).toFixed(1)}K
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {totalBudget ? Math.round((d.budget / totalBudget) * 100) : 0}% payroll
                          {d.spent > 0 && ` · spent $${d.spent.toLocaleString()}`}
                        </div>
                      </div>
                    </div>
                  ))}
                  {!departmentData.length && <EmptyState loading={loading} message="No payroll data yet." />}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Performance Distribution</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportReport('performance')}>Export</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceDist.map(p => (
                  <div key={p.label} className="flex justify-between items-center">
                    <span className="text-sm">{p.label}</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={p.pct} className="w-32 h-2" />
                      <span className="text-sm font-medium w-10 text-right">{p.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Top Performer:</span>
                  <p className="font-medium">{topPerformer ? `${topPerformer.name} (${topPerformer.performance_score ?? 0}%)` : '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Avg Score:</span>
                  <p className="font-medium">{avgPerformance}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recruitment" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Shooting Request Funnel</CardTitle>
                    <CardDescription>Requests grouped by status</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => exportReport('recruitment')}>Export</Button>
                </div>
              </CardHeader>
              <CardContent>
                {recruitmentFunnel.some(s => s.count > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={recruitmentFunnel} cx="50%" cy="50%" outerRadius={100} dataKey="count" label={({ stage, count }) => `${stage}: ${count}`}>
                        {recruitmentFunnel.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <EmptyState loading={loading} message="No shooting requests yet." />}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Recent Hires</CardTitle></CardHeader>
              <CardContent>
                {recentHires.length ? (
                  <div className="space-y-2 text-sm">
                    {recentHires.map(h => (
                      <div key={h.id} className="flex justify-between">
                        <span>{h.name}</span>
                        <span className="text-muted-foreground">{h.hire_date}</span>
                      </div>
                    ))}
                  </div>
                ) : <EmptyState loading={loading} message="No hires recorded yet." />}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Weekly Attendance Pattern</CardTitle>
                  <CardDescription>Counts of attendance records by weekday</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => exportReport('attendance')}>Export</Button>
              </div>
            </CardHeader>
            <CardContent>
              {attendance.length ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyAttendance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="present" fill="#22c55e" name="Present" />
                    <Bar dataKey="late" fill="#f59e0b" name="Late" />
                    <Bar dataKey="absent" fill="#ef4444" name="Absent" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyState loading={loading} message="No attendance records yet." />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="work" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Projects</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Total" value={projectStats.total} />
                <Row label="In progress" value={projectStats.inProgress} />
                <Row label="Completed" value={projectStats.completed} />
                <Row label="Average progress" value={`${projectStats.avgProgress}%`} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Tasks</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Total" value={taskStats.total} />
                <Row label="Open" value={taskStats.open} />
                <Row label="Done" value={taskStats.done} />
                <Row label="Critical priority" value={taskStats.critical} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

const Row = ({ label, value }: { label: string; value: number | string }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
)

const EmptyState = ({ loading, message }: { loading: boolean; message: string }) => (
  <div className="text-center py-8 text-sm text-muted-foreground">
    {loading ? 'Loading…' : message}
  </div>
)

export default Analytics
