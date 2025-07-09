
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Brain, Send, TrendingUp, Users, Calendar, AlertTriangle, Lightbulb, Target, Clock, CheckCircle } from "lucide-react"
import { AIInsight } from "@/types/hrms"
import { useToast } from "@/hooks/use-toast"

export function AIAssistant() {
  const { toast } = useToast()
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState<Array<{id: string, type: 'user' | 'ai', message: string, timestamp: string}>>([
    {
      id: '1',
      type: 'ai',
      message: 'Hello! I\'m your AI HR Assistant. I can help you with employee insights, performance analysis, recruitment recommendations, and more. What would you like to know?',
      timestamp: new Date().toLocaleTimeString()
    }
  ])

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

    // Add user message to chat
    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      message: query,
      timestamp: new Date().toLocaleTimeString()
    }
    setChatHistory(prev => [...prev, userMessage])

    setIsLoading(true)
    
    // Simulate AI processing with realistic responses
    setTimeout(() => {
      const aiResponses = [
        "Based on current data, I recommend focusing on employee retention strategies. Your turnover rate has increased by 12% this quarter.",
        "I've analyzed the recruitment pipeline and found 3 high-potential candidates for the Senior Developer position. Would you like me to schedule interviews?",
        "Performance metrics show that team productivity peaks on Tuesdays and Wednesdays. Consider scheduling important meetings during these days.",
        "I notice attendance patterns suggest some employees may benefit from flexible work arrangements. Shall I prepare a proposal?",
        "Your current hiring process takes an average of 23 days. I can suggest optimizations to reduce this to 15 days.",
        "Employee satisfaction scores indicate training opportunities in leadership development would be valuable for 67% of your managers."
      ]
      
      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)]
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai' as const,
        message: randomResponse,
        timestamp: new Date().toLocaleTimeString()
      }
      
      setChatHistory(prev => [...prev, aiMessage])
      setIsLoading(false)
      setQuery("")
      
      toast({
        title: "AI Analysis Complete",
        description: "I've analyzed your request and provided recommendations.",
      })
    }, 2000)
  }

  const handleQuickAction = (action: string) => {
    const quickResponses = {
      'Screen Resumes': 'I\'ve analyzed 45 resumes for the open positions. 12 candidates meet the minimum requirements, and 5 are exceptional matches. Would you like me to rank them?',
      'Optimize Schedule': 'Based on employee preferences and productivity patterns, I\'ve created an optimized schedule that could increase efficiency by 18%. Shall I implement it?',
      'Analyze Performance': 'Performance analysis complete: 78% of employees are meeting targets, 15% are exceeding expectations, and 7% may need additional support. Detailed report ready.',
      'Risk Assessment': 'I\'ve identified 3 potential risks: high workload in Marketing (85% capacity), upcoming deadline conflicts in Development, and 2 employees showing burnout indicators.'
    }
    
    const response = quickResponses[action as keyof typeof quickResponses] || `Processing ${action} request...`
    
    const aiMessage = {
      id: Date.now().toString(),
      type: 'ai' as const,
      message: response,
      timestamp: new Date().toLocaleTimeString()
    }
    
    setChatHistory(prev => [...prev, aiMessage])
    
    toast({
      title: `${action} Complete`,
      description: "AI analysis has been completed successfully.",
    })
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
          {/* Chat History */}
          <div className="mb-4 h-64 overflow-y-auto border rounded-lg p-4 bg-muted/20">
            <div className="space-y-4">
              {chatHistory.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    message.type === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-background border'
                  }`}>
                    <p className="text-sm">{message.message}</p>
                    <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-background border p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
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
            <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => handleQuickAction('Screen Resumes')}>
              <Users className="h-6 w-6" />
              <span className="text-xs">Screen Resumes</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => handleQuickAction('Optimize Schedule')}>
              <Calendar className="h-6 w-6" />
              <span className="text-xs">Optimize Schedule</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => handleQuickAction('Analyze Performance')}>
              <TrendingUp className="h-6 w-6" />
              <span className="text-xs">Analyze Performance</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => handleQuickAction('Risk Assessment')}>
              <AlertTriangle className="h-6 w-6" />
              <span className="text-xs">Risk Assessment</span>
            </Button>
          </div>
          
          {/* Additional AI Tools */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                <h3 className="font-medium">Smart Suggestions</h3>
              </div>
              <p className="text-sm text-muted-foreground">Get AI-powered recommendations for improving HR processes</p>
              <Button size="sm" className="mt-2 w-full" onClick={() => handleQuickAction('Smart Suggestions')}>
                Get Suggestions
              </Button>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="h-5 w-5 text-green-500" />
                <h3 className="font-medium">Goal Tracking</h3>
              </div>
              <p className="text-sm text-muted-foreground">Monitor progress towards HR objectives and KPIs</p>
              <Button size="sm" className="mt-2 w-full" onClick={() => handleQuickAction('Goal Tracking')}>
                View Progress
              </Button>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-5 w-5 text-blue-500" />
                <h3 className="font-medium">Compliance Check</h3>
              </div>
              <p className="text-sm text-muted-foreground">Ensure HR practices meet regulatory requirements</p>
              <Button size="sm" className="mt-2 w-full" onClick={() => handleQuickAction('Compliance Check')}>
                Run Check
              </Button>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
