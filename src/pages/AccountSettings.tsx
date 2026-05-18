import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
import { User, Bell, Shield, Palette, Key, Eye, EyeOff, Copy, Check, Smartphone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"
import { useAuth } from "@/context/AuthContext"

// Simple deterministic "hash" so we don't store raw passwords in localStorage.
// Not cryptographically secure — adequate for the local-demo password feature.
const hashPassword = (s: string) => {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i)
  return `h_${(h >>> 0).toString(16)}_${s.length}`
}

// Pseudo-TOTP generator (30s window) for the demo 2FA flow.
const generateOtp = (secret: string, step?: number) => {
  const t = step ?? Math.floor(Date.now() / 30000)
  let h = 2166136261
  const input = `${secret}:${t}`
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = (h * 16777619) >>> 0
  }
  return (h % 1000000).toString().padStart(6, "0")
}

const randomSecret = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  let s = ""
  for (let i = 0; i < 16; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

const randomBackupCodes = () =>
  Array.from({ length: 8 }, () =>
    Math.random().toString(36).slice(2, 6).toUpperCase() +
    "-" +
    Math.random().toString(36).slice(2, 6).toUpperCase()
  )

const AccountSettings = () => {
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const { currentUser, login } = useAuth()

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
    twoFactorEnabled: boolean
    sessionTimeout: string
    twoFactorSecret?: string
    backupCodes?: string[]
    passwordUpdatedAt?: string
  }>({
    twoFactorEnabled: false,
    sessionTimeout: "30",
  })

  const [preferences, setPreferences] = useState({
    language: "en",
    dateFormat: "mm/dd/yyyy",
    timeFormat: "12",
  })

  // Change password dialog
  const [pwOpen, setPwOpen] = useState(false)
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" })
  const [pwShow, setPwShow] = useState(false)

  // 2FA setup dialog
  const [twoFaOpen, setTwoFaOpen] = useState(false)
  const [pendingSecret, setPendingSecret] = useState<string>("")
  const [twoFaCode, setTwoFaCode] = useState("")
  const [pendingBackupCodes, setPendingBackupCodes] = useState<string[]>([])
  const [codesCopied, setCodesCopied] = useState(false)

  // 2FA disable dialog
  const [disable2faOpen, setDisable2faOpen] = useState(false)
  const [disableCode, setDisableCode] = useState("")

  useEffect(() => {
    const savedNotifications = localStorage.getItem("notifications")
    const savedPreferences = localStorage.getItem("preferences")
    const savedSecurity = localStorage.getItem("security")

    if (savedNotifications) setNotifications(JSON.parse(savedNotifications))
    if (savedPreferences) setPreferences(JSON.parse(savedPreferences))
    if (savedSecurity) setSecurity(JSON.parse(savedSecurity))
  }, [])

  const persistSecurity = (next: typeof security) => {
    setSecurity(next)
    localStorage.setItem("security", JSON.stringify(next))
  }

  const handleProfileSave = () => {
    localStorage.setItem("userProfile", JSON.stringify(profile))
    if (currentUser) {
      login({
        ...currentUser,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        department: profile.department,
        avatar: profile.avatar,
      } as any)
    }
    toast({ title: "Profile Updated", description: "Your profile has been successfully updated." })
  }

  const handleNotificationSave = () => {
    localStorage.setItem("notifications", JSON.stringify(notifications))
    toast({ title: "Notifications Updated", description: "Your notification preferences have been saved." })
  }

  const handleSecuritySave = () => {
    localStorage.setItem("security", JSON.stringify(security))
    toast({ title: "Security Settings Updated", description: "Your security settings have been updated." })
  }

  const handlePreferencesSave = () => {
    localStorage.setItem("preferences", JSON.stringify(preferences))
    document.documentElement.lang = preferences.language
    toast({ title: "Preferences Updated", description: "Your preferences have been saved and applied." })
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image smaller than 2MB.", variant: "destructive" })
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const newAvatar = e.target?.result as string
      const updated = { ...profile, avatar: newAvatar }
      setProfile(updated)
      localStorage.setItem("userProfile", JSON.stringify(updated))
      if (currentUser) login({ ...currentUser, avatar: newAvatar } as any)
      toast({ title: "Photo Updated", description: "Your profile photo has been updated successfully." })
    }
    reader.readAsDataURL(file)
  }

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    toast({ title: "Theme Changed", description: `Theme has been changed to ${newTheme === "system" ? "system preference" : newTheme}.` })
  }

  // ---------- Change Password ----------
  const openChangePassword = () => {
    setPwForm({ current: "", next: "", confirm: "" })
    setPwShow(false)
    setPwOpen(true)
  }

  const submitChangePassword = () => {
    const { current, next, confirm } = pwForm
    if (!current || !next || !confirm) {
      toast({ title: "Missing fields", description: "All password fields are required.", variant: "destructive" })
      return
    }
    if (next.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" })
      return
    }
    if (!/[A-Z]/.test(next) || !/[0-9]/.test(next)) {
      toast({ title: "Weak password", description: "Include at least one uppercase letter and one number.", variant: "destructive" })
      return
    }
    if (next !== confirm) {
      toast({ title: "Passwords don't match", description: "New password and confirmation must match.", variant: "destructive" })
      return
    }

    const storedHash = localStorage.getItem("userPasswordHash")
    if (storedHash && storedHash !== hashPassword(current)) {
      toast({ title: "Incorrect current password", description: "Please verify and try again.", variant: "destructive" })
      return
    }

    localStorage.setItem("userPasswordHash", hashPassword(next))
    const updated = { ...security, passwordUpdatedAt: new Date().toISOString() }
    persistSecurity(updated)
    setPwOpen(false)
    toast({ title: "Password Changed", description: "Your password has been updated successfully." })
  }

  // ---------- Two-Factor ----------
  const startEnable2fa = () => {
    const secret = randomSecret()
    setPendingSecret(secret)
    setPendingBackupCodes(randomBackupCodes())
    setTwoFaCode("")
    setCodesCopied(false)
    setTwoFaOpen(true)
  }

  const confirmEnable2fa = () => {
    if (twoFaCode.length !== 6) {
      toast({ title: "Enter 6-digit code", description: "Open your authenticator and enter the current code.", variant: "destructive" })
      return
    }
    const valid = [
      generateOtp(pendingSecret),
      generateOtp(pendingSecret, Math.floor(Date.now() / 30000) - 1),
      generateOtp(pendingSecret, Math.floor(Date.now() / 30000) + 1),
    ]
    if (!valid.includes(twoFaCode)) {
      toast({ title: "Invalid code", description: "The code didn't match. Try the current one shown below.", variant: "destructive" })
      return
    }
    persistSecurity({
      ...security,
      twoFactorEnabled: true,
      twoFactorSecret: pendingSecret,
      backupCodes: pendingBackupCodes,
    })
    setTwoFaOpen(false)
    toast({ title: "Two-Factor Enabled", description: "Your account is now protected with 2FA." })
  }

  const requestDisable2fa = () => {
    setDisableCode("")
    setDisable2faOpen(true)
  }

  const confirmDisable2fa = () => {
    const secret = security.twoFactorSecret || ""
    const valid = [
      generateOtp(secret),
      generateOtp(secret, Math.floor(Date.now() / 30000) - 1),
      generateOtp(secret, Math.floor(Date.now() / 30000) + 1),
    ]
    const isBackup = security.backupCodes?.includes(disableCode.toUpperCase())
    if (!valid.includes(disableCode) && !isBackup) {
      toast({ title: "Invalid code", description: "Enter a valid authenticator or backup code.", variant: "destructive" })
      return
    }
    persistSecurity({
      ...security,
      twoFactorEnabled: false,
      twoFactorSecret: undefined,
      backupCodes: undefined,
    })
    setDisable2faOpen(false)
    toast({ title: "Two-Factor Disabled", description: "2FA has been turned off for your account." })
  }

  const copyBackupCodes = async () => {
    await navigator.clipboard.writeText(pendingBackupCodes.join("\n"))
    setCodesCopied(true)
    toast({ title: "Copied", description: "Backup codes copied to clipboard." })
  }

  const currentOtpPreview = useMemo(
    () => (pendingSecret ? generateOtp(pendingSecret) : ""),
    [pendingSecret, twoFaOpen]
  )

  const passwordLastChanged = security.passwordUpdatedAt
    ? new Date(security.passwordUpdatedAt).toLocaleDateString()
    : "Never"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
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
                    {profile.name ? profile.name.split(" ").map((n) => n[0]).join("") : "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" id="photo-upload" />
                  <label htmlFor="photo-upload">
                    <Button variant="outline" size="sm" asChild>
                      <span className="cursor-pointer">Change Photo</span>
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
                  <Input id="email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
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
                  { key: "emailNotifications", label: "Email Notifications", desc: "Receive notifications via email" },
                  { key: "pushNotifications", label: "Push Notifications", desc: "Receive push notifications in your browser" },
                  { key: "weeklyReports", label: "Weekly Reports", desc: "Receive weekly summary reports" },
                  { key: "systemAlerts", label: "System Alerts", desc: "Receive important system alerts and updates" },
                ].map((n, i) => (
                  <div key={n.key}>
                    {i > 0 && <Separator className="mb-4" />}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{n.label}</Label>
                        <p className="text-sm text-muted-foreground">{n.desc}</p>
                      </div>
                      <Switch
                        checked={(notifications as any)[n.key]}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, [n.key]: checked } as any)
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
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={security.twoFactorEnabled ? "default" : "secondary"}>
                      {security.twoFactorEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                    {security.twoFactorEnabled ? (
                      <Button variant="outline" size="sm" onClick={requestDisable2fa}>Disable</Button>
                    ) : (
                      <Button size="sm" onClick={startEnable2fa}>Enable</Button>
                    )}
                  </div>
                </div>

                {security.twoFactorEnabled && security.backupCodes && (
                  <div className="rounded-md border bg-muted/40 p-3 text-sm">
                    <p className="font-medium mb-1">Backup codes available</p>
                    <p className="text-muted-foreground">
                      You have {security.backupCodes.length} backup codes. Keep them safe — each works once.
                    </p>
                  </div>
                )}

                <Separator />

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
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
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
              <Label>Current Password</Label>
              <div className="relative">
                <Input
                  type={pwShow ? "text" : "password"}
                  value={pwForm.current}
                  onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                  placeholder="Enter current password"
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
              {!localStorage.getItem("userPasswordHash") && (
                <p className="text-xs text-muted-foreground">
                  No password set yet — current password will be accepted as your initial value.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type={pwShow ? "text" : "password"}
                value={pwForm.next}
                onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
                placeholder="At least 8 characters"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type={pwShow ? "text" : "password"}
                value={pwForm.confirm}
                onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                placeholder="Repeat new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwOpen(false)}>Cancel</Button>
            <Button onClick={submitChangePassword}>Update Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enable 2FA Dialog */}
      <Dialog open={twoFaOpen} onOpenChange={setTwoFaOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" /> Enable Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Scan the secret into an authenticator app (Google Authenticator, Authy, 1Password), then enter the 6-digit code.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground mb-1">Setup secret</p>
              <p className="font-mono text-sm tracking-wider break-all">{pendingSecret}</p>
            </div>
            <div className="rounded-md border p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Current code (demo)</p>
              <p className="font-mono text-2xl tracking-widest">{currentOtpPreview}</p>
              <p className="text-xs text-muted-foreground mt-1">Refreshes every 30 seconds</p>
            </div>
            <div className="space-y-2">
              <Label>Enter 6-digit code</Label>
              <Input
                inputMode="numeric"
                maxLength={6}
                value={twoFaCode}
                onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="font-mono tracking-widest text-center text-lg"
              />
            </div>
            <div className="rounded-md border p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Backup codes</p>
                <Button variant="ghost" size="sm" onClick={copyBackupCodes}>
                  {codesCopied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  {codesCopied ? "Copied" : "Copy all"}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-1 font-mono text-xs">
                {pendingBackupCodes.map((c) => (
                  <span key={c} className="px-2 py-1 rounded bg-muted">{c}</span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Store these somewhere safe — each can be used once.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTwoFaOpen(false)}>Cancel</Button>
            <Button onClick={confirmEnable2fa}>Verify & Enable</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={disable2faOpen} onOpenChange={setDisable2faOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter a current authenticator code or one of your backup codes to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Verification Code</Label>
            <Input
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value)}
              placeholder="6-digit code or backup code"
              className="font-mono tracking-widest"
            />
            {security.twoFactorSecret && (
              <p className="text-xs text-muted-foreground">
                Current demo code: <span className="font-mono">{generateOtp(security.twoFactorSecret)}</span>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisable2faOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDisable2fa}>Disable 2FA</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AccountSettings
