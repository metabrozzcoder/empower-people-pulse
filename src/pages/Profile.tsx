
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from 'react-i18next'
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Mail, Phone, MapPin, Building, User, Award, Clock, TrendingUp, Loader2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

const Profile = () => {
  const { t } = useTranslation()
  const { currentUser, refreshProfile } = useAuth()
  const { toast } = useToast()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    position: '',
    department: '',
    avatar_url: '',
  })

  const openEdit = () => {
    setForm({
      name: currentUser?.name ?? '',
      phone: currentUser?.phone ?? '',
      position: currentUser?.position ?? '',
      department: currentUser?.department ?? '',
      avatar_url: currentUser?.avatar ?? '',
    })
    setIsEditOpen(true)
  }

  const saveProfile = async () => {
    if (!currentUser?.id) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        position: form.position.trim() || null,
        department: form.department.trim() || null,
        avatar_url: form.avatar_url.trim() || null,
      })
      .eq('id', currentUser.id)
    setSaving(false)
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' })
      return
    }
    await refreshProfile()
    toast({ title: 'Profile updated', description: 'Your changes have been saved.' })
    setIsEditOpen(false)
  }

  const userProfile = {
    name: currentUser?.name || "Not provided",
    email: currentUser?.email || "Not provided",
    phone: currentUser?.phone || "Not provided",
    position: currentUser?.role === 'Admin' ? 'Administrator' : currentUser?.role === 'HR' ? 'HR Manager' : currentUser?.role === 'Guest' ? 'Guest' : 'Not assigned',
    department: currentUser?.department || "Not assigned",
    location: "Not provided",
    hireDate: currentUser?.createdDate || "Not provided",
    employeeId: currentUser?.id ? `#${currentUser.id.slice(0, 6).toUpperCase()}` : "—",
    manager: "Not assigned",
    status: currentUser?.status || "Unknown",
    performanceScore: 0
  }

  const stats = [
    { label: "Years of Service", value: "Not calculated", icon: Clock },
    { label: "Performance Score", value: userProfile.performanceScore > 0 ? `${userProfile.performanceScore}%` : "Not evaluated", icon: TrendingUp },
    { label: "Team Size", value: "Not assigned", icon: User },
    { label: "Projects Completed", value: "Not tracked", icon: Award }
  ]

  const recentAchievements = [
    { title: "No achievements recorded", date: "N/A", type: "info" }
  ]

  const skills = [
    { name: "No skills recorded", level: 0 }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('pages.profile.title')}</h1>
        <p className="text-muted-foreground">{t('pages.profile.subtitle')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto">
                <Avatar variant="gradient" size="xl" status="online">
                  <AvatarImage src={currentUser?.avatar} />
                  <AvatarFallback>{currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('') : 'U'}</AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="mt-3">{userProfile.name}</CardTitle>
              <CardDescription>{userProfile.position}</CardDescription>
              <Badge variant="default" className="w-fit mx-auto">
                {userProfile.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{userProfile.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{userProfile.phone}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  <span>{userProfile.department}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{userProfile.location}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Joined {userProfile.hireDate}</span>
                </div>
              </div>
              <Separator />
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Employee ID</p>
                <p className="font-medium">{userProfile.employeeId}</p>
              </div>
              <Button className="w-full" variant="soft" onClick={openEdit}>
                Edit Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <Card key={index} className="min-w-0">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <stat.icon className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold leading-tight break-words">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1 break-words">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Skills & Competencies</CardTitle>
              <CardDescription>
                Your professional skills and their current levels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {skills.map((skill, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{skill.name}</span>
                    <span className="text-sm text-muted-foreground">{skill.level}%</span>
                  </div>
                  <Progress value={skill.level} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Achievements</CardTitle>
              <CardDescription>
                Your recent accomplishments and milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAchievements.map((achievement, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{achievement.title}</p>
                      <p className="text-sm text-muted-foreground">{achievement.date}</p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {achievement.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your personal information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="p-name">Full name</Label>
              <Input id="p-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-phone">Phone</Label>
              <Input id="p-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="p-pos">Position</Label>
                <Input id="p-pos" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-dep">Department</Label>
                <Input id="p-dep" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-avatar">Avatar URL</Label>
              <Input id="p-avatar" placeholder="https://…" value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={saving}>Cancel</Button>
            <Button variant="gradient" onClick={saveProfile} disabled={saving || !form.name.trim()}>
              {saving ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>) : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Profile
