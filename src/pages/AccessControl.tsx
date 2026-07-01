import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Shield, Plus, Search, Edit, Trash2, Users, Lock, Unlock,
  Clock, MapPin, Wifi, Smartphone, Loader2
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { formatDate } from '@/lib/date'

type RuleType = 'IP_RESTRICTION' | 'TIME_RESTRICTION' | 'LOCATION_RESTRICTION' | 'DEVICE_RESTRICTION'

interface AccessRule {
  id: string
  name: string
  type: RuleType
  description: string | null
  is_active: boolean
  created_at: string
  users: string[]
}

interface ProfileLite {
  id: string
  name: string
  email: string
}

export default function AccessControl() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [accessRules, setAccessRules] = useState<AccessRule[]>([])
  const [users, setUsers] = useState<ProfileLite[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<AccessRule | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // form state
  const [fName, setFName] = useState('')
  const [fType, setFType] = useState<RuleType>('IP_RESTRICTION')
  const [fDescription, setFDescription] = useState('')
  const [fActive, setFActive] = useState(true)
  const [fUsers, setFUsers] = useState<string[]>([])

  const load = async () => {
    setLoading(true)
    const [rulesRes, usersRes, assignRes] = await Promise.all([
      supabase.from('access_rules').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id,name,email').order('name'),
      supabase.from('access_rule_users').select('rule_id,user_id'),
    ])
    if (rulesRes.error || usersRes.error || assignRes.error) {
      toast({ title: 'Error', description: rulesRes.error?.message || usersRes.error?.message || assignRes.error?.message, variant: 'destructive' })
      setLoading(false)
      return
    }
    const byRule = new Map<string, string[]>()
    ;(assignRes.data || []).forEach((a: any) => {
      const arr = byRule.get(a.rule_id) || []
      arr.push(a.user_id)
      byRule.set(a.rule_id, arr)
    })
    setAccessRules((rulesRes.data || []).map((r: any) => ({ ...r, users: byRule.get(r.id) || [] })))
    setUsers(usersRes.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const resetForm = (rule: AccessRule | null) => {
    setFName(rule?.name || '')
    setFType(rule?.type || 'IP_RESTRICTION')
    setFDescription(rule?.description || '')
    setFActive(rule?.is_active ?? true)
    setFUsers(rule?.users || [])
  }

  const handleAddRule = () => {
    setSelectedRule(null)
    resetForm(null)
    setIsDialogOpen(true)
  }

  const handleEditRule = (rule: AccessRule) => {
    setSelectedRule(rule)
    resetForm(rule)
    setIsDialogOpen(true)
  }

  const handleDeleteRule = async (id: string) => {
    const { error } = await supabase.from('access_rules').delete().eq('id', id)
    if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' })
    setAccessRules(prev => prev.filter(r => r.id !== id))
    toast({ title: t('pages.accessControl.deletedTitle'), description: t('pages.accessControl.deletedDesc') })
  }

  const toggleRuleStatus = async (rule: AccessRule) => {
    const { error } = await supabase.from('access_rules').update({ is_active: !rule.is_active }).eq('id', rule.id)
    if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' })
    setAccessRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: !r.is_active } : r))
  }

  const saveRule = async () => {
    if (!fName.trim()) {
      return toast({ title: 'Name required', variant: 'destructive' })
    }
    setSaving(true)
    const { data: userData } = await supabase.auth.getUser()
    let ruleId = selectedRule?.id

    if (selectedRule) {
      const { error } = await supabase.from('access_rules').update({
        name: fName, type: fType, description: fDescription, is_active: fActive,
      }).eq('id', selectedRule.id)
      if (error) { setSaving(false); return toast({ title: 'Error', description: error.message, variant: 'destructive' }) }
    } else {
      const { data, error } = await supabase.from('access_rules').insert({
        name: fName, type: fType, description: fDescription, is_active: fActive,
        created_by: userData.user?.id,
      }).select('id').single()
      if (error || !data) { setSaving(false); return toast({ title: 'Error', description: error?.message, variant: 'destructive' }) }
      ruleId = data.id
    }

    // sync users: delete all then insert
    if (ruleId) {
      await supabase.from('access_rule_users').delete().eq('rule_id', ruleId)
      if (fUsers.length > 0) {
        const rows = fUsers.map(uid => ({ rule_id: ruleId!, user_id: uid }))
        const { error: insErr } = await supabase.from('access_rule_users').insert(rows)
        if (insErr) { setSaving(false); return toast({ title: 'Error', description: insErr.message, variant: 'destructive' }) }
      }
    }

    setSaving(false)
    setIsDialogOpen(false)
    toast({ title: selectedRule ? 'Rule updated' : 'Rule created' })
    load()
  }

  const toggleUser = (uid: string) => {
    setFUsers(prev => prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid])
  }

  const filteredRules = accessRules.filter(rule =>
    rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (rule.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getTypeIcon = (type: RuleType) => ({
    IP_RESTRICTION: Wifi, TIME_RESTRICTION: Clock,
    LOCATION_RESTRICTION: MapPin, DEVICE_RESTRICTION: Smartphone,
  }[type] || Shield)

  const getTypeColor = (type: RuleType) => ({
    IP_RESTRICTION: 'bg-blue-100 text-blue-800',
    TIME_RESTRICTION: 'bg-green-100 text-green-800',
    LOCATION_RESTRICTION: 'bg-purple-100 text-purple-800',
    DEVICE_RESTRICTION: 'bg-orange-100 text-orange-800',
  }[type])

  const activeRules = accessRules.filter(r => r.is_active).length
  const totalUsers = new Set(accessRules.flatMap(r => r.users)).size

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('pages.accessControl.title')}</h1>
          <p className="text-muted-foreground">{t('pages.accessControl.subtitle')}</p>
        </div>
        <Button onClick={handleAddRule} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>{t('pages.accessControl.addRule')}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-6"><div className="flex items-center space-x-2"><Shield className="w-8 h-8 text-blue-500" /><div><p className="text-2xl font-bold">{accessRules.length}</p><p className="text-sm text-muted-foreground">{t('pages.accessControl.totalRules')}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center space-x-2"><Lock className="w-8 h-8 text-green-500" /><div><p className="text-2xl font-bold">{activeRules}</p><p className="text-sm text-muted-foreground">{t('pages.accessControl.activeRules')}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center space-x-2"><Users className="w-8 h-8 text-purple-500" /><div><p className="text-2xl font-bold">{totalUsers}</p><p className="text-sm text-muted-foreground">{t('pages.accessControl.affectedUsers')}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center space-x-2"><Unlock className="w-8 h-8 text-red-500" /><div><p className="text-2xl font-bold">{accessRules.length - activeRules}</p><p className="text-sm text-muted-foreground">{t('pages.accessControl.inactiveRules')}</p></div></div></CardContent></Card>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder={t('pages.accessControl.searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('pages.accessControl.rulesTitle')}</CardTitle>
          <CardDescription>{t('pages.accessControl.rulesDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : filteredRules.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No access rules yet. Click "Add Rule" to create one.</p>
          ) : (
            <div className="space-y-4">
              {filteredRules.map((rule) => {
                const TypeIcon = getTypeIcon(rule.type)
                const typeLabelKey =
                  rule.type === 'IP_RESTRICTION' ? 'typeIp' :
                  rule.type === 'TIME_RESTRICTION' ? 'typeTime' :
                  rule.type === 'LOCATION_RESTRICTION' ? 'typeLocation' : 'typeDevice'
                return (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <TypeIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{rule.name}</h3>
                          <Badge className={getTypeColor(rule.type)}>{t(`pages.accessControl.${typeLabelKey}`)}</Badge>
                          <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                            {rule.is_active ? t('pages.accessControl.active') : t('pages.accessControl.inactive')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>{t('pages.accessControl.users')}: {rule.users.length}</span>
                          <span>{t('pages.accessControl.created')}: {formatDate(rule.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={rule.is_active} onCheckedChange={() => toggleRuleStatus(rule)} />
                      <Button variant="ghost" size="sm" onClick={() => handleEditRule(rule)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteRule(rule.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedRule ? t('pages.accessControl.editRule') : t('pages.accessControl.createRule')}</DialogTitle>
            <DialogDescription>{selectedRule ? t('pages.accessControl.editDesc') : t('pages.accessControl.createDesc')}</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">{t('pages.accessControl.tabGeneral')}</TabsTrigger>
              <TabsTrigger value="users">{t('pages.accessControl.tabUsers')} ({fUsers.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="space-y-4">
              <div className="space-y-2">
                <Label>{t('pages.accessControl.ruleName')}</Label>
                <Input value={fName} onChange={e => setFName(e.target.value)} placeholder={t('pages.accessControl.ruleNamePlaceholder')} />
              </div>
              <div className="space-y-2">
                <Label>{t('pages.accessControl.ruleType')}</Label>
                <Select value={fType} onValueChange={(v) => setFType(v as RuleType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IP_RESTRICTION">{t('pages.accessControl.typeIp')}</SelectItem>
                    <SelectItem value="TIME_RESTRICTION">{t('pages.accessControl.typeTime')}</SelectItem>
                    <SelectItem value="LOCATION_RESTRICTION">{t('pages.accessControl.typeLocation')}</SelectItem>
                    <SelectItem value="DEVICE_RESTRICTION">{t('pages.accessControl.typeDevice')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('pages.accessControl.description')}</Label>
                <Input value={fDescription} onChange={e => setFDescription(e.target.value)} placeholder={t('pages.accessControl.descriptionPlaceholder')} />
              </div>
              <div className="flex items-center space-x-2">
                <Switch checked={fActive} onCheckedChange={setFActive} />
                <Label>{t('pages.accessControl.enableRule')}</Label>
              </div>
            </TabsContent>
            <TabsContent value="users" className="space-y-2">
              <p className="text-sm text-muted-foreground">{t('pages.accessControl.affectedUsersDesc')}</p>
              <div className="border rounded-lg max-h-80 overflow-y-auto divide-y">
                {users.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">No users found.</p>
                ) : users.map(u => (
                  <label key={u.id} className="flex items-center gap-3 p-3 hover:bg-accent/50 cursor-pointer">
                    <Checkbox checked={fUsers.includes(u.id)} onCheckedChange={() => toggleUser(u.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            </TabsContent>
          </Tabs>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>{t('pages.accessControl.cancel')}</Button>
            <Button onClick={saveRule} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selectedRule ? t('pages.accessControl.update') : t('pages.accessControl.create')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
