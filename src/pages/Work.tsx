import React, { useEffect, useMemo, useState } from 'react'
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Plus, Edit, Trash2, Calendar, X, Users, User, Check, ChevronDown, ChevronRight, ListTodo } from 'lucide-react'
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

const PROJECT_STATUSES = ['Planning', 'In Progress', 'Review', 'Completed', 'On Hold']
const PROJECT_PRIORITIES = ['Low', 'Medium', 'High', 'Critical']
const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done']
const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical']

const labelize = (s: string) => s.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')

const projectStatusColor = (s: string | null) =>
  s === 'Completed' ? 'bg-green-500/15 text-green-700'
  : s === 'In Progress' ? 'bg-yellow-500/15 text-yellow-700'
  : s === 'Review' ? 'bg-purple-500/15 text-purple-700'
  : s === 'On Hold' ? 'bg-red-500/15 text-red-700'
  : 'bg-blue-500/15 text-blue-700'

const taskStatusColor = (s: string | null) =>
  s === 'done' ? 'bg-green-500/15 text-green-700'
  : s === 'in_progress' ? 'bg-blue-500/15 text-blue-700'
  : s === 'review' ? 'bg-yellow-500/15 text-yellow-700'
  : 'bg-gray-500/15 text-gray-700'

const priorityBorder = (p: string | null) =>
  p === 'critical' ? 'border-red-500'
  : p === 'high' ? 'border-orange-500'
  : p === 'medium' ? 'border-yellow-500'
  : 'border-green-500'

