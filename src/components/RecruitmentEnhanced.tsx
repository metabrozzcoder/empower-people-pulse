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
  MessageSquare,
  Download
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
  const [isAddCandidateDialogOpen, setIsAddCandidateDialogOpen] = useState(false)
  const [isViewCandidateDialogOpen, setIsViewCandidateDialogOpen] = useState(false)
  const [isEditCandidateDialogOpen, setIsEditCandidateDialogOpen] = useState(false)
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)
  const [isAddJobDialogOpen, setIsAddJobDialogOpen] = useState(false)

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
        toast({
          title: 'Candidate Shortlisted',
          description: `${candidate.name} has been shortlisted for ${candidate.position}`,
        })
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
      case 'send_email':
        toast({
          title: 'Email Sent',
          description: `Email sent to ${candidate.name} successfully`,
        })
        break
      case 'download_resume':
        // Simulate resume download
        const resumeContent = `Resume for ${candidate.name}\n\nPosition: ${candidate.position}\nExperience: ${candidate.experience}\nSkills: ${candidate.skills.join(', ')}\nEmail: ${candidate.email}\nPhone: ${candidate.phone}`
        const blob = new Blob([resumeContent], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${candidate.name.replace(/\s+/g, '_')}_Resume.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast({
          title: 'Resume Downloaded',
          description: `${candidate.name}'s resume has been downloaded`,
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
                <Button onClick={() => setIsAddCandidateDialogOpen(true)}>
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
                            disabled={candidate.status === 'Shortlisted' || candidate.status === 'Hired'}
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            {candidate.status === 'Shortlisted' ? 'Shortlisted' : 'Shortlist'}
                          </Button>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedCandidate(candidate)
                                setIsViewCandidateDialogOpen(true)
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedCandidate(candidate)
                                setIsMessageDialogOpen(true)
                              }}
                            >
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedCandidate(candidate)
                                setIsEditCandidateDialogOpen(true)
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleCandidateAction('download_resume', candidate)}
                              title="Download Resume"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleCandidateAction('send_email', candidate)}
                              title="Send Email"
                            >
                              <Mail className="w-4 h-4" />
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
                <Button onClick={() => setIsAddJobDialogOpen(true)}>
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
                            <Button size="sm" variant="outline" onClick={() => {
                              toast({
                                title: "Job Details",
                                description: `Viewing details for ${job.title}`,
                              })
                            }}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              toast({
                                title: "Edit Job",
                                description: `Editing ${job.title}`,
                              })
                            }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              const jobData = `Job Title: ${job.title}\nDepartment: ${job.department}\nType: ${job.type}\nSalary: ${job.salary}\nRequirements: ${job.requirements.join(', ')}\nApplicants: ${job.applicants}`
                              const blob = new Blob([jobData], { type: 'text/plain' })
                              const url = URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = `${job.title.replace(/\s+/g, '_')}_Job_Posting.txt`
                              document.body.appendChild(a)
                              a.click()
                              document.body.removeChild(a)
                              URL.revokeObjectURL(url)
                              toast({
                                title: "Job Posting Downloaded",
                                description: `${job.title} job posting has been downloaded`,
                              })
                            }}>
                              <Download className="w-4 h-4" />
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
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>This Month</span>
                    <span>127</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Interview Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">23%</div>
                <p className="text-xs text-muted-foreground">+5% from last month</p>
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Target: 25%</span>
                    <span>23%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Hire Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">18%</div>
                <p className="text-xs text-muted-foreground">+2% from last month</p>
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Target: 20%</span>
                    <span>18%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-600 h-2 rounded-full" style={{ width: '90%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Additional Analytics */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Source Effectiveness</CardTitle>
                <CardDescription>Where our best candidates come from</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { source: 'LinkedIn', percentage: 45, candidates: 57 },
                    { source: 'Company Website', percentage: 28, candidates: 36 },
                    { source: 'Referrals', percentage: 15, candidates: 19 },
                    { source: 'Job Boards', percentage: 12, candidates: 15 }
                  ].map((item) => (
                    <div key={item.source} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.source}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground w-12">{item.candidates}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Time to Hire</CardTitle>
                <CardDescription>Average days from application to hire</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { position: 'Software Engineer', days: 18, trend: 'down' },
                    { position: 'Product Manager', days: 25, trend: 'up' },
                    { position: 'Designer', days: 22, trend: 'stable' },
                    { position: 'Sales Rep', days: 15, trend: 'down' }
                  ].map((item) => (
                    <div key={item.position} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.position}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{item.days} days</span>
                        <div className={`w-2 h-2 rounded-full ${
                          item.trend === 'down' ? 'bg-green-500' : 
                          item.trend === 'up' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}></div>
                      </div>
                    </div>
                  ))}
                </div>
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
            <DialogDescription>Schedule an interview with the selected candidate</DialogDescription>
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

      {/* Add Candidate Dialog */}
      <Dialog open={isAddCandidateDialogOpen} onOpenChange={setIsAddCandidateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Candidate</DialogTitle>
            <DialogDescription>Add a new candidate to the recruitment system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="candidate-name">Full Name</Label>
              <Input id="candidate-name" placeholder="Enter candidate name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="candidate-email">Email</Label>
              <Input id="candidate-email" type="email" placeholder="Enter email address" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="candidate-phone">Phone</Label>
              <Input id="candidate-phone" placeholder="Enter phone number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="candidate-position">Position</Label>
              <Input id="candidate-position" placeholder="Enter position applied for" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="candidate-skills">Skills</Label>
              <Input id="candidate-skills" placeholder="Enter skills (comma separated)" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="candidate-experience">Experience</Label>
              <Input id="candidate-experience" placeholder="Enter years of experience" />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddCandidateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast({
                  title: "Candidate Added",
                  description: "New candidate has been added successfully",
                })
                setIsAddCandidateDialogOpen(false)
              }}>
                Add Candidate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Candidate Dialog */}
      <Dialog open={isViewCandidateDialogOpen} onOpenChange={setIsViewCandidateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Candidate Details</DialogTitle>
            <DialogDescription>View complete candidate profile</DialogDescription>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={selectedCandidate.avatar} />
                  <AvatarFallback>{selectedCandidate.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedCandidate.name}</h3>
                  <p className="text-muted-foreground">{selectedCandidate.position}</p>
                  <Badge className={getStatusColor(selectedCandidate.status)}>{selectedCandidate.status}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="font-medium">Email</Label>
                  <p>{selectedCandidate.email}</p>
                </div>
                <div>
                  <Label className="font-medium">Phone</Label>
                  <p>{selectedCandidate.phone}</p>
                </div>
                <div>
                  <Label className="font-medium">Experience</Label>
                  <p>{selectedCandidate.experience}</p>
                </div>
                <div>
                  <Label className="font-medium">AI Score</Label>
                  <p className={getScoreColor(selectedCandidate.aiScore)}>{selectedCandidate.aiScore}%</p>
                </div>
              </div>
              <div>
                <Label className="font-medium">Skills</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedCandidate.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </div>
              {selectedCandidate.notes && (
                <div>
                  <Label className="font-medium">Notes</Label>
                  <p className="text-sm mt-1">{selectedCandidate.notes}</p>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={() => setIsViewCandidateDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Candidate Dialog */}
      <Dialog open={isEditCandidateDialogOpen} onOpenChange={setIsEditCandidateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Candidate</DialogTitle>
            <DialogDescription>Update candidate information</DialogDescription>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input id="edit-name" defaultValue={selectedCandidate.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" type="email" defaultValue={selectedCandidate.email} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input id="edit-phone" defaultValue={selectedCandidate.phone} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-position">Position</Label>
                <Input id="edit-position" defaultValue={selectedCandidate.position} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select defaultValue={selectedCandidate.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Applied">Applied</SelectItem>
                    <SelectItem value="Shortlisted">Shortlisted</SelectItem>
                    <SelectItem value="Interview Scheduled">Interview Scheduled</SelectItem>
                    <SelectItem value="Interview Completed">Interview Completed</SelectItem>
                    <SelectItem value="Offered">Offered</SelectItem>
                    <SelectItem value="Hired">Hired</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea id="edit-notes" defaultValue={selectedCandidate.notes} />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditCandidateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  toast({
                    title: "Candidate Updated",
                    description: `${selectedCandidate.name} has been updated successfully`,
                  })
                  setIsEditCandidateDialogOpen(false)
                }}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Message Candidate Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
            <DialogDescription>Send a message to the candidate</DialogDescription>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-4">
              <div>
                <Label>To</Label>
                <p className="font-medium">{selectedCandidate.name} ({selectedCandidate.email})</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message-subject">Subject</Label>
                <Input id="message-subject" placeholder="Enter message subject" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message-body">Message</Label>
                <Textarea id="message-body" placeholder="Enter your message..." rows={5} />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  toast({
                    title: "Message Sent",
                    description: `Message sent to ${selectedCandidate.name}`,
                  })
                  setIsMessageDialogOpen(false)
                }}>
                  Send Message
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Job Dialog */}
      <Dialog open={isAddJobDialogOpen} onOpenChange={setIsAddJobDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Post New Job</DialogTitle>
            <DialogDescription>Create a new job posting</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="job-title">Job Title</Label>
              <Input id="job-title" placeholder="Enter job title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-department">Department</Label>
              <Input id="job-department" placeholder="Enter department" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-type">Job Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-salary">Salary Range</Label>
              <Input id="job-salary" placeholder="Enter salary range" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-requirements">Requirements</Label>
              <Textarea id="job-requirements" placeholder="Enter job requirements..." />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddJobDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast({
                  title: "Job Posted",
                  description: "New job has been posted successfully",
                })
                setIsAddJobDialogOpen(false)
              }}>
                Post Job
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}