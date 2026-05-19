import React, { useState, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  FileText,
  Upload,
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Paperclip,
  Send,
  Download,
  Eye,
  UserCheck,
  Inbox,
  FileUp,
  RefreshCw,
  MessageSquare,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

type ApprovalStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected'
type Priority = 'Low' | 'Normal' | 'High' | 'Urgent'

interface DocAttachment {
  id: string
  name: string
  size: string
  type: string
}

interface DocRequest {
  id: string
  title: string
  description: string
  category: string
  priority: Priority
  status: ApprovalStatus
  submittedBy: string
  receiver: string
  createdAt: string
  updatedAt: string
  attachments: DocAttachment[]
  reviewerComment?: string
}

// Leadership / approver roster
const leadership = [
  { id: 'ceo', name: 'Sarah Mitchell', role: 'CEO' },
  { id: 'coo', name: 'David Chen', role: 'COO' },
  { id: 'hr-lead', name: 'Maria Rodriguez', role: 'Head of HR' },
  { id: 'finance-lead', name: 'Robert Kim', role: 'Head of Finance' },
  { id: 'ops-lead', name: 'Jennifer Park', role: 'Operations Director' },
]

const categories = ['HR Request', 'Finance', 'Leave Request', 'Equipment', 'Policy', 'Contract', 'Other']
const priorities: Priority[] = ['Low', 'Normal', 'High', 'Urgent']

const CURRENT_USER = 'Current Employee'

const seed: DocRequest[] = [
  {
    id: 'd1',
    title: 'Annual Leave Request – March 2024',
    description: 'Requesting 5 days of annual leave from March 18 to March 22 for personal travel.',
    category: 'Leave Request',
    priority: 'Normal',
    status: 'Pending',
    submittedBy: CURRENT_USER,
    receiver: 'Maria Rodriguez',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    attachments: [{ id: 'a1', name: 'Leave_Form.pdf', size: '120 KB', type: 'pdf' }],
  },
  {
    id: 'd2',
    title: 'Equipment Purchase – New Laptop',
    description: 'Current device is 5 years old and slows down editing workflow. Quote attached.',
    category: 'Equipment',
    priority: 'High',
    status: 'Approved',
    submittedBy: CURRENT_USER,
    receiver: 'Robert Kim',
    createdAt: '2024-01-10T09:15:00Z',
    updatedAt: '2024-01-12T14:00:00Z',
    attachments: [{ id: 'a2', name: 'Quote_MacBookPro.pdf', size: '340 KB', type: 'pdf' }],
    reviewerComment: 'Approved. Please coordinate with IT for procurement.',
  },
  {
    id: 'd3',
    title: 'Expense Reimbursement – Client Dinner',
    description: 'Reimbursement request for client dinner on Jan 8.',
    category: 'Finance',
    priority: 'Normal',
    status: 'Rejected',
    submittedBy: CURRENT_USER,
    receiver: 'Robert Kim',
    createdAt: '2024-01-09T18:20:00Z',
    updatedAt: '2024-01-11T11:00:00Z',
    attachments: [{ id: 'a3', name: 'Receipt.jpg', size: '1.1 MB', type: 'jpg' }],
    reviewerComment: 'Missing itemised receipt. Please resubmit with full breakdown.',
  },
  {
    id: 'd4',
    title: 'Remote Work Policy Amendment Proposal',
    description: 'Draft proposal to extend remote work allowance to 3 days/week.',
    category: 'Policy',
    priority: 'Low',
    status: 'Draft',
    submittedBy: CURRENT_USER,
    receiver: 'Sarah Mitchell',
    createdAt: '2024-01-14T08:00:00Z',
    updatedAt: '2024-01-14T08:00:00Z',
    attachments: [],
  },
]

const emptyForm = {
  title: '',
  description: '',
  category: 'HR Request',
  priority: 'Normal' as Priority,
  receiver: leadership[0].name,
  attachments: [] as DocAttachment[],
}

export default function Documentation() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [docs, setDocs] = useState<DocRequest[]>(seed)
  const [tab, setTab] = useState<'my' | 'inbox' | 'drafts' | 'all'>('my')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | ApprovalStatus>('All')

  const [composeOpen, setComposeOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const [viewing, setViewing] = useState<DocRequest | null>(null)
  const [reviewComment, setReviewComment] = useState('')

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      const tabMatch =
        tab === 'my'
          ? d.submittedBy === CURRENT_USER && d.status !== 'Draft'
          : tab === 'inbox'
          ? leadership.some((l) => l.name === d.receiver) && d.status === 'Pending'
          : tab === 'drafts'
          ? d.status === 'Draft' && d.submittedBy === CURRENT_USER
          : true
      const statusMatch = statusFilter === 'All' || d.status === statusFilter
      const searchMatch =
        !search ||
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.description.toLowerCase().includes(search.toLowerCase()) ||
        d.receiver.toLowerCase().includes(search.toLowerCase())
      return tabMatch && statusMatch && searchMatch
    })
  }, [docs, tab, search, statusFilter])

  const counts = useMemo(
    () => ({
      my: docs.filter((d) => d.submittedBy === CURRENT_USER && d.status !== 'Draft').length,
      inbox: docs.filter((d) => d.status === 'Pending').length,
      drafts: docs.filter((d) => d.status === 'Draft' && d.submittedBy === CURRENT_USER).length,
      all: docs.length,
    }),
    [docs]
  )

  const openCompose = () => {
  const { t } = useTranslation()
    setEditingId(null)
    setForm(emptyForm)
    setComposeOpen(true)
  }

  const openEdit = (doc: DocRequest) => {
    setEditingId(doc.id)
    setForm({
      title: doc.title,
      description: doc.description,
      category: doc.category,
      priority: doc.priority,
      receiver: doc.receiver,
      attachments: [...doc.attachments],
    })
    setComposeOpen(true)
  }

  const handleFilePick = () => fileInputRef.current?.click()

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const newOnes: DocAttachment[] = Array.from(files).map((f) => ({
      id: `${Date.now()}-${f.name}`,
      name: f.name,
      size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
      type: f.name.split('.').pop() ?? 'file',
    }))
    setForm((p) => ({ ...p, attachments: [...p.attachments, ...newOnes] }))
    e.target.value = ''
  }

  const removeAttachment = (id: string) =>
    setForm((p) => ({ ...p, attachments: p.attachments.filter((a) => a.id !== id) }))

  const persist = (status: ApprovalStatus) => {
    if (!form.title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' })
      return
    }
    if (status === 'Pending' && !form.receiver) {
      toast({ title: 'Please assign a receiver', variant: 'destructive' })
      return
    }
    const now = new Date().toISOString()
    if (editingId) {
      setDocs((prev) =>
        prev.map((d) =>
          d.id === editingId
            ? { ...d, ...form, status, updatedAt: now }
            : d
        )
      )
      toast({ title: status === 'Draft' ? 'Draft saved' : 'Request updated and sent for approval' })
    } else {
      const doc: DocRequest = {
        id: Date.now().toString(),
        ...form,
        status,
        submittedBy: CURRENT_USER,
        createdAt: now,
        updatedAt: now,
      }
      setDocs((prev) => [doc, ...prev])
      toast({
        title: status === 'Draft' ? 'Draft saved' : 'Submitted for approval',
        description: status === 'Draft' ? undefined : `Sent to ${form.receiver}`,
      })
    }
    setComposeOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const deleteDoc = (id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id))
    toast({ title: 'Document deleted' })
  }

  const reassign = (doc: DocRequest, receiver: string) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, receiver, updatedAt: new Date().toISOString() } : d))
    )
    toast({ title: 'Receiver updated', description: `Reassigned to ${receiver}` })
  }

  const decide = (doc: DocRequest, status: 'Approved' | 'Rejected') => {
    setDocs((prev) =>
      prev.map((d) =>
        d.id === doc.id
          ? { ...d, status, reviewerComment: reviewComment || d.reviewerComment, updatedAt: new Date().toISOString() }
          : d
      )
    )
    toast({
      title: status === 'Approved' ? 'Document approved' : 'Document rejected',
      description: doc.title,
    })
    setReviewComment('')
    setViewing(null)
  }

  const statusBadge = (s: ApprovalStatus) => {
    const map: Record<ApprovalStatus, string> = {
      Draft: 'bg-muted text-muted-foreground',
      Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      Approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      Rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    }
    const Icon = s === 'Approved' ? CheckCircle2 : s === 'Rejected' ? XCircle : s === 'Pending' ? Clock : Edit
    return (
      <Badge className={`${map[s]} gap-1`}>
        <Icon className="h-3 w-3" />
        {s}
      </Badge>
    )
  }

  const priorityBadge = (p: Priority) => {
    const map: Record<Priority, string> = {
      Urgent: 'bg-red-100 text-red-800 border-red-200',
      High: 'bg-orange-100 text-orange-800 border-orange-200',
      Normal: 'bg-blue-100 text-blue-800 border-blue-200',
      Low: 'bg-gray-100 text-gray-800 border-gray-200',
    }
    return <Badge variant="outline" className={`text-xs ${map[p]}`}>{p}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 backdrop-blur-xl">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('pages.documentation.title')}</h1>
            <p className="text-muted-foreground">{t('pages.documentation.subtitle')}</p>
          </div>
          <Button size="lg" onClick={openCompose} className="shadow-lg">
            <Upload className="mr-2 h-4 w-4" />
            New Document Request
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'My Submissions', value: counts.my, icon: FileText },
          { label: 'Pending Review', value: counts.inbox, icon: Clock },
          { label: 'Drafts', value: counts.drafts, icon: Edit },
          {
            label: 'Approved',
            value: docs.filter((d) => d.status === 'Approved').length,
            icon: CheckCircle2,
          },
        ].map((c) => (
          <Card key={c.label} className="backdrop-blur">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className="text-2xl font-bold">{c.value}</p>
              </div>
              <c.icon className="h-8 w-8 text-primary/60" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar + Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <TabsList>
            <TabsTrigger value="my" className="gap-2">
              <Send className="h-4 w-4" /> My Submissions
            </TabsTrigger>
            <TabsTrigger value="inbox" className="gap-2">
              <Inbox className="h-4 w-4" /> Approval Inbox
            </TabsTrigger>
            <TabsTrigger value="drafts" className="gap-2">
              <Edit className="h-4 w-4" /> Drafts
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              <FileText className="h-4 w-4" /> All
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search documents…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['All', 'Pending', 'Approved', 'Rejected', 'Draft'] as const).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={() => toast({ title: 'Refreshed' })}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value={tab} className="mt-4">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                <FileUp className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">No documents in this view.</p>
                <Button onClick={openCompose}>
                  <Plus className="mr-2 h-4 w-4" /> Create one
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {filtered.map((doc) => (
                <Card key={doc.id} className="transition hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {doc.submittedBy
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{doc.title}</h3>
                          {statusBadge(doc.status)}
                          {priorityBadge(doc.priority)}
                          <Badge variant="outline" className="text-xs">
                            {doc.category}
                          </Badge>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{doc.description}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <UserCheck className="h-3 w-3" />
                            Receiver: <span className="font-medium text-foreground">{doc.receiver}</span>
                          </span>
                          <span>Updated {new Date(doc.updatedAt).toLocaleDateString()}</span>
                          {doc.attachments.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Paperclip className="h-3 w-3" />
                              {doc.attachments.length} file{doc.attachments.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-shrink-0 items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewing(doc)} title="View">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(doc.status === 'Draft' || doc.status === 'Rejected' || doc.submittedBy === CURRENT_USER) && (
                          <Button variant="ghost" size="icon" onClick={() => openEdit(doc)} title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteDoc(doc.id)}
                          title="Delete"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Quick reassign for pending docs */}
                    {doc.status === 'Pending' && doc.submittedBy === CURRENT_USER && (
                      <div className="mt-3 flex items-center gap-2 border-t pt-3">
                        <Label className="text-xs text-muted-foreground">Reassign receiver:</Label>
                        <Select value={doc.receiver} onValueChange={(v) => reassign(doc, v)}>
                          <SelectTrigger className="h-8 w-64">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {leadership.map((l) => (
                              <SelectItem key={l.id} value={l.name}>
                                {l.name} — {l.role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Compose / Edit Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Document Request' : 'New Document Request'}</DialogTitle>
            <DialogDescription>
              Upload supporting documents and assign a leadership receiver for approval.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Annual Leave Request – March 2024"
              />
            </div>

            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Provide context for the approver…"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v as Priority })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Assign to (Receiver) *</Label>
              <Select value={form.receiver} onValueChange={(v) => setForm({ ...form, receiver: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {leadership.map((l) => (
                    <SelectItem key={l.id} value={l.name}>
                      {l.name} — {l.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Attachments</Label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFiles}
              />
              <Button variant="outline" onClick={handleFilePick} className="justify-start">
                <Upload className="mr-2 h-4 w-4" />
                Upload files
              </Button>
              {form.attachments.length > 0 && (
                <div className="space-y-1">
                  {form.attachments.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{a.name}</span>
                        <span className="text-xs text-muted-foreground">{a.size}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => removeAttachment(a.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setComposeOpen(false)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={() => persist('Draft')}>
              Save Draft
            </Button>
            <Button onClick={() => persist('Pending')}>
              <Send className="mr-2 h-4 w-4" />
              Submit for Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View / Review Dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-2xl">
          {viewing && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  {statusBadge(viewing.status)}
                  {priorityBadge(viewing.priority)}
                  <Badge variant="outline">{viewing.category}</Badge>
                </div>
                <DialogTitle className="mt-2">{viewing.title}</DialogTitle>
                <DialogDescription>
                  From <b>{viewing.submittedBy}</b> · To <b>{viewing.receiver}</b> ·{' '}
                  {new Date(viewing.createdAt).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <p className="text-sm">{viewing.description}</p>

                {viewing.attachments.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Attachments</Label>
                    {viewing.attachments.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Paperclip className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{a.name}</span>
                          <span className="text-xs text-muted-foreground">{a.size}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toast({ title: 'Download started', description: a.name })}
                        >
                          <Download className="mr-1 h-3 w-3" /> Download
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {viewing.reviewerComment && (
                  <div className="rounded-md border bg-muted/30 p-3">
                    <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3" /> Reviewer comment
                    </Label>
                    <p className="mt-1 text-sm">{viewing.reviewerComment}</p>
                  </div>
                )}

                {viewing.status === 'Pending' && (
                  <div className="space-y-2 border-t pt-3">
                    <Label>Review comment (optional)</Label>
                    <Textarea
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Leave a note for the submitter…"
                    />
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                {viewing.status === 'Pending' ? (
                  <>
                    <Button variant="outline" onClick={() => setViewing(null)}>
                      Close
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => decide(viewing, 'Rejected')}
                    >
                      <XCircle className="mr-2 h-4 w-4" /> Reject
                    </Button>
                    <Button onClick={() => decide(viewing, 'Approved')}>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setViewing(null)}>Close</Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
