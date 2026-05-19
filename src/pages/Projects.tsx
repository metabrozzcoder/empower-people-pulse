import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2, Calendar } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/context/AuthContext'

// Use session for owner_id


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
  progress: 0,
  due_date: '',
  tags: '',
}

const statusColor = (s: string | null) =>
  s === 'Completed' ? 'bg-green-500/15 text-green-700'
  : s === 'In Progress' ? 'bg-yellow-500/15 text-yellow-700'
  : s === 'Review' ? 'bg-purple-500/15 text-purple-700'
  : s === 'On Hold' ? 'bg-red-500/15 text-red-700'
  : 'bg-blue-500/15 text-blue-700'

const Projects = () => {
  const { toast } = useToast()
  const { session } = useAuth()
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ProjectRow | null>(null)
  const [form, setForm] = useState({ ...emptyForm })

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
    if (error) toast({ title: 'Failed to load projects', description: error.message, variant: 'destructive' })
    setProjects((data as ProjectRow[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm })
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
      progress: p.progress ?? 0,
      due_date: p.due_date ?? '',
      tags: (p.tags ?? []).join(', '),
    })
    setDialogOpen(true)
  }

  const save = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Name required', variant: 'destructive' })
      return
    }
    const payload = {
      name: form.name,
      description: form.description || null,
      status: form.status,
      priority: form.priority,
      department: form.department || null,
      progress: Number(form.progress) || 0,
      due_date: form.due_date || null,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
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
          <h1 className="text-3xl font-bold tracking-tight">Project Management</h1>
          <p className="text-muted-foreground">Manage and track all your projects.</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />New Project</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : projects.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No projects yet. Click "New Project" to create one.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
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
                {p.due_date && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />Due {new Date(p.due_date).toLocaleDateString()}
                  </div>
                )}
                {p.tags && p.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.tags.map((t, i) => <span key={i} className="px-2 py-0.5 bg-muted rounded text-xs">{t}</span>)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Project' : 'New Project'}</DialogTitle>
            <DialogDescription>{editing ? 'Update project details' : 'Create a new project'}</DialogDescription>
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
              <Label>Progress (%)</Label>
              <Input type="number" min={0} max={100} value={form.progress} onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Tags (comma separated)</Label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
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
