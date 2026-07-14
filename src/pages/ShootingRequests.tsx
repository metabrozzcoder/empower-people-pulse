import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Camera, Plus, MapPin, Calendar, AlertTriangle, CheckCircle2, XCircle, ArrowRight, Inbox, User as UserIcon, Truck, Package, ShieldCheck, Loader2, History, Users, Video, ClipboardCheck, Gavel } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { formatDateTime } from '@/lib/date'

interface VehicleOption {
  id: string
  plate_number: string
  model: string | null
  make: string | null
  status: string | null
  assigned_driver_id: string | null
  driver_name?: string
}

type WorkflowStatus =
  | 'pending_moderator'
  | 'pending_director'
  | 'pending_equipment'
  | 'pending_driver'
  | 'scheduled'
  | 'completed'
  | 'declined'

type WorkflowRole = 'shooting_moderator' | 'director' | 'tech_supply' | 'driver'

interface ShootingRow {
  id: string
  title: string
  description: string | null
  location: string | null
  scheduled_date: string | null
  requester_id: string | null
  workflow_status: WorkflowStatus
  sensitive: boolean
  moderator_id: string | null
  moderator_note: string | null
  moderator_decided_at: string | null
  director_id: string | null
  director_note: string | null
  director_decided_at: string | null
  tech_supply_id: string | null
  equipment_note: string | null
  equipment_assigned_at: string | null
  driver_id: string | null
  vehicle_info: string | null
  driver_assigned_at: string | null
  decline_reason: string | null
  created_at: string
  updated_at: string
}

interface HistoryRow {
  id: string
  request_id: string
  actor_id: string | null
  action: string
  from_status: string | null
  to_status: string | null
  note: string | null
  created_at: string
}

const STATUS_LABEL: Record<WorkflowStatus, string> = {
  pending_moderator: 'Awaiting moderator',
  pending_director: 'Awaiting director',
  pending_equipment: 'Awaiting equipment',
  pending_driver: 'Awaiting driver',
  scheduled: 'Scheduled',
  completed: 'Completed',
  declined: 'Declined',
}

const STATUS_TONE: Record<WorkflowStatus, string> = {
  pending_moderator: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
  pending_director: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
  pending_equipment: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  pending_driver: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
  scheduled: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  completed: 'bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30',
  declined: 'bg-destructive/15 text-destructive border-destructive/30',
}

const STAGE_ORDER: WorkflowStatus[] = [
  'pending_moderator',
  'pending_director',
  'pending_equipment',
  'pending_driver',
  'scheduled',
  'completed',
]

function stageRoleFor(status: WorkflowStatus): WorkflowRole | null {
  switch (status) {
    case 'pending_moderator': return 'shooting_moderator'
    case 'pending_director': return 'director'
    case 'pending_equipment': return 'tech_supply'
    case 'pending_driver': return 'driver'
    default: return null
  }
}

