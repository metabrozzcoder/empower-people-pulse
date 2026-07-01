
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, MessageCircle, CheckSquare, Gift } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { format, isToday, isTomorrow } from "date-fns"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { AnnouncementsBoard } from "@/components/AnnouncementsBoard"

interface UpcomingEvent {
  id: string
  title: string
  date: string
  type: string
}

interface BirthdayEmp {
  id: string
  name: string
  position?: string | null
  avatar?: string | null
  isToday: boolean
  formattedDate: string
}

const Index = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [birthdayEmployees, setBirthdayEmployees] = useState<BirthdayEmp[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([])

  const quickActions = [
    { title: t('pages.dashboard.quickActions.chat'), description: t('pages.dashboard.quickActions.chatDesc'), icon: MessageCircle, href: '/chat', color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { title: t('pages.dashboard.quickActions.calendar'), description: t('pages.dashboard.quickActions.calendarDesc'), icon: Calendar, href: '/scheduling', color: 'bg-green-50 text-green-600 border-green-200' },
    { title: t('pages.dashboard.quickActions.tasks'), description: t('pages.dashboard.quickActions.tasksDesc'), icon: CheckSquare, href: '/tasks', color: 'bg-purple-50 text-purple-600 border-purple-200' },
  ]

  useEffect(() => {
    (async () => {
      const [{ data: emps }, { data: profs }] = await Promise.all([
        supabase.from('employees').select('id, name, position, avatar, birthday'),
        supabase.from('profiles').select('id, name, position, avatar_url, birthday'),
      ])
      const raw = [
        ...((emps ?? []).map((e: any) => ({ id: `e:${e.id}`, name: e.name, position: e.position, avatar: e.avatar, birthday: e.birthday }))),
        ...((profs ?? []).map((p: any) => ({ id: `p:${p.id}`, name: p.name, position: p.position, avatar: p.avatar_url, birthday: p.birthday }))),
      ].filter((x) => x.birthday)

      const today = new Date(); today.setHours(0,0,0,0)
      const seen = new Set<string>()
      const list: BirthdayEmp[] = []
      for (const e of raw) {
        const b = new Date(e.birthday as string)
        if (isNaN(b.getTime())) continue
        const key = `${(e.name || '').toLowerCase()}|${b.getMonth()}-${b.getDate()}`
        if (seen.has(key)) continue
        seen.add(key)
        const next = new Date(today.getFullYear(), b.getMonth(), b.getDate())
        if (next < today) next.setFullYear(today.getFullYear() + 1)
        const diffDays = Math.round((next.getTime() - today.getTime()) / 86400000)
        if (diffDays > 30) continue
        list.push({
          id: e.id,
          name: e.name,
          position: e.position,
          avatar: e.avatar,
          isToday: diffDays === 0,
          formattedDate: format(next, 'MMM dd'),
        })
      }
      list.sort((a, b) => (a.isToday === b.isToday ? a.formattedDate.localeCompare(b.formattedDate) : a.isToday ? -1 : 1))
      setBirthdayEmployees(list)
    })()

    ;(async () => {
      const { data: auth } = await supabase.auth.getUser()
      const uid = auth.user?.id
      if (!uid) return
      const today = format(new Date(), 'yyyy-MM-dd')
      const { data } = await (supabase as any)
        .from('reminders')
        .select('id, title, date, time, type')
        .eq('user_id', uid)
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(10)
      const list: UpcomingEvent[] = (data ?? []).map((r: any) => {
        const d = new Date(r.date)
        const label = isToday(d) ? t('common.today') : isTomorrow(d) ? t('common.tomorrow') : format(d, 'MMM dd, yyyy')
        return { id: r.id, title: r.title, date: r.time ? `${label} • ${r.time}` : label, type: r.type || 'reminder' }
      })
      setUpcomingEvents(list)
    })()
  }, [t])


  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('pages.dashboard.title')}</h1>
          <p className="text-muted-foreground">{t('pages.dashboard.subtitle')}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        {quickActions.map((action, index) => (
          <Card 
            key={index} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(action.href)}
          >
            <CardContent className="flex items-center p-6">
              <div className={`p-3 rounded-lg ${action.color} mr-4`}>
                <action.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">{action.title}</h3>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Announcements */}
      <AnnouncementsBoard />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              {t('pages.dashboard.upcomingEvents')}
            </CardTitle>
            <CardDescription>{t('pages.dashboard.upcomingEventsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.length > 0 ? upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">{event.date}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {event.type}
                  </Badge>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="mx-auto h-12 w-12 mb-4 opacity-30" />
                  <p>{t('pages.dashboard.noEvents', 'No upcoming events')}</p>
                </div>
              )}
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => navigate('/scheduling')}
            >
              {t('pages.dashboard.viewAllEvents')}
            </Button>
          </CardContent>
        </Card>

        {/* Employee Birthdays */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Gift className="mr-2 h-5 w-5" />
              {t('pages.dashboard.birthdays')}
            </CardTitle>
            <CardDescription>{t('pages.dashboard.birthdaysDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {birthdayEmployees.length > 0 ? (
              <div className="space-y-4">
                {birthdayEmployees.map((employee) => (
                  <div key={employee.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={employee.avatar ?? undefined} />
                      <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{employee.name}</p>
                      <p className="text-sm text-muted-foreground">{employee.position}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{employee.formattedDate}</p>
                      <Badge variant={employee.isToday ? "default" : "secondary"} className="text-xs">
                        {employee.isToday ? t('common.today') : t('common.tomorrow')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Gift className="mx-auto h-12 w-12 mb-4 opacity-30" />
                <p>{t('pages.dashboard.noBirthdays')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Index
