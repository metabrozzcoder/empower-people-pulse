import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2, Calendar, X, Users } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { formatDate } from '@/lib/date'

interface ChecklistItem { id: string; text: string; done: boolean }
interface TeamMember { id: string; name: string }

interface ProjectRow {
  id: string
  name: string
  description: string | null
  status: string | null
  priority: string | null
  department: string | null
  progress: number | null
  due_date: string | null
  tags: string[] | null
  team: TeamMember[] | null
  checklist: ChecklistItem[] | null
  owner_id: string | null
  created_at: string
}

const STATUSES = ['Planning', 'In Progress', 'Review', 'Completed', 'On Hold']
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']

const emptyForm = {
  name: '',
  description: '',
  status: 'Planning',
  priority: 'Medium',
  department: '',
  due_date: '',
  tags: '',
  team: [] as TeamMember[],
  checklist: [] as ChecklistItem[],
}

const statusColor = (s: string | null) =>
  s === 'Completed' ? 'bg-green-500/15 text-green-700'
  : s === 'In Progress' ? 'bg-yellow-500/15 text-yellow-700'
  : s === 'Review' ? 'bg-purple-500/15 text-purple-700'
  : s === 'On Hold' ? 'bg-red-500/15 text-red-700'
  : 'bg-blue-500/15 text-blue-700'

const computeProgress = (list: ChecklistItem[]) => {
  if (!list || list.length === 0) return 0
  const done = list.filter(i => i.done).length
  return Math.round((done / list.length) * 100)
}