export default function ShootingRequests() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { currentUser } = useAuth()
  const userId = currentUser?.id

  const [roles, setRoles] = useState<string[]>([])
  const [requests, setRequests] = useState<ShootingRow[]>([])
  const [history, setHistory] = useState<HistoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState<Record<string, { name: string; email: string }>>({})

  const [tab, setTab] = useState('inbox')
  const [selected, setSelected] = useState<ShootingRow | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', location: '', scheduled_date: '', sensitive: false })
  const [actionNote, setActionNote] = useState('')
  const [vehicleInfo, setVehicleInfo] = useState('')
  const [equipmentNote, setEquipmentNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [vehicles, setVehicles] = useState<VehicleOption[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('')

  const isAdmin = currentUser?.role === 'Admin' || roles.includes('admin')
  const isModerator = isAdmin || roles.includes('shooting_moderator')
  const isDirector = isAdmin || roles.includes('director')
  const isTechSupply = isAdmin || roles.includes('tech_supply')
  const isDriver = isAdmin || roles.includes('driver')

  const loadRoles = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase.from('user_roles').select('role').eq('user_id', userId)
    setRoles((data ?? []).map((r: { role: string }) => r.role))
  }, [userId])

  const loadRequests = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('shooting_requests')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      toast({ title: 'Failed to load requests', description: error.message, variant: 'destructive' })
    } else {
      setRequests((data ?? []) as ShootingRow[])
      const ids = new Set<string>()
      ;(data ?? []).forEach((r: { requester_id: string | null; moderator_id: string | null; director_id: string | null; tech_supply_id: string | null; driver_id: string | null }) => {
        if (r.requester_id) ids.add(r.requester_id)
        if (r.moderator_id) ids.add(r.moderator_id)
        if (r.director_id) ids.add(r.director_id)
        if (r.tech_supply_id) ids.add(r.tech_supply_id)
        if (r.driver_id) ids.add(r.driver_id)
      })
      if (ids.size > 0) {
        const { data: ps } = await supabase.from('profiles_public' as never).select('id,name').in('id', Array.from(ids))
        const map: Record<string, { name: string; email: string }> = {}
        ;(ps ?? []).forEach((p: any) => { map[p.id] = { name: p.name, email: '' } })
        setProfiles((prev) => ({ ...prev, ...map }))
      }
    }
    setLoading(false)
  }, [toast])

  const loadHistory = useCallback(async (requestId: string) => {
    const { data } = await supabase
      .from('shooting_request_history')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: false })
    setHistory((data ?? []) as HistoryRow[])
  }, [])

  const loadVehicles = useCallback(async () => {
    const { data: vs } = await supabase
      .from('vehicles')
      .select('id, plate_number, model, make, status, assigned_driver_id')
      .order('plate_number', { ascending: true })
    const list = (vs ?? []) as VehicleOption[]
    const driverIds = Array.from(new Set(list.map((v) => v.assigned_driver_id).filter(Boolean))) as string[]
    if (driverIds.length) {
      const { data: ps } = await supabase.from('profiles_public' as never).select('id,name').in('id', driverIds)
      const map: Record<string, string> = {}
      ;(ps ?? []).forEach((p: any) => { map[p.id] = p.name })
      list.forEach((v) => { if (v.assigned_driver_id) v.driver_name = map[v.assigned_driver_id] })
    }
    setVehicles(list)
  }, [])

  useEffect(() => {
    loadRoles()
    loadRequests()
    loadVehicles()
  }, [loadRoles, loadRequests, loadVehicles])

  useEffect(() => {
    if (selected) loadHistory(selected.id)
  }, [selected, loadHistory])

  const recordHistory = async (requestId: string, action: string, from: string, to: string, note?: string) => {
    if (!userId) return
    await supabase.from('shooting_request_history').insert({
      request_id: requestId,
      actor_id: userId,
      action,
      from_status: from,
      to_status: to,
      note: note ?? null,
    })
  }

  const myRequests = useMemo(() => requests.filter((r) => r.requester_id === userId), [requests, userId])

  const inbox = useMemo(() => {
    if (isAdmin) return requests.filter((r) => r.workflow_status.startsWith('pending_'))
    return requests.filter((r) => {
      const role = stageRoleFor(r.workflow_status)
      if (!role) return false
      if (role === 'shooting_moderator' && isModerator) return true
      if (role === 'director' && isDirector) return true
      if (role === 'tech_supply' && isTechSupply) return true
      if (role === 'driver' && isDriver) return true
      return false
    })
  }, [requests, isAdmin, isModerator, isDirector, isTechSupply, isDriver])

  const handleCreate = async () => {
    if (!userId) {
      toast({ title: 'Sign in required', variant: 'destructive' })
      return
    }
    if (!form.title.trim()) {
      toast({ title: 'Title required', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    const { data, error } = await supabase
      .from('shooting_requests')
      .insert({
        title: form.title,
        description: form.description || null,
        location: form.location || null,
        scheduled_date: form.scheduled_date || null,
        sensitive: form.sensitive,
        requester_id: userId,
        workflow_status: 'pending_moderator',
        status: 'pending',
      })
      .select('*')
      .single()
    setSubmitting(false)
    if (error) {
      toast({ title: 'Failed to create', description: error.message, variant: 'destructive' })
      return
    }
    await recordHistory(data.id, 'created', '', 'pending_moderator', form.sensitive ? 'Marked sensitive' : undefined)
    toast({ title: 'Request submitted', description: 'Sent to the shooting moderator.' })
    setCreateOpen(false)
    setForm({ title: '', description: '', location: '', scheduled_date: '', sensitive: false })
    loadRequests()
  }

  const transition = async (
    req: ShootingRow,
    next: WorkflowStatus,
    extra: Partial<ShootingRow>,
    action: string,
    note?: string,
  ) => {
    setSubmitting(true)
    const { error } = await supabase
      .from('shooting_requests')
      .update({ workflow_status: next, ...extra, updated_at: new Date().toISOString() })
      .eq('id', req.id)
    if (error) {
      setSubmitting(false)
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' })
      return
    }
    await recordHistory(req.id, action, req.workflow_status, next, note)
    setSubmitting(false)
    setActionNote('')
    setVehicleInfo('')
    setEquipmentNote('')
    toast({ title: 'Updated', description: STATUS_LABEL[next] })
    await loadRequests()
    setSelected((prev) => (prev ? { ...prev, workflow_status: next, ...extra } as ShootingRow : prev))
    if (selected) loadHistory(selected.id)
  }

  const canActOnSelected = (req: ShootingRow): boolean => {
    if (isAdmin) return true
    const role = stageRoleFor(req.workflow_status)
    if (!role) return false
    if (role === 'shooting_moderator') return isModerator
    if (role === 'director') return isDirector
    if (role === 'tech_supply') return isTechSupply
    if (role === 'driver') return isDriver
    return false
  }

  const initials = (name?: string) => (name ?? '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

  const renderCard = (r: ShootingRow) => (
    <Card key={r.id} className="hover:shadow-md transition cursor-pointer" onClick={() => setSelected(r)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate flex items-center gap-2">
              {r.sensitive && <ShieldCheck className="w-4 h-4 text-amber-500" />}
              {r.title}
            </CardTitle>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
              {r.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{r.location}</span>}
              {r.scheduled_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{r.scheduled_date}</span>}
            </div>
          </div>
          <Badge variant="outline" className={STATUS_TONE[r.workflow_status]}>{STATUS_LABEL[r.workflow_status]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {r.description && <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>}
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <Avatar className="w-5 h-5"><AvatarFallback className="text-[10px]">{initials(profiles[r.requester_id ?? '']?.name)}</AvatarFallback></Avatar>
          <span>{profiles[r.requester_id ?? '']?.name ?? 'Unknown'}</span>
        </div>
      </CardContent>
    </Card>
  )

  const stageIdx = (s: WorkflowStatus) => {
    if (s === 'declined') return -1
    return STAGE_ORDER.indexOf(s)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Camera className="w-7 h-7" />Shooting Requests</h1>
          <p className="text-muted-foreground">Submit and route shooting requests through approval, equipment, and dispatch.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />New request
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="inbox"><Inbox className="w-4 h-4 mr-2" />{t('Inbox')} ({inbox.length})</TabsTrigger>
          <TabsTrigger value="mine"><UserIcon className="w-4 h-4 mr-2" />{t('My requests')} ({myRequests.length})</TabsTrigger>
          <TabsTrigger value="all">{t('All')} ({requests.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="inbox" className="space-y-3 mt-4">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : inbox.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">Nothing waiting on you.</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{inbox.map(renderCard)}</div>
          )}
        </TabsContent>
        <TabsContent value="mine" className="space-y-3 mt-4">
          {myRequests.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">You haven't submitted any requests yet.</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{myRequests.map(renderCard)}</div>
          )}
        </TabsContent>
        <TabsContent value="all" className="space-y-3 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{requests.map(renderCard)}</div>
        </TabsContent>
      </Tabs>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New shooting request</DialogTitle>
            <DialogDescription>It will be sent to the shooting moderator for review.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Short title" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What needs to be shot, context, audience..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Scheduled date</Label>
                <Input type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={form.sensitive} onCheckedChange={(c) => setForm({ ...form, sensitive: !!c })} />
              <span>Mark as sensitive (moderator will likely escalate to the director)</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selected.sensitive && <ShieldCheck className="w-5 h-5 text-amber-500" />}
                  {selected.title}
                </DialogTitle>
                <DialogDescription>
                  <Badge variant="outline" className={STATUS_TONE[selected.workflow_status]}>{STATUS_LABEL[selected.workflow_status]}</Badge>
                </DialogDescription>
              </DialogHeader>

              {/* Stage progress */}
              <div className="flex items-center gap-1 text-xs">
                {STAGE_ORDER.slice(0, 5).map((s, i) => {
                  const cur = stageIdx(selected.workflow_status)
                  const done = cur > i || selected.workflow_status === 'completed'
                  const active = cur === i
                  return (
                    <React.Fragment key={s}>
                      <div className={`px-2 py-1 rounded border ${active ? STATUS_TONE[s] : done ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' : 'bg-muted text-muted-foreground border-border'}`}>
                        {STATUS_LABEL[s].replace('Awaiting ', '')}
                      </div>
                      {i < 4 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                    </React.Fragment>
                  )
                })}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-muted-foreground text-xs">Requester</div>{profiles[selected.requester_id ?? '']?.name ?? '—'}</div>
                <div><div className="text-muted-foreground text-xs">Date</div>{selected.scheduled_date ?? '—'}</div>
                <div><div className="text-muted-foreground text-xs">Location</div>{selected.location ?? '—'}</div>
                <div><div className="text-muted-foreground text-xs">Created</div>{formatDateTime(selected.created_at)}</div>
              </div>
              {selected.description && (
                <div className="text-sm"><div className="text-muted-foreground text-xs mb-1">Description</div>{selected.description}</div>
              )}

              {/* Stage summaries */}
              {selected.moderator_note && (
                <div className="text-sm rounded-md border p-2"><div className="text-xs text-muted-foreground">Moderator note</div>{selected.moderator_note}</div>
              )}
              {selected.director_note && (
                <div className="text-sm rounded-md border p-2"><div className="text-xs text-muted-foreground">Director note</div>{selected.director_note}</div>
              )}
              {selected.equipment_note && (
                <div className="text-sm rounded-md border p-2"><div className="text-xs text-muted-foreground flex items-center gap-1"><Package className="w-3 h-3" />Equipment</div>{selected.equipment_note}</div>
              )}
              {selected.vehicle_info && (
                <div className="text-sm rounded-md border p-2"><div className="text-xs text-muted-foreground flex items-center gap-1"><Truck className="w-3 h-3" />Vehicle / driver</div>{selected.vehicle_info}</div>
              )}
              {selected.decline_reason && (
                <div className="text-sm rounded-md border border-destructive/30 bg-destructive/5 p-2"><div className="text-xs text-destructive flex items-center gap-1"><XCircle className="w-3 h-3" />Declined</div>{selected.decline_reason}</div>
              )}

              {/* Stage actions */}
              {canActOnSelected(selected) && selected.workflow_status === 'pending_moderator' && (
                <div className="space-y-2 border-t pt-3">
                  <Label className="text-xs">Moderator note (optional)</Label>
                  <Textarea value={actionNote} onChange={(e) => setActionNote(e.target.value)} placeholder="Notes for next stage…" />
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" disabled={submitting} onClick={() => transition(selected, 'pending_equipment', { moderator_id: userId!, moderator_note: actionNote || null, moderator_decided_at: new Date().toISOString() }, 'moderator_approved', actionNote)}>
                      <CheckCircle2 className="w-4 h-4 mr-1" />Approve → Equipment
                    </Button>
                    <Button size="sm" variant="secondary" disabled={submitting} onClick={() => transition(selected, 'pending_director', { moderator_id: userId!, moderator_note: actionNote || null, moderator_decided_at: new Date().toISOString() }, 'escalated_to_director', actionNote)}>
                      <AlertTriangle className="w-4 h-4 mr-1" />Escalate to Director
                    </Button>
                    <Button size="sm" variant="destructive" disabled={submitting || !actionNote.trim()} onClick={() => transition(selected, 'declined', { moderator_id: userId!, decline_reason: actionNote, moderator_decided_at: new Date().toISOString() }, 'moderator_declined', actionNote)}>
                      <XCircle className="w-4 h-4 mr-1" />Decline
                    </Button>
                  </div>
                </div>
              )}

              {canActOnSelected(selected) && selected.workflow_status === 'pending_director' && (
                <div className="space-y-2 border-t pt-3">
                  <Label className="text-xs">Director note</Label>
                  <Textarea value={actionNote} onChange={(e) => setActionNote(e.target.value)} />
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" disabled={submitting} onClick={() => transition(selected, 'pending_equipment', { director_id: userId!, director_note: actionNote || null, director_decided_at: new Date().toISOString() }, 'director_approved', actionNote)}>
                      <CheckCircle2 className="w-4 h-4 mr-1" />Approve → Equipment
                    </Button>
                    <Button size="sm" variant="destructive" disabled={submitting || !actionNote.trim()} onClick={() => transition(selected, 'declined', { director_id: userId!, decline_reason: actionNote, director_decided_at: new Date().toISOString() }, 'director_declined', actionNote)}>
                      <XCircle className="w-4 h-4 mr-1" />Decline
                    </Button>
                  </div>
                </div>
              )}

              {canActOnSelected(selected) && selected.workflow_status === 'pending_equipment' && (
                <div className="space-y-2 border-t pt-3">
                  <Label className="text-xs">Equipment provided</Label>
                  <Textarea value={equipmentNote} onChange={(e) => setEquipmentNote(e.target.value)} placeholder="List equipment assigned (e.g. 2× Sony A7, 1× boom mic, tripod)…" />
                  <Button size="sm" disabled={submitting || !equipmentNote.trim()} onClick={() => transition(selected, 'pending_driver', { tech_supply_id: userId!, equipment_note: equipmentNote, equipment_assigned_at: new Date().toISOString() }, 'equipment_assigned', equipmentNote)}>
                    <Package className="w-4 h-4 mr-1" />Mark provided → Driver
                  </Button>
                </div>
              )}

              {canActOnSelected(selected) && selected.workflow_status === 'pending_driver' && (() => {
                const availableVehicles = vehicles.filter((v) => v.assigned_driver_id && (v.status ?? 'available').toLowerCase() !== 'maintenance')
                const chosen = availableVehicles.find((v) => v.id === selectedVehicleId)
                return (
                  <div className="space-y-2 border-t pt-3">
                    <Label className="text-xs">Available vehicle (with bound driver)</Label>
                    {availableVehicles.length === 0 ? (
                      <div className="text-xs text-muted-foreground border rounded p-2">No vehicles with an assigned driver. Add one in Drivers & Garage first.</div>
                    ) : (
                      <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                        <SelectTrigger><SelectValue placeholder="Select vehicle & driver" /></SelectTrigger>
                        <SelectContent>
                          {availableVehicles.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.plate_number} · {[v.make, v.model].filter(Boolean).join(' ') || 'Vehicle'} — {v.driver_name ?? 'Driver'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Label className="text-xs">Notes (optional)</Label>
                    <Textarea value={vehicleInfo} onChange={(e) => setVehicleInfo(e.target.value)} placeholder="Pickup time, meeting point…" />
                    <Button size="sm" disabled={submitting || !chosen} onClick={() => {
                      if (!chosen) return
                      const label = `${chosen.plate_number} · ${[chosen.make, chosen.model].filter(Boolean).join(' ')} — ${chosen.driver_name ?? 'Driver'}${vehicleInfo ? ` · ${vehicleInfo}` : ''}`
                      transition(selected, 'scheduled', { driver_id: chosen.assigned_driver_id!, vehicle_info: label, driver_assigned_at: new Date().toISOString() }, 'driver_assigned', label)
                      setSelectedVehicleId('')
                    }}>
                      <Truck className="w-4 h-4 mr-1" />Assign & schedule
                    </Button>
                  </div>
                )
              })()}

              {canActOnSelected(selected) && selected.workflow_status === 'scheduled' && (
                <div className="space-y-2 border-t pt-3">
                  <Button size="sm" disabled={submitting} onClick={() => transition(selected, 'completed', {}, 'completed')}>
                    <CheckCircle2 className="w-4 h-4 mr-1" />Mark completed
                  </Button>
                </div>
              )}

              {/* History */}
              {history.length > 0 && (
                <div className="border-t pt-3">
                  <div className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-2"><History className="w-3 h-3" />Activity</div>
                  <div className="space-y-2">
                    {history.map((h) => (
                      <div key={h.id} className="text-xs flex items-start gap-2">
                        <div className="text-muted-foreground whitespace-nowrap">{formatDateTime(h.created_at)}</div>
                        <div>
                          <span className="font-medium">{profiles[h.actor_id ?? '']?.name ?? 'System'}</span>
                          {' · '}{h.action.replace(/_/g, ' ')}
                          {h.note && <span className="text-muted-foreground"> — {h.note}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
