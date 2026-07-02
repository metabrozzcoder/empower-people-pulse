import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
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
  FileText, Upload, Plus, Edit, Trash2, Search, CheckCircle2, XCircle, Clock,
  Paperclip, Send, Download, Eye, UserCheck, Inbox, FileUp, RefreshCw, MessageSquare, Loader2,
  Globe, Lock, QrCode,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { DocumentEditor } from '@/components/DocumentEditor'
import { QRCodeSVG } from 'qrcode.react'
import { formatDate, formatDateTime } from '@/lib/date'

type ApprovalStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected'
type Priority = 'Low' | 'Normal' | 'High' | 'Urgent'

interface Assigner { id: string; name: string; role: string }

interface DocRow {
  id: string
  title: string
  description: string | null
  body_html: string | null
  visibility: string
  category: string | null
  priority: string
  status: string
  owner_id: string
  approver_id: string | null
  receiver_name: string | null
  file_path: string | null
  file_type: string | null
  file_size: number | null
  approver_comment: string | null
  created_at: string
  updated_at: string
  reviewed_at: string | null
}

const categories = ['HR Request', 'Finance', 'Leave Request', 'Equipment', 'Policy', 'Contract', 'Other']
const priorities: Priority[] = ['Low', 'Normal', 'High', 'Urgent']

const STATUS_DB_TO_UI: Record<string, ApprovalStatus> = {
  draft: 'Draft', pending: 'Pending', approved: 'Approved', rejected: 'Rejected',
}
const STATUS_UI_TO_DB: Record<ApprovalStatus, string> = {
  Draft: 'draft', Pending: 'pending', Approved: 'approved', Rejected: 'rejected',
}

const emptyForm = {
  title: '',
  description: '',
  bodyHtml: '',
  visibility: 'private' as 'private' | 'public',
  category: 'HR Request',
  priority: 'Normal' as Priority,
  approverId: '',
  receiverName: '',
  file: null as File | null,
  existingFilePath: null as string | null,
  existingFileType: null as string | null,
  existingFileSize: null as number | null,
}

