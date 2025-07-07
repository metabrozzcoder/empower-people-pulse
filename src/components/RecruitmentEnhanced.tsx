import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Brain, 
  Users, 
  Search, 
  Plus, 
  Filter, 
  Star, 
  Clock, 
  Mail, 
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  MessageSquare
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

interface Candidate {
  id: string
  name: string
  email: string
  phone: string
  position: string
  aiScore: number
  status: 'Applied' | 'Shortlisted' | 'Interview Scheduled' | 'Interview Completed' | 'Offered' | 'Hired' | 'Rejected'
  skills: string[]
  experience: string
  avatar?: string
  appliedDate: string
  notes?: string
}

interface JobPosting {
  id: string
  title: string
  department: string
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship'
  applicants: number
  status: 'Active' | 'Paused' | 'Closed'
  posted: string
  salary: string
  requirements: string[]
}

const mockCandidates: Candidate[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    email: 'sarah.chen@email.com',
    phone: '+1 (555) 123-4567',
    position: 'Senior Video Editor',
    aiScore: 95,
    status: 'Interview Scheduled',
    skills: ['Adobe Premiere', 'After Effects', 'Color Grading', 'Motion Graphics'],
    experience: '5 years',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b25d0a63?w=80&h=80&fit=crop&crop=face',
    appliedDate: '2024-01-10',
    notes: 'Excellent portfolio, strong technical skills'
  },
  {
    id: '2',
    name: 'Michael Rodriguez',
    email: 'm.rodriguez@email.com',
    phone: '+1 (555) 987-6543',
    position: 'News Anchor',
    aiScore: 88,
    status: 'Shortlisted',
    skills: ['Live Broadcasting', 'Teleprompter', 'Journalism', 'Public Speaking'],
    experience: '8 years',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face',
    appliedDate: '2024-01-08',
    notes: 'Great on-camera presence'
  },
  {
    id: '3',
    name: 'Emily Johnson',
    email: 'emily.j@email.com',
    phone: '+1 (555) 456-7890',
    position: 'Content Producer',
    aiScore: 92,
    status: 'Interview Completed',
    skills: ['Content Strategy', 'Production Planning', 'Team Leadership', 'Budget Management'],
    experience: '6 years',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face',
    appliedDate: '2024-01-05',
    notes: 'Strong leadership experience, good cultural fit'
  }
]

const mockJobPostings: JobPosting[] = [
  {
    id: '1',
    title: 'Senior Camera Operator',
    department: 'Production',
    type: 'Full-time',
    applicants: 24,
    status: 'Active',
    posted: '2024-01-10',
    salary: '$65,000 - $75,000',
    requirements: ['5+ years experience', 'Live TV experience', 'Equipment maintenance']
  },
  {
    id: '2',
    title: 'Graphics Designer',
    department: 'Creative',
    type: 'Contract',
    applicants: 18,
    status: 'Active',
    posted: '2024-01-08',
    salary: '$50 - $75/hour',
    requirements: ['Adobe Creative Suite', 'Motion Graphics', 'Broadcast graphics']
  }
]

interface RecruitmentEnhancedProps {
  onCandidateAction?: (action: string, candidateId: string) => void
  onJobAction?: (action: string, jobId: string) => void
}

