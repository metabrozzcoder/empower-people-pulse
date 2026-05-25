import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  MessageSquare, Send, Search, Smile, Check, CheckCheck, Bell, BellOff,
} from 'lucide-react'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

interface ChatUser {
  id: string
  name: string
  avatar?: string
  role?: string
  unreadCount: number
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  edited?: boolean
}

const EMOJIS = ['😊','😂','❤️','👍','🎉','🔥','🙏','👏','😍','🤔','😎','💯','✅','🚀','💡']

const fmtTime = (iso: string) => {
  try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } catch { return '' }
}

export default function Chat() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { currentUser, session } = useAuth()
  const myId = session?.user.id

  const [users, setUsers] = useState<ChatUser[]>([])
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null)
  const [convByUser, setConvByUser] = useState<Record<string, string>>({}) // userId -> conversationId
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [notifEnabled, setNotifEnabled] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const selectedUserRef = useRef<ChatUser | null>(null)
  useEffect(() => { selectedUserRef.current = selectedUser }, [selectedUser])

  // Request browser notification permission
  useEffect(() => {
    if (typeof Notification === 'undefined') return
    if (Notification.permission === 'granted') { setNotifEnabled(true); return }
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(p => setNotifEnabled(p === 'granted'))
    }
  }, [])

  // Load users (other profiles)
  useEffect(() => {
    if (!myId) return
    ;(async () => {
      const { data } = await supabase
        .from('profiles_public' as never)
        .select('id, name, avatar_url, position')
        .order('name')
      const list: ChatUser[] = (data ?? [])
        .filter((p: any) => p.id !== myId)
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar_url ?? undefined,
          role: p.position ?? undefined,
          unreadCount: 0,
        }))
      setUsers(list)
    })()
  }, [myId])

  // Load existing DM conversations the user is in -> map user->conv
  const refreshConvMap = useCallback(async () => {
    if (!myId) return
    const { data: myMems } = await supabase
      .from('conversation_members')
      .select('conversation_id')
    const convIds = (myMems ?? []).map(m => m.conversation_id)
    if (convIds.length === 0) return
    const { data: convs } = await supabase
      .from('conversations')
      .select('id, is_group')
      .in('id', convIds)
      .eq('is_group', false)
    const dmIds = (convs ?? []).map(c => c.id)
    if (dmIds.length === 0) return
    const { data: allMems } = await supabase
      .from('conversation_members')
      .select('conversation_id, user_id')
      .in('conversation_id', dmIds)
    const map: Record<string, string> = {}
    const byConv: Record<string, string[]> = {}
    ;(allMems ?? []).forEach(m => {
      byConv[m.conversation_id] = byConv[m.conversation_id] || []
      byConv[m.conversation_id].push(m.user_id)
    })
    Object.entries(byConv).forEach(([cid, uids]) => {
      const other = uids.find(u => u !== myId)
      if (other && uids.includes(myId)) map[other] = cid
    })
    setConvByUser(map)
  }, [myId])

  useEffect(() => { refreshConvMap() }, [refreshConvMap])

  const getOrCreateDm = useCallback(async (otherUserId: string): Promise<string | null> => {
    if (!myId) return null
    if (convByUser[otherUserId]) return convByUser[otherUserId]
    // Create conversation
    const { data: conv, error: cErr } = await supabase
      .from('conversations')
      .insert({ is_group: false, created_by: myId })
      .select('id')
      .single()
    if (cErr || !conv) {
      toast({ title: 'Failed to start chat', description: cErr?.message, variant: 'destructive' })
      return null
    }
    const { error: mErr } = await supabase.from('conversation_members').insert([
      { conversation_id: conv.id, user_id: myId },
      { conversation_id: conv.id, user_id: otherUserId },
    ])
    if (mErr) {
      toast({ title: 'Failed to add members', description: mErr.message, variant: 'destructive' })
      return null
    }
    setConvByUser(prev => ({ ...prev, [otherUserId]: conv.id }))
    return conv.id
  }, [myId, convByUser, toast])

  // Ensure DM exists when selecting a user (does not load messages)
  useEffect(() => {
    if (!selectedUser || !myId) return
    if (convByUser[selectedUser.id]) return
    getOrCreateDm(selectedUser.id)
  }, [selectedUser, myId, convByUser, getOrCreateDm])

  // Load messages whenever the active conversation id is known/changes
  const activeConvId = selectedUser ? convByUser[selectedUser.id] : undefined
  useEffect(() => {
    if (!activeConvId || !myId) { setMessages([]); return }
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, content, created_at, edited')
        .eq('conversation_id', activeConvId)
        .order('created_at', { ascending: true })
        .limit(500)
      if (cancelled) return
      // Merge: keep any optimistic/realtime messages not yet in DB result
      setMessages(prev => {
        const fetched = (data as Message[]) ?? []
        const ids = new Set(fetched.map(m => m.id))
        const extras = prev.filter(m => m.conversation_id === activeConvId && !ids.has(m.id))
        return [...fetched, ...extras]
      })
      if (selectedUser) {
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, unreadCount: 0 } : u))
      }
    })()
    return () => { cancelled = true }
  }, [activeConvId, myId])

  // Active conversation realtime subscription
  const activeConvId = selectedUser ? convByUser[selectedUser.id] : undefined
  useEffect(() => {
    if (!activeConvId || !myId) return
    const channel = supabase
      .channel(`messages-active-${activeConvId}-${myId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${activeConvId}`,
      }, (payload) => {
        const m = payload.new as Message
        setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [activeConvId, myId])

  // Refresh conv map when I'm added to a new conversation
  useEffect(() => {
    if (!myId) return
    const channel = supabase
      .channel(`cm-watch-${myId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'conversation_members',
        filter: `user_id=eq.${myId}`,
      }, () => { refreshConvMap() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [myId, refreshConvMap])

  // Global notification subscription: listen for all inserts and check if in our convs
  useEffect(() => {
    if (!myId) return
    const channel = supabase
      .channel(`messages-notify-${myId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
      }, async (payload) => {
        const m = payload.new as Message
        if (m.sender_id === myId) return
        let userId = Object.entries(convByUser).find(([, cid]) => cid === m.conversation_id)?.[0]
        if (!userId) {
          await refreshConvMap()
          if (selectedUserRef.current?.id && m.sender_id === selectedUserRef.current.id) {
            setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m])
          }
          return
        }
        const sender = users.find(u => u.id === userId)
        const isActive = selectedUserRef.current?.id === userId
        if (isActive) {
          setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m])
        } else {
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, unreadCount: u.unreadCount + 1 } : u))
          toast({ title: sender?.name ?? 'New message', description: m.content.slice(0, 120) })
          if (notifEnabled && typeof Notification !== 'undefined' && document.visibilityState !== 'visible') {
            try {
              new Notification(sender?.name ?? 'New message', { body: m.content.slice(0, 200), icon: sender?.avatar })
            } catch {}
          }
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [myId, convByUser, users, notifEnabled, toast, refreshConvMap])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, selectedUser?.id])

  const filteredUsers = useMemo(() => {
    return users
      .filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(u => filter === 'unread' ? u.unreadCount > 0 : true)
  }, [users, searchTerm, filter])

  // Auto-select first
  useEffect(() => {
    if (!selectedUser && users.length > 0) setSelectedUser(users[0])
  }, [users, selectedUser])

  const handleSend = async () => {
    if (!draft.trim() || !selectedUser || !myId) return
    const convId = await getOrCreateDm(selectedUser.id)
    if (!convId) return
    const content = draft.trim()
    setDraft('')
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: convId, sender_id: myId, content })
      .select('id, conversation_id, sender_id, content, created_at, edited')
      .single()
    if (error) {
      toast({ title: 'Failed to send', description: error.message, variant: 'destructive' })
      setDraft(content)
      return
    }
    if (data) {
      setMessages(prev => prev.some(x => x.id === (data as any).id) ? prev : [...prev, data as Message])
    }
  }

  const insertEmoji = (e: string) => setDraft(prev => prev + e)

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t('pages.chat.title', 'Chat')}</h1>
          <p className="text-muted-foreground">{t('pages.chat.subtitle', 'Send messages to your team in real time')}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            if (typeof Notification === 'undefined') return
            Notification.requestPermission().then(p => {
              setNotifEnabled(p === 'granted')
              toast({ title: p === 'granted' ? 'Notifications enabled' : 'Notifications blocked' })
            })
          }}
        >
          {notifEnabled ? <Bell className="w-4 h-4 mr-2" /> : <BellOff className="w-4 h-4 mr-2" />}
          {notifEnabled ? 'Notifications on' : 'Enable notifications'}
        </Button>
      </div>

      <div className="flex h-[calc(100vh-13rem)] space-x-4">
        {/* List */}
        <Card className="w-80 flex flex-col">
          <CardHeader className="pb-3 space-y-3">
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Messages</span>
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search people..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">Unread</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full">
              <div className="space-y-1 p-2">
                {filteredUsers.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">No users</p>
                )}
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className={cn(
                      'flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors',
                      selectedUser?.id === u.id ? 'bg-accent' : 'hover:bg-accent/50'
                    )}
                    onClick={() => setSelectedUser(u)}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={u.avatar} />
                      <AvatarFallback>{u.name.split(' ').map(n => n[0]).join('').slice(0,2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium truncate">{u.name}</p>
                        {u.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">{u.unreadCount}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{u.role || '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Window */}
        {selectedUser ? (
          <Card className="flex-1 flex flex-col min-w-0">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedUser.avatar} />
                  <AvatarFallback>{selectedUser.name.split(' ').map(n => n[0]).join('').slice(0,2)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{selectedUser.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{selectedUser.role || ''}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 min-h-0">
              <ScrollArea className="h-full p-4">
                <div className="space-y-3">
                  {messages.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-12">No messages yet. Say hi 👋</p>
                  )}
                  {messages.map((m) => {
                    const mine = m.sender_id === myId
                    return (
                      <div key={m.id} className={cn('flex items-end gap-2', mine ? 'justify-end' : 'justify-start')}>
                        {!mine && (
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={selectedUser.avatar} />
                            <AvatarFallback className="text-xs">{selectedUser.name.split(' ').map(n => n[0]).join('').slice(0,2)}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className={cn(
                          'max-w-xs lg:max-w-md px-3 py-2 rounded-2xl shadow-sm',
                          mine ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-accent rounded-bl-sm'
                        )}>
                          <p className="whitespace-pre-wrap break-words text-sm">{m.content}</p>
                          <div className="flex items-center gap-1 mt-1 justify-end">
                            <span className="text-[10px] opacity-70">{fmtTime(m.created_at)}</span>
                            {mine && <CheckCheck className="w-3.5 h-3.5 opacity-70" />}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>

            <div className="border-t p-3">
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm"><Smile className="w-4 h-4" /></Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="grid grid-cols-8 gap-1">
                      {EMOJIS.map(e => (
                        <button key={e} className="text-xl hover:bg-accent rounded p-1" onClick={() => insertEmoji(e)}>{e}</button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={!draft.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Select a person to start chatting</p>
          </Card>
        )}
      </div>
    </div>
  )
}
