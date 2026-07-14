import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Shield, Plus, Search, Edit, Trash2, Users, Settings } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useUsers } from '@/context/UserContext'
import { useTranslation } from 'react-i18next'

const ALL_SECTIONS = [
  'Dashboard', 'Shooting Requests', 'Employees', 'Projects', 'Recruitment', 'Tasks',
  'Scheduling', 'Attendance', 'Analytics', 'Organizations', 'Chat', 'User Management',
  'Role Management', 'Access Control', 'Documentation', 'Security System', 'Garage',
  'Ride Orders', 'Payment Commission', 'Settings'
]

const ALL_PERMISSIONS = [
  { id: 'employee_read', name: 'View Employees' },
  { id: 'employee_write', name: 'Manage Employees' },
  { id: 'recruitment_write', name: 'Manage Recruitment' },
  { id: 'performance_write', name: 'Manage Performance' },
  { id: 'analytics_read', name: 'View Analytics' },
  { id: 'user_management', name: 'User Management' },
  { id: 'role_management', name: 'Role Management' },
  { id: 'vehicle_manage', name: 'Manage Vehicles' },
  { id: 'trip_log', name: 'Log Vehicle Trips' },
  { id: 'system_settings', name: 'System Settings' },
]

const WORKFLOW_SLOTS = [
  { value: 'none', key: 'slotNone' },
  { value: 'shooting_moderator', key: 'slotShootingModerator' },
  { value: 'director', key: 'slotDirector' },
  { value: 'tech_supply', key: 'slotTechSupply' },
  { value: 'driver', key: 'slotDriver' },
]

interface CustomRole {
  id: string
  name: string
  description: string | null
  permissions: string[]
  allowed_sections: string[]
  workflow_slot: string | null
  created_at: string
}

