import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Megaphone, Pin, Plus, Trash2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "react-i18next"
import { formatDate } from "@/lib/date"

interface Announcement {
  id: string
  title: string
  body: string
  pinned: boolean
  created_at: string
  created_by: string | null
}

export function AnnouncementsBoard() {
  const { currentUser: user } = useAuth()
  const { t } = useTranslation()
  const { toast } = useToast()
  const [items, setItems] = useState<Announcement[]>([])
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [pinned, setPinned] = useState(false)
  const [saving, setSaving] = useState(false)

  const isAdmin = user?.role === "Admin"
  const isGuest = user?.role === "Guest"

  const load = async () => {
    const { data, error } = await (supabase as any)
      .from("announcements")
      .select("*")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
    if (error) console.error("[Announcements] load error", error)
    setItems((data ?? []) as Announcement[])
  }

  useEffect(() => {
    if (!user || isGuest) return
    load()
    const channel = supabase
      .channel("announcements-board")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, isGuest])

  if (!user || isGuest) return null


  const create = async () => {
    if (!title.trim() || !body.trim()) return
    setSaving(true)
    const { error } = await (supabase as any).from("announcements").insert({
      title: title.trim(),
      body: body.trim(),
      pinned,
      created_by: user?.id,
    })
    setSaving(false)
    if (error) {
      toast({ title: t("common.error", "Error"), description: error.message, variant: "destructive" })
      return
    }
    setTitle(""); setBody(""); setPinned(false); setOpen(false)
    toast({ title: t("pages.dashboard.announcements.posted", "Announcement posted") })
  }

  const remove = async (id: string) => {
    const { error } = await (supabase as any).from("announcements").delete().eq("id", id)
    if (error) toast({ title: t("common.error", "Error"), description: error.message, variant: "destructive" })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center">
            <Megaphone className="mr-2 h-5 w-5" />
            {t("pages.dashboard.announcements.title", "Announcements from Leadership")}
          </CardTitle>
          <CardDescription>
            {t("pages.dashboard.announcements.subtitle", "Official updates and messages from the leadership team")}
          </CardDescription>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />{t("pages.dashboard.announcements.new", "New")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("pages.dashboard.announcements.newTitle", "New announcement")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>{t("common.title", "Title")}</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                  <Label>{t("common.message", "Message")}</Label>
                  <Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={pinned} onCheckedChange={setPinned} id="pin-ann" />
                  <Label htmlFor="pin-ann">{t("pages.dashboard.announcements.pin", "Pin to top")}</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel", "Cancel")}</Button>
                <Button onClick={create} disabled={saving}>{t("common.post", "Post")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Megaphone className="mx-auto h-12 w-12 mb-4 opacity-30" />
            <p>{t("pages.dashboard.announcements.empty", "No announcements yet")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((a) => (
              <div key={a.id} className="p-4 rounded-lg border bg-card/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {a.pinned && <Badge variant="secondary"><Pin className="h-3 w-3 mr-1" />Pinned</Badge>}
                    <h4 className="font-semibold">{a.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{formatDate(a.created_at)}</span>
                    {isAdmin && (
                      <Button size="icon" variant="ghost" onClick={() => remove(a.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{a.body}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
