import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { useUsers } from '@/context/UserContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Car, MapPin, Clock, X, Check } from 'lucide-react'
import { toast } from 'sonner'

interface RideOrder {
  id: string
  requester_id: string
  pickup_location: string
  dropoff_location: string
  pickup_time: string
  purpose: string | null
  notes: string | null
  status: string
  vehicle_id: string | null
  driver_id: string | null
  assigned_by: string | null
  assigned_at: string | null
  completed_at: string | null
  created_at: string
}

interface VehicleLite { id: string; plate_number: string; make: string | null; model: string | null; assigned_driver_id: string | null; status: string }

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300',
  assigned: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  in_progress: 'bg-purple-500/15 text-purple-700 dark:text-purple-300',
  completed: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  cancelled: 'bg-muted text-muted-foreground',
  rejected: 'bg-red-500/15 text-red-700 dark:text-red-300',
}

export default function RideOrdersPanel() {
  const { currentUser } = useAuth()
  const { users } = useUsers()
  const [orders, setOrders] = useState<RideOrder[]>([])
  const [vehicles, setVehicles] = useState<VehicleLite[]>([])
  const [isDispatcher, setIsDispatcher] = useState(false)
  const [driverIds, setDriverIds] = useState<string[]>([])

  const [orderOpen, setOrderOpen] = useState(false)
  const [oForm, setOForm] = useState({ pickup_location: '', dropoff_location: '', pickup_time: '', purpose: '', notes: '' })

  const [assignOpen, setAssignOpen] = useState(false)
  const [assignRow, setAssignRow] = useState<RideOrder | null>(null)
  const [aVehicleId, setAVehicleId] = useState<string>('')
  const [aDriverId, setADriverId] = useState<string>('')

  const load = useCallback(async () => {
    const [o, v, dr] = await Promise.all([
      supabase.from('ride_orders').select('*').order('created_at', { ascending: false }),
      supabase.from('vehicles').select('id, plate_number, make, model, assigned_driver_id, status'),
      supabase.from('user_roles').select('user_id, role').in('role', ['driver', 'head_of_drivers'] as any),
    ])
    setOrders((o.data ?? []) as any)
    setVehicles((v.data ?? []) as any)
    const dset = new Set<string>()
    ;((dr.data ?? []) as any[]).forEach(r => { if (r.role === 'driver') dset.add(r.user_id) })
    setDriverIds(Array.from(dset))
    if (currentUser?.id) {
      const isAdmin = currentUser.role === 'Admin'
      const hasHod = (dr.data ?? []).some((r: any) => r.user_id === currentUser.id && r.role === 'head_of_drivers')
      setIsDispatcher(isAdmin || hasHod)
    }
  }, [currentUser])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const ch = supabase
      .channel('ride_orders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ride_orders' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [load])

  const openNewOrder = () => {
    const dt = new Date(); dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset() + 60)
    setOForm({ pickup_location: '', dropoff_location: '', pickup_time: dt.toISOString().slice(0, 16), purpose: '', notes: '' })
    setOrderOpen(true)
  }

  const submitOrder = async () => {
    if (!currentUser?.id) { toast.error('Not signed in'); return }
    if (!oForm.pickup_location.trim() || !oForm.dropoff_location.trim() || !oForm.pickup_time) {
      toast.error('Pickup, drop-off and time are required'); return
    }
    const { error } = await supabase.from('ride_orders').insert({
      requester_id: currentUser.id,
      pickup_location: oForm.pickup_location,
      dropoff_location: oForm.dropoff_location,
      pickup_time: new Date(oForm.pickup_time).toISOString(),
      purpose: oForm.purpose || null,
      notes: oForm.notes || null,
      status: 'pending',
    })
    if (error) { toast.error(error.message); return }
    toast.success('Ride requested')
    setOrderOpen(false); await load()
  }

  const openAssign = (r: RideOrder) => {
    setAssignRow(r)
    setAVehicleId(r.vehicle_id ?? '')
    setADriverId(r.driver_id ?? '')
    setAssignOpen(true)
  }

  const availableVehiclesForTime = (pickupISO: string) => {
    const busyIds = new Set(
      orders
        .filter(o => ['assigned', 'in_progress'].includes(o.status) && o.vehicle_id && o.id !== assignRow?.id)
        .filter(o => Math.abs(new Date(o.pickup_time).getTime() - new Date(pickupISO).getTime()) < 2 * 60 * 60 * 1000)
        .map(o => o.vehicle_id as string),
    )
    return vehicles.filter(v => v.status === 'Active' && !busyIds.has(v.id))
  }

  const availableDriversForTime = (pickupISO: string) => {
    const busyIds = new Set(
      orders
        .filter(o => ['assigned', 'in_progress'].includes(o.status) && o.driver_id && o.id !== assignRow?.id)
        .filter(o => Math.abs(new Date(o.pickup_time).getTime() - new Date(pickupISO).getTime()) < 2 * 60 * 60 * 1000)
        .map(o => o.driver_id as string),
    )
    return users.filter(u => driverIds.includes(u.id) && !busyIds.has(u.id))
  }

  const saveAssign = async () => {
    if (!assignRow || !currentUser?.id) return
    if (!aVehicleId || !aDriverId) { toast.error('Select vehicle and driver'); return }
    const { error } = await supabase.from('ride_orders').update({
      vehicle_id: aVehicleId,
      driver_id: aDriverId,
      assigned_by: currentUser.id,
      assigned_at: new Date().toISOString(),
      status: 'assigned',
    }).eq('id', assignRow.id)
    if (error) { toast.error(error.message); return }
    toast.success('Ride assigned')
    setAssignOpen(false); setAssignRow(null); await load()
  }

  const updateStatus = async (id: string, status: string, extra: Record<string, any> = {}) => {
    const { error } = await supabase.from('ride_orders').update({ status, ...extra }).eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Updated'); await load()
  }

  const nameOf = (id?: string | null) => users.find(u => u.id === id)?.name ?? '—'
  const vehicleLabel = (id?: string | null) => {
    const v = vehicles.find(x => x.id === id); if (!v) return '—'
    return `${v.plate_number}${v.make || v.model ? ` · ${[v.make, v.model].filter(Boolean).join(' ')}` : ''}`
  }

  const myId = currentUser?.id
  const mine = orders.filter(o => o.requester_id === myId)
  const toDispatch = orders.filter(o => o.status === 'pending')
  const active = orders.filter(o => ['assigned', 'in_progress'].includes(o.status))

  return (
    <div className="space-y-6 pt-4">
      <div className="flex justify-end">
        <Button onClick={openNewOrder}><Plus className="w-4 h-4 mr-2" />Order a Ride</Button>
      </div>

      {isDispatcher && (
        <section className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2"><Clock className="w-4 h-4" />Pending requests ({toDispatch.length})</h3>
          <div className="space-y-2">
            {toDispatch.map(o => (
              <RideRow key={o.id} order={o} nameOf={nameOf} vehicleLabel={vehicleLabel}>
                <Button size="sm" onClick={() => openAssign(o)}>Assign</Button>
                <Button size="sm" variant="ghost" onClick={() => updateStatus(o.id, 'rejected')}><X className="w-4 h-4" /></Button>
              </RideRow>
            ))}
            {toDispatch.length === 0 && <p className="text-sm text-muted-foreground">No pending ride requests.</p>}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2"><Car className="w-4 h-4" />Active rides ({active.length})</h3>
        <div className="space-y-2">
          {active.map(o => {
            const isDriver = o.driver_id === myId
            return (
              <RideRow key={o.id} order={o} nameOf={nameOf} vehicleLabel={vehicleLabel}>
                {isDispatcher && <Button size="sm" variant="outline" onClick={() => openAssign(o)}>Reassign</Button>}
                {isDriver && o.status === 'assigned' && (
                  <Button size="sm" onClick={() => updateStatus(o.id, 'in_progress')}>Start</Button>
                )}
                {(isDriver || isDispatcher) && o.status === 'in_progress' && (
                  <Button size="sm" onClick={() => updateStatus(o.id, 'completed', { completed_at: new Date().toISOString() })}>
                    <Check className="w-4 h-4 mr-1" />Complete
                  </Button>
                )}
              </RideRow>
            )
          })}
          {active.length === 0 && <p className="text-sm text-muted-foreground">No active rides.</p>}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2"><MapPin className="w-4 h-4" />My ride orders ({mine.length})</h3>
        <div className="space-y-2">
          {mine.map(o => (
            <RideRow key={o.id} order={o} nameOf={nameOf} vehicleLabel={vehicleLabel}>
              {['pending', 'assigned'].includes(o.status) && o.requester_id === myId && (
                <Button size="sm" variant="ghost" onClick={() => updateStatus(o.id, 'cancelled')}>Cancel</Button>
              )}
            </RideRow>
          ))}
          {mine.length === 0 && <p className="text-sm text-muted-foreground">You haven't ordered any rides yet.</p>}
        </div>
      </section>

      {/* Order dialog */}
      <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Order a Ride</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Pickup location *</Label><Input value={oForm.pickup_location} onChange={e => setOForm({ ...oForm, pickup_location: e.target.value })} /></div>
            <div className="space-y-2"><Label>Drop-off location *</Label><Input value={oForm.dropoff_location} onChange={e => setOForm({ ...oForm, dropoff_location: e.target.value })} /></div>
            <div className="space-y-2"><Label>Pickup time *</Label><Input type="datetime-local" value={oForm.pickup_time} onChange={e => setOForm({ ...oForm, pickup_time: e.target.value })} /></div>
            <div className="space-y-2"><Label>Purpose</Label><Input value={oForm.purpose} onChange={e => setOForm({ ...oForm, purpose: e.target.value })} /></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={oForm.notes} onChange={e => setOForm({ ...oForm, notes: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOrderOpen(false)}>Cancel</Button>
            <Button onClick={submitOrder}>Submit</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Assign vehicle & driver</DialogTitle></DialogHeader>
          {assignRow && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                {new Date(assignRow.pickup_time).toLocaleString()} · {assignRow.pickup_location} → {assignRow.dropoff_location}
              </div>
              <div className="space-y-2">
                <Label>Available vehicles</Label>
                <Select value={aVehicleId} onValueChange={setAVehicleId}>
                  <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                  <SelectContent>
                    {availableVehiclesForTime(assignRow.pickup_time).map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.plate_number} · {[v.make, v.model].filter(Boolean).join(' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Available drivers</Label>
                <Select value={aDriverId} onValueChange={setADriverId}>
                  <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
                  <SelectContent>
                    {availableDriversForTime(assignRow.pickup_time).map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={saveAssign}>Assign</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function RideRow({ order, nameOf, vehicleLabel, children }: {
  order: RideOrder
  nameOf: (id?: string | null) => string
  vehicleLabel: (id?: string | null) => string
  children?: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[240px] grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
          <div><p className="text-muted-foreground text-xs">Requester</p><p className="font-medium">{nameOf(order.requester_id)}</p></div>
          <div><p className="text-muted-foreground text-xs">When</p><p className="font-medium">{new Date(order.pickup_time).toLocaleString()}</p></div>
          <div className="md:col-span-2"><p className="text-muted-foreground text-xs">Route</p><p className="font-medium truncate">{order.pickup_location} → {order.dropoff_location}</p></div>
          <div><p className="text-muted-foreground text-xs">Vehicle / Driver</p><p className="font-medium truncate">{vehicleLabel(order.vehicle_id)}{order.driver_id ? ` · ${nameOf(order.driver_id)}` : ''}</p></div>
        </div>
        <Badge className={STATUS_COLORS[order.status] ?? ''} variant="outline">{order.status.replace('_', ' ')}</Badge>
        <div className="flex gap-1">{children}</div>
      </CardContent>
    </Card>
  )
}