export function RecruitmentEnhanced({ onCandidateAction, onJobAction }: RecruitmentEnhancedProps) {
  const { toast } = useToast()
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates)
  const [jobPostings, setJobPostings] = useState<JobPosting[]>(mockJobPostings)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [isInterviewDialogOpen, setIsInterviewDialogOpen] = useState(false)

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusColor = (status: Candidate['status']) => {
    switch (status) {
      case 'Applied': return 'bg-blue-100 text-blue-800'
      case 'Shortlisted': return 'bg-green-100 text-green-800'
      case 'Interview Scheduled': return 'bg-purple-100 text-purple-800'
      case 'Interview Completed': return 'bg-yellow-100 text-yellow-800'
      case 'Offered': return 'bg-orange-100 text-orange-800'
      case 'Hired': return 'bg-green-100 text-green-800'
      case 'Rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleCandidateAction = (action: string, candidate: Candidate) => {
    switch (action) {
      case 'schedule_interview':
        setSelectedCandidate(candidate)
        setIsInterviewDialogOpen(true)
        break
      case 'shortlist':
        updateCandidateStatus(candidate.id, 'Shortlisted')
        break
      case 'hire':
        updateCandidateStatus(candidate.id, 'Hired')
        toast({
          title: 'Candidate Hired',
          description: `${candidate.name} has been hired for ${candidate.position}`,
        })
        break
      case 'reject':
        updateCandidateStatus(candidate.id, 'Rejected')
        toast({
          title: 'Candidate Rejected',
          description: `${candidate.name} has been rejected`,
          variant: 'destructive'
        })
        break
      default:
        toast({
          title: action,
          description: `${action} performed for ${candidate.name}`,
        })
    }
    onCandidateAction?.(action, candidate.id)
  }

  const updateCandidateStatus = (candidateId: string, newStatus: Candidate['status']) => {
    setCandidates(prev => 
      prev.map(candidate => 
        candidate.id === candidateId ? { ...candidate, status: newStatus } : candidate
      )
    )
  }

  const filteredCandidates = candidates.filter(candidate => {
    if (filterStatus !== 'all' && candidate.status !== filterStatus) return false
    if (searchTerm && !candidate.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      <Tabs defaultValue="candidates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="jobs">Job Postings</TabsTrigger>
          <TabsTrigger value="pipeline">Hiring Pipeline</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="candidates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI-Enhanced Candidate Management
              </CardTitle>
              <CardDescription>
                Advanced AI screening with comprehensive candidate tracking
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
                  <SelectTrigger className="w-[200px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Applied">Applied</SelectItem>
                    <SelectItem value="Shortlisted">Shortlisted</SelectItem>
                    <SelectItem value="Interview Scheduled">Interview Scheduled</SelectItem>
                    <SelectItem value="Interview Completed">Interview Completed</SelectItem>
                    <SelectItem value="Offered">Offered</SelectItem>
                    <SelectItem value="Hired">Hired</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Candidate
                </Button>
              </div>

              <div className="grid gap-4">
                {filteredCandidates.map((candidate) => (
                  <Card key={candidate.id} className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <Avatar className="w-16 h-16">
                            <AvatarImage src={candidate.avatar} />
                            <AvatarFallback>{candidate.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-3 flex-1">
                            <div>
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="font-semibold text-lg">{candidate.name}</h3>
                                <Badge className={getStatusColor(candidate.status)}>
                                  {candidate.status}
                                </Badge>
                                <div className="flex items-center gap-2">
                                  <Star className="h-4 w-4 text-yellow-500" />
                                  <span className={`font-bold ${getScoreColor(candidate.aiScore)}`}>
                                    {candidate.aiScore}% Match
                                  </span>
                                </div>
                              </div>
                              <p className="text-muted-foreground font-medium">{candidate.position}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{candidate.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{candidate.phone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{candidate.experience} experience</span>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              {candidate.skills.map((skill, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>

                            {candidate.notes && (
                              <div className="bg-muted/50 p-3 rounded-lg">
                                <p className="text-sm">{candidate.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-4">
                          <Button 
                            size="sm" 
                            onClick={() => handleCandidateAction('schedule_interview', candidate)}
                          >
                            <Calendar className="w-4 h-4 mr-1" />
                            Schedule Interview
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCandidateAction('shortlist', candidate)}
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Shortlist
                          </Button>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
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
                  <CardTitle>Job Postings Management</CardTitle>
                  <CardDescription>Create and manage job openings</CardDescription>
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
                  <Card key={job.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-semibold text-lg">{job.title}</h3>
                            <Badge variant={job.status === 'Active' ? 'default' : 'secondary'}>
                              {job.status}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>{job.department}</span>
                            <span>•</span>
                            <span>{job.type}</span>
                            <span>•</span>
                            <span>{job.salary}</span>
                            <span>•</span>
                            <span>Posted: {job.posted}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {job.requirements.map((req, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {req}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <div className="text-2xl font-bold text-primary">{job.applicants}</div>
                          <p className="text-sm text-muted-foreground">Applicants</p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
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

        <TabsContent value="pipeline" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-4">
            {['Applied', 'Shortlisted', 'Interview Scheduled', 'Hired'].map((stage) => (
              <Card key={stage}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">{stage}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">
                    {candidates.filter(c => c.status === stage).length}
                  </div>
                  <div className="space-y-2">
                    {candidates.filter(c => c.status === stage).slice(0, 3).map((candidate) => (
                      <div key={candidate.id} className="text-sm p-2 bg-muted/50 rounded">
                        <p className="font-medium">{candidate.name}</p>
                        <p className="text-muted-foreground text-xs">{candidate.position}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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

      {/* Interview Dialog */}
      <Dialog open={isInterviewDialogOpen} onOpenChange={setIsInterviewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Candidate</Label>
              <p className="font-medium">{selectedCandidate?.name}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="interview-date">Interview Date</Label>
              <Input type="datetime-local" id="interview-date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interviewer">Interviewer</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select interviewer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="john">John Smith - HR Manager</SelectItem>
                  <SelectItem value="sarah">Sarah Wilson - Department Head</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Interview notes..." />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsInterviewDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast({
                  title: "Interview Scheduled",
                  description: `Interview scheduled for ${selectedCandidate?.name}`,
                })
                setIsInterviewDialogOpen(false)
                if (selectedCandidate) {
                  updateCandidateStatus(selectedCandidate.id, 'Interview Scheduled')
                }
              }}>
                Schedule Interview
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}