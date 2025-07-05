
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"

const monthlyData = [
  { month: "Jan", hires: 12, departures: 5 },
  { month: "Feb", hires: 15, departures: 8 },
  { month: "Mar", hires: 18, departures: 6 },
  { month: "Apr", hires: 14, departures: 9 },
  { month: "May", hires: 22, departures: 7 },
  { month: "Jun", hires: 16, departures: 4 },
]

const departmentData = [
  { name: "Engineering", value: 85, color: "#3b82f6" },
  { name: "Sales", value: 45, color: "#10b981" },
  { name: "Marketing", value: 32, color: "#f59e0b" },
  { name: "HR", value: 28, color: "#ef4444" },
  { name: "Finance", value: 35, color: "#8b5cf6" },
  { name: "Operations", value: 23, color: "#06b6d4" },
]

const performanceData = [
  { month: "Jan", score: 88 },
  { month: "Feb", score: 91 },
  { month: "Mar", score: 89 },
  { month: "Apr", score: 94 },
  { month: "May", score: 92 },
  { month: "Jun", score: 96 },
]

export function DashboardCharts() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Hiring Trends</CardTitle>
          <CardDescription>Monthly hires vs departures</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="hires" fill="#3b82f6" name="Hires" />
              <Bar dataKey="departures" fill="#ef4444" name="Departures" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Department Distribution</CardTitle>
          <CardDescription>Employees by department</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={departmentData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {departmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {departmentData.map((dept, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: dept.color }}
                  />
                  <span>{dept.name}</span>
                </div>
                <span className="font-medium">{dept.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-1 lg:col-span-3">
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>Average performance score over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: "#10b981", strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
