import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Brain, Search, Plus, Filter, Star, Clock, Mail, Phone, Calendar,
  Edit, Eye, UserCheck, MessageSquare, Download, Trash2, Loader2,
  Paperclip, X, FileText, ThumbsUp, ThumbsDown, UserCircle,
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { formatDate } from '@/lib/date'

type CandidateStatus =
  | 'Applied' | 'Shortlisted' | 'Interview Scheduled' | 'Interview Completed'
  | 'Offered' | 'Hired' | 'Rejected'

interface Attachment { path: string; name: string; type?: string; size?: number }

interface Candidate {
  id: string
  name: string
  email: string | null
  phone: string | null
  position: string | null
  ai_score: number
  status: CandidateStatus
  skills: string[]
  experience: string | null
  notes: string | null
  applied_date: string
  job_posting_id: string | null
  source: string | null
  assigned_to: string | null
  review_decision: string | null
  review_note: string | null
  reviewed_at: string | null
  attachments: Attachment[]
}

interface JobPosting {
  id: string
  title: string
  department: string | null
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | string
  status: 'Active' | 'Paused' | 'Closed' | string
  salary: string | null
  requirements: string[]
  description: string | null
  created_at: string
  applicants?: number
}

interface ProfileLite { id: string; name: string; position: string | null }

interface RecruitmentEnhancedProps {
  onCandidateAction?: (action: string, candidateId: string) => void
  onJobAction?: (action: string, jobId: string) => void
}

const emptyCandidate = {
  name: '', email: '', phone: '', position: '',
  ai_score: 0, status: 'Applied' as CandidateStatus,
  skills: '', experience: '', notes: '', job_posting_id: '' as string,
  assigned_to: '' as string,
}

const emptyJob = {
  title: '', department: '', type: 'Full-time',
  status: 'Active', salary: '', requirements: '', description: '',
}

