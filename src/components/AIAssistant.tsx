
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Brain, Send, TrendingUp, Users, Calendar, AlertTriangle } from "lucide-react"
import { AIInsight } from "@/types/hrms"

export function AIAssistant() {
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const aiInsights: AIInsight[] = [
    {
      id: "1",
      type: "recruitment",
      title: "High-Quality Candidate Match",
      description: "AI identified 3 candidates with 95%+ match for Senior Video Editor position based on skills analysis",
      confidence: 95,
      actionable: true,
      suggestedActions: ["Review top candidates", "Schedule interviews", "Send assessment"],
      createdAt: "2024-01-15T10:30:00Z"
    },
    {
      id: "2",
      type: "performance",
      title: "Team Productivity Alert",
      description: "Creative team productivity increased 23% this month. Consider workload optimization for sustained performance",
      confidence: 87,
      actionable: true,
      suggestedActions: ["Analyze workload distribution", "Plan team expansion", "Implement efficiency tools"],
      createdAt: "2024-01-15T09:15:00Z"
    },
    {
      id: "3",
      type: "scheduling",
      title: "Optimal Shift Scheduling",
      description: "AI suggests rotating prime-time shifts to improve team satisfaction and reduce burnout risk",
      confidence: 78,
      actionable: true,
      suggestedActions: ["Review current schedules", "Implement rotation system", "Survey team preferences"],
      createdAt: "2024-01-15T08:45:00Z"
    }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    // Simulate AI processing
    setTimeout(() => {
      setIsLoading(false)
      setQuery("")
    }, 2000)
  }

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'recruitment': return Users
      case 'performance': return TrendingUp
      case 'scheduling': return Calendar
      default: return Brain
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "bg-green-100 text-green-800"
    if (confidence >= 70) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  return (
    <div className="space-y-6">
      {/* AI Chat Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Assistant
          </CardTitle>
          <CardDescription>
            Ask questions about HR analytics, employee insights, or get recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              placeholder="Ask me anything about your HR data..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !query.trim()}>
              {isLoading ? "Processing..." : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recent AI Insights</h3>
        <div className="grid gap-4">
          {aiInsights.map((insight) => {
            const IconComponent = getInsightIcon(insight.type)
            return (
              <Card key={insight.id} className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base">{insight.title}</CardTitle>
                    </div>
                    <Badge className={getConfidenceColor(insight.confidence)}>
                      {insight.confidence}% confidence
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-3">
                    {insight.description}
                  </p>
                  {insight.actionable && insight.suggestedActions && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Suggested Actions:</p>
                      <div className="flex flex-wrap gap-2">
                        {insight.suggestedActions.map((action, index) => (
                          <Button key={index} variant="outline" size="sm" className="text-xs">
                            {action}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick AI Actions</CardTitle>
          <CardDescription>Common AI-powered tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Users className="h-6 w-6" />
              <span className="text-xs">Screen Resumes</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Calendar className="h-6 w-6" />
              <span className="text-xs">Optimize Schedule</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <TrendingUp className="h-6 w-6" />
              <span className="text-xs">Analyze Performance</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <AlertTriangle className="h-6 w-6" />
              <span className="text-xs">Risk Assessment</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
