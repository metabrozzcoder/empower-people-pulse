
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserPlus, TrendingUp, Clock } from "lucide-react"

const stats = [
  {
    title: "Total Employees",
    value: "248",
    change: "+12%",
    icon: Users,
    positive: true
  },
  {
    title: "New Hires",
    value: "18",
    change: "+23%",
    icon: UserPlus,
    positive: true
  },
  {
    title: "Performance",
    value: "94.2%",
    change: "+5.1%",
    icon: TrendingUp,
    positive: true
  },
  {
    title: "Attendance",
    value: "96.8%",
    change: "-2.1%",
    icon: Clock,
    positive: false
  }
]

export function DashboardStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className={`text-xs ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
              {stat.change} from last month
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