export default function CustomRolesBox() {
  const { users } = useUsers()
  const { toast } = useToast()
  const { t } = useTranslation()
  const [roles, setRoles] = useState<CustomRole[]>([])
  const [assignments, setAssignments] = useState<Map<string, string[]>>(new Map())
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CustomRole | null>(null)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [slot, setSlot] = useState('none')
  const [perms, setPerms] = useState<string[]>([])
  const [sections, setSections] = useState<string[]>([])
  const [selUsers, setSelUsers] = useState<string[]>([])
  const [viewRole, setViewRole] = useState<string | null>(null)

  const load = async () => {
    const [{ data: r }, { data: ucr }] = await Promise.all([
      supabase.from('custom_roles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_custom_roles').select('user_id, custom_role_id'),
    ])
    const map = new Map<string, string[]>()
    ;(ucr ?? []).forEach((row: any) => {
      const arr = map.get(row.custom_role_id) ?? []
      arr.push(row.user_id); map.set(row.custom_role_id, arr)
    })
    setAssignments(map)
    setRoles(((r ?? []) as any[]).map(x => ({
      ...x,
      permissions: Array.isArray(x.permissions) ? x.permissions : [],
      allowed_sections: Array.isArray(x.allowed_sections) ? x.allowed_sections : [],
    })))
  }

  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditing(null); setName(''); setDesc(''); setSlot('none')
    setPerms([]); setSections([]); setSelUsers([]); setOpen(true)
  }

  const openEdit = (r: CustomRole) => {
    setEditing(r); setName(r.name); setDesc(r.description ?? '')
    setSlot(r.workflow_slot ?? 'none'); setPerms(r.permissions)
    setSections(r.allowed_sections); setSelUsers(assignments.get(r.id) ?? []); setOpen(true)
  }

  const save = async () => {
    if (!name.trim()) {
      toast({ title: t('pages.customRoles.nameRequired'), description: t('pages.customRoles.pleaseEnterName'), variant: 'destructive' })
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      name, description: desc || null, permissions: perms as any,
      allowed_sections: sections as any,
      workflow_slot: slot === 'none' ? null : slot,
      created_by: user?.id,
    }
    let roleId = editing?.id
    if (editing) {
      const { error } = await supabase.from('custom_roles').update(payload).eq('id', editing.id)
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' })
        return
      }
    } else {
      const { data, error } = await supabase.from('custom_roles').insert(payload).select('id').single()
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' })
        return
      }
      roleId = data.id
    }
    if (roleId) {
      await supabase.from('user_custom_roles').delete().eq('custom_role_id', roleId)
      if (selUsers.length) {
        await supabase.from('user_custom_roles').insert(
          selUsers.map(uid => ({ custom_role_id: roleId!, user_id: uid }))
        )
      }
    }
    toast({ title: editing ? t('pages.customRoles.roleUpdated') : t('pages.customRoles.roleCreated') })
    setOpen(false); await load()
  }

  const remove = async (id: string) => {
    if (!confirm(t('pages.customRoles.deleteConfirm'))) return
    const { error } = await supabase.from('custom_roles').delete().eq('id', id)
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: t('pages.customRoles.deleted') })
    await load()
  }

  const toggle = (arr: string[], set: (v: string[]) => void, val: string) =>
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])

  const filtered = roles.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('pages.customRoles.title')}</CardTitle>
            <CardDescription>{t('pages.customRoles.description')}</CardDescription>
          </div>
          <Button onClick={openNew} size="sm"><Plus className="w-4 h-4 mr-2" />{t('pages.customRoles.newRole')}</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 flex items-center gap-3"><Shield className="w-6 h-6 text-primary" /><div><p className="text-xl font-bold">{roles.length}</p><p className="text-xs text-muted-foreground">{t('pages.customRoles.stats.roles')}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><Users className="w-6 h-6 text-primary" /><div><p className="text-xl font-bold">{Array.from(assignments.values()).reduce((s, a) => s + a.length, 0)}</p><p className="text-xs text-muted-foreground">{t('pages.customRoles.stats.assignments')}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><Settings className="w-6 h-6 text-primary" /><div><p className="text-xl font-bold">{ALL_PERMISSIONS.length}</p><p className="text-xs text-muted-foreground">{t('pages.customRoles.stats.permissions')}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><Shield className="w-6 h-6 text-primary" /><div><p className="text-xl font-bold">{ALL_SECTIONS.length}</p><p className="text-xs text-muted-foreground">{t('pages.customRoles.stats.sections')}</p></div></CardContent></Card>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={t('pages.customRoles.searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(r => (
            <Card key={r.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center"><Shield className="w-5 h-5 text-primary" /></div>
                    <div>
                      <CardTitle className="text-base">{r.name}</CardTitle>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <Badge
                          variant="outline"
                          className="text-xs cursor-pointer hover:bg-accent"
                          onClick={(e) => { e.stopPropagation(); setViewRole(r.id) }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setViewRole(r.id) } }}
                        >
                          <Users className="w-3 h-3 mr-1" />{(assignments.get(r.id) ?? []).length}
                        </Badge>
                        {r.workflow_slot && <Badge variant="secondary" className="text-xs">{r.workflow_slot}</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(r)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {r.description && <CardDescription>{r.description}</CardDescription>}
                <div className="text-xs text-muted-foreground">Sections ({r.allowed_sections.length}):</div>
                <div className="flex flex-wrap gap-1">
                  {r.allowed_sections.slice(0, 4).map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                  {r.allowed_sections.length > 4 && <Badge variant="outline" className="text-xs">+{r.allowed_sections.length - 4}</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">No custom roles yet.</p>}
        </div>
      </CardContent>

      {/* Role Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? t('pages.customRoles.editRole') : t('pages.customRoles.newCustomRole')}</DialogTitle>
            <DialogDescription>{t('pages.customRoles.dialogDesc')}</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="general">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">{t('pages.customRoles.tabGeneral')}</TabsTrigger>
              <TabsTrigger value="sections">{t('pages.customRoles.tabSections')}</TabsTrigger>
              <TabsTrigger value="permissions">{t('pages.customRoles.tabPermissions')}</TabsTrigger>
              <TabsTrigger value="users">{t('pages.customRoles.tabUsers')}</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="space-y-4 pt-4">
              <div className="space-y-2"><Label>{t('pages.customRoles.roleName')}</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder={t('pages.customRoles.roleNamePlaceholder')} /></div>
              <div className="space-y-2"><Label>{t('pages.customRoles.description2')}</Label><Textarea value={desc} onChange={e => setDesc(e.target.value)} /></div>
              <div className="space-y-2">
                <Label>{t('pages.customRoles.workflowSlot')}</Label>
                <Select value={slot} onValueChange={setSlot}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{WORKFLOW_SLOTS.map(s => <SelectItem key={s.value} value={s.value}>{t(`pages.customRoles.${s.key}`)}</SelectItem>)}</SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{t('pages.customRoles.workflowSlotHint')}</p>
              </div>
            </TabsContent>
            <TabsContent value="sections" className="space-y-2 pt-4">
              <div className="grid grid-cols-2 gap-2">
                {ALL_SECTIONS.map(s => (
                  <label key={s} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-accent">
                    <Checkbox checked={sections.includes(s)} onCheckedChange={() => toggle(sections, setSections, s)} />
                    <span className="text-sm">{s}</span>
                  </label>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="permissions" className="space-y-2 pt-4">
              {ALL_PERMISSIONS.map(p => (
                <label key={p.id} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-accent">
                  <Checkbox checked={perms.includes(p.id)} onCheckedChange={() => toggle(perms, setPerms, p.id)} />
                  <span className="text-sm">{p.name}</span>
                </label>
              ))}
            </TabsContent>
            <TabsContent value="users" className="space-y-2 pt-4 max-h-96 overflow-y-auto">
              {users.map(u => (
                <label key={u.id} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-accent">
                  <Checkbox checked={selUsers.includes(u.id)} onCheckedChange={() => toggle(selUsers, setSelUsers, u.id)} />
                  <span className="text-sm">{u.name} <span className="text-muted-foreground">— {u.email}</span></span>
                </label>
              ))}
            </TabsContent>
          </Tabs>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>{t('pages.customRoles.cancel')}</Button>
            <Button onClick={save}>{editing ? t('pages.customRoles.update') : t('pages.customRoles.create')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewRole} onOpenChange={(open) => { if (!open) setViewRole(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('pages.customRoles.viewAssigners')} — {roles.find(r => r.id === viewRole)?.name}</DialogTitle>
            <DialogDescription>{t('pages.customRoles.assignersDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto py-2">
            {(() => {
              const role = roles.find(r => r.id === viewRole)
              const assigned = role ? (assignments.get(role.id) ?? []).map(uid => users.find(u => u.id === uid)).filter((u): u is typeof users[0] => !!u) : []
              return assigned.length ? assigned.map(u => (
                <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg border">
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={u.avatar} alt={u.name} />
                    <AvatarFallback>{u.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground text-center py-6">{t('pages.customRoles.noAssigners')}</p>
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