const Projects = () => {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { session } = useAuth()
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [users, setUsers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ProjectRow | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [newItem, setNewItem] = useState('')

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
    if (error) toast({ title: 'Failed to load projects', description: error.message, variant: 'destructive' })
    setProjects((data as unknown as ProjectRow[]) ?? [])
    setLoading(false)
  }

  const loadUsers = async () => {
    const { data } = await supabase.from('profiles_public' as never).select('id, name')
    setUsers(((data as unknown) as TeamMember[]) ?? [])
  }

  useEffect(() => { load(); loadUsers() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, team: [], checklist: [] })
    setDialogOpen(true)
  }

  const openEdit = (p: ProjectRow) => {
    setEditing(p)
    setForm({
      name: p.name,
      description: p.description ?? '',
      status: p.status ?? 'Planning',
      priority: p.priority ?? 'Medium',
      department: p.department ?? '',
      due_date: p.due_date ?? '',
      tags: (p.tags ?? []).join(', '),
      team: Array.isArray(p.team) ? p.team : [],
      checklist: Array.isArray(p.checklist) ? p.checklist : [],
    })
    setDialogOpen(true)
  }

  const toggleAssignee = (u: TeamMember) => {
    const exists = form.team.find(m => m.id === u.id)
    setForm({
      ...form,
      team: exists ? form.team.filter(m => m.id !== u.id) : [...form.team, u],
    })
  }

  const addChecklistItem = () => {
    if (!newItem.trim()) return
    setForm({
      ...form,
      checklist: [...form.checklist, { id: crypto.randomUUID(), text: newItem.trim(), done: false }],
    })
    setNewItem('')
  }

  const toggleItem = (id: string) => {
    setForm({
      ...form,
      checklist: form.checklist.map(i => i.id === id ? { ...i, done: !i.done } : i),
    })
  }

  const removeItem = (id: string) => {
    setForm({ ...form, checklist: form.checklist.filter(i => i.id !== id) })
  }

  const save = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Name required', variant: 'destructive' })
      return
    }
    const progress = computeProgress(form.checklist)
    const payload = {
      name: form.name,
      description: form.description || null,
      status: progress === 100 ? 'Completed' : (form.status === 'Completed' ? 'In Progress' : form.status),
      priority: form.priority,
      department: form.department || null,
      progress,
      due_date: form.due_date || null,
      tags: form.tags ? form.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
      team: form.team as never,
      checklist: form.checklist as never,
    }
    if (editing) {
      const { error } = await supabase.from('projects').update(payload).eq('id', editing.id)
      if (error) return toast({ title: 'Update failed', description: error.message, variant: 'destructive' })
      toast({ title: 'Project updated' })
    } else {
      const { error } = await supabase.from('projects').insert({ ...payload, owner_id: session?.user?.id })
      if (error) return toast({ title: 'Create failed', description: error.message, variant: 'destructive' })
      toast({ title: 'Project created' })
    }
    setDialogOpen(false)
    await load()
  }

  const toggleCardItem = async (p: ProjectRow, itemId: string) => {
    const list = (Array.isArray(p.checklist) ? p.checklist : []).map(i =>
      i.id === itemId ? { ...i, done: !i.done } : i
    )
    const progress = computeProgress(list)
    const newStatus = progress === 100
      ? 'Completed'
      : (p.status === 'Completed' ? 'In Progress' : (p.status ?? 'Planning'))
    const { error } = await supabase
      .from('projects')
      .update({ checklist: list as never, progress, status: newStatus })
      .eq('id', p.id)
    if (error) return toast({ title: 'Update failed', description: error.message, variant: 'destructive' })
    setProjects(prev => prev.map(x => x.id === p.id ? { ...x, checklist: list, progress, status: newStatus } : x))
  }

  const remove = async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) return toast({ title: 'Delete failed', description: error.message, variant: 'destructive' })
    toast({ title: 'Project deleted' })
    await load()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('pages.projects.title')}</h1>
          <p className="text-muted-foreground">{t('pages.projects.subtitle')}</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />New Project</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : projects.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No projects yet. Click "New Project" to create one.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const checklist = Array.isArray(p.checklist) ? p.checklist : []
            const team = Array.isArray(p.team) ? p.team : []
            return (
              <Card key={p.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{p.name}</CardTitle>
                      {p.department && <CardDescription>{p.department}</CardDescription>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => remove(p.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {p.description && <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>}
                  <div className="flex flex-wrap gap-2">
                    <Badge className={statusColor(p.status)}>{p.status ?? 'Planning'}</Badge>
                    <Badge variant="outline">{p.priority ?? 'Medium'}</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span><span>{p.progress ?? 0}%</span>
                    </div>
                    <Progress value={p.progress ?? 0} />
                  </div>
                  {team.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span className="truncate">{team.map(m => m.name).join(', ')}</span>
                    </div>
                  )}
                  {checklist.length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t">
                      {checklist.map(item => (
                        <label key={item.id} className="flex items-start gap-2 text-sm cursor-pointer">
                          <Checkbox checked={item.done} onCheckedChange={() => toggleCardItem(p, item.id)} className="mt-0.5" />
                          <span className={item.done ? 'line-through text-muted-foreground' : ''}>{item.text}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {p.due_date && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />Due {formatDate(p.due_date)}
                    </div>
                  )}
                  {p.tags && p.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.tags.map((tg, i) => <span key={i} className="px-2 py-0.5 bg-muted rounded text-xs">{tg}</span>)}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Project' : 'New Project'}</DialogTitle>
            <DialogDescription>{editing ? 'Update project details' : 'Create a new project with assignees and tasks'}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tags (comma separated)</Label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Assignees</Label>
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                {users.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No users available</p>
                ) : users.map(u => {
                  const checked = !!form.team.find(m => m.id === u.id)
                  return (
                    <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={checked} onCheckedChange={() => toggleAssignee(u)} />
                      <span>{u.name}</span>
                    </label>
                  )
                })}
              </div>
              {form.team.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {form.team.map(m => (
                    <Badge key={m.id} variant="secondary" className="gap-1">
                      {m.name}
                      <button onClick={() => toggleAssignee(m)}><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Checklist (progress is calculated from checked items)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a task…"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem() } }}
                />
                <Button type="button" onClick={addChecklistItem}>Add</Button>
              </div>
              {form.checklist.length > 0 && (
                <div className="border rounded-md p-3 space-y-2">
                  {form.checklist.map(item => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={item.done} onCheckedChange={() => toggleItem(item.id)} />
                      <span className={`flex-1 ${item.done ? 'line-through text-muted-foreground' : ''}`}>{item.text}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="pt-2 border-t space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span><span>{computeProgress(form.checklist)}%</span>
                    </div>
                    <Progress value={computeProgress(form.checklist)} />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? 'Update' : 'Create'} Project</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Projects
