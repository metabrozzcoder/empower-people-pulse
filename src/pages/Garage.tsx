import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { useUsers } from '@/context/UserContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Car, Plus, Camera, Edit, Trash2, Gauge, MapPin, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import RideOrdersPanel from '@/components/RideOrdersPanel'

interface Vehicle {
  id: string
  plate_number: string
  model: string | null
  make: string | null
  year: number | null
  color: string | null
  photo_url: string | null
  current_mileage: number
  assigned_driver_id: string | null
  status: string
  notes: string | null
}
interface Trip {
  id: string
  vehicle_id: string
  driver_id: string
  shooting_request_id: string | null
  trip_date: string
  start_mileage: number
  end_mileage: number | null
  miles_driven: number | null
  plate_photo_url: string | null
  odometer_start_photo_url: string | null
  odometer_end_photo_url: string | null
  notes: string | null
  status: string
}
interface ShootingReq { id: string; title: string; workflow_status: string }

export default function Garage() {
  const { currentUser } = useAuth()
  const { users } = useUsers()
  const { t } = useTranslation()
  const isAdmin = currentUser?.role === 'Admin'
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [requests, setRequests] = useState<ShootingReq[]>([])
  const [tab, setTab] = useState('vehicles')

  // Vehicle dialog
  const [vOpen, setVOpen] = useState(false)
  const [vEdit, setVEdit] = useState<Vehicle | null>(null)
  const [vForm, setVForm] = useState({ plate_number: '', make: '', model: '', year: '', color: '', current_mileage: '0', assigned_driver_id: '', status: 'Active', notes: '' })
  const [vPhotoFile, setVPhotoFile] = useState<File | null>(null)

  // Trip dialog
  const [tOpen, setTOpen] = useState(false)
  const [tEdit, setTEdit] = useState<Trip | null>(null)
  const [tForm, setTForm] = useState({ vehicle_id: '', shooting_request_id: '', trip_date: new Date().toISOString().split('T')[0], start_mileage: '', end_mileage: '', notes: '' })
  const [platePhoto, setPlatePhoto] = useState<File | null>(null)
  const [odomStart, setOdomStart] = useState<File | null>(null)
  const [odomEnd, setOdomEnd] = useState<File | null>(null)

  const [driverIds, setDriverIds] = useState<string[]>([])

  const load = async () => {
    const [v, t, r, dr1, dr2] = await Promise.all([
      supabase.from('vehicles').select('*').order('created_at', { ascending: false }),
      supabase.from('vehicle_trips').select('*').order('trip_date', { ascending: false }).limit(200),
      supabase.from('shooting_requests').select('id, title, workflow_status').order('created_at', { ascending: false }).limit(100),
      supabase.from('user_roles').select('user_id').eq('role', 'driver' as any),
      supabase.from('profiles').select('id').ilike('position', '%driver%'),
    ])
    setVehicles((v.data ?? []) as any)
    setTrips((t.data ?? []) as any)
    setRequests((r.data ?? []) as any)
    const ids = new Set<string>()
    ;((dr1.data ?? []) as any[]).forEach(x => ids.add(x.user_id))
    ;((dr2.data ?? []) as any[]).forEach(x => ids.add(x.id))
    setDriverIds(Array.from(ids))
  }
  useEffect(() => { load() }, [])

  const uploadPhoto = async (file: File, folder: string): Promise<string | null> => {
    const path = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const { error } = await supabase.storage.from('vehicles').upload(path, file)
    if (error) { toast.error(error.message); return null }
    const { data } = supabase.storage.from('vehicles').getPublicUrl(path)
    return data.publicUrl
  }

  /* ---------------- Vehicles ---------------- */
  const openVehicleNew = () => {
    setVEdit(null); setVPhotoFile(null)
    setVForm({ plate_number: '', make: '', model: '', year: '', color: '', current_mileage: '0', assigned_driver_id: '', status: 'Active', notes: '' })
    setVOpen(true)
  }
  const openVehicleEdit = (v: Vehicle) => {
    setVEdit(v); setVPhotoFile(null)
    setVForm({
      plate_number: v.plate_number, make: v.make ?? '', model: v.model ?? '',
      year: v.year?.toString() ?? '', color: v.color ?? '',
      current_mileage: v.current_mileage.toString(),
      assigned_driver_id: v.assigned_driver_id ?? '', status: v.status, notes: v.notes ?? '',
    })
    setVOpen(true)
  }
  const saveVehicle = async () => {
    if (!vForm.plate_number.trim()) { toast.error(t('pages.garage.plateRequired')); return }
    let photo_url = vEdit?.photo_url ?? null
    if (vPhotoFile) photo_url = await uploadPhoto(vPhotoFile, 'vehicle-photos')
    const payload: any = {
      plate_number: vForm.plate_number, make: vForm.make || null, model: vForm.model || null,
      year: vForm.year ? Number(vForm.year) : null, color: vForm.color || null,
      current_mileage: Number(vForm.current_mileage) || 0,
      assigned_driver_id: vForm.assigned_driver_id || null,
      status: vForm.status, notes: vForm.notes || null, photo_url,
    }
    const { error } = vEdit
      ? await supabase.from('vehicles').update(payload).eq('id', vEdit.id)
      : await supabase.from('vehicles').insert(payload)
    if (error) { toast.error(error.message); return }
    toast.success(vEdit ? t('pages.garage.vehicleUpdated') : t('pages.garage.vehicleAdded'))
    setVOpen(false); await load()
  }
  const deleteVehicle = async (id: string) => {
    if (!confirm(t('pages.garage.deleteVehicleConfirm'))) return
    const { error } = await supabase.from('vehicles').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success(t('pages.garage.deleted')); await load()
  }

  /* ---------------- Trips ---------------- */
  const openTripNew = (vehicleId?: string) => {
    setTEdit(null); setPlatePhoto(null); setOdomStart(null); setOdomEnd(null)
    const v = vehicles.find(x => x.id === vehicleId)
    setTForm({
      vehicle_id: vehicleId ?? '', shooting_request_id: '',
      trip_date: new Date().toISOString().split('T')[0],
      start_mileage: v?.current_mileage.toString() ?? '', end_mileage: '', notes: '',
    })
    setTOpen(true)
  }
  const openTripEdit = (t: Trip) => {
    setTEdit(t); setPlatePhoto(null); setOdomStart(null); setOdomEnd(null)
    setTForm({
      vehicle_id: t.vehicle_id, shooting_request_id: t.shooting_request_id ?? '',
      trip_date: t.trip_date, start_mileage: t.start_mileage.toString(),
      end_mileage: t.end_mileage?.toString() ?? '', notes: t.notes ?? '',
    })
    setTOpen(true)
  }
  const saveTrip = async () => {
    if (!tForm.vehicle_id) { toast.error(t('pages.garage.chooseVehicleError')); return }
    if (!currentUser) return
    const payload: any = {
      vehicle_id: tForm.vehicle_id,
      driver_id: tEdit?.driver_id ?? currentUser.id,
      shooting_request_id: tForm.shooting_request_id || null,
      trip_date: tForm.trip_date,
      start_mileage: Number(tForm.start_mileage) || 0,
      end_mileage: tForm.end_mileage ? Number(tForm.end_mileage) : null,
      notes: tForm.notes || null,
      status: tForm.end_mileage ? 'completed' : 'in_progress',
    }
    if (platePhoto) payload.plate_photo_url = await uploadPhoto(platePhoto, 'trips')
    if (odomStart) payload.odometer_start_photo_url = await uploadPhoto(odomStart, 'trips')
    if (odomEnd) payload.odometer_end_photo_url = await uploadPhoto(odomEnd, 'trips')
    const { error } = tEdit
      ? await supabase.from('vehicle_trips').update(payload).eq('id', tEdit.id)
      : await supabase.from('vehicle_trips').insert(payload)
    if (error) { toast.error(error.message); return }
    toast.success(tEdit ? t('pages.garage.tripUpdated') : t('pages.garage.tripLogged'))
    setTOpen(false); await load()
  }
  const deleteTrip = async (id: string) => {
    if (!confirm(t('pages.garage.deleteTripConfirm'))) return
    const { error } = await supabase.from('vehicle_trips').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success(t('pages.garage.deleted')); await load()
  }

  const driverName = (id?: string | null) => users.find(u => u.id === id)?.name ?? '—'
  const reqTitle = (id?: string | null) => requests.find(r => r.id === id)?.title ?? null

  const totalMiles = trips.reduce((s, t) => s + (t.miles_driven ?? 0), 0)
  const activeTrips = trips.filter(t => t.status === 'in_progress').length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('pages.garage.title')}</h1>
          <p className="text-muted-foreground">{t('pages.garage.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && <Button onClick={openVehicleNew}><Plus className="w-4 h-4 mr-2" />{t('pages.garage.vehicle')}</Button>}
          <Button variant="secondary" onClick={() => openTripNew()}><Plus className="w-4 h-4 mr-2" />{t('pages.garage.logTrip')}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-6 flex items-center gap-3"><Car className="w-8 h-8 text-primary" /><div><p className="text-2xl font-bold">{vehicles.length}</p><p className="text-sm text-muted-foreground">{t('pages.garage.vehicles')}</p></div></CardContent></Card>
        <Card><CardContent className="p-6 flex items-center gap-3"><MapPin className="w-8 h-8 text-primary" /><div><p className="text-2xl font-bold">{trips.length}</p><p className="text-sm text-muted-foreground">{t('pages.garage.trips')}</p></div></CardContent></Card>
        <Card><CardContent className="p-6 flex items-center gap-3"><Gauge className="w-8 h-8 text-primary" /><div><p className="text-2xl font-bold">{totalMiles.toFixed(0)}</p><p className="text-sm text-muted-foreground">{t('pages.garage.milesDriven')}</p></div></CardContent></Card>
        <Card><CardContent className="p-6 flex items-center gap-3"><Camera className="w-8 h-8 text-primary" /><div><p className="text-2xl font-bold">{activeTrips}</p><p className="text-sm text-muted-foreground">{t('pages.garage.activeTrips')}</p></div></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="vehicles">{t('pages.garage.vehicles')}</TabsTrigger>
          <TabsTrigger value="trips">{t('pages.garage.tripLog')}</TabsTrigger>
          <TabsTrigger value="rides">Ride Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="rides"><RideOrdersPanel /></TabsContent>



        <TabsContent value="vehicles" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map(v => (
              <Card key={v.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {v.photo_url ? (
                  <img src={v.photo_url} alt={v.plate_number} className="h-40 w-full object-cover" />
                ) : (
                  <div className="h-40 bg-muted flex items-center justify-center"><Car className="w-12 h-12 text-muted-foreground" /></div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{v.plate_number}</CardTitle>
                      <p className="text-sm text-muted-foreground">{[v.make, v.model, v.year].filter(Boolean).join(' ')}</p>
                    </div>
                    <Badge variant={v.status === 'Active' ? 'default' : 'secondary'}>{v.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><Gauge className="w-4 h-4 text-muted-foreground" />{v.current_mileage.toFixed(0)} mi</div>
                  <div>Driver: <span className="font-medium">{driverName(v.assigned_driver_id)}</span></div>
                  <div className="flex gap-1 pt-2">
                    <Button size="sm" variant="outline" onClick={() => openTripNew(v.id)}><Plus className="w-3 h-3 mr-1" />Trip</Button>
                    {isAdmin && <Button size="sm" variant="ghost" onClick={() => openVehicleEdit(v)}><Edit className="w-4 h-4" /></Button>}
                    {isAdmin && <Button size="sm" variant="ghost" onClick={() => deleteVehicle(v.id)}><Trash2 className="w-4 h-4" /></Button>}
                  </div>
                </CardContent>
              </Card>
            ))}
            {vehicles.length === 0 && <p className="text-muted-foreground col-span-full text-center py-12">No vehicles yet.</p>}
          </div>
        </TabsContent>

        <TabsContent value="trips" className="space-y-2 pt-4">
          {trips.map(trip => {
            const v = vehicles.find(x => x.id === trip.vehicle_id)
            return (
              <Card key={trip.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  {trip.plate_photo_url ? (
                    <img src={trip.plate_photo_url} alt="plate" className="w-20 h-20 object-cover rounded" />
                  ) : (
                    <div className="w-20 h-20 bg-muted flex items-center justify-center rounded"><Camera className="w-6 h-6 text-muted-foreground" /></div>
                  )}
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                    <div><p className="text-muted-foreground text-xs">{t('pages.garage.vehicle')}</p><p className="font-medium">{v?.plate_number ?? '—'}</p></div>
                    <div><p className="text-muted-foreground text-xs">{t('pages.garage.driver')}</p><p className="font-medium">{driverName(trip.driver_id)}</p></div>
                    <div><p className="text-muted-foreground text-xs">{t('pages.garage.date')}</p><p className="font-medium">{trip.trip_date}</p></div>
                    <div><p className="text-muted-foreground text-xs">{t('pages.garage.miles')}</p><p className="font-medium">{(trip.miles_driven ?? 0).toFixed(0)}</p></div>
                    <div><p className="text-muted-foreground text-xs">{t('pages.garage.request')}</p><p className="font-medium truncate">{reqTitle(trip.shooting_request_id) ?? '—'}</p></div>
                  </div>
                  <Badge variant={trip.status === 'completed' ? 'default' : 'secondary'}>{trip.status}</Badge>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openTripEdit(trip)}><Edit className="w-4 h-4" /></Button>
                    {isAdmin && <Button size="sm" variant="ghost" onClick={() => deleteTrip(trip.id)}><Trash2 className="w-4 h-4" /></Button>}
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {trips.length === 0 && <p className="text-muted-foreground text-center py-12">{t('pages.garage.noTrips')}</p>}
        </TabsContent>
      </Tabs>

      {/* Vehicle dialog */}
      <Dialog open={vOpen} onOpenChange={setVOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{vEdit ? t('pages.garage.editVehicle') : t('pages.garage.newVehicle')}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>{t('pages.garage.plateNumber')} *</Label><Input value={vForm.plate_number} onChange={e => setVForm({ ...vForm, plate_number: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t('pages.garage.status')}</Label>
              <Select value={vForm.status} onValueChange={v => setVForm({ ...vForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">{t('pages.garage.statusActive')}</SelectItem>
                  <SelectItem value="Maintenance">{t('pages.garage.statusMaintenance')}</SelectItem>
                  <SelectItem value="Retired">{t('pages.garage.statusRetired')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>{t('pages.garage.make')}</Label><Input value={vForm.make} onChange={e => setVForm({ ...vForm, make: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t('pages.garage.model')}</Label><Input value={vForm.model} onChange={e => setVForm({ ...vForm, model: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t('pages.garage.year')}</Label><Input type="number" value={vForm.year} onChange={e => setVForm({ ...vForm, year: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t('pages.garage.color')}</Label><Input value={vForm.color} onChange={e => setVForm({ ...vForm, color: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t('pages.garage.currentMileage')}</Label><Input type="number" value={vForm.current_mileage} onChange={e => setVForm({ ...vForm, current_mileage: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t('pages.garage.assignedDriver')}</Label>
              {(() => {
                const takenIds = new Set(
                  vehicles
                    .filter(v => v.assigned_driver_id && v.id !== vEdit?.id)
                    .map(v => v.assigned_driver_id as string)
                )
                const availableDrivers = users.filter(u => driverIds.includes(u.id) && !takenIds.has(u.id))
                return (
                  <Select value={vForm.assigned_driver_id || 'none'} onValueChange={v => setVForm({ ...vForm, assigned_driver_id: v === 'none' ? '' : v })}>
                    <SelectTrigger><SelectValue placeholder={t('pages.garage.selectDriver')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('pages.garage.none')}</SelectItem>
                      {availableDrivers.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                      {availableDrivers.length === 0 && (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground">No available drivers</div>
                      )}
                    </SelectContent>
                  </Select>
                )
              })()}
            </div>
            <div className="col-span-2 space-y-2"><Label>{t('pages.garage.photo')}</Label>
              <Input type="file" accept="image/*" onChange={e => setVPhotoFile(e.target.files?.[0] ?? null)} />
              {vEdit?.photo_url && !vPhotoFile && <img src={vEdit.photo_url} alt="current" className="w-32 h-24 object-cover rounded" />}
            </div>
            <div className="col-span-2 space-y-2"><Label>{t('pages.garage.notes')}</Label><Textarea value={vForm.notes} onChange={e => setVForm({ ...vForm, notes: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setVOpen(false)}>{t('pages.garage.cancel')}</Button><Button onClick={saveVehicle}>{vEdit ? t('pages.garage.update') : t('pages.garage.create')}</Button></div>
        </DialogContent>
      </Dialog>

      {/* Trip dialog */}
      <Dialog open={tOpen} onOpenChange={setTOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{tEdit ? t('pages.garage.editTrip') : t('pages.garage.newTrip')}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>{t('pages.garage.vehicle')} *</Label>
              <Select value={tForm.vehicle_id} onValueChange={v => {
                const veh = vehicles.find(x => x.id === v)
                setTForm({ ...tForm, vehicle_id: v, start_mileage: tForm.start_mileage || veh?.current_mileage.toString() || '' })
              }}>
                <SelectTrigger><SelectValue placeholder={t('pages.garage.chooseVehicle')} /></SelectTrigger>
                <SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.plate_number}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>{t('pages.garage.date')}</Label><Input type="date" value={tForm.trip_date} onChange={e => setTForm({ ...tForm, trip_date: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t('pages.garage.startMileage')}</Label><Input type="number" value={tForm.start_mileage} onChange={e => setTForm({ ...tForm, start_mileage: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t('pages.garage.endMileage')}</Label><Input type="number" value={tForm.end_mileage} onChange={e => setTForm({ ...tForm, end_mileage: e.target.value })} placeholder={t('pages.garage.endMileagePlaceholder')} /></div>
            <div className="col-span-2 space-y-2"><Label>{t('pages.garage.linkedRequest')}</Label>
              <Select value={tForm.shooting_request_id || 'none'} onValueChange={v => setTForm({ ...tForm, shooting_request_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder={t('pages.garage.noLink')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('pages.garage.none')}</SelectItem>
                  {requests.map(r => <SelectItem key={r.id} value={r.id}>{r.title} <span className="text-muted-foreground">({r.workflow_status})</span></SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label className="flex items-center gap-1"><Upload className="w-3 h-3" />{t('pages.garage.platePhoto')}</Label><Input type="file" accept="image/*" capture="environment" onChange={e => setPlatePhoto(e.target.files?.[0] ?? null)} /></div>
            <div className="space-y-2"><Label className="flex items-center gap-1"><Upload className="w-3 h-3" />{t('pages.garage.odoStart')}</Label><Input type="file" accept="image/*" capture="environment" onChange={e => setOdomStart(e.target.files?.[0] ?? null)} /></div>
            <div className="space-y-2"><Label className="flex items-center gap-1"><Upload className="w-3 h-3" />{t('pages.garage.odoEnd')}</Label><Input type="file" accept="image/*" capture="environment" onChange={e => setOdomEnd(e.target.files?.[0] ?? null)} /></div>
            <div className="col-span-2 space-y-2"><Label>{t('pages.garage.notes')}</Label><Textarea value={tForm.notes} onChange={e => setTForm({ ...tForm, notes: e.target.value })} /></div>
            {tEdit && (
              <div className="col-span-2 grid grid-cols-3 gap-2">
                {tEdit.plate_photo_url && <a href={tEdit.plate_photo_url} target="_blank" rel="noreferrer"><img src={tEdit.plate_photo_url} className="rounded w-full h-24 object-cover" alt="plate" /></a>}
                {tEdit.odometer_start_photo_url && <a href={tEdit.odometer_start_photo_url} target="_blank" rel="noreferrer"><img src={tEdit.odometer_start_photo_url} className="rounded w-full h-24 object-cover" alt="odo start" /></a>}
                {tEdit.odometer_end_photo_url && <a href={tEdit.odometer_end_photo_url} target="_blank" rel="noreferrer"><img src={tEdit.odometer_end_photo_url} className="rounded w-full h-24 object-cover" alt="odo end" /></a>}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setTOpen(false)}>{t('pages.garage.cancel')}</Button><Button onClick={saveTrip}>{tEdit ? t('pages.garage.update') : t('pages.garage.logTrip')}</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
