
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Brain, Users, Search, Plus, Filter, Star, Clock, Mail, Phone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const Recruitment = () => {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const candidates = [
    {
      id: "1",
      name: "Sarah Chen",
      email: "sarah.chen@email.com",
      phone: "+1 (555) 123-4567",
      position: "Senior Video Editor",
      aiScore: 95,
      status: "Interview Scheduled",
      skills: ["Adobe Premiere", "After Effects", "Color Grading"],
      experience: "5 years",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b25d0a63?w=80&h=80&fit=crop&crop=face"
    },
    {
      id: "2",
      name: "Michael Rodriguez",
      email: "m.rodriguez@email.com",
      phone: "+1 (555) 987-6543",
      position: "News Anchor",
      aiScore: 88,
      status: "Under Review",
      skills: ["Live Broadcasting", "Teleprompter", "Journalism"],
      experience: "8 years",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face"
    },
    {
      id: "3",
      name: "Emily Johnson",
      email: "emily.j@email.com",
      phone: "+1 (555) 456-7890",
      position: "Content Producer",
      aiScore: 92,
      status: "Shortlisted",
      skills: ["Content Strategy", "Production Planning", "Team Leadership"],
      experience: "6 years",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face"
    }
  ]

  const jobPostings = [
    {
      id: "1",
      title: "Senior Camera Operator",
      department: "Production",
      type: "Full-time",
      applicants: 24,
      status: "Active",
      posted: "2024-01-10"
    },
    {
      id: "2",
      title: "Graphics Designer",
      department: "Creative",
      type: "Contract",
      applicants: 18,
      status: "Active",
      posted: "2024-01-08"
    }
  ]

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Interview Scheduled": return "bg-blue-100 text-blue-800"
      case "Shortlisted": return "bg-green-100 text-green-800"
      case "Under Review": return "bg-yellow-100 text-yellow-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const handleScheduleInterview = (candidateId: string) => {
    toast({
      title: "Interview Scheduled",
      description: "Interview has been scheduled and candidate will be notified.",
    })
  }

  const filteredCandidates = candidates.filter(candidate => {
    if (filterStatus !== "all" && candidate.status !== filterStatus) return false
    if (searchTerm && !candidate.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI-Powered Recruitment</h1>
        <p className="text-muted-foreground">
          Streamline your hiring process with intelligent candidate screening and matching.
        </p>
      </div>

      <Tabs defaultValue="candidates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="jobs">Job Postings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="candidates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI Resume Screening
              </CardTitle>
              <CardDescription>
                Advanced AI analysis of candidate profiles and skills matching
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search candidates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Shortlisted">Shortlisted</SelectItem>
                    <SelectItem value="Interview Scheduled">Interview Scheduled</SelectItem>
                    <SelectItem value="Under Review">Under Review</SelectItem>
                  </SelectContent>
                </Select>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Candidate
                </Button>
              </div>

              <div className="grid gap-4">
                {filteredCandidates.map((candidate) => (
                  <Card key={candidate.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={candidate.avatar} />
                            <AvatarFallback>{candidate.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-2">
                            <div>
                              <h3 className="font-semibold text-lg">{candidate.name}</h3>
                              <p className="text-muted-foreground">{candidate.position}</p>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Mail className="h-4 w-4" />
                                {candidate.email}
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                {candidate.phone}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {candidate.experience}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {candidate.skills.map((skill, index) => (
                                <Badge key={index} variant="secondary">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-right space-y-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className={`font-bold ${getScoreColor(candidate.aiScore)}`}>
                                {candidate.aiScore}% Match
                              </span>
                            </div>
                            <Badge className={getStatusColor(candidate.status)}>
                              {candidate.status}
                            </Badge>
                          </div>
                          <div className="space-x-2">
                            <Button variant="outline" size="sm">
                              View Profile
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleScheduleInterview(candidate.id)}
                            >
                              Schedule Interview
                            </Button>
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

        <TabsContent value="jobs" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Job Postings</CardTitle>
                  <CardDescription>Manage your current job openings</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Post New Job
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {jobPostings.map((job) => (
                  <Card key={job.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{job.title}</h3>
                          <p className="text-muted-foreground">{job.department} • {job.type}</p>
                          <p className="text-sm text-muted-foreground">Posted: {job.posted}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{job.applicants}</div>
                          <p className="text-sm text-muted-foreground">Applicants</p>
                          <Badge className="mt-2" variant="secondary">{job.status}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">127</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Interview Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">23%</div>
                <p className="text-xs text-muted-foreground">+5% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Hire Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">18%</div>
                <p className="text-xs text-muted-foreground">+2% from last month</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Recruitment
