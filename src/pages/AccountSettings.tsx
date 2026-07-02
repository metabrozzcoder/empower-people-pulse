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
    weeklyReports: true,
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
    dateFormat: "mm/dd/yyyy",
    timeFormat: "12",
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
      toast({ title: 'Not signed in', description: 'Please sign in again.', variant: 'destructive' })
      return
    }
    if (!profile.name.trim()) {
      toast({ title: 'Name required', variant: 'destructive' })
      return
    }
    const { error } = await supabase.from('profiles').update({
      name: profile.name,
      phone: profile.phone,
      department: profile.department,
      position: profile.role,
      avatar_url: profile.avatar,
    } as never).eq('id', currentUser.id)
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Profile Updated', description: 'Your profile has been successfully updated.' })
  }

  const handleNotificationSave = async () => {
    const { error } = await upsertSettings({ notifications })
    if (error) { toast({ title: 'Save failed', description: error.message, variant: 'destructive' }); return }
    toast({ title: 'Notifications Updated', description: 'Your notification preferences have been saved.' })
  }

  const handleSecuritySave = async () => {
    const { error } = await upsertSettings({ security })
    if (error) { toast({ title: 'Save failed', description: error.message, variant: 'destructive' }); return }
    toast({ title: 'Security Settings Updated', description: 'Your security settings have been updated.' })
  }

  const handlePreferencesSave = async () => {
    document.documentElement.lang = preferences.language
    if (['en', 'ru', 'uz'].includes(preferences.language) && i18n.language !== preferences.language) {
      i18n.changeLanguage(preferences.language)
      if (currentUser) {
        await supabase.from('profiles').update({ preferred_language: preferences.language } as never).eq('id', currentUser.id)
      }
    }
    const { error } = await upsertSettings({ preferences })
    if (error) { toast({ title: 'Save failed', description: error.message, variant: 'destructive' }); return }
    toast({ title: 'Preferences Updated', description: 'Your preferences have been saved and applied.' })
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!currentUser) {
      toast({ title: 'Not signed in', variant: 'destructive' })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please select an image smaller than 2MB.', variant: 'destructive' })
      return
    }
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file.', variant: 'destructive' })
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
      toast({ title: 'Photo Updated', description: 'Your profile photo has been updated successfully.' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      toast({ title: 'Upload failed', description: message, variant: 'destructive' })
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    toast({ title: 'Theme Changed', description: `Theme has been changed to ${newTheme === 'system' ? 'system preference' : newTheme}.` })
  }

  const openChangePassword = () => {
    setPwForm({ next: '', confirm: '' })
    setPwShow(false)
    setPwOpen(true)
  }

  const submitChangePassword = async () => {
    const { next, confirm } = pwForm
    if (!next || !confirm) {
      toast({ title: 'Missing fields', description: 'All password fields are required.', variant: 'destructive' })
      return
    }
    if (next.length < 8) {
      toast({ title: 'Password too short', description: 'Use at least 8 characters.', variant: 'destructive' })
      return
    }
    if (!/[A-Z]/.test(next) || !/[0-9]/.test(next)) {
      toast({ title: 'Weak password', description: 'Include at least one uppercase letter and one number.', variant: 'destructive' })
      return
    }
    if (next !== confirm) {
      toast({ title: "Passwords don't match", description: 'New password and confirmation must match.', variant: 'destructive' })
      return
    }
    setPwSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password: next })
    setPwSubmitting(false)
    if (error) {
      toast({ title: 'Password update failed', description: error.message, variant: 'destructive' })
      return
    }
    const updated = { ...security, passwordUpdatedAt: new Date().toISOString() }
    setSecurity(updated)
    await upsertSettings({ security: updated })
    setPwOpen(false)
    toast({ title: 'Password Changed', description: 'Your password has been updated successfully.' })
  }

  const passwordLastChanged = security.passwordUpdatedAt
    ? formatDate(security.passwordUpdatedAt)
    : 'Never'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('pages.accountSettings.title')}</h1>
        <p className="text-muted-foreground">{t('pages.accountSettings.subtitle')}</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Palette className="w-4 h-4" /> Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal and professional information.</CardDescription>
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
                      <span className="cursor-pointer">{avatarUploading ? 'Uploading…' : 'Change Photo'}</span>
                    </Button>
                  </label>
                  <p className="text-sm text-muted-foreground mt-1">JPG, PNG or GIF. Max size 2MB.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={profile.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={profile.department} onValueChange={(value) => setProfile({ ...profile, department: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Human Resources">Human Resources</SelectItem>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" value={profile.role} onChange={(e) => setProfile({ ...profile, role: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={profile.timezone} onValueChange={(value) => setProfile({ ...profile, timezone: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC-8">Pacific Time (UTC-8)</SelectItem>
                      <SelectItem value="UTC-7">Mountain Time (UTC-7)</SelectItem>
                      <SelectItem value="UTC-6">Central Time (UTC-6)</SelectItem>
                      <SelectItem value="UTC-5">Eastern Time (UTC-5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleProfileSave}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified about important updates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {[
                  { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                  { key: 'pushNotifications', label: 'Push Notifications', desc: 'Receive push notifications in your browser' },
                  { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Receive weekly summary reports' },
                  { key: 'systemAlerts', label: 'System Alerts', desc: 'Receive important system alerts and updates' },
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
              <Button onClick={handleNotificationSave}>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security and authentication preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Select value={security.sessionTimeout} onValueChange={(value) => setSecurity({ ...security, sessionTimeout: value })}>
                    <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={openChangePassword}>
                      <Key className="w-4 h-4 mr-2" /> Change Password
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Last changed: {passwordLastChanged}</p>
                </div>
              </div>

              <Button onClick={handleSecuritySave}>Save Security Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Preferences</CardTitle>
              <CardDescription>Customize your application experience and appearance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={theme} onValueChange={handleThemeChange}>
                    <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">Choose your preferred theme or follow system settings</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Language</Label>
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
                  <Label>Date Format</Label>
                  <Select value={preferences.dateFormat} onValueChange={(value) => setPreferences({ ...preferences, dateFormat: value })}>
                    <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Time Format</Label>
                  <Select value={preferences.timeFormat} onValueChange={(value) => setPreferences({ ...preferences, timeFormat: value })}>
                    <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12-hour</SelectItem>
                      <SelectItem value="24">24-hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handlePreferencesSave}>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Change Password Dialog */}
      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Choose a strong password with at least 8 characters, including an uppercase letter and a number.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={pwShow ? 'text' : 'password'}
                  value={pwForm.next}
                  onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setPwShow(!pwShow)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label="Toggle password visibility"
                >
                  {pwShow ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type={pwShow ? 'text' : 'password'}
                value={pwForm.confirm}
                onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                placeholder="Repeat new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwOpen(false)} disabled={pwSubmitting}>Cancel</Button>
            <Button onClick={submitChangePassword} disabled={pwSubmitting}>
              {pwSubmitting ? 'Updating…' : 'Update Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AccountSettings