const emptyProjectForm = {
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

const emptyTaskForm = {
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

const computeProgress = (list: ChecklistItem[]) => {
  if (!list || list.length === 0) return 0
  const done = list.filter(i => i.done).length
  return Math.round((done / list.length) * 100)
}

const initials = (name: string) => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

const Work = () => {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { session } = useAuth()

  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [users, setUsers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')

  const [projectDialog, setProjectDialog] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectRow | null>(null)
  const [pForm, setPForm] = useState({ ...emptyProjectForm })
  const [newItem, setNewItem] = useState('')

  const [taskDialog, setTaskDialog] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskRow | null>(null)
  const [tForm, setTForm] = useState({ ...emptyTaskForm })

  const load = async () => {
    setLoading(true)
    const [{ data: p, error: pe }, { data: tk }, { data: prof }] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles_public' as never).select('id, name'),
    ])
    if (pe) toast({ title: 'Failed to load projects', description: pe.message, variant: 'destructive' })
    setProjects((p as unknown as ProjectRow[]) ?? [])
    setTasks((tk as unknown as TaskRow[]) ?? [])
    setUsers(((prof as unknown) as TeamMember[]) ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const matchesTask = (tk: TaskRow) => {
    if (filterStatus !== 'all' && tk.status !== filterStatus) return false
    if (filterPriority !== 'all' && tk.priority !== filterPriority) return false
    if (search && !tk.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }

  const tasksByProject = useMemo(() => {
    const map: Record<string, TaskRow[]> = {}
    tasks.filter(matchesTask).forEach(tk => {
      const key = tk.project_id ?? '__none__'
      ;(map[key] ||= []).push(tk)
    })
    return map
  }, [tasks, filterStatus, filterPriority, search])

  const visibleProjects = useMemo(() => projects.filter(p => {
    if (!search) return true
    if (p.name.toLowerCase().includes(search.toLowerCase())) return true
    return (tasksByProject[p.id]?.length ?? 0) > 0
  }), [projects, search, tasksByProject])

  const profileName = (id: string | null) => users.find(u => u.id === id)?.name

  /* ---------- project actions ---------- */
  const openCreateProject = () => {
    setEditingProject(null)
    setPForm({ ...emptyProjectForm, team: [], checklist: [] })
    setProjectDialog(true)
  }

  const openEditProject = (p: ProjectRow) => {
    setEditingProject(p)
    setPForm({
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
    setProjectDialog(true)
  }

  const toggleAssignee = (u: TeamMember) => {
    const exists = pForm.team.find(m => m.id === u.id)
    setPForm({ ...pForm, team: exists ? pForm.team.filter(m => m.id !== u.id) : [...pForm.team, u] })
  }

  const addChecklistItem = () => {
    if (!newItem.trim()) return
    setPForm({ ...pForm, checklist: [...pForm.checklist, { id: crypto.randomUUID(), text: newItem.trim(), done: false }] })
    setNewItem('')
  }
  const toggleItem = (id: string) => setPForm({ ...pForm, checklist: pForm.checklist.map(i => i.id === id ? { ...i, done: !i.done } : i) })
  const removeItem = (id: string) => setPForm({ ...pForm, checklist: pForm.checklist.filter(i => i.id !== id) })

  const saveProject = async () => {
    if (!pForm.name.trim()) return toast({ title: 'Name required', variant: 'destructive' })
    const progress = computeProgress(pForm.checklist)
    const payload = {
      name: pForm.name,
      description: pForm.description || null,
      status: progress === 100 ? 'Completed' : (pForm.status === 'Completed' ? 'In Progress' : pForm.status),
      priority: pForm.priority,
      department: pForm.department || null,
      progress,
      due_date: pForm.due_date || null,
      tags: pForm.tags ? pForm.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
      team: pForm.team as never,
      checklist: pForm.checklist as never,
    }
    if (editingProject) {
      const { error } = await supabase.from('projects').update(payload).eq('id', editingProject.id)
      if (error) return toast({ title: 'Update failed', description: error.message, variant: 'destructive' })
      toast({ title: 'Project updated' })
    } else {
      const { error } = await supabase.from('projects').insert({ ...payload, owner_id: session?.user?.id })
      if (error) return toast({ title: 'Create failed', description: error.message, variant: 'destructive' })
      toast({ title: 'Project created' })
    }
    setProjectDialog(false)
    await load()
  }

  const toggleCardItem = async (p: ProjectRow, itemId: string) => {
    const list = (Array.isArray(p.checklist) ? p.checklist : []).map(i => i.id === itemId ? { ...i, done: !i.done } : i)
    const progress = computeProgress(list)
    const newStatus = progress === 100 ? 'Completed' : (p.status === 'Completed' ? 'In Progress' : (p.status ?? 'Planning'))
    const { error } = await supabase.from('projects').update({ checklist: list as never, progress, status: newStatus }).eq('id', p.id)
    if (error) return toast({ title: 'Update failed', description: error.message, variant: 'destructive' })
    setProjects(prev => prev.map(x => x.id === p.id ? { ...x, checklist: list, progress, status: newStatus } : x))
  }

  const removeProject = async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) return toast({ title: 'Delete failed', description: error.message, variant: 'destructive' })
    toast({ title: 'Project deleted' })
    await load()
  }

  /* ---------- task actions ---------- */
  const openCreateTask = (projectId?: string) => {
    setEditingTask(null)
    setTForm({ ...emptyTaskForm, project_id: projectId ?? '' })
    setTaskDialog(true)
  }
  const openEditTask = (tk: TaskRow) => {
    setEditingTask(tk)
    setTForm({
      title: tk.title,
      description: tk.description ?? '',
      status: tk.status ?? 'todo',
      priority: tk.priority ?? 'medium',
      due_date: tk.due_date ?? '',
      project_id: tk.project_id ?? '',
      assignee_id: tk.assignee_id ?? '',
      tags: (tk.tags ?? []).join(', '),
      estimated_hours: Number(tk.estimated_hours ?? 0),
    })
    setTaskDialog(true)
  }

  const saveTask = async () => {
    if (!tForm.title.trim()) return toast({ title: 'Title required', variant: 'destructive' })
    const payload = {
      title: tForm.title,
      description: tForm.description || null,
      status: tForm.status,
      priority: tForm.priority,
      due_date: tForm.due_date || null,
      project_id: tForm.project_id || null,
      assignee_id: tForm.assignee_id || null,
      tags: tForm.tags ? tForm.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
      estimated_hours: Number(tForm.estimated_hours) || 0,
    }
    if (editingTask) {
      const { error } = await supabase.from('tasks').update(payload).eq('id', editingTask.id)
      if (error) return toast({ title: 'Update failed', description: error.message, variant: 'destructive' })
      toast({ title: 'Task updated' })
    } else {
      const { error } = await supabase.from('tasks').insert({ ...payload, created_by: session?.user?.id })
      if (error) return toast({ title: 'Create failed', description: error.message, variant: 'destructive' })
      toast({ title: 'Task created' })
    }
    setTaskDialog(false)
    if (payload.project_id) setExpanded(prev => ({ ...prev, [payload.project_id!]: true }))
    await load()
  }

  const removeTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) return toast({ title: 'Delete failed', description: error.message, variant: 'destructive' })
    toast({ title: 'Task deleted' })
    await load()
  }

  const updateTaskStatus = async (id: string, status: string) => {
    setTasks(prev => prev.map(x => x.id === id ? { ...x, status } : x))
    const { error } = await supabase.from('tasks').update({ status }).eq('id', id)
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' })
      await load()
    } else {
      toast({ title: `Moved to ${labelize(status)}` })
    }
  }
  const nextStatus = (s: string | null) => {
    const i = TASK_STATUSES.indexOf(s ?? 'todo')
    return TASK_STATUSES[Math.min(i + 1, TASK_STATUSES.length - 1)]
  }

  /* ---------- task row ---------- */
  const TaskRowCard = ({ tk }: { tk: TaskRow }) => (
    <div className={`border-l-4 ${priorityBorder(tk.priority)} bg-muted/30 rounded-md px-3 py-2`}>
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{tk.title}</div>
          {tk.description && <div className="text-xs text-muted-foreground line-clamp-2">{tk.description}</div>}
        </div>
        <div className="flex gap-1 shrink-0">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditTask(tk)}><Edit className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => removeTask(tk.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 items-center text-xs mt-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium hover:opacity-80 transition ${taskStatusColor(tk.status)}`}>
              {labelize(tk.status ?? 'todo')}
              <ChevronDown className="w-3 h-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {TASK_STATUSES.map(s => (
              <DropdownMenuItem key={s} onClick={() => updateTaskStatus(tk.id, s)}>
                <span className={`w-2 h-2 rounded-full mr-2 ${taskStatusColor(s).split(' ')[0]}`} />
                {labelize(s)}
                {tk.status === s && <Check className="w-3 h-3 ml-auto" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {tk.status !== 'done' && (
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs gap-1 border-green-500/40 text-green-700 hover:bg-green-500/10"
            onClick={() => updateTaskStatus(tk.id, nextStatus(tk.status))}
          >
            <Check className="w-3 h-3" />
            {nextStatus(tk.status) === 'done' ? 'Mark Done' : `→ ${labelize(nextStatus(tk.status))}`}
          </Button>
        )}
        <Badge variant="outline">{labelize(tk.priority ?? 'medium')}</Badge>
        {profileName(tk.assignee_id) && (
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className="rounded-full ring-1 ring-border hover:ring-primary transition" aria-label={`Assignee ${profileName(tk.assignee_id)}`}>
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{initials(profileName(tk.assignee_id)!)}</AvatarFallback>
                </Avatar>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="start">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/10 text-primary">{initials(profileName(tk.assignee_id)!)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" /> Assignee</div>
                  <div className="text-sm font-medium truncate">{profileName(tk.assignee_id)}</div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
        {tk.due_date && <span className="flex items-center gap-1 text-muted-foreground"><Calendar className="w-3 h-3" />{formatDate(tk.due_date)}</span>}
        {tk.tags?.map((tag, i) => <span key={i} className="px-2 py-0.5 bg-muted rounded">{tag}</span>)}
      </div>
    </div>
  )

  const orphanTasks = tasksByProject['__none__'] ?? []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{`Projects & Tasks`}</h1>
          <p className="text-muted-foreground">{t('pages.projects.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openCreateTask()}><Plus className="w-4 h-4 mr-2" />{`New Task`}</Button>
          <Button onClick={openCreateProject}><Plus className="w-4 h-4 mr-2" />{`New Project`}</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 flex gap-3 flex-wrap">
          <Input placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {TASK_STATUSES.map(s => <SelectItem key={s} value={s}>{labelize(s)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {TASK_PRIORITIES.map(p => <SelectItem key={p} value={p}>{labelize(p)}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-4">
          {visibleProjects.length === 0 && orphanTasks.length === 0 && (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No projects yet. Click "New Project" to create one.</CardContent></Card>
          )}

          {visibleProjects.map(p => {
            const checklist = Array.isArray(p.checklist) ? p.checklist : []
            const team = Array.isArray(p.team) ? p.team : []
            const projTasks = tasksByProject[p.id] ?? []
            const doneTasks = projTasks.filter(x => x.status === 'done').length
            const open = !!expanded[p.id]
            return (
              <Card key={p.id}>
                <Collapsible open={open} onOpenChange={(v) => setExpanded(prev => ({ ...prev, [p.id]: v }))}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-3">
                      <CollapsibleTrigger asChild>
                        <button type="button" className="flex items-start gap-2 text-left min-w-0">
                          {open ? <ChevronDown className="w-4 h-4 mt-1 shrink-0" /> : <ChevronRight className="w-4 h-4 mt-1 shrink-0" />}
                          <div className="min-w-0">
                            <CardTitle className="text-lg truncate">{p.name}</CardTitle>
                            {p.department && <CardDescription>{p.department}</CardDescription>}
                          </div>
                        </button>
                      </CollapsibleTrigger>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => openEditProject(p)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => removeProject(p.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {p.description && <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>}
                    <div className="flex flex-wrap gap-2 items-center">
                      <Badge className={projectStatusColor(p.status)}>{p.status ?? 'Planning'}</Badge>
                      <Badge variant="outline">{p.priority ?? 'Medium'}</Badge>
                      <Badge variant="secondary" className="gap-1">
                        <ListTodo className="w-3 h-3" />{`${doneTasks}/${projTasks.length} tasks`}
                      </Badge>
                      {p.due_date && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />Due {formatDate(p.due_date)}
                        </span>
                      )}
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

                    <CollapsibleContent className="space-y-3 pt-2 border-t">
                      {checklist.length > 0 && (
                        <div className="space-y-1.5">
                          {checklist.map(item => (
                            <label key={item.id} className="flex items-start gap-2 text-sm cursor-pointer">
                              <Checkbox checked={item.done} onCheckedChange={() => toggleCardItem(p, item.id)} className="mt-0.5" />
                              <span className={item.done ? 'line-through text-muted-foreground' : ''}>{item.text}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      <div className="space-y-2">
                        {projTasks.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No tasks yet.</p>
                        ) : projTasks.map(tk => <TaskRowCard key={tk.id} tk={tk} />)}
                        <Button variant="outline" size="sm" onClick={() => openCreateTask(p.id)}>
                          <Plus className="w-3.5 h-3.5 mr-1" />{`Add Task`}
                        </Button>
                      </div>
                      {p.tags && p.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {p.tags.map((tg, i) => <span key={i} className="px-2 py-0.5 bg-muted rounded text-xs">{tg}</span>)}
                        </div>
                      )}
                    </CollapsibleContent>
                  </CardContent>
                </Collapsible>
              </Card>
            )
          })}

          {orphanTasks.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{`Unassigned Tasks`}</CardTitle>
                <CardDescription>{`Tasks that don't belong to a project`}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {orphanTasks.map(tk => <TaskRowCard key={tk.id} tk={tk} />)}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Project dialog */}
      <Dialog open={projectDialog} onOpenChange={setProjectDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProject ? 'Edit Project' : 'New Project'}</DialogTitle>
            <DialogDescription>{editingProject ? 'Update project details' : 'Create a new project with assignees and tasks'}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input value={pForm.name} onChange={(e) => setPForm({ ...pForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input value={pForm.department} onChange={(e) => setPForm({ ...pForm, department: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea value={pForm.description} onChange={(e) => setPForm({ ...pForm, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={pForm.status} onValueChange={(v) => setPForm({ ...pForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PROJECT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={pForm.priority} onValueChange={(v) => setPForm({ ...pForm, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PROJECT_PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={pForm.due_date} onChange={(e) => setPForm({ ...pForm, due_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tags (comma separated)</Label>
              <Input value={pForm.tags} onChange={(e) => setPForm({ ...pForm, tags: e.target.value })} />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Assignees</Label>
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                {users.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No users available</p>
                ) : users.map(u => {
                  const checked = !!pForm.team.find(m => m.id === u.id)
                  return (
                    <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={checked} onCheckedChange={() => toggleAssignee(u)} />
                      <span>{u.name}</span>
                    </label>
                  )
                })}
              </div>
              {pForm.team.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {pForm.team.map(m => (
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
              {pForm.checklist.length > 0 && (
                <div className="border rounded-md p-3 space-y-2">
                  {pForm.checklist.map(item => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={item.done} onCheckedChange={() => toggleItem(item.id)} />
                      <span className={`flex-1 ${item.done ? 'line-through text-muted-foreground' : ''}`}>{item.text}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}><X className="w-3 h-3" /></Button>
                    </div>
                  ))}
                  <div className="pt-2 border-t space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span><span>{computeProgress(pForm.checklist)}%</span>
                    </div>
                    <Progress value={computeProgress(pForm.checklist)} />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setProjectDialog(false)}>Cancel</Button>
            <Button onClick={saveProject}>{`${editingProject ? 'Update' : 'Create'} Project`}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task dialog */}
      <Dialog open={taskDialog} onOpenChange={setTaskDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'New Task'}</DialogTitle>
            <DialogDescription>{editingTask ? 'Update task details' : 'Create a new task'}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <Label>Title</Label>
              <Input value={tForm.title} onChange={(e) => setTForm({ ...tForm, title: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea value={tForm.description} onChange={(e) => setTForm({ ...tForm, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={tForm.status} onValueChange={(v) => setTForm({ ...tForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TASK_STATUSES.map(s => <SelectItem key={s} value={s}>{labelize(s)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={tForm.priority} onValueChange={(v) => setTForm({ ...tForm, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TASK_PRIORITIES.map(p => <SelectItem key={p} value={p}>{labelize(p)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={tForm.project_id || 'none'} onValueChange={(v) => setTForm({ ...tForm, project_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select value={tForm.assignee_id || 'none'} onValueChange={(v) => setTForm({ ...tForm, assignee_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={tForm.due_date} onChange={(e) => setTForm({ ...tForm, due_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Estimated Hours</Label>
              <Input type="number" value={tForm.estimated_hours} onChange={(e) => setTForm({ ...tForm, estimated_hours: Number(e.target.value) })} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Tags (comma separated)</Label>
              <Input value={tForm.tags} onChange={(e) => setTForm({ ...tForm, tags: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setTaskDialog(false)}>Cancel</Button>
            <Button onClick={saveTask}>{`${editingTask ? 'Update' : 'Create'} Task`}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Work