export function RecruitmentEnhanced({ onCandidateAction, onJobAction }: RecruitmentEnhancedProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null)

  const [isInterviewDialogOpen, setIsInterviewDialogOpen] = useState(false)
  const [isAddCandidateDialogOpen, setIsAddCandidateDialogOpen] = useState(false)
  const [isViewCandidateDialogOpen, setIsViewCandidateDialogOpen] = useState(false)
  const [isEditCandidateDialogOpen, setIsEditCandidateDialogOpen] = useState(false)
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)
  const [isAddJobDialogOpen, setIsAddJobDialogOpen] = useState(false)
  const [isViewJobDialogOpen, setIsViewJobDialogOpen] = useState(false)
  const [isEditJobDialogOpen, setIsEditJobDialogOpen] = useState(false)

  const [interviewForm, setInterviewForm] = useState({ date: '', time: '', interviewer: '', notes: '' })
  const [addForm, setAddForm] = useState({ ...emptyCandidate })
  const [editForm, setEditForm] = useState({ ...emptyCandidate })
  const [messageForm, setMessageForm] = useState({ subject: '', body: '' })
  const [addJobForm, setAddJobForm] = useState({ ...emptyJob })
  const [editJobForm, setEditJobForm] = useState({ ...emptyJob })
  const [profiles, setProfiles] = useState<ProfileLite[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAdminHR, setIsAdminHR] = useState(false)
  const [addFiles, setAddFiles] = useState<File[]>([])
  const [editFiles, setEditFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id ?? null)
    let adminHR = false
    if (user) {
      const { data: roleRows } = await supabase.from('user_roles').select('role').eq('user_id', user.id)
      adminHR = (roleRows || []).some((r: any) => r.role === 'admin' || r.role === 'hr')
    }
    setIsAdminHR(adminHR)
    const [{ data: cands, error: cErr }, { data: jobs, error: jErr }, { data: profs }] = await Promise.all([
      supabase.from('candidates').select('*').order('created_at', { ascending: false }),
      supabase.from('job_postings').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, name, position').order('name'),
    ])
    if (cErr) toast({ title: 'Failed to load candidates', description: cErr.message, variant: 'destructive' })
    if (jErr) toast({ title: 'Failed to load job postings', description: jErr.message, variant: 'destructive' })
    setCandidates((cands as any) || [])
    setJobPostings((jobs as any) || [])
    setProfiles((profs as any) || [])
    setLoading(false)
  }


  useEffect(() => { fetchAll() }, [])

  useEffect(() => {
    const ch = supabase
      .channel('recruitment-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_postings' }, fetchAll)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applicantsByJob = useMemo(() => {
    const map: Record<string, number> = {}
    candidates.forEach(c => { if (c.job_posting_id) map[c.job_posting_id] = (map[c.job_posting_id] || 0) + 1 })
    return map
  }, [candidates])

  const getScoreColor = (s: number) => s >= 90 ? 'text-green-600' : s >= 70 ? 'text-yellow-600' : 'text-red-600'
  const getStatusColor = (s: CandidateStatus) => {
    switch (s) {
      case 'Applied': return 'bg-blue-100 text-blue-800'
      case 'Shortlisted': return 'bg-green-100 text-green-800'
      case 'Interview Scheduled': return 'bg-purple-100 text-purple-800'
      case 'Interview Completed': return 'bg-yellow-100 text-yellow-800'
      case 'Offered': return 'bg-orange-100 text-orange-800'
      case 'Hired': return 'bg-emerald-100 text-emerald-800'
      case 'Rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const updateCandidateStatus = async (id: string, status: CandidateStatus, extra: Record<string, any> = {}) => {
    const { error } = await supabase.from('candidates').update({ status, ...extra }).eq('id', id)
    if (error) { toast({ title: 'Update failed', description: error.message, variant: 'destructive' }); return false }
    setCandidates(prev => prev.map(candidate => (
      candidate.id === id ? { ...candidate, status, ...extra } : candidate
    )))
    void fetchAll()
    return true
  }

  const uploadFilesForCandidate = async (candidateId: string, files: File[]): Promise<Attachment[]> => {
    const out: Attachment[] = []
    for (const f of files) {
      const safe = f.name.replace(/[^\w.\-]+/g, '_')
      const path = `${candidateId}/${Date.now()}_${safe}`
      const { error } = await supabase.storage.from('candidate-files').upload(path, f, { upsert: false })
      if (error) { toast({ title: 'Upload failed', description: `${f.name}: ${error.message}`, variant: 'destructive' }); continue }
      out.push({ path, name: f.name, type: f.type, size: f.size })
    }
    return out
  }

  const downloadAttachment = async (a: Attachment) => {
    const { data, error } = await supabase.storage.from('candidate-files').createSignedUrl(a.path, 300)
    if (error || !data?.signedUrl) { toast({ title: 'Download failed', description: error?.message, variant: 'destructive' }); return }
    window.open(data.signedUrl, '_blank')
  }

  const removeAttachment = async (c: Candidate, a: Attachment) => {
    if (!confirm(`Remove ${a.name}?`)) return
    await supabase.storage.from('candidate-files').remove([a.path])
    const remaining = (c.attachments || []).filter(x => x.path !== a.path)
    const { error } = await supabase.from('candidates').update({ attachments: remaining as any }).eq('id', c.id)
    if (error) { toast({ title: 'Failed', description: error.message, variant: 'destructive' }); return }
    setCandidates(prev => prev.map(x => x.id === c.id ? { ...x, attachments: remaining } : x))
    if (selectedCandidate?.id === c.id) setSelectedCandidate({ ...c, attachments: remaining })
  }

  const reviewCandidate = async (c: Candidate, decision: 'approved' | 'rejected') => {
    const note = window.prompt(`Optional note for ${decision === 'approved' ? 'approval' : 'rejection'}:`, c.review_note ?? '') ?? ''
    const { error } = await supabase.from('candidates').update({
      review_decision: decision,
      review_note: note || null,
      reviewed_at: new Date().toISOString(),
      status: decision === 'rejected' ? 'Rejected' : c.status,
    }).eq('id', c.id)
    if (error) { toast({ title: 'Review failed', description: error.message, variant: 'destructive' }); return }
    toast({ title: decision === 'approved' ? 'Approved' : 'Rejected', description: c.name })
    void fetchAll()
  }


  const handleCandidateAction = async (action: string, c: Candidate) => {
    switch (action) {
      case 'schedule_interview':
        setSelectedCandidate(c)
        setInterviewForm({ date: '', time: '', interviewer: '', notes: '' })
        setIsInterviewDialogOpen(true); break
      case 'shortlist':
        if (await updateCandidateStatus(c.id, 'Shortlisted'))
          toast({ title: 'Shortlisted', description: `${c.name} was shortlisted` })
        break
      case 'hire':
        if (await updateCandidateStatus(c.id, 'Hired'))
          toast({ title: 'Hired', description: `${c.name} was hired` })
        break
      case 'reject':
        if (await updateCandidateStatus(c.id, 'Rejected'))
          toast({ title: 'Rejected', description: `${c.name} was rejected`, variant: 'destructive' })
        break
      case 'delete': {
        if (!confirm(`Delete candidate ${c.name}?`)) return
        const { error } = await supabase.from('candidates').delete().eq('id', c.id)
        if (error) toast({ title: 'Delete failed', description: error.message, variant: 'destructive' })
        else {
          setCandidates(prev => prev.filter(candidate => candidate.id !== c.id))
          toast({ title: 'Deleted', description: `${c.name} removed` })
          void fetchAll()
        }
        break
      }
      case 'download_resume': {
        const content = `Resume for ${c.name}\n\nPosition: ${c.position ?? ''}\nExperience: ${c.experience ?? ''}\nSkills: ${c.skills.join(', ')}\nEmail: ${c.email ?? ''}\nPhone: ${c.phone ?? ''}\nNotes: ${c.notes ?? ''}`
        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `${c.name.replace(/\s+/g, '_')}_Resume.txt`
        document.body.appendChild(a); a.click(); document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast({ title: 'Resume downloaded' })
        break
      }
      case 'send_email': {
        if (c.email) window.location.href = `mailto:${c.email}`
        else toast({ title: 'No email', description: 'Candidate has no email', variant: 'destructive' })
        break
      }
    }
    onCandidateAction?.(action, c.id)
  }

  const submitInterview = async () => {
    if (!selectedCandidate) return
    if (!interviewForm.date) { toast({ title: 'Pick a date', variant: 'destructive' }); return }
    const dt = interviewForm.time
      ? new Date(`${interviewForm.date}T${interviewForm.time}`)
      : new Date(`${interviewForm.date}T00:00`)
    if (isNaN(dt.getTime())) { toast({ title: 'Invalid date', variant: 'destructive' }); return }
    const when = interviewForm.time ? dt.toLocaleString() : dt.toLocaleDateString()
    const note = `Interview scheduled for ${when}${interviewForm.interviewer ? ` with ${interviewForm.interviewer}` : ''}${interviewForm.notes ? ` — ${interviewForm.notes}` : ''}`
    const combinedNotes = [selectedCandidate.notes, note].filter(Boolean).join('\n')
    if (await updateCandidateStatus(selectedCandidate.id, 'Interview Scheduled', { notes: combinedNotes })) {
      toast({ title: 'Interview scheduled', description: `for ${selectedCandidate.name}` })
      setIsInterviewDialogOpen(false)
    }
  }

  const submitAdd = async () => {
    if (!addForm.name.trim()) { toast({ title: 'Name required', variant: 'destructive' }); return }
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      name: addForm.name.trim(),
      email: addForm.email.trim() || null,
      phone: addForm.phone.trim() || null,
      position: addForm.position.trim() || null,
      ai_score: Number(addForm.ai_score) || 0,
      status: addForm.status,
      skills: addForm.skills.split(',').map(s => s.trim()).filter(Boolean),
      experience: addForm.experience.trim() || null,
      notes: addForm.notes.trim() || null,
      job_posting_id: addForm.job_posting_id || null,
      assigned_to: addForm.assigned_to || null,
      created_by: user?.id ?? null,
    }
    const { data: inserted, error } = await supabase.from('candidates').insert(payload).select('id').single()
    if (error || !inserted) { setUploading(false); toast({ title: 'Failed', description: error?.message, variant: 'destructive' }); return }
    if (addFiles.length) {
      const uploaded = await uploadFilesForCandidate(inserted.id, addFiles)
      if (uploaded.length) {
        await supabase.from('candidates').update({ attachments: uploaded as any }).eq('id', inserted.id)
      }
    }
    setUploading(false)
    toast({ title: 'Candidate added' })
    setAddForm({ ...emptyCandidate })
    setAddFiles([])
    setIsAddCandidateDialogOpen(false)
    await fetchAll()
  }

  const submitEdit = async () => {
    if (!selectedCandidate) return
    setUploading(true)
    const payload: any = {
      name: editForm.name.trim(),
      email: editForm.email.trim() || null,
      phone: editForm.phone.trim() || null,
      position: editForm.position.trim() || null,
      ai_score: Number(editForm.ai_score) || 0,
      status: editForm.status,
      skills: typeof editForm.skills === 'string'
        ? editForm.skills.split(',').map(s => s.trim()).filter(Boolean)
        : editForm.skills,
      experience: editForm.experience.trim() || null,
      notes: editForm.notes.trim() || null,
      job_posting_id: editForm.job_posting_id || null,
      assigned_to: editForm.assigned_to || null,
    }
    if (editFiles.length) {
      const uploaded = await uploadFilesForCandidate(selectedCandidate.id, editFiles)
      payload.attachments = [...(selectedCandidate.attachments || []), ...uploaded]
    }
    const { error } = await supabase.from('candidates').update(payload).eq('id', selectedCandidate.id)
    if (error) { setUploading(false); toast({ title: 'Update failed', description: error.message, variant: 'destructive' }); return }
    setCandidates(prev => prev.map(candidate => (
      candidate.id === selectedCandidate.id ? { ...candidate, ...payload } as Candidate : candidate
    )))
    setUploading(false)
    setEditFiles([])
    toast({ title: 'Candidate updated' })
    setIsEditCandidateDialogOpen(false)
    void fetchAll()
  }

  const submitMessage = () => {
    if (!selectedCandidate?.email) { toast({ title: 'No email on file', variant: 'destructive' }); return }
    const url = `mailto:${selectedCandidate.email}?subject=${encodeURIComponent(messageForm.subject)}&body=${encodeURIComponent(messageForm.body)}`
    window.location.href = url
    setIsMessageDialogOpen(false)
    setMessageForm({ subject: '', body: '' })
  }

  const submitAddJob = async () => {
    if (!addJobForm.title.trim()) { toast({ title: 'Title required', variant: 'destructive' }); return }
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      title: addJobForm.title.trim(),
      department: addJobForm.department.trim() || null,
      type: addJobForm.type,
      status: addJobForm.status,
      salary: addJobForm.salary.trim() || null,
      requirements: addJobForm.requirements.split(',').map(s => s.trim()).filter(Boolean),
      description: addJobForm.description.trim() || null,
      posted_by: user?.id ?? null,
    }
    const { error } = await supabase.from('job_postings').insert(payload)
    if (error) { toast({ title: 'Failed', description: error.message, variant: 'destructive' }); return }
    toast({ title: 'Job posted' })
    setAddJobForm({ ...emptyJob })
    setIsAddJobDialogOpen(false)
    await fetchAll()
  }

  const submitEditJob = async () => {
    if (!selectedJob) return
    const payload = {
      title: editJobForm.title.trim(),
      department: editJobForm.department.trim() || null,
      type: editJobForm.type,
      status: editJobForm.status,
      salary: editJobForm.salary.trim() || null,
      requirements: typeof editJobForm.requirements === 'string'
        ? editJobForm.requirements.split(',').map(s => s.trim()).filter(Boolean)
        : editJobForm.requirements,
      description: editJobForm.description.trim() || null,
    }
    const { error } = await supabase.from('job_postings').update(payload).eq('id', selectedJob.id)
    if (error) { toast({ title: 'Update failed', description: error.message, variant: 'destructive' }); return }
    setJobPostings(prev => prev.map(job => (
      job.id === selectedJob.id ? { ...job, ...payload } as JobPosting : job
    )))
    toast({ title: 'Job updated' })
    setIsEditJobDialogOpen(false)
    void fetchAll()
  }

  const deleteJob = async (j: JobPosting) => {
    if (!confirm(`Delete job "${j.title}"?`)) return
    const { error } = await supabase.from('job_postings').delete().eq('id', j.id)
    if (error) toast({ title: 'Delete failed', description: error.message, variant: 'destructive' })
    else {
      setJobPostings(prev => prev.filter(job => job.id !== j.id))
      toast({ title: 'Job deleted' })
      void fetchAll()
    }
    onJobAction?.('delete', j.id)
  }

  const downloadJob = (j: JobPosting) => {
    const content = `Job Title: ${j.title}\nDepartment: ${j.department ?? ''}\nType: ${j.type}\nStatus: ${j.status}\nSalary: ${j.salary ?? ''}\nRequirements: ${j.requirements.join(', ')}\nDescription: ${j.description ?? ''}\nApplicants: ${applicantsByJob[j.id] || 0}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${j.title.replace(/\s+/g, '_')}_Job_Posting.txt`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast({ title: 'Job posting downloaded' })
  }

  const filteredCandidates = candidates.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false
    if (searchTerm && !`${c.name} ${c.position ?? ''} ${c.email ?? ''}`.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  // Analytics from real data
  const totalApps = candidates.length
  const interviewCount = candidates.filter(c => c.status === 'Interview Scheduled' || c.status === 'Interview Completed').length
  const hiredCount = candidates.filter(c => c.status === 'Hired').length
  const interviewRate = totalApps ? Math.round((interviewCount / totalApps) * 100) : 0
  const hireRate = totalApps ? Math.round((hiredCount / totalApps) * 100) : 0

  const sourceStats = useMemo(() => {
    const groups: Record<string, number> = {}
    candidates.forEach(c => { const k = (c.source || 'Direct'); groups[k] = (groups[k] || 0) + 1 })
    const items = Object.entries(groups).map(([source, count]) => ({ source, count }))
    items.sort((a, b) => b.count - a.count)
    const total = candidates.length || 1
    return items.map(i => ({ ...i, percentage: Math.round((i.count / total) * 100) }))
  }, [candidates])

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
                Candidate Management
              </CardTitle>
              <CardDescription>Track applicants through the hiring pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6 flex-wrap">
                <div className="flex-1 min-w-[220px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search candidates..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[220px]">
                    <Filter className="h-4 w-4 mr-2" /><SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {['Applied','Shortlisted','Interview Scheduled','Interview Completed','Offered','Hired','Rejected'].map(s =>
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Button variant="gradient" onClick={() => { setAddForm({ ...emptyCandidate }); setAddFiles([]); setIsAddCandidateDialogOpen(true) }}>
                  <Plus className="h-4 w-4 mr-2" />Add Candidate
                </Button>
              </div>

              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : filteredCandidates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No candidates yet. Click "Add Candidate" to get started.
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredCandidates.map(c => (
                    <Card key={c.id} className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex items-start space-x-4 flex-1 min-w-[280px]">
                            <Avatar variant="gradient" size="xl">
                              <AvatarFallback>{c.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-3 flex-1">
                              <div>
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                  <h3 className="font-semibold text-lg">{c.name}</h3>
                                  <Badge className={getStatusColor(c.status)}>{c.status}</Badge>
                                  {c.ai_score > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Star className="h-4 w-4 text-yellow-500" />
                                      <span className={`font-bold ${getScoreColor(c.ai_score)}`}>{c.ai_score}% Match</span>
                                    </div>
                                  )}
                                </div>
                                {c.position && <p className="text-muted-foreground font-medium">{c.position}</p>}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                {c.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span className="truncate">{c.email}</span></div>}
                                {c.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>{c.phone}</span></div>}
                                {c.experience && <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><span>{c.experience}</span></div>}
                                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span>Applied {formatDate(c.applied_date)}</span></div>
                              </div>
                              {c.skills.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {c.skills.map((s,i) => <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>)}
                                </div>
                              )}
                              {(c.assigned_to || c.review_decision) && (
                                <div className="flex items-center gap-2 flex-wrap text-xs">
                                  {c.assigned_to && (
                                    <Badge variant="outline" className="gap-1">
                                      <UserCircle className="w-3 h-3" />
                                      Assigned to {profiles.find(p => p.id === c.assigned_to)?.name ?? 'reviewer'}
                                    </Badge>
                                  )}
                                  {c.review_decision === 'approved' && <Badge className="bg-emerald-100 text-emerald-800">Reviewer approved</Badge>}
                                  {c.review_decision === 'rejected' && <Badge className="bg-red-100 text-red-800">Reviewer rejected</Badge>}
                                </div>
                              )}
                              {c.attachments?.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {c.attachments.map((a, i) => (
                                    <Button key={i} size="sm" variant="outline" className="h-7 text-xs" onClick={() => downloadAttachment(a)}>
                                      <FileText className="w-3 h-3 mr-1" />{a.name}
                                    </Button>
                                  ))}
                                </div>
                              )}
                              {c.notes && <div className="bg-muted/50 p-3 rounded-lg"><p className="text-sm whitespace-pre-wrap">{c.notes}</p></div>}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 min-w-[180px]">
                            {c.assigned_to === currentUserId && !isAdminHR && (
                              <div className="grid grid-cols-2 gap-2">
                                <Button size="sm" variant="glow" onClick={() => reviewCandidate(c, 'approved')} disabled={c.review_decision==='approved'}>
                                  <ThumbsUp className="w-4 h-4 mr-1" />Approve
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => reviewCandidate(c, 'rejected')} disabled={c.review_decision==='rejected'}>
                                  <ThumbsDown className="w-4 h-4 mr-1" />Reject
                                </Button>
                              </div>
                            )}
                            {isAdminHR && <>
                            <Button size="sm" variant="shimmer" onClick={() => handleCandidateAction('schedule_interview', c)}>
                              <Calendar className="w-4 h-4 mr-1" />Schedule Interview
                            </Button>
                            <div className="grid grid-cols-2 gap-2">
                              <Button size="sm" variant="soft" onClick={() => handleCandidateAction('shortlist', c)} disabled={c.status==='Shortlisted'||c.status==='Hired'}>
                                <UserCheck className="w-4 h-4 mr-1" />Shortlist
                              </Button>
                              <Button size="sm" variant="glow" onClick={() => handleCandidateAction('hire', c)} disabled={c.status==='Hired'}>
                                Hire
                              </Button>
                            </div>
                            </>}
                            <div className="flex gap-1 flex-wrap">
                              <Button size="sm" variant="outline" onClick={() => { setSelectedCandidate(c); setIsViewCandidateDialogOpen(true) }} title="View"><Eye className="w-4 h-4" /></Button>
                              {isAdminHR && <>
                              <Button size="sm" variant="outline" onClick={() => { setSelectedCandidate(c); setMessageForm({ subject:'', body:'' }); setIsMessageDialogOpen(true) }} title="Message"><MessageSquare className="w-4 h-4" /></Button>
                              <Button size="sm" variant="outline" onClick={() => {
                                setSelectedCandidate(c)
                                setEditForm({
                                  name: c.name, email: c.email ?? '', phone: c.phone ?? '',
                                  position: c.position ?? '', ai_score: c.ai_score, status: c.status,
                                  skills: c.skills.join(', ') as any, experience: c.experience ?? '',
                                  notes: c.notes ?? '', job_posting_id: c.job_posting_id ?? '',
                                  assigned_to: c.assigned_to ?? '',
                                })
                                setEditFiles([])
                                setIsEditCandidateDialogOpen(true)
                              }} title="Edit"><Edit className="w-4 h-4" /></Button>
                              <Button size="sm" variant="outline" onClick={() => handleCandidateAction('download_resume', c)} title="Download resume"><Download className="w-4 h-4" /></Button>
                              
                              <Button size="sm" variant="outline" onClick={() => handleCandidateAction('reject', c)} disabled={c.status==='Rejected'} title="Reject">Reject</Button>
                              <Button size="sm" variant="outline" onClick={() => handleCandidateAction('delete', c)} title="Delete"><Trash2 className="w-4 h-4" /></Button>
                              </>}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle>Job Postings Management</CardTitle>
                  <CardDescription>Create and manage job openings</CardDescription>
                </div>
                <Button variant="gradient" onClick={() => { setAddJobForm({ ...emptyJob }); setIsAddJobDialogOpen(true) }}>
                  <Plus className="h-4 w-4 mr-2" />Post New Job
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : jobPostings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No job postings yet.</div>
              ) : (
                <div className="grid gap-4">
                  {jobPostings.map(job => (
                    <Card key={job.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="space-y-2 flex-1 min-w-[260px]">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-semibold text-lg">{job.title}</h3>
                              <Badge variant={job.status === 'Active' ? 'default' : 'secondary'}>{job.status}</Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                              {job.department && <><span>{job.department}</span><span>•</span></>}
                              <span>{job.type}</span>
                              {job.salary && <><span>•</span><span>{job.salary}</span></>}
                              <span>•</span><span>Posted {formatDate(job.created_at)}</span>
                            </div>
                            {job.requirements.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {job.requirements.map((r,i) => <Badge key={i} variant="outline" className="text-xs">{r}</Badge>)}
                              </div>
                            )}
                          </div>
                          <div className="text-right space-y-2">
                            <div className="text-2xl font-bold text-primary">{applicantsByJob[job.id] || 0}</div>
                            <p className="text-sm text-muted-foreground">Applicants</p>
                            <div className="flex gap-2 justify-end">
                              <Button size="sm" variant="outline" onClick={() => { setSelectedJob(job); setIsViewJobDialogOpen(true) }}><Eye className="w-4 h-4" /></Button>
                              <Button size="sm" variant="outline" onClick={() => {
                                setSelectedJob(job)
                                setEditJobForm({
                                  title: job.title, department: job.department ?? '', type: job.type,
                                  status: job.status, salary: job.salary ?? '',
                                  requirements: job.requirements.join(', ') as any, description: job.description ?? '',
                                })
                                setIsEditJobDialogOpen(true)
                              }}><Edit className="w-4 h-4" /></Button>
                              <Button size="sm" variant="outline" onClick={() => downloadJob(job)}><Download className="w-4 h-4" /></Button>
                              <Button size="sm" variant="outline" onClick={() => deleteJob(job)}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-4">
            {(['Applied','Shortlisted','Interview Scheduled','Hired'] as CandidateStatus[]).map(stage => (
              <Card key={stage}>
                <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">{stage}</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{candidates.filter(c => c.status === stage).length}</div>
                  <div className="space-y-2">
                    {candidates.filter(c => c.status === stage).slice(0,5).map(c => (
                      <div key={c.id} className="text-sm p-2 bg-muted/50 rounded">
                        <p className="font-medium">{c.name}</p>
                        <p className="text-muted-foreground text-xs">{c.position}</p>
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
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Applications</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{totalApps}</div><p className="text-xs text-muted-foreground">All time</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Interview Rate</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{interviewRate}%</div><p className="text-xs text-muted-foreground">{interviewCount} interviewed</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Hire Rate</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{hireRate}%</div><p className="text-xs text-muted-foreground">{hiredCount} hired</p></CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Source Breakdown</CardTitle><CardDescription>Where candidates come from</CardDescription></CardHeader>
            <CardContent>
              {sourceStats.length === 0 ? (
                <p className="text-sm text-muted-foreground">No candidates yet.</p>
              ) : (
                <div className="space-y-4">
                  {sourceStats.map(i => (
                    <div key={i.source} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{i.source}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: `${i.percentage}%` }} />
                        </div>
                        <span className="text-sm text-muted-foreground w-16 text-right">{i.count} ({i.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Interview Dialog */}
      <Dialog open={isInterviewDialogOpen} onOpenChange={setIsInterviewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Schedule Interview</DialogTitle><DialogDescription>{selectedCandidate?.name}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={interviewForm.date} onChange={e => setInterviewForm(v => ({ ...v, date: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Time (optional)</Label><Input type="time" value={interviewForm.time} onChange={e => setInterviewForm(v => ({ ...v, time: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>Interviewer</Label><Input placeholder="Name of interviewer" value={interviewForm.interviewer} onChange={e => setInterviewForm(v => ({ ...v, interviewer: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea placeholder="Interview notes..." value={interviewForm.notes} onChange={e => setInterviewForm(v => ({ ...v, notes: e.target.value }))} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsInterviewDialogOpen(false)}>Cancel</Button>
              <Button onClick={submitInterview}>Schedule</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Candidate */}
      <Dialog open={isAddCandidateDialogOpen} onOpenChange={setIsAddCandidateDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Candidate</DialogTitle><DialogDescription>Create a new candidate</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Full Name *</Label><Input value={addForm.name} onChange={e => setAddForm(v => ({ ...v, name: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={addForm.email} onChange={e => setAddForm(v => ({ ...v, email: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={addForm.phone} onChange={e => setAddForm(v => ({ ...v, phone: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Position</Label><Input value={addForm.position} onChange={e => setAddForm(v => ({ ...v, position: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Job Posting</Label>
              <Select value={addForm.job_posting_id || 'none'} onValueChange={val => setAddForm(v => ({ ...v, job_posting_id: val === 'none' ? '' : val }))}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {jobPostings.map(j => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Skills (comma separated)</Label><Input value={addForm.skills} onChange={e => setAddForm(v => ({ ...v, skills: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Experience</Label><Input placeholder="e.g. 5 years" value={addForm.experience} onChange={e => setAddForm(v => ({ ...v, experience: e.target.value }))} /></div>
            <div className="space-y-2"><Label>AI Match Score (0-100)</Label><Input type="number" min={0} max={100} value={addForm.ai_score} onChange={e => setAddForm(v => ({ ...v, ai_score: Number(e.target.value) }))} /></div>
            <div className="space-y-2"><Label>Status</Label>
              <Select value={addForm.status} onValueChange={val => setAddForm(v => ({ ...v, status: val as CandidateStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Applied','Shortlisted','Interview Scheduled','Interview Completed','Offered','Hired','Rejected'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Assign to (reviewer)</Label>
              <Select value={addForm.assigned_to || 'none'} onValueChange={val => setAddForm(v => ({ ...v, assigned_to: val === 'none' ? '' : val }))}>
                <SelectTrigger><SelectValue placeholder="Pick a person" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}{p.position ? ` — ${p.position}` : ''}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">The assigned person will be able to view and approve/reject this candidate.</p>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={addForm.notes} onChange={e => setAddForm(v => ({ ...v, notes: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>Attachments (CV & documents)</Label>
              <Input type="file" multiple onChange={e => setAddFiles(Array.from(e.target.files || []))} />
              {addFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {addFiles.map((f, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      <Paperclip className="w-3 h-3" />{f.name}
                      <button onClick={() => setAddFiles(prev => prev.filter((_, j) => j !== i))} className="ml-1"><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddCandidateDialogOpen(false)} disabled={uploading}>Cancel</Button>
              <Button onClick={submitAdd} disabled={uploading}>{uploading ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Saving</> : 'Add'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Candidate */}
      <Dialog open={isViewCandidateDialogOpen} onOpenChange={setIsViewCandidateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Candidate Details</DialogTitle><DialogDescription>Complete profile</DialogDescription></DialogHeader>
          {selectedCandidate && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar variant="gradient" size="xl"><AvatarFallback>{selectedCandidate.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}</AvatarFallback></Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedCandidate.name}</h3>
                  {selectedCandidate.position && <p className="text-muted-foreground">{selectedCandidate.position}</p>}
                  <Badge className={getStatusColor(selectedCandidate.status)}>{selectedCandidate.status}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><Label className="font-medium">Email</Label><p className="break-all">{selectedCandidate.email ?? '—'}</p></div>
                <div><Label className="font-medium">Phone</Label><p>{selectedCandidate.phone ?? '—'}</p></div>
                <div><Label className="font-medium">Experience</Label><p>{selectedCandidate.experience ?? '—'}</p></div>
                <div><Label className="font-medium">AI Score</Label><p className={getScoreColor(selectedCandidate.ai_score)}>{selectedCandidate.ai_score}%</p></div>
                <div><Label className="font-medium">Applied</Label><p>{formatDate(selectedCandidate.applied_date)}</p></div>
              </div>
              {selectedCandidate.skills.length > 0 && (
                <div><Label className="font-medium">Skills</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedCandidate.skills.map((s,i) => <Badge key={i} variant="secondary">{s}</Badge>)}
                  </div>
                </div>
              )}
              {selectedCandidate.notes && (<div><Label className="font-medium">Notes</Label><p className="text-sm mt-1 whitespace-pre-wrap">{selectedCandidate.notes}</p></div>)}
              {selectedCandidate.assigned_to && (
                <div><Label className="font-medium">Assigned reviewer</Label>
                  <p className="text-sm mt-1">{profiles.find(p => p.id === selectedCandidate.assigned_to)?.name ?? '—'}</p>
                </div>
              )}
              {selectedCandidate.review_decision && (
                <div><Label className="font-medium">Review</Label>
                  <p className="text-sm mt-1">{selectedCandidate.review_decision === 'approved' ? '✅ Approved' : '❌ Rejected'}{selectedCandidate.review_note ? ` — ${selectedCandidate.review_note}` : ''}</p>
                </div>
              )}
              {selectedCandidate.attachments?.length > 0 && (
                <div><Label className="font-medium">Attachments</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedCandidate.attachments.map((a, i) => (
                      <Button key={i} size="sm" variant="outline" onClick={() => downloadAttachment(a)}>
                        <FileText className="w-4 h-4 mr-1" />{a.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end"><Button onClick={() => setIsViewCandidateDialogOpen(false)}>Close</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Candidate */}
      <Dialog open={isEditCandidateDialogOpen} onOpenChange={setIsEditCandidateDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Candidate</DialogTitle><DialogDescription>Update information</DialogDescription></DialogHeader>
          {selectedCandidate && (
            <div className="space-y-3">
              <div className="space-y-2"><Label>Full Name</Label><Input value={editForm.name} onChange={e => setEditForm(v => ({ ...v, name: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={editForm.email} onChange={e => setEditForm(v => ({ ...v, email: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={editForm.phone} onChange={e => setEditForm(v => ({ ...v, phone: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Position</Label><Input value={editForm.position} onChange={e => setEditForm(v => ({ ...v, position: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Skills (comma separated)</Label><Input value={editForm.skills as any} onChange={e => setEditForm(v => ({ ...v, skills: e.target.value as any }))} /></div>
              <div className="space-y-2"><Label>Experience</Label><Input value={editForm.experience} onChange={e => setEditForm(v => ({ ...v, experience: e.target.value }))} /></div>
              <div className="space-y-2"><Label>AI Score</Label><Input type="number" min={0} max={100} value={editForm.ai_score} onChange={e => setEditForm(v => ({ ...v, ai_score: Number(e.target.value) }))} /></div>
              <div className="space-y-2"><Label>Status</Label>
                <Select value={editForm.status} onValueChange={val => setEditForm(v => ({ ...v, status: val as CandidateStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Applied','Shortlisted','Interview Scheduled','Interview Completed','Offered','Hired','Rejected'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Assign to (reviewer)</Label>
                <Select value={editForm.assigned_to || 'none'} onValueChange={val => setEditForm(v => ({ ...v, assigned_to: val === 'none' ? '' : val }))}>
                  <SelectTrigger><SelectValue placeholder="Pick a person" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}{p.position ? ` — ${p.position}` : ''}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Notes</Label><Textarea value={editForm.notes} onChange={e => setEditForm(v => ({ ...v, notes: e.target.value }))} /></div>
              {selectedCandidate.attachments?.length > 0 && (
                <div className="space-y-2">
                  <Label>Existing attachments</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.attachments.map((a, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        <FileText className="w-3 h-3" />{a.name}
                        <button onClick={() => removeAttachment(selectedCandidate, a)} className="ml-1"><X className="w-3 h-3" /></button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Add attachments</Label>
                <Input type="file" multiple onChange={e => setEditFiles(Array.from(e.target.files || []))} />
                {editFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {editFiles.map((f, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        <Paperclip className="w-3 h-3" />{f.name}
                        <button onClick={() => setEditFiles(prev => prev.filter((_, j) => j !== i))} className="ml-1"><X className="w-3 h-3" /></button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditCandidateDialogOpen(false)} disabled={uploading}>Cancel</Button>
                <Button onClick={submitEdit} disabled={uploading}>{uploading ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Saving</> : 'Save'}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Message Candidate */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Send Email</DialogTitle><DialogDescription>Compose an email to the candidate</DialogDescription></DialogHeader>
          {selectedCandidate && (
            <div className="space-y-4">
              <div><Label>To</Label><p className="font-medium">{selectedCandidate.name} ({selectedCandidate.email ?? 'no email'})</p></div>
              <div className="space-y-2"><Label>Subject</Label><Input value={messageForm.subject} onChange={e => setMessageForm(v => ({ ...v, subject: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Body</Label><Textarea rows={5} value={messageForm.body} onChange={e => setMessageForm(v => ({ ...v, body: e.target.value }))} /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)}>Cancel</Button>
                <Button onClick={submitMessage}>Open in Mail</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Job */}
      <Dialog open={isAddJobDialogOpen} onOpenChange={setIsAddJobDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Post New Job</DialogTitle><DialogDescription>Create a job posting</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Title *</Label><Input value={addJobForm.title} onChange={e => setAddJobForm(v => ({ ...v, title: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Department</Label><Input value={addJobForm.department} onChange={e => setAddJobForm(v => ({ ...v, department: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Type</Label>
              <Select value={addJobForm.type} onValueChange={val => setAddJobForm(v => ({ ...v, type: val }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Full-time','Part-time','Contract','Internship'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Status</Label>
              <Select value={addJobForm.status} onValueChange={val => setAddJobForm(v => ({ ...v, status: val }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Active','Paused','Closed'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Salary Range</Label><Input value={addJobForm.salary} onChange={e => setAddJobForm(v => ({ ...v, salary: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Requirements (comma separated)</Label><Textarea value={addJobForm.requirements} onChange={e => setAddJobForm(v => ({ ...v, requirements: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={addJobForm.description} onChange={e => setAddJobForm(v => ({ ...v, description: e.target.value }))} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddJobDialogOpen(false)}>Cancel</Button>
              <Button onClick={submitAddJob}>Post</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Job */}
      <Dialog open={isEditJobDialogOpen} onOpenChange={setIsEditJobDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Job</DialogTitle><DialogDescription>Update posting</DialogDescription></DialogHeader>
          {selectedJob && (
            <div className="space-y-3">
              <div className="space-y-2"><Label>Title</Label><Input value={editJobForm.title} onChange={e => setEditJobForm(v => ({ ...v, title: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Department</Label><Input value={editJobForm.department} onChange={e => setEditJobForm(v => ({ ...v, department: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Type</Label>
                <Select value={editJobForm.type} onValueChange={val => setEditJobForm(v => ({ ...v, type: val }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['Full-time','Part-time','Contract','Internship'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Status</Label>
                <Select value={editJobForm.status} onValueChange={val => setEditJobForm(v => ({ ...v, status: val }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['Active','Paused','Closed'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Salary</Label><Input value={editJobForm.salary} onChange={e => setEditJobForm(v => ({ ...v, salary: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Requirements (comma separated)</Label><Textarea value={editJobForm.requirements as any} onChange={e => setEditJobForm(v => ({ ...v, requirements: e.target.value as any }))} /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={editJobForm.description} onChange={e => setEditJobForm(v => ({ ...v, description: e.target.value }))} /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditJobDialogOpen(false)}>Cancel</Button>
                <Button onClick={submitEditJob}>Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Job */}
      <Dialog open={isViewJobDialogOpen} onOpenChange={setIsViewJobDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selectedJob?.title}</DialogTitle><DialogDescription>Job posting details</DialogDescription></DialogHeader>
          {selectedJob && (
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant={selectedJob.status === 'Active' ? 'default' : 'secondary'}>{selectedJob.status}</Badge>
                <Badge variant="outline">{selectedJob.type}</Badge>
                {selectedJob.department && <Badge variant="outline">{selectedJob.department}</Badge>}
              </div>
              {selectedJob.salary && <div><Label className="font-medium">Salary</Label><p>{selectedJob.salary}</p></div>}
              <div><Label className="font-medium">Applicants</Label><p>{applicantsByJob[selectedJob.id] || 0}</p></div>
              <div><Label className="font-medium">Posted</Label><p>{formatDate(selectedJob.created_at)}</p></div>
              {selectedJob.requirements.length > 0 && (
                <div><Label className="font-medium">Requirements</Label>
                  <div className="flex flex-wrap gap-1 mt-1">{selectedJob.requirements.map((r,i) => <Badge key={i} variant="outline">{r}</Badge>)}</div>
                </div>
              )}
              {selectedJob.description && <div><Label className="font-medium">Description</Label><p className="whitespace-pre-wrap mt-1">{selectedJob.description}</p></div>}
              <div className="flex justify-end"><Button onClick={() => setIsViewJobDialogOpen(false)}>Close</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
