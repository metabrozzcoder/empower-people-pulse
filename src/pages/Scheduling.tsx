import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Clock, Plus, MapPin, Trash2, Edit } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface ShiftRow {
  id: string
  employee_id: string | null
  employee_name: string | null
  date: string
  start_time: string
  end_time: string
  role: string | null
  location: string | null
  status: string
  notes: string | null
}

interface ProfileOption { id: string; name: string }

const STATUS_OPTS = ['Scheduled', 'In Progress', 'Completed', 'Cancelled']

const statusColor = (s: string) =>
  s === 'In Progress' ? 'bg-green-500/15 text-green-700'
  : s === 'Completed' ? 'bg-gray-500/15 text-gray-700'
  : s === 'Cancelled' ? 'bg-red-500/15 text-red-700'
  : 'bg-blue-500/15 text-blue-700'

const emptyForm = {
  employee_id: '',
  date: new Date().toISOString().split('T')[0],
  start_time: '09:00',
  end_time: '17:00',
  role: '',
  location: '',
  status: 'Scheduled',
  notes: '',
}

const Scheduling = () => {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [shifts, setShifts] = useState<ShiftRow[]>([])
  const [profiles, setProfiles] = useState<ProfileOption[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ShiftRow | null>(null)
  const [form, setForm] = useState({ ...emptyForm })

  const load = async () => {
    setLoading(true)
    const [{ data: s }, { data: p }] = await Promise.all([
      supabase.from('shifts').select('*').order('date', { ascending: true }),
      supabase.from('profiles').select('id, name'),
    ])
    setShifts((s as ShiftRow[]) ?? [])
    setProfiles((p as ProfileOption[]) ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm })
    setDialogOpen(true)
  }
  const openEdit = (s: ShiftRow) => {
    setEditing(s)
    setForm({
      employee_id: s.employee_id ?? '',
      date: s.date,
      start_time: s.start_time,
      end_time: s.end_time,
      role: s.role ?? '',
      location: s.location ?? '',
      status: s.status,
      notes: s.notes ?? '',
    })
    setDialogOpen(true)
  }

  const save = async () => {
    if (!form.employee_id) return toast({ title: 'Employee required', variant: 'destructive' })
    const employee_name = profiles.find(p => p.id === form.employee_id)?.name ?? null
    const payload = { ...form, employee_name }
    if (editing) {
      const { error } = await supabase.from('shifts').update(payload).eq('id', editing.id)
      if (error) return toast({ title: 'Update failed', description: error.message, variant: 'destructive' })
      toast({ title: 'Shift updated' })
    } else {
      const { error } = await supabase.from('shifts').insert(payload)
      if (error) return toast({ title: 'Create failed', description: error.message, variant: 'destructive' })
      toast({ title: 'Shift created' })
    }
    setDialogOpen(false)
    await load()
  }

  const remove = async (id: string) => {
    const { error } = await supabase.from('shifts').delete().eq('id', id)
    if (error) return toast({ title: 'Delete failed', description: error.message, variant: 'destructive' })
    toast({ title: 'Shift deleted' })
    await load()
  }

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('shifts').update({ status }).eq('id', id)
    if (error) return toast({ title: 'Update failed', description: error.message, variant: 'destructive' })
    await load()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('pages.scheduling.title')}</h1>
          <p className="text-muted-foreground">{t('pages.scheduling.subtitle')}</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add Shift</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {STATUS_OPTS.map(s => (
          <Card key={s}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{shifts.filter(x => x.status === s).length}</div>
              <div className="text-sm text-muted-foreground">{s}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Shifts</CardTitle>
          <CardDescription>Live from the database</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : shifts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No shifts scheduled yet.</p>
          ) : (
            <div className="space-y-3">
              {shifts.map(s => (
                <Card key={s.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4 flex justify-between items-start gap-4">
                    <div className="flex items-start space-x-3 flex-1">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>{(s.employee_name ?? '?').split(' ').map(n => n[0]).join('').slice(0,2)}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <p className="font-semibold">{s.employee_name ?? 'Unassigned'}</p>
                        {s.role && <p className="text-sm text-muted-foreground">{s.role}</p>}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(s.date).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.start_time} – {s.end_time}</span>
                          {s.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.location}</span>}
                        </div>
                        {s.notes && <p className="text-xs text-muted-foreground">{s.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColor(s.status)}>{s.status}</Badge>
                      <Select value={s.status} onValueChange={(v) => updateStatus(s.id, v)}>
                        <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{STATUS_OPTS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(s)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => remove(s.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Shift' : 'Add New Shift'}</DialogTitle>
            <DialogDescription>{editing ? 'Update shift details' : 'Create a new shift'}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>{profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Role / Position</Label>
              <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_OPTS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? 'Update' : 'Create'} Shift</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Scheduling
