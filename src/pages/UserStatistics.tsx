import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle2, Clock, ListTodo, FolderKanban, Search, AlertTriangle } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/date'

interface ProfileRow {
  id: string
  name: string
  email: string
  position: string | null
  department: string | null
  avatar_url: string | null
}

interface TaskRow {
  id: string
  title: string
  status: string | null
  priority: string | null
  due_date: string | null
  assignee_id: string | null
  created_by: string | null
  project_id: string | null
  created_at: string
  updated_at: string
}

interface ProjectRow {
  id: string
  name: string
  status: string | null
  progress: number | null
  owner_id: string | null
  team: { id: string; name: string }[] | null
  due_date: string | null
}

const isDone = (s: string | null) => ['done', 'completed'].includes((s ?? '').toLowerCase())
const isInProgress = (s: string | null) => ['in_progress', 'in progress', 'review'].includes((s ?? '').toLowerCase())

interface Stat {
  user: ProfileRow
  total: number
  done: number
  inProgress: number
  todo: number
  overdue: number
  created: number
  projectsOwned: number
  projectsMember: number
  completion: number
}

const UserStatistics = () => {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Stat | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [p, tk, pr] = await Promise.all([
        supabase.from('profiles').select('id,name,email,position,department,avatar_url').order('name'),
        supabase.from('tasks').select('id,title,status,priority,due_date,assignee_id,created_by,project_id,created_at,updated_at'),
        supabase.from('projects').select('id,name,status,progress,owner_id,team,due_date'),
      ])
      const err = p.error || tk.error || pr.error
      if (err) toast({ title: 'Failed to load statistics', description: err.message, variant: 'destructive' })
      setProfiles((p.data as ProfileRow[]) ?? [])
      setTasks((tk.data as unknown as TaskRow[]) ?? [])
      setProjects((pr.data as unknown as ProjectRow[]) ?? [])
      setLoading(false)
    }
    load()
  }, [toast])

  const stats: Stat[] = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return profiles.map((user) => {
      const mine = tasks.filter(x => x.assignee_id === user.id)
      const done = mine.filter(x => isDone(x.status)).length
      const inProgress = mine.filter(x => isInProgress(x.status)).length
      const todo = mine.length - done - inProgress
      const overdue = mine.filter(x => !isDone(x.status) && x.due_date && x.due_date < today).length
      const projectsOwned = projects.filter(x => x.owner_id === user.id).length
      const projectsMember = projects.filter(x => Array.isArray(x.team) && x.team.some(m => m?.id === user.id)).length
      return {
        user,
        total: mine.length,
        done,
        inProgress,
        todo: todo < 0 ? 0 : todo,
        overdue,
        created: tasks.filter(x => x.created_by === user.id).length,
        projectsOwned,
        projectsMember,
        completion: mine.length ? Math.round((done / mine.length) * 100) : 0,
      }
    })
  }, [profiles, tasks, projects])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = q
      ? stats.filter(s =>
          s.user.name.toLowerCase().includes(q) ||
          (s.user.email ?? '').toLowerCase().includes(q) ||
          (s.user.department ?? '').toLowerCase().includes(q))
      : stats
    return [...list].sort((a, b) => b.total - a.total || b.done - a.done)
  }, [stats, search])

  const totals = useMemo(() => ({
    users: stats.length,
    tasks: tasks.length,
    done: tasks.filter(x => isDone(x.status)).length,
    projects: projects.length,
  }), [stats, tasks, projects])

  const selectedTasks = selected ? tasks.filter(x => x.assignee_id === selected.user.id) : []
  const selectedProjects = selected
    ? projects.filter(x => x.owner_id === selected.user.id || (Array.isArray(x.team) && x.team.some(m => m?.id === selected.user.id)))
    : []

  const initials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('pages.userStatistics.title')}</h1>
        <p className="text-muted-foreground">{t('pages.userStatistics.subtitle')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ListTodo className="w-5 h-5 text-primary" />
            <div><p className="text-2xl font-bold">{totals.tasks}</p><p className="text-xs text-muted-foreground">{t('pages.userStatistics.totalTasks')}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div><p className="text-2xl font-bold">{totals.done}</p><p className="text-xs text-muted-foreground">{t('pages.userStatistics.completedTasks')}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <FolderKanban className="w-5 h-5 text-primary" />
            <div><p className="text-2xl font-bold">{totals.projects}</p><p className="text-xs text-muted-foreground">{t('pages.userStatistics.projects')}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary" />
            <div><p className="text-2xl font-bold">{totals.users}</p><p className="text-xs text-muted-foreground">{t('pages.userStatistics.people')}</p></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('pages.userStatistics.perUser')}</CardTitle>
          <CardDescription>{t('pages.userStatistics.perUserHint')}</CardDescription>
          <div className="relative pt-2">
            <Search className="absolute left-3 top-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder={t('pages.userStatistics.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground">{t('pages.userStatistics.noData')}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('pages.userStatistics.user')}</TableHead>
                    <TableHead className="text-center">{t('pages.userStatistics.tasks')}</TableHead>
                    <TableHead className="text-center">{t('pages.userStatistics.done')}</TableHead>
                    <TableHead className="text-center">{t('pages.userStatistics.inProgress')}</TableHead>
                    <TableHead className="text-center">{t('pages.userStatistics.todo')}</TableHead>
                    <TableHead className="text-center">{t('pages.userStatistics.overdue')}</TableHead>
                    <TableHead className="text-center">{t('pages.userStatistics.projects')}</TableHead>
                    <TableHead className="w-40">{t('pages.userStatistics.completion')}</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={s.user.avatar_url ?? undefined} alt={s.user.name} />
                            <AvatarFallback>{initials(s.user.name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{s.user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{s.user.position || s.user.department || s.user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{s.total}</TableCell>
                      <TableCell className="text-center text-green-600 font-medium">{s.done}</TableCell>
                      <TableCell className="text-center">{s.inProgress}</TableCell>
                      <TableCell className="text-center">{s.todo}</TableCell>
                      <TableCell className="text-center">
                        {s.overdue > 0 ? (
                          <span className="inline-flex items-center gap-1 text-destructive"><AlertTriangle className="w-3 h-3" />{s.overdue}</span>
                        ) : 0}
                      </TableCell>
                      <TableCell className="text-center">{s.projectsOwned + s.projectsMember}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={s.completion} className="h-2" />
                          <span className="text-xs text-muted-foreground w-9 text-right">{s.completion}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setSelected(s)}>{t('pages.userStatistics.history')}</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.user.name}</DialogTitle>
            <DialogDescription>{t('pages.userStatistics.historyHint')}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: t('pages.userStatistics.tasks'), value: selected.total },
                  { label: t('pages.userStatistics.done'), value: selected.done },
                  { label: t('pages.userStatistics.inProgress'), value: selected.inProgress },
                  { label: t('pages.userStatistics.createdByUser'), value: selected.created },
                ].map((b) => (
                  <div key={b.label} className="rounded-lg border p-3">
                    <p className="text-2xl font-bold">{b.value}</p>
                    <p className="text-xs text-muted-foreground">{b.label}</p>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="font-semibold mb-2">{t('pages.userStatistics.taskHistory')}</h3>
                {selectedTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('pages.userStatistics.noTasks')}</p>
                ) : (
                  <div className="space-y-2">
                    {selectedTasks
                      .slice()
                      .sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''))
                      .map((tk) => (
                        <div key={tk.id} className="flex items-center justify-between gap-3 rounded-md border p-2">
                          <span className="truncate text-sm">{tk.title}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {tk.due_date && <span className="text-xs text-muted-foreground">{formatDate(tk.due_date)}</span>}
                            <Badge variant={isDone(tk.status) ? 'default' : 'outline'}>{tk.status ?? 'todo'}</Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">{t('pages.userStatistics.projectHistory')}</h3>
                {selectedProjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('pages.userStatistics.noProjects')}</p>
                ) : (
                  <div className="space-y-2">
                    {selectedProjects.map((pj) => (
                      <div key={pj.id} className="flex items-center justify-between gap-3 rounded-md border p-2">
                        <span className="truncate text-sm">{pj.name}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-muted-foreground">{pj.progress ?? 0}%</span>
                          <Badge variant="outline">{pj.status ?? 'Planning'}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default UserStatistics
