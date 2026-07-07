import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar as CalIcon, Clock, Plus, Trash2, Edit, ChevronLeft, ChevronRight, Bell, CalendarDays, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { formatDate, formatMonthYear } from '@/lib/date'

const MONTH_KEYS = [0,1,2,3,4,5,6,7,8,9,10,11]

interface Reminder {
  id: string
  user_id: string
  title: string
  description: string | null
  date: string
  time: string | null
  type: string
  color: string
  completed: boolean
}

const TYPES = [
  { value: 'reminder', label: 'Reminder', color: 'bg-blue-500' },
  { value: 'event', label: 'Event', color: 'bg-purple-500' },
  { value: 'meeting', label: 'Meeting', color: 'bg-emerald-500' },
  { value: 'task', label: 'Task', color: 'bg-amber-500' },
]

const typeMeta = (t: string) => TYPES.find(x => x.value === t) ?? TYPES[0]

const toDateStr = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const emptyForm = {
  title: '',
  description: '',
  date: toDateStr(new Date()),
  time: '',
  type: 'reminder',
}

const Scheduling = () => {
  const { t, i18n } = useTranslation()
  const locale = (i18n.language ?? 'en').split('-')[0]
  const monthNames = useMemo(() => {
    try {
      const fmt = new Intl.DateTimeFormat(locale, { month: 'long' })
      return MONTH_KEYS.map(i => fmt.format(new Date(2020, i, 1)))
    } catch {
      return ['January','February','March','April','May','June','July','August','September','October','November','December']
    }
  }, [locale])
  const weekdayNames = useMemo(() => {
    try {
      const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' })
      // Monday..Sunday
      return [1,2,3,4,5,6,7].map(d => fmt.format(new Date(2024, 0, d)))
    } catch {
      return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
    }
  }, [locale])
  const { toast } = useToast()
  const [items, setItems] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Reminder | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [cursor, setCursor] = useState(new Date())
  const [selected, setSelected] = useState<string>(toDateStr(new Date()))
  const [userId, setUserId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id ?? null
    setUserId(uid)
    if (!uid) { setItems([]); setLoading(false); return }
    const { data, error } = await (supabase as any)
      .from('reminders')
      .select('*')
      .eq('user_id', uid)
      .order('date', { ascending: true })
    if (error) toast({ title: 'Load failed', description: error.message, variant: 'destructive' })
    const list = ((data as unknown) as Reminder[]) ?? []
    setItems(list)
    setLoading(false)
    scheduleNotifications(list)
  }

  // ---- Notifications ----
  const timersRef = useRef<number[]>([])

  const notify = (r: Reminder) => {
    toast({ title: `🔔 ${r.title}`, description: r.description ?? (r.time ? `Scheduled for ${r.time}` : 'Reminder') })
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try { new Notification(r.title, { body: r.description ?? (r.time ?? ''), tag: r.id }) } catch { /* ignore */ }
    }
  }

  const scheduleNotifications = (list: Reminder[]) => {
    timersRef.current.forEach((id) => clearTimeout(id))
    timersRef.current = []
    if (typeof window === 'undefined') return
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
    const now = Date.now()
    const horizon = now + 24 * 60 * 60 * 1000
    list.forEach((r) => {
      if (r.completed) return
      const when = new Date(`${r.date}T${(r.time && r.time.length ? r.time : '09:00')}:00`).getTime()
      if (isNaN(when)) return
      if (when > now && when <= horizon) {
        const tid = window.setTimeout(() => notify(r), when - now)
        timersRef.current.push(tid)
      }
    })
  }

  useEffect(() => { load(); return () => { timersRef.current.forEach((id: number) => clearTimeout(id)) } }, [])

  const openCreate = (dateStr?: string) => {
    setEditing(null)
    setForm({ ...emptyForm, date: dateStr ?? selected })
    setDialogOpen(true)
  }
  const openEdit = (r: Reminder) => {
    setEditing(r)
    setForm({
      title: r.title,
      description: r.description ?? '',
      date: r.date,
      time: r.time ?? '',
      type: r.type,
    })
    setDialogOpen(true)
  }

  const save = async () => {
    if (!userId) return toast({ title: 'Sign in required', variant: 'destructive' })
    if (!form.title.trim()) return toast({ title: 'Title required', variant: 'destructive' })
    const payload = {
      user_id: userId,
      title: form.title.trim(),
      description: form.description || null,
      date: form.date,
      time: form.time || null,
      type: form.type,
      color: typeMeta(form.type).color,
    }
    if (editing) {
      const { error } = await (supabase as any).from('reminders').update(payload).eq('id', editing.id)
      if (error) return toast({ title: 'Update failed', description: error.message, variant: 'destructive' })
      toast({ title: 'Updated' })
    } else {
      const { error } = await (supabase as any).from('reminders').insert(payload)
      if (error) return toast({ title: 'Create failed', description: error.message, variant: 'destructive' })
      toast({ title: 'Created' })
    }
    setDialogOpen(false)
    await load()
  }

  const remove = async (id: string) => {
    const { error } = await (supabase as any).from('reminders').delete().eq('id', id)
    if (error) return toast({ title: 'Delete failed', description: error.message, variant: 'destructive' })
    toast({ title: 'Deleted' })
    await load()
  }

  const toggleDone = async (r: Reminder) => {
    const { error } = await (supabase as any).from('reminders').update({ completed: !r.completed }).eq('id', r.id)
    if (error) return toast({ title: 'Update failed', description: error.message, variant: 'destructive' })
    await load()
  }

  // Build calendar grid (Mon-Sun)
  const grid = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const startWeekday = (first.getDay() + 6) % 7 // 0 = Monday
    const start = new Date(first)
    start.setDate(first.getDate() - startWeekday)
    const days: Date[] = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      days.push(d)
    }
    return days
  }, [cursor])

  const byDate = useMemo(() => {
    const m = new Map<string, Reminder[]>()
    for (const r of items) {
      const list = m.get(r.date) ?? []
      list.push(r)
      m.set(r.date, list)
    }
    return m
  }, [items])

  const todayStr = toDateStr(new Date())
  const upcoming = useMemo(
    () => [...items]
      .filter(r => !r.completed && r.date >= todayStr)
      .sort((a, b) => (a.date + (a.time ?? '')).localeCompare(b.date + (b.time ?? '')))
      .slice(0, 6),
    [items, todayStr]
  )
  const dayItems = (byDate.get(selected) ?? []).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))

  const monthLabel = formatMonthYear(cursor, locale)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Calendar</h1>
          <p className="text-muted-foreground">Personal reminders and events</p>
        </div>
        <Button onClick={() => openCreate()}><Plus className="w-4 h-4 mr-2" />Add Reminder</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4">
          <div className="text-2xl font-bold">{items.filter(i => i.date === todayStr && !i.completed).length}</div>
          <div className="text-sm text-muted-foreground flex items-center gap-1"><Bell className="w-3 h-3" />Today</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-2xl font-bold">{items.filter(i => i.date > todayStr && !i.completed).length}</div>
          <div className="text-sm text-muted-foreground flex items-center gap-1"><CalendarDays className="w-3 h-3" />Upcoming</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-2xl font-bold">{items.filter(i => i.completed).length}</div>
          <div className="text-sm text-muted-foreground flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Completed</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-2xl font-bold">{items.length}</div>
          <div className="text-sm text-muted-foreground">Total</div>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 flex-wrap gap-2">
            <CardTitle className="capitalize">{monthLabel}</CardTitle>
            <div className="flex items-center gap-1 flex-wrap">
              <Select value={String(cursor.getMonth())} onValueChange={(v) => setCursor(new Date(cursor.getFullYear(), Number(v), 1))}>
                <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => <SelectItem key={m} value={String(i)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={String(cursor.getFullYear())} onValueChange={(v) => setCursor(new Date(Number(v), cursor.getMonth(), 1))}>
                <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => { const n = new Date(); setCursor(n); setSelected(toDateStr(n)) }}>Today</Button>
              <Button variant="ghost" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 text-xs text-muted-foreground mb-2">
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <div key={d} className="text-center py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {grid.map((d, idx) => {
                const ds = toDateStr(d)
                const inMonth = d.getMonth() === cursor.getMonth()
                const isToday = ds === todayStr
                const isSelected = ds === selected
                const dayList = byDate.get(ds) ?? []
                return (
                  <button
                    key={idx}
                    onClick={() => setSelected(ds)}
                    onDoubleClick={() => openCreate(ds)}
                    className={cn(
                      'min-h-16 sm:min-h-20 rounded-md border p-1 text-left transition-colors hover:bg-accent',
                      !inMonth && 'opacity-40',
                      isSelected && 'ring-2 ring-primary',
                      isToday && 'bg-primary/5 border-primary/30'
                    )}
                  >
                    <div className={cn('text-xs font-medium', isToday && 'text-primary')}>{d.getDate()}</div>
                    <div className="mt-1 space-y-0.5">
                      {dayList.slice(0, 3).map(r => (
                        <div key={r.id} className={cn('h-1.5 rounded-full', typeMeta(r.type).color, r.completed && 'opacity-40')} />
                      ))}
                      {dayList.length > 3 && <div className="text-[10px] text-muted-foreground">+{dayList.length - 3}</div>}
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{formatDate(selected + 'T00:00:00')}</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => openCreate(selected)}><Plus className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : dayItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nothing scheduled.</p>
            ) : (
              dayItems.map(r => (
                <div key={r.id} className="flex items-start gap-2 p-2 rounded-md border bg-card hover:bg-accent/50">
                  <Checkbox checked={r.completed} onCheckedChange={() => toggleDone(r)} className="mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('w-2 h-2 rounded-full', typeMeta(r.type).color)} />
                      <p className={cn('font-medium text-sm truncate', r.completed && 'line-through text-muted-foreground')}>{r.title}</p>
                    </div>
                    {r.time && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{r.time}</p>}
                    {r.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(r)}><Edit className="w-3 h-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => remove(r.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="w-4 h-4" />Upcoming</CardTitle></CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No upcoming reminders.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {upcoming.map(r => (
                <div key={r.id} className="p-3 rounded-md border flex items-start gap-3">
                  <div className={cn('w-1 self-stretch rounded-full', typeMeta(r.type).color)} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <CalIcon className="w-3 h-3" />{formatDate(r.date + 'T00:00:00')}
                      {r.time && <><Clock className="w-3 h-3 ml-1" />{r.time}</>}
                    </p>
                    <Badge variant="secondary" className="mt-2 text-[10px]">{typeMeta(r.type).label}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Reminder' : 'New Reminder'}</DialogTitle>
            <DialogDescription>{editing ? 'Update your reminder' : 'Create a personal reminder or event'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Doctor appointment" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !form.date && 'text-muted-foreground')}>
                      <CalIcon className="mr-2 h-4 w-4" />
                      {form.date ? format(new Date(form.date + 'T00:00:00'), 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.date ? new Date(form.date + 'T00:00:00') : undefined}
                      onSelect={(d) => d && setForm({ ...form, date: toDateStr(d) })}
                      captionLayout="dropdown-buttons"
                      fromYear={new Date().getFullYear() - 5}
                      toYear={new Date().getFullYear() + 10}
                      defaultMonth={form.date ? new Date(form.date + 'T00:00:00') : new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Time (optional)</Label>
                <Input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center gap-2">
                        <span className={cn('w-2 h-2 rounded-full', t.color)} />{t.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Scheduling