export default function Documentation() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { currentUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [docs, setDocs] = useState<DocRow[]>([])
  const [assigners, setAssigners] = useState<Assigner[]>([])
  const [profileNames, setProfileNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [assignersLoading, setAssignersLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [tab, setTab] = useState<'my' | 'inbox' | 'drafts' | 'all'>('my')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | ApprovalStatus>('All')

  const [composeOpen, setComposeOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const [viewing, setViewing] = useState<DocRow | null>(null)
  const [reviewComment, setReviewComment] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setPreviewUrl(null)
    if (viewing?.file_path) {
      supabase.storage.from('documents').createSignedUrl(viewing.file_path, 300).then(({ data }) => {
        if (!cancelled && data?.signedUrl) setPreviewUrl(data.signedUrl)
      })
    }
    return () => { cancelled = true }
  }, [viewing?.id, viewing?.file_path])

  // ---------- Load assigners (admin + hr users) ----------
  const loadAssigners = useCallback(async () => {
    setAssignersLoading(true)
    const { data: profs } = await supabase
      .from('profiles_public' as never)
      .select('id, name, position, department')
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id, role')
    const roleByUser = new Map<string, string>()
    ;(roles ?? []).forEach((r) => {
      const cur = roleByUser.get(r.user_id)
      if (!cur || r.role === 'admin') roleByUser.set(r.user_id, r.role)
    })
    const roleLabel = (r?: string) => {
      switch (r) {
        case 'admin': return 'Administrator'
        case 'hr': return 'HR Manager'
        case 'accountant': return 'Accountant'
        case 'director': return 'Director'
        case 'shooting_moderator': return 'Shooting Moderator'
        case 'tech_supply': return 'Tech Supply'
        case 'driver': return 'Driver'
        case 'employee': return 'Employee'
        case 'guest': return 'Guest'
        default: return 'User'
      }
    }
    const list: Assigner[] = (profs ?? [])
      .filter((p: { id: string }) => p.id !== currentUser?.id)
      .map((p: { id: string; name: string; position: string | null; department: string | null }) => ({
        id: p.id,
        name: p.name,
        role: p.position || p.department || roleLabel(roleByUser.get(p.id)),
      }))
    setAssigners(list.sort((a, b) => a.name.localeCompare(b.name)))
    setAssignersLoading(false)
  }, [currentUser?.id])

  const loadDocs = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      toast({ title: 'Failed to load documents', description: error.message, variant: 'destructive' })
    }
    const rows = (data ?? []) as unknown as DocRow[]
    setDocs(rows)
    // hydrate profile names for owners + approvers
    const idsNeeded = new Set<string>()
    rows.forEach((r) => { idsNeeded.add(r.owner_id); if (r.approver_id) idsNeeded.add(r.approver_id) })
    const missing = Array.from(idsNeeded).filter((id) => !profileNames[id])
    if (missing.length) {
      const { data: profs } = await supabase.from('profiles_public' as never).select('id, name').in('id', missing)
      const next = { ...profileNames }
      ;(profs ?? []).forEach((p: { id: string; name: string }) => { next[p.id] = p.name })
      setProfileNames(next)
    }
    setLoading(false)
  }, [toast, profileNames])

  useEffect(() => {
    loadAssigners()
    loadDocs()
    // Realtime sync
    const channel = supabase
      .channel('documents-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => {
        loadDocs()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ownerName = (id: string) => profileNames[id] || (id === currentUser?.id ? currentUser?.name ?? 'You' : '—')

  const filtered = useMemo(() => {
    const me = currentUser?.id
    return docs.filter((d) => {
      const status = STATUS_DB_TO_UI[d.status] ?? 'Draft'
      const tabMatch =
        tab === 'my'   ? d.owner_id === me && status !== 'Draft'
      : tab === 'inbox' ? d.approver_id === me && status === 'Pending'
      : tab === 'drafts' ? d.owner_id === me && status === 'Draft'
      : true
      const statusMatch = statusFilter === 'All' || status === statusFilter
      const q = search.toLowerCase()
      const searchMatch = !q
        || d.title.toLowerCase().includes(q)
        || (d.description ?? '').toLowerCase().includes(q)
        || (d.receiver_name ?? '').toLowerCase().includes(q)
      return tabMatch && statusMatch && searchMatch
    })
  }, [docs, tab, search, statusFilter, currentUser])

  const counts = useMemo(() => {
    const me = currentUser?.id
    return {
      my: docs.filter((d) => d.owner_id === me && d.status !== 'draft').length,
      inbox: docs.filter((d) => d.approver_id === me && d.status === 'pending').length,
      drafts: docs.filter((d) => d.owner_id === me && d.status === 'draft').length,
      all: docs.length,
    }
  }, [docs, currentUser])

  const openCompose = () => {
    setEditingId(null)
    setForm({ ...emptyForm, approverId: assigners[0]?.id ?? '', receiverName: assigners[0]?.name ?? '' })
    setComposeOpen(true)
  }

  const openEdit = (d: DocRow) => {
    setEditingId(d.id)
    setForm({
      title: d.title,
      description: d.description ?? '',
      bodyHtml: d.body_html ?? '',
      visibility: (d.visibility as 'private' | 'public') ?? 'private',
      category: d.category ?? 'HR Request',
      priority: (d.priority as Priority) ?? 'Normal',
      approverId: d.approver_id ?? '',
      receiverName: d.receiver_name ?? '',
      file: null,
      existingFilePath: d.file_path,
      existingFileType: d.file_type,
      existingFileSize: d.file_size,
    })
    setComposeOpen(true)
  }

  const handleFilePick = () => fileInputRef.current?.click()
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setForm((p) => ({ ...p, file: f }))
    e.target.value = ''
  }

  const persist = async (uiStatus: ApprovalStatus) => {
    if (!currentUser) return
    if (!form.title.trim()) { toast({ title: 'Title is required', variant: 'destructive' }); return }
    if (uiStatus === 'Pending' && !form.approverId) {
      toast({ title: 'Please assign a receiver', variant: 'destructive' }); return
    }
    setSaving(true)
    try {
      let filePath = form.existingFilePath
      let fileType = form.existingFileType
      let fileSize = form.existingFileSize
      if (form.file) {
        const ext = form.file.name.split('.').pop() ?? 'bin'
        const key = `${currentUser.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: upErr } = await supabase.storage.from('documents').upload(key, form.file, { upsert: false })
        if (upErr) throw upErr
        filePath = key
        fileType = form.file.type || ext
        fileSize = form.file.size
      }

      const approver = assigners.find((a) => a.id === form.approverId)
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        body_html: form.bodyHtml || null,
        visibility: form.visibility,
        category: form.category,
        priority: form.priority,
        status: STATUS_UI_TO_DB[uiStatus],
        approver_id: form.approverId || null,
        receiver_name: approver?.name ?? form.receiverName ?? null,
        file_path: filePath,
        file_type: fileType,
        file_size: fileSize,
      }

      if (editingId) {
        const { error } = await supabase.from('documents').update(payload as never).eq('id', editingId)
        if (error) throw error
        toast({ title: uiStatus === 'Draft' ? 'Draft saved' : 'Request updated' })
      } else {
        const { error } = await supabase.from('documents').insert({
          ...payload,
          owner_id: currentUser.id,
        } as never)
        if (error) throw error
        toast({
          title: uiStatus === 'Draft' ? 'Draft saved' : 'Submitted for approval',
          description: uiStatus === 'Draft' ? undefined : `Sent to ${approver?.name}`,
        })
      }
      setComposeOpen(false); setEditingId(null); setForm(emptyForm)
      loadDocs()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed'
      toast({ title: 'Save failed', description: msg, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const deleteDoc = async (d: DocRow) => {
    const { error } = await supabase.from('documents').delete().eq('id', d.id)
    if (error) { toast({ title: 'Delete failed', description: error.message, variant: 'destructive' }); return }
    if (d.file_path) supabase.storage.from('documents').remove([d.file_path])
    toast({ title: 'Document deleted' })
    loadDocs()
  }

  const reassign = async (d: DocRow, approverId: string) => {
    const approver = assigners.find((a) => a.id === approverId)
    const { error } = await supabase
      .from('documents')
      .update({ approver_id: approverId, receiver_name: approver?.name ?? null } as never)
      .eq('id', d.id)
    if (error) { toast({ title: 'Update failed', description: error.message, variant: 'destructive' }); return }
    toast({ title: 'Receiver updated', description: `Reassigned to ${approver?.name}` })
    loadDocs()
  }

  const decide = async (d: DocRow, uiStatus: 'Approved' | 'Rejected') => {
    const { error } = await supabase
      .from('documents')
      .update({
        status: STATUS_UI_TO_DB[uiStatus],
        approver_comment: reviewComment || d.approver_comment,
        reviewed_at: new Date().toISOString(),
      } as never)
      .eq('id', d.id)
    if (error) { toast({ title: 'Update failed', description: error.message, variant: 'destructive' }); return }
    toast({ title: uiStatus === 'Approved' ? 'Document approved' : 'Document rejected', description: d.title })
    setReviewComment(''); setViewing(null); loadDocs()
  }

  const downloadAttachment = async (d: DocRow) => {
    if (!d.file_path) return
    const { data, error } = await supabase.storage.from('documents').createSignedUrl(d.file_path, 60)
    if (error || !data?.signedUrl) { toast({ title: 'Download failed', description: error?.message, variant: 'destructive' }); return }
    window.open(data.signedUrl, '_blank')
  }

  const statusBadge = (s: ApprovalStatus) => {
    const map: Record<ApprovalStatus, string> = {
      Draft: 'bg-muted text-muted-foreground',
      Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      Approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      Rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    }
    const Icon = s === 'Approved' ? CheckCircle2 : s === 'Rejected' ? XCircle : s === 'Pending' ? Clock : Edit
    return <Badge className={`${map[s]} gap-1`}><Icon className="h-3 w-3" />{s}</Badge>
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

  const fmtSize = (n: number | null) => !n ? '' : n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 backdrop-blur-xl">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('pages.documentation.title')}</h1>
            <p className="text-muted-foreground">{t('pages.documentation.subtitle')}</p>
          </div>
          <Button size="lg" onClick={openCompose} className="shadow-lg">
            <Upload className="mr-2 h-4 w-4" /> New Document Request
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'My Submissions', value: counts.my, icon: FileText },
          { label: 'Pending Review', value: counts.inbox, icon: Clock },
          { label: 'Drafts', value: counts.drafts, icon: Edit },
          { label: 'Approved', value: docs.filter((d) => d.status === 'approved').length, icon: CheckCircle2 },
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

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <TabsList>
            <TabsTrigger value="my" className="gap-2"><Send className="h-4 w-4" /> My Submissions</TabsTrigger>
            <TabsTrigger value="inbox" className="gap-2"><Inbox className="h-4 w-4" /> Approval Inbox</TabsTrigger>
            <TabsTrigger value="drafts" className="gap-2"><Edit className="h-4 w-4" /> Drafts</TabsTrigger>
            <TabsTrigger value="all" className="gap-2"><FileText className="h-4 w-4" /> All</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search documents…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-64 pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(['All', 'Pending', 'Approved', 'Rejected', 'Draft'] as const).map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={() => loadDocs()}><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </div>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <Card><CardContent className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading documents…
            </CardContent></Card>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                <FileUp className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">No documents in this view.</p>
                <Button onClick={openCompose}><Plus className="mr-2 h-4 w-4" /> Create one</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {filtered.map((d) => {
                const status = STATUS_DB_TO_UI[d.status] ?? 'Draft'
                const submitter = ownerName(d.owner_id)
                return (
                  <Card key={d.id} className="transition hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{submitter.split(' ').map((n) => n[0]).join('').slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold">{d.title}</h3>
                            {statusBadge(status)}
                            {priorityBadge((d.priority as Priority) ?? 'Normal')}
                            {d.category && <Badge variant="outline" className="text-xs">{d.category}</Badge>}
                          </div>
                          {d.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{d.description}</p>}
                          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <UserCheck className="h-3 w-3" />
                              Receiver: <span className="font-medium text-foreground">{d.receiver_name ?? (d.approver_id ? ownerName(d.approver_id) : '—')}</span>
                            </span>
                            <span>Updated {formatDate(d.updated_at)}</span>
                            {d.file_path && (
                              <span className="flex items-center gap-1">
                                <Paperclip className="h-3 w-3" /> 1 file
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setViewing(d)} title="View"><Eye className="h-4 w-4" /></Button>
                          {(d.owner_id === currentUser?.id) && (
                            <Button variant="ghost" size="icon" onClick={() => openEdit(d)} title="Edit"><Edit className="h-4 w-4" /></Button>
                          )}
                          {(d.owner_id === currentUser?.id || currentUser?.role === 'Admin') && (
                            <Button variant="ghost" size="icon" onClick={() => deleteDoc(d)} title="Delete" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {status === 'Pending' && d.owner_id === currentUser?.id && (
                        <div className="mt-3 flex items-center gap-2 border-t pt-3">
                          <Label className="text-xs text-muted-foreground">Reassign receiver:</Label>
                          <Select value={d.approver_id ?? ''} onValueChange={(v) => reassign(d, v)}>
                            <SelectTrigger className="h-8 w-64"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              {assigners.map((l) => (
                                <SelectItem key={l.id} value={l.id}>{l.name} — {l.role}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Compose / Edit Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Document Request' : 'New Document Request'}</DialogTitle>
            <DialogDescription>Write your document, preview it live, then submit it for approval.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Annual Leave Request" />
            </div>
            <div className="grid gap-2">
              <Label>Short summary</Label>
              <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="One-line context for the approver…" />
            </div>

            {form.file ? (
              <div className="space-y-2">
                <Label>Edit document (live preview)</Label>
                <DocumentEditor
                  file={form.file}
                  onSave={(edited) => {
                    setForm((p) => ({ ...p, file: edited }))
                    toast({ title: 'Edits applied', description: 'Your changes are baked into the file.' })
                  }}
                  onCancel={() => {
                    // no-op: just collapses inline editing if user wants
                  }}
                />
              </div>
            ) : form.existingFilePath ? (
              <div className="rounded-md border bg-muted/20 p-4 text-sm text-muted-foreground">
                Replace the existing file to open the editor.
              </div>
            ) : (
              <div className="rounded-md border border-dashed bg-muted/10 p-6 text-center text-sm text-muted-foreground">
                Upload a PDF or image below to open the live editor (add text, draw, highlight, signatures, rotate / delete pages).
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Priority })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{priorities.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Visibility</Label>
                <Select value={form.visibility} onValueChange={(v) => setForm({ ...form, visibility: v as 'private' | 'public' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private"><span className="flex items-center gap-2"><Lock className="h-3 w-3" /> Private</span></SelectItem>
                    <SelectItem value="public"><span className="flex items-center gap-2"><Globe className="h-3 w-3" /> Public (QR verifiable)</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.visibility === 'public' && (
              <p className="text-xs text-muted-foreground">
                Once approved, anyone scanning the QR can verify this document and see who assigned and approved it.
              </p>
            )}

            <div className="grid gap-2">
              <Label>Assign to (Receiver) *</Label>
              {assignersLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading approvers…
                </div>
              ) : assigners.length === 0 ? (
                <p className="text-sm text-muted-foreground">No admin or HR users found. Ask an admin to assign roles.</p>
              ) : (
                <Select
                  value={form.approverId}
                  onValueChange={(v) => {
                    const a = assigners.find((x) => x.id === v)
                    setForm({ ...form, approverId: v, receiverName: a?.name ?? '' })
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Select an approver" /></SelectTrigger>
                  <SelectContent>
                    {assigners.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name} — {l.role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Attachment (optional)</Label>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFile} />
              <Button variant="outline" onClick={handleFilePick} className="justify-start">
                <Upload className="mr-2 h-4 w-4" />
                {form.file ? form.file.name : form.existingFilePath ? 'Replace file' : 'Upload file'}
              </Button>
              {(form.file || form.existingFilePath) && (
                <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{form.file ? form.file.name : form.existingFilePath?.split('/').pop()}</span>
                    <span className="text-xs text-muted-foreground">{form.file ? fmtSize(form.file.size) : fmtSize(form.existingFileSize)}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                    onClick={() => setForm((p) => ({ ...p, file: null, existingFilePath: null, existingFileSize: null, existingFileType: null }))}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setComposeOpen(false)} disabled={saving}>Cancel</Button>
            <Button variant="outline" onClick={() => persist('Draft')} disabled={saving}>Save Draft</Button>
            <Button onClick={() => persist('Pending')} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Submit for Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View / Review Dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {viewing && (() => {
            const status = STATUS_DB_TO_UI[viewing.status] ?? 'Draft'
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 flex-wrap">
                    {statusBadge(status)}
                    {priorityBadge((viewing.priority as Priority) ?? 'Normal')}
                    {viewing.category && <Badge variant="outline">{viewing.category}</Badge>}
                    <Badge variant="outline" className="gap-1">
                      {viewing.visibility === 'public' ? <><Globe className="h-3 w-3" /> Public</> : <><Lock className="h-3 w-3" /> Private</>}
                    </Badge>
                  </div>
                  <DialogTitle className="mt-2">{viewing.title}</DialogTitle>
                  <DialogDescription>
                    From <b>{ownerName(viewing.owner_id)}</b> · To <b>{viewing.receiver_name ?? (viewing.approver_id ? ownerName(viewing.approver_id) : '—')}</b> · {formatDateTime(viewing.created_at)}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {viewing.description && <p className="text-sm">{viewing.description}</p>}
                  {viewing.body_html && (
                    <div className="rounded-md border bg-muted/20 p-4">
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: viewing.body_html }}
                      />
                    </div>
                  )}
                  {viewing.file_path && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Attachment preview</Label>
                      <FilePreview url={previewUrl} fileType={viewing.file_type} fileName={viewing.file_path.split('/').pop() || 'file'} />
                      <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Paperclip className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{viewing.file_path.split('/').pop()}</span>
                          <span className="text-xs text-muted-foreground">{fmtSize(viewing.file_size)}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => downloadAttachment(viewing)}>
                          <Download className="mr-1 h-3 w-3" /> Download
                        </Button>
                      </div>
                    </div>
                  )}
                  {viewing.approver_comment && (
                    <div className="rounded-md border bg-muted/30 p-3">
                      <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageSquare className="h-3 w-3" /> Reviewer comment
                      </Label>
                      <p className="mt-1 text-sm">{viewing.approver_comment}</p>
                    </div>
                  )}
                  {status === 'Approved' && viewing.visibility === 'public' && (() => {
                    const url = `${window.location.origin}${window.location.pathname}#/verify/${viewing.id}`
                    return (
                      <div className="flex flex-col items-center gap-2 rounded-md border bg-background p-4">
                        <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                          <QrCode className="h-3 w-3" /> Verification QR
                        </Label>
                        <div className="rounded-md bg-white p-3">
                          <QRCodeSVG value={url} size={160} level="M" />
                        </div>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline break-all text-center">
                          {url}
                        </a>
                        <p className="text-xs text-muted-foreground text-center max-w-md">
                          Scan to verify this document is approved and see who assigned and approved it.
                        </p>
                      </div>
                    )
                  })()}
                  {status === 'Pending' && viewing.approver_id === currentUser?.id && (
                    <div className="space-y-2 border-t pt-3">
                      <Label>Review comment (optional)</Label>
                      <Textarea rows={3} value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Leave a note for the submitter…" />
                    </div>
                  )}
                </div>

                <DialogFooter className="gap-2">
                  {status === 'Pending' && viewing.approver_id === currentUser?.id ? (
                    <>
                      <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
                      <Button variant="destructive" onClick={() => decide(viewing, 'Rejected')}><XCircle className="mr-2 h-4 w-4" /> Reject</Button>
                      <Button onClick={() => decide(viewing, 'Approved')}><CheckCircle2 className="mr-2 h-4 w-4" /> Approve</Button>
                    </>
                  ) : (
                    <Button onClick={() => setViewing(null)}>Close</Button>
                  )}
                </DialogFooter>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FilePreview({ url, fileType, fileName }: { url: string | null; fileType: string | null; fileName: string }) {
  if (!url) {
    return (
      <div className="flex h-40 items-center justify-center rounded-md border bg-muted/30 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading preview…
      </div>
    )
  }
  const ft = (fileType || '').toLowerCase()
  const name = fileName.toLowerCase()
  const isImage = ft.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(name)
  const isPdf = ft === 'application/pdf' || name.endsWith('.pdf')
  const isOffice = /(word|excel|powerpoint|officedocument|msword|ms-excel|ms-powerpoint)/.test(ft) || /\.(docx?|xlsx?|pptx?)$/i.test(name)

  if (isImage) {
    return (
      <div className="overflow-hidden rounded-md border bg-muted/30">
        <img src={url} alt={fileName} className="mx-auto max-h-[500px] w-auto object-contain" />
      </div>
    )
  }
  if (isPdf) {
    return (
      <div className="overflow-hidden rounded-md border bg-muted/30">
        <iframe src={url} title={fileName} className="h-[500px] w-full" />
      </div>
    )
  }
  if (isOffice) {
    const viewer = `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`
    return (
      <div className="overflow-hidden rounded-md border bg-muted/30">
        <iframe src={viewer} title={fileName} className="h-[500px] w-full" />
      </div>
    )
  }
  return (
    <div className="rounded-md border bg-muted/30 p-4 text-center text-xs text-muted-foreground">
      Inline preview is not available for this file type. Use Download below.
    </div>
  )
}
