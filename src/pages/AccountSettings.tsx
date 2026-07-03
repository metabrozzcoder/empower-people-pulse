import { useState, useEffect } from "react"
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { User, Bell, Shield, Palette, Key, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import i18n from "@/i18n"
import { formatDate, setDateFormat, setTimeFormat, getDateFormat, getTimeFormat, type DateFormat, type TimeFormat } from '@/lib/date'

const AccountSettings = () => {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const { currentUser } = useAuth()

  const canEditOrg = currentUser?.role === 'Admin' || currentUser?.role === 'HR'

  const [profile, setProfile] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    department: currentUser?.department || "Human Resources",
    role: currentUser?.role || "",
    timezone: "UTC-8",
    avatar: currentUser?.avatar || "",
  })

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    systemAlerts: true,
  })

  const [security, setSecurity] = useState<{
    sessionTimeout: string
    passwordUpdatedAt?: string
  }>({
    sessionTimeout: "30",
  })

  const [preferences, setPreferences] = useState({
    language: "en",
    dateFormat: (typeof window !== 'undefined' ? getDateFormat() : 'dd/mmm/yyyy') as DateFormat,
    timeFormat: (typeof window !== 'undefined' ? getTimeFormat() : '24') as TimeFormat,
  })

  const [pwOpen, setPwOpen] = useState(false)
  const [pwForm, setPwForm] = useState({ next: "", confirm: "" })
  const [pwShow, setPwShow] = useState(false)
  const [pwSubmitting, setPwSubmitting] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  useEffect(() => {
    if (!currentUser) return
    setProfile((p) => ({
      ...p,
      name: currentUser.name ?? p.name,
      email: currentUser.email ?? p.email,
      phone: currentUser.phone ?? p.phone,
      department: currentUser.department ?? p.department,
      role: currentUser.role ?? p.role,
      avatar: currentUser.avatar ?? p.avatar,
    }))
  }, [currentUser?.id, currentUser?.name, currentUser?.email, currentUser?.phone, currentUser?.department, currentUser?.avatar, currentUser?.role])

  useEffect(() => {
    if (!currentUser) return
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('user_settings')
        .select('notifications, preferences, security')
        .eq('user_id', currentUser.id)
        .maybeSingle()
      if (cancelled || !data) return
      const d = data as { notifications: typeof notifications; preferences: typeof preferences; security: typeof security }
      if (d.notifications && Object.keys(d.notifications).length) setNotifications((prev) => ({ ...prev, ...d.notifications }))
      if (d.preferences && Object.keys(d.preferences).length) setPreferences((prev) => ({ ...prev, ...d.preferences }))
      if (d.security && Object.keys(d.security).length) {
        // strip any legacy 2FA fields from prior versions
        const { twoFactorEnabled: _a, twoFactorSecret: _b, backupCodes: _c, ...safe } = d.security as Record<string, unknown>
        setSecurity((prev) => ({ ...prev, ...(safe as typeof security) }))
      }
    })()
    return () => { cancelled = true }
  }, [currentUser?.id])

  const upsertSettings = async (patch: Partial<{ notifications: typeof notifications; preferences: typeof preferences; security: typeof security }>) => {
    if (!currentUser) return { error: null as { message: string } | null }
    const { error } = await supabase.from('user_settings').upsert({
      user_id: currentUser.id,
      notifications: patch.notifications ?? notifications,
      preferences: patch.preferences ?? preferences,
      security: patch.security ?? security,
    } as never, { onConflict: 'user_id' })
    return { error }
  }

  const handleProfileSave = async () => {
    if (!currentUser) {
      toast({ title: t('pages.accountSettings.toasts.notSignedIn'), description: t('pages.accountSettings.toasts.signInAgain'), variant: 'destructive' })
      return
    }
    if (!profile.name.trim()) {
      toast({ title: t('pages.accountSettings.toasts.nameRequired'), variant: 'destructive' })
      return
    }
    const updates: Record<string, unknown> = {
      name: profile.name,
      phone: profile.phone,
      avatar_url: profile.avatar,
    }
    if (canEditOrg) {
      updates.department = profile.department
      updates.position = profile.role
    }
    const { error } = await supabase.from('profiles').update(updates as never).eq('id', currentUser.id)
    if (error) {
      toast({ title: t('pages.accountSettings.toasts.saveFailed'), description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: t('pages.accountSettings.toasts.profileUpdated'), description: t('pages.accountSettings.toasts.profileUpdatedDesc') })
  }

  const handleNotificationSave = async () => {
    const { error } = await upsertSettings({ notifications })
    if (error) { toast({ title: t('pages.accountSettings.toasts.saveFailed'), description: error.message, variant: 'destructive' }); return }
    toast({ title: t('pages.accountSettings.toasts.notificationsUpdated'), description: t('pages.accountSettings.toasts.notificationsUpdatedDesc') })
  }

  const handleSecuritySave = async () => {
    const { error } = await upsertSettings({ security })
    if (error) { toast({ title: t('pages.accountSettings.toasts.saveFailed'), description: error.message, variant: 'destructive' }); return }
    toast({ title: t('pages.accountSettings.toasts.securityUpdated'), description: t('pages.accountSettings.toasts.securityUpdatedDesc') })
  }

  const handlePreferencesSave = async () => {
    document.documentElement.lang = preferences.language
    if (['en', 'ru', 'uz'].includes(preferences.language) && i18n.language !== preferences.language) {
      i18n.changeLanguage(preferences.language)
      if (currentUser) {
        await supabase.from('profiles').update({ preferred_language: preferences.language } as never).eq('id', currentUser.id)
      }
    }
    setDateFormat(preferences.dateFormat)
    setTimeFormat(preferences.timeFormat)
    const { error } = await upsertSettings({ preferences })
    if (error) { toast({ title: t('pages.accountSettings.toasts.saveFailed'), description: error.message, variant: 'destructive' }); return }
    toast({ title: t('pages.accountSettings.toasts.preferencesUpdated'), description: t('pages.accountSettings.toasts.preferencesUpdatedDesc') })
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!currentUser) {
      toast({ title: t('pages.accountSettings.toasts.notSignedIn'), variant: 'destructive' })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: t('pages.accountSettings.toasts.fileTooLarge'), description: t('pages.accountSettings.toasts.fileTooLargeDesc'), variant: 'destructive' })
      return
    }
    if (!file.type.startsWith('image/')) {
      toast({ title: t('pages.accountSettings.toasts.invalidFile'), description: t('pages.accountSettings.toasts.invalidFileDesc'), variant: 'destructive' })
      return
    }
    setAvatarUploading(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${currentUser.id}/avatar-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadError) throw uploadError
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
      const url = pub.publicUrl
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: url } as never)
        .eq('id', currentUser.id)
      if (updateError) throw updateError
      setProfile((p) => ({ ...p, avatar: url }))
      toast({ title: t('pages.accountSettings.toasts.photoUpdated'), description: t('pages.accountSettings.toasts.photoUpdatedDesc') })
    } catch (err) {
      const message = err instanceof Error ? err.message : t('pages.accountSettings.toasts.uploadFailed')
      toast({ title: t('pages.accountSettings.toasts.uploadFailed'), description: message, variant: 'destructive' })
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    toast({
      title: t('pages.accountSettings.toasts.themeChanged'),
      description: t('pages.accountSettings.toasts.themeChangedDesc', {
        theme: newTheme === 'system' ? t('pages.accountSettings.preferences.systemPreference') : t(`pages.accountSettings.preferences.themeOptions.${newTheme}`),
      }),
    })
  }

  const openChangePassword = () => {
    setPwForm({ next: '', confirm: '' })
    setPwShow(false)
    setPwOpen(true)
  }

  const submitChangePassword = async () => {
    const { next, confirm } = pwForm
    if (!next || !confirm) {
      toast({ title: t('pages.accountSettings.toasts.missingFields'), description: t('pages.accountSettings.toasts.passwordFieldsRequired'), variant: 'destructive' })
      return
    }
    if (next.length < 8) {
      toast({ title: t('pages.accountSettings.toasts.passwordTooShort'), description: t('pages.accountSettings.toasts.useAtLeast8'), variant: 'destructive' })
      return
    }
    if (!/[A-Z]/.test(next) || !/[0-9]/.test(next)) {
      toast({ title: t('pages.accountSettings.toasts.weakPassword'), description: t('pages.accountSettings.toasts.includeUppercaseNumber'), variant: 'destructive' })
      return
    }
    if (next !== confirm) {
      toast({ title: t('pages.accountSettings.toasts.passwordsDontMatch'), description: t('pages.accountSettings.toasts.passwordsDontMatchDesc'), variant: 'destructive' })
      return
    }
    setPwSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password: next })
    setPwSubmitting(false)
    if (error) {
      toast({ title: t('pages.accountSettings.toasts.passwordUpdateFailed'), description: error.message, variant: 'destructive' })
      return
    }
    const updated = { ...security, passwordUpdatedAt: new Date().toISOString() }
    setSecurity(updated)
    await upsertSettings({ security: updated })
    setPwOpen(false)
    toast({ title: t('pages.accountSettings.toasts.passwordChanged'), description: t('pages.accountSettings.toasts.passwordChangedDesc') })
  }

  const passwordLastChanged = security.passwordUpdatedAt
    ? formatDate(security.passwordUpdatedAt)
    : t('pages.accountSettings.security.never')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('pages.accountSettings.title')}</h1>
        <p className="text-muted-foreground">{t('pages.accountSettings.subtitle')}</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" /> {t('pages.accountSettings.tabs.profile')}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" /> {t('pages.accountSettings.tabs.notifications')}
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" /> {t('pages.accountSettings.tabs.security')}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Palette className="w-4 h-4" /> {t('pages.accountSettings.tabs.preferences')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('pages.accountSettings.profile.title')}</CardTitle>
              <CardDescription>{t('pages.accountSettings.profile.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback>
                    {profile.name ? profile.name.split(' ').map((n) => n[0]).join('') : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" id="photo-upload" disabled={avatarUploading} />
                  <label htmlFor="photo-upload">
                    <Button variant="outline" size="sm" asChild disabled={avatarUploading}>
                      <span className="cursor-pointer">{avatarUploading ? t('pages.accountSettings.profile.uploading') : t('pages.accountSettings.profile.changePhoto')}</span>
                    </Button>
                  </label>
                  <p className="text-sm text-muted-foreground mt-1">{t('pages.accountSettings.profile.photoHint')}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('pages.accountSettings.profile.fullName')}</Label>
                  <Input id="name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('pages.accountSettings.profile.email')}</Label>
                  <Input id="email" type="email" value={profile.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('pages.accountSettings.profile.phone')}</Label>
                  <Input id="phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">{t('pages.accountSettings.profile.department')}</Label>
                  <Select value={profile.department} onValueChange={(value) => setProfile({ ...profile, department: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Human Resources">{t('pages.accountSettings.profile.departments.humanResources')}</SelectItem>
                      <SelectItem value="Engineering">{t('pages.accountSettings.profile.departments.engineering')}</SelectItem>
                      <SelectItem value="Marketing">{t('pages.accountSettings.profile.departments.marketing')}</SelectItem>
                      <SelectItem value="Sales">{t('pages.accountSettings.profile.departments.sales')}</SelectItem>
                      <SelectItem value="Finance">{t('pages.accountSettings.profile.departments.finance')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">{t('pages.accountSettings.profile.role')}</Label>
                  <Input id="role" value={profile.role} onChange={(e) => setProfile({ ...profile, role: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">{t('pages.accountSettings.profile.timezone')}</Label>
                  <Select value={profile.timezone} onValueChange={(value) => setProfile({ ...profile, timezone: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC-8">{t('pages.accountSettings.profile.timezones.pacific')}</SelectItem>
                      <SelectItem value="UTC-7">{t('pages.accountSettings.profile.timezones.mountain')}</SelectItem>
                      <SelectItem value="UTC-6">{t('pages.accountSettings.profile.timezones.central')}</SelectItem>
                      <SelectItem value="UTC-5">{t('pages.accountSettings.profile.timezones.eastern')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleProfileSave}>{t('pages.accountSettings.profile.saveChanges')}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('pages.accountSettings.notifications.title')}</CardTitle>
              <CardDescription>{t('pages.accountSettings.notifications.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {[
                  { key: 'emailNotifications', label: t('pages.accountSettings.notifications.email'), desc: t('pages.accountSettings.notifications.emailDesc') },
                  { key: 'pushNotifications', label: t('pages.accountSettings.notifications.push'), desc: t('pages.accountSettings.notifications.pushDesc') },
                  { key: 'systemAlerts', label: t('pages.accountSettings.notifications.systemAlerts'), desc: t('pages.accountSettings.notifications.systemAlertsDesc') },
                ].map((n, i) => (
                  <div key={n.key}>
                    {i > 0 && <Separator className="mb-4" />}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{n.label}</Label>
                        <p className="text-sm text-muted-foreground">{n.desc}</p>
                      </div>
                      <Switch
                        checked={(notifications as Record<string, boolean>)[n.key]}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, [n.key]: checked })
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={handleNotificationSave}>{t('pages.accountSettings.notifications.savePreferences')}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('pages.accountSettings.security.title')}</CardTitle>
              <CardDescription>{t('pages.accountSettings.security.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">{t('pages.accountSettings.security.sessionTimeout')}</Label>
                  <Select value={security.sessionTimeout} onValueChange={(value) => setSecurity({ ...security, sessionTimeout: value })}>
                    <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">{t('pages.accountSettings.security.timeOptions.15')}</SelectItem>
                      <SelectItem value="30">{t('pages.accountSettings.security.timeOptions.30')}</SelectItem>
                      <SelectItem value="60">{t('pages.accountSettings.security.timeOptions.60')}</SelectItem>
                      <SelectItem value="120">{t('pages.accountSettings.security.timeOptions.120')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>{t('pages.accountSettings.security.password')}</Label>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={openChangePassword}>
                      <Key className="w-4 h-4 mr-2" /> {t('pages.accountSettings.security.changePassword')}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{t('pages.accountSettings.security.lastChanged', { date: passwordLastChanged })}</p>
                </div>
              </div>

              <Button onClick={handleSecuritySave}>{t('pages.accountSettings.security.saveSecurity')}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('pages.accountSettings.preferences.title')}</CardTitle>
              <CardDescription>{t('pages.accountSettings.preferences.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('pages.accountSettings.preferences.theme')}</Label>
                  <Select value={theme} onValueChange={handleThemeChange}>
                    <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">{t('pages.accountSettings.preferences.themeOptions.light')}</SelectItem>
                      <SelectItem value="dark">{t('pages.accountSettings.preferences.themeOptions.dark')}</SelectItem>
                      <SelectItem value="system">{t('pages.accountSettings.preferences.themeOptions.system')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">{t('pages.accountSettings.preferences.themeHint')}</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>{t('pages.accountSettings.preferences.language')}</Label>
                  <Select value={preferences.language} onValueChange={(value) => setPreferences({ ...preferences, language: value })}>
                    <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ru">Русский</SelectItem>
                      <SelectItem value="uz">O'zbekcha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>{t('pages.accountSettings.preferences.dateFormat')}</Label>
                  <Select value={preferences.dateFormat} onValueChange={(value) => setPreferences({ ...preferences, dateFormat: value as DateFormat })}>
                    <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd/mmm/yyyy">DD/MMM/YYYY</SelectItem>
                      <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">{t('pages.accountSettings.preferences.preview', { date: formatDate(new Date(), preferences.dateFormat) })}</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>{t('pages.accountSettings.preferences.timeFormat')}</Label>
                  <Select value={preferences.timeFormat} onValueChange={(value) => setPreferences({ ...preferences, timeFormat: value as TimeFormat })}>
                    <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">{t('pages.accountSettings.preferences.timeOptions.12')}</SelectItem>
                      <SelectItem value="24">{t('pages.accountSettings.preferences.timeOptions.24')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handlePreferencesSave}>{t('pages.accountSettings.preferences.savePreferences')}</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pages.accountSettings.passwordDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('pages.accountSettings.passwordDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>{t('pages.accountSettings.passwordDialog.newPassword')}</Label>
              <div className="relative">
                <Input
                  type={pwShow ? 'text' : 'password'}
                  value={pwForm.next}
                  onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
                  placeholder={t('pages.accountSettings.passwordDialog.placeholder')}
                />
                <button
                  type="button"
                  onClick={() => setPwShow(!pwShow)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label={t('pages.accountSettings.passwordDialog.toggleVisibility')}
                >
                  {pwShow ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('pages.accountSettings.passwordDialog.confirmNewPassword')}</Label>
              <Input
                type={pwShow ? 'text' : 'password'}
                value={pwForm.confirm}
                onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                placeholder={t('pages.accountSettings.passwordDialog.repeatPlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwOpen(false)} disabled={pwSubmitting}>{t('pages.accountSettings.passwordDialog.cancel')}</Button>
            <Button onClick={submitChangePassword} disabled={pwSubmitting}>
              {pwSubmitting ? t('pages.accountSettings.passwordDialog.updating') : t('pages.accountSettings.passwordDialog.updatePassword')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AccountSettings
