import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Calendar } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/context/AuthContext'

interface TaskRow {
  id: string
  title: string
  description: string | null
  status: string | null
  priority: string | null
  due_date: string | null
  project_id: string | null
  assignee_id: string | null
  tags: string[] | null
  estimated_hours: number | null
  actual_hours: number | null
  created_by: string | null
  created_at: string
}

interface ProjectOption { id: string; name: string }
interface ProfileOption { id: string; name: string }

const STATUSES = ['todo', 'in_progress', 'review', 'done']
const PRIORITIES = ['low', 'medium', 'high', 'critical']

const labelize = (s: string) => s.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')

const statusColor = (s: string | null) =>
  s === 'done' ? 'bg-green-500/15 text-green-700'
  : s === 'in_progress' ? 'bg-blue-500/15 text-blue-700'
  : s === 'review' ? 'bg-yellow-500/15 text-yellow-700'
  : 'bg-gray-500/15 text-gray-700'

const priorityColor = (p: string | null) =>
  p === 'critical' ? 'border-red-500'
  : p === 'high' ? 'border-orange-500'
  : p === 'medium' ? 'border-yellow-500'
  : 'border-green-500'

const emptyForm = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  due_date: '',
  project_id: '',
  assignee_id: '',
  tags: '',
  estimated_hours: 0,
}

const Tasks = () => {
  const { toast } = useToast()
  const { session } = useAuth()
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [profiles, setProfiles] = useState<ProfileOption[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<TaskRow | null>(null)
  const [form, setForm] = useState({ ...emptyForm })

  const load = async () => {
    setLoading(true)
    const [{ data: t }, { data: p }, { data: prof }] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name'),
      supabase.from('profiles').select('id, name'),
    ])
    setTasks((t as TaskRow[]) ?? [])
    setProjects((p as ProjectOption[]) ?? [])
    setProfiles((prof as ProfileOption[]) ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => tasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [tasks, filterStatus, filterPriority, search])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm })
    setDialogOpen(true)
  }
  const openEdit = (t: TaskRow) => {
    setEditing(t)
    setForm({
      title: t.title,
      description: t.description ?? '',
      status: t.status ?? 'todo',
      priority: t.priority ?? 'medium',
      due_date: t.due_date ?? '',
      project_id: t.project_id ?? '',
      assignee_id: t.assignee_id ?? '',
      tags: (t.tags ?? []).join(', '),
      estimated_hours: Number(t.estimated_hours ?? 0),
    })
    setDialogOpen(true)
  }

  const save = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Title required', variant: 'destructive' })
      return
    }
    const payload = {
      title: form.title,
      description: form.description || null,
      status: form.status,
      priority: form.priority,
      due_date: form.due_date || null,
      project_id: form.project_id || null,
      assignee_id: form.assignee_id || null,
      tags: form.tags ? form.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
      estimated_hours: Number(form.estimated_hours) || 0,
    }
    if (editing) {
      const { error } = await supabase.from('tasks').update(payload).eq('id', editing.id)
      if (error) return toast({ title: 'Update failed', description: error.message, variant: 'destructive' })
      toast({ title: 'Task updated' })
    } else {
      const { error } = await supabase.from('tasks').insert({ ...payload, created_by: session?.user?.id })
      if (error) return toast({ title: 'Create failed', description: error.message, variant: 'destructive' })
      toast({ title: 'Task created' })
    }
    setDialogOpen(false)
    await load()
  }

  const remove = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) return toast({ title: 'Delete failed', description: error.message, variant: 'destructive' })
    toast({ title: 'Task deleted' })
    await load()
  }

  const projectName = (id: string | null) => projects.find(p => p.id === id)?.name
  const profileName = (id: string | null) => profiles.find(p => p.id === id)?.name

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Manage individual tasks across projects.</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />New Task</Button>
      </div>

      <Card>
        <CardContent className="p-4 flex gap-3 flex-wrap">
          <Input placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{labelize(s)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {PRIORITIES.map(p => <SelectItem key={p} value={p}>{labelize(p)}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No tasks yet.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map(t => (
            <Card key={t.id} className={`border-l-4 ${priorityColor(t.priority)}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{t.title}</CardTitle>
                    {t.description && <CardDescription className="line-clamp-2">{t.description}</CardDescription>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(t)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(t.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2 items-center text-xs">
                <Badge className={statusColor(t.status)}>{labelize(t.status ?? 'todo')}</Badge>
                <Badge variant="outline">{labelize(t.priority ?? 'medium')}</Badge>
                {projectName(t.project_id) && <Badge variant="secondary">{projectName(t.project_id)}</Badge>}
                {profileName(t.assignee_id) && <span className="text-muted-foreground">@{profileName(t.assignee_id)}</span>}
                {t.due_date && <span className="flex items-center gap-1 text-muted-foreground"><Calendar className="w-3 h-3" />{new Date(t.due_date).toLocaleDateString()}</span>}
                {t.tags?.map((tag, i) => <span key={i} className="px-2 py-0.5 bg-muted rounded">{tag}</span>)}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Task' : 'New Task'}</DialogTitle>
            <DialogDescription>{editing ? 'Update task details' : 'Create a new task'}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{labelize(s)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{labelize(p)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={form.project_id || 'none'} onValueChange={(v) => setForm({ ...form, project_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select value={form.assignee_id || 'none'} onValueChange={(v) => setForm({ ...form, assignee_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Estimated Hours</Label>
              <Input type="number" value={form.estimated_hours} onChange={(e) => setForm({ ...form, estimated_hours: Number(e.target.value) })} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Tags (comma separated)</Label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? 'Update' : 'Create'} Task</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Tasks
