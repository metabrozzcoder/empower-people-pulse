import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Loader2, Plus, Users, Trash2, ArrowRight } from 'lucide-react'
import { WorkspaceRoom, type Person } from './WorkspaceRoom'

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = supabase as any

export function WorkspacePanel() {
  const { t } = useTranslation()
  const { currentUser } = useAuth()
  const { toast } = useToast()
  const uid = currentUser?.id as string | undefined

  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [{ data: ws }, { data: profs }] = await Promise.all([
      db.from('workspaces').select('*').order('created_at', { ascending: false }),
      db.from('profiles_public').select('id, name, avatar_url'),
    ])
    setWorkspaces(ws ?? [])
    setPeople((profs ?? []) as Person[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const channel = supabase
      .channel('workspaces-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspaces' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  const create = async () => {
    if (!title.trim() || !uid) return
    setCreating(true)
    const { data, error } = await db.from('workspaces')
      .insert({ title: title.trim(), description: description.trim() || null, created_by: uid })
      .select().single()
    if (!error && data) {
      await db.from('workspace_members').insert({ workspace_id: data.id, user_id: uid, role: 'owner' })
    }
    setCreating(false)
    if (error) return toast({ title: error.message, variant: 'destructive' })
    setTitle(''); setDescription(''); setOpen(false)
    await load()
    setActiveId(data.id)
  }

  const remove = async (id: string) => {
    await db.from('workspaces').delete().eq('id', id)
    load()
  }

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  const active = workspaces.find((w) => w.id === activeId)
  if (active) {
    return (
      <WorkspaceRoom
        workspaceId={active.id}
        workspaceTitle={active.title}
        ownerId={active.created_by}
        people={people}
        onBack={() => setActiveId(null)}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{`${t('workspace.title', 'Team workspaces')}`}</h2>
          <p className="text-sm text-muted-foreground">
            {`${t('workspace.subtitle', 'Real-time docs, shared tables, boards and comments for invited members.')}`}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> {`${t('workspace.new', 'New workspace')}`}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{`${t('workspace.new', 'New workspace')}`}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder={t('workspace.namePlaceholder', 'Workspace name') as string} />
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder={t('workspace.descPlaceholder', 'What is this workspace for?') as string} />
            </div>
            <DialogFooter>
              <Button onClick={create} disabled={creating || !title.trim()} className="gap-2">
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                {`${t('common.create', 'Create')}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!workspaces.length ? (
        <Card><CardContent className="py-14 text-center text-sm text-muted-foreground">
          {`${t('workspace.empty', 'No workspaces yet. Create one and invite your teammates.')}`}
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((w) => (
            <Card key={w.id} className="group transition-shadow hover:shadow-md">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{w.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{w.description ?? ''}</p>
                  </div>
                  {w.created_by === uid && (
                    <button onClick={() => remove(w.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" />
                    {w.created_by === uid ? `${t('workspace.owner', 'Owner')}` : `${t('workspace.member', 'Member')}`}
                  </Badge>
                  <Button size="sm" variant="outline" className="gap-2" onClick={() => setActiveId(w.id)}>
                    {`${t('workspace.open', 'Open')}`} <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
