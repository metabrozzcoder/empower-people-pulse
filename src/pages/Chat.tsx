import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  MessageSquare, Send, Search, Smile, Check, CheckCheck, Bell, BellOff,
  Phone, Video, Plus, Users, UserPlus, Paperclip, X, FileText, Download, Image as ImageIcon,
  Film, Music, Loader2,
} from 'lucide-react'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Trash2, Settings } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import CallDialog from '@/components/CallDialog'
import { formatTime, formatDate } from '@/lib/date'


interface ChatUser {
  id: string
  name: string
  avatar?: string
  role?: string
  unreadCount: number
  lastSeen?: string | null
}

interface Attachment {
  path: string
  name: string
  size: number
  type: string
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  edited?: boolean
  attachments?: Attachment[]
  read_at?: string | null
}

const EMOJIS = ['😊','😂','❤️','👍','🎉','🔥','🙏','👏','😍','🤔','😎','💯','✅','🚀','💡']

const fmtTime = (iso: string) => {
  try { return formatTime(iso) } catch { return '' }
}

const fmtLastSeen = (iso?: string | null): string => {
  if (!iso) return 'offline'
  const d = new Date(iso).getTime()
  if (isNaN(d)) return 'offline'
  const diff = Date.now() - d
  if (diff < 90_000) return 'online'
  if (diff < 3_600_000) return `last seen ${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `last seen ${Math.floor(diff / 3_600_000)}h ago`
  return `last seen ${formatDate(iso)}`
}

const isSameDay = (a: string, b: string) => {
  const da = new Date(a), db = new Date(b)
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate()
}

const dayLabel = (iso: string): string => {
  const today = new Date().toISOString()
  const y = new Date(); y.setDate(new Date().getDate() - 1)
  const yest = y.toISOString()
  if (isSameDay(iso, today)) return 'Today'
  if (isSameDay(iso, yest)) return 'Yesterday'
  return formatDate(iso)
}

type ChatLang = 'en' | 'ru' | 'uz'

const getChatLang = (lng?: string): ChatLang => {
  const base = lng?.split('-')[0]
  return base === 'ru' || base === 'uz' ? base : 'en'
}

const POSITION_TRANSLATIONS: Array<Record<ChatLang, string> & { aliases?: string[] }> = [
  { en: 'Lead Specialist', ru: 'Ведущий специалист', uz: 'Yetakchi mutaxassis', aliases: ['Leading Specialist', 'Главный специалист', 'Bosh mutaxassis'] },
  { en: 'Senior Specialist', ru: 'Старший специалист', uz: 'Katta mutaxassis' },
  { en: 'Specialist', ru: 'Специалист', uz: 'Mutaxassis' },
  { en: 'Reporter', ru: 'Репортёр', uz: 'Reportyor' },
  { en: 'Admin', ru: 'Администратор', uz: 'Administrator' },
  { en: 'Head of Reporters', ru: 'Руководитель репортёров', uz: 'Reportyorlar rahbari' },
  { en: 'Driver', ru: 'Водитель', uz: 'Haydovchi' },
  { en: 'Equipment Department', ru: 'Отдел оборудования', uz: "Uskunalar bo'limi" },
  { en: 'Initiator', ru: 'Инициатор', uz: 'Tashabbuskor' },
  { en: 'Employee', ru: 'Сотрудник', uz: 'Xodim' },
  { en: 'HR Manager', ru: 'HR менеджер', uz: 'HR menejer' },
  { en: 'Accountant', ru: 'Бухгалтер', uz: 'Buxgalter' },
  { en: 'Software Engineer', ru: 'Программист', uz: 'Dasturchi' },
  { en: 'Product Manager', ru: 'Продукт менеджер', uz: 'Mahsulot menejeri' },
  { en: 'Designer', ru: 'Дизайнер', uz: 'Dizayner' },
  { en: 'Sales Rep', ru: 'Менеджер по продажам', uz: 'Sotuv menejeri' },
]

const normalizePosition = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase()

const translatePosition = (value: string | undefined | null, lang: ChatLang) => {
  if (!value) return ''
  const normalized = normalizePosition(value)
  const match = POSITION_TRANSLATIONS.find(item => {
    const candidates = [item.en, item.ru, item.uz, ...(item.aliases ?? [])]
    return candidates.some(candidate => normalizePosition(candidate) === normalized)
  })
  return match?.[lang] ?? value
}

const ruPlural = (count: number, one: string, few: string, many: string) => {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

const formatMemberCount = (count: number, lang: ChatLang) => {
  if (lang === 'ru') return `${count} ${ruPlural(count, 'участник', 'участника', 'участников')}`
  if (lang === 'uz') return `${count} a'zo`
  return `${count} ${count === 1 ? 'member' : 'members'}`
}

const formatLastSeen = (iso: string | null | undefined, lang: ChatLang): string => {
  const labels = {
    en: { offline: 'offline', online: 'online', minute: 'last seen {n}m ago', hour: 'last seen {n}h ago', day: 'last seen' },
    ru: { offline: 'не в сети', online: 'в сети', minute: 'был(а) {n} мин назад', hour: 'был(а) {n} ч назад', day: 'был(а)' },
    uz: { offline: 'oflayn', online: 'onlayn', minute: '{n} daqiqa oldin ko‘rilgan', hour: '{n} soat oldin ko‘rilgan', day: 'oxirgi marta' },
  }[lang]
  if (!iso) return labels.offline
  const d = new Date(iso).getTime()
  if (isNaN(d)) return labels.offline
  const diff = Date.now() - d
  if (diff < 90_000) return labels.online
  if (diff < 3_600_000) return labels.minute.replace('{n}', String(Math.floor(diff / 60_000)))
  if (diff < 86_400_000) return labels.hour.replace('{n}', String(Math.floor(diff / 3_600_000)))
  return `${labels.day} ${formatDate(iso)}`
}

export default function Chat() {
  const { t, i18n } = useTranslation()
  const { toast } = useToast()
  const { currentUser, session } = useAuth()
  const myId = session?.user.id
  const chatLang = getChatLang(i18n.language)

  const [users, setUsers] = useState<ChatUser[]>([])
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null)
  const [convByUser, setConvByUser] = useState<Record<string, string>>({}) // userId -> conversationId
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [notifEnabled, setNotifEnabled] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const selectedUserRef = useRef<ChatUser | null>(null)
  useEffect(() => { selectedUserRef.current = selectedUser }, [selectedUser])
  const usersRef = useRef<ChatUser[]>([])
  useEffect(() => { usersRef.current = users }, [users])
  const callRef = useRef<any>(null)

  // Groups
  interface GroupConv { id: string; name: string; memberCount: number; created_by: string | null }
  const [groups, setGroups] = useState<GroupConv[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [listTab, setListTab] = useState<'people' | 'groups'>('people')

  // Dialogs
  const [newChatOpen, setNewChatOpen] = useState(false)
  const [newGroupOpen, setNewGroupOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupMembers, setGroupMembers] = useState<Set<string>>(new Set())

  // Group settings
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false)
  const [groupMemberProfiles, setGroupMemberProfiles] = useState<Array<{ id: string; name: string; avatar?: string; role?: string }>>([])

  // Calls
  const [call, _setCall] = useState<null | { mode: 'audio' | 'video'; role: 'caller' | 'callee'; conversationId: string; peer: { id: string; name: string; avatar?: string } }>(null)
  const setCall = (v: any) => { callRef.current = v; _setCall(v) }


  // Request browser notification permission
  useEffect(() => {
    if (typeof Notification === 'undefined') return
    if (Notification.permission === 'granted') { setNotifEnabled(true); return }
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(p => setNotifEnabled(p === 'granted'))
    }
  }, [])

  // Safety: ensure body interactions aren't left disabled by a stale Radix overlay
  useEffect(() => {
    if (!newChatOpen && !newGroupOpen) {
      const t = setTimeout(() => {
        if (document.body.style.pointerEvents === 'none') document.body.style.pointerEvents = ''
      }, 200)
      return () => clearTimeout(t)
    }
  }, [newChatOpen, newGroupOpen])

  // Load users (other profiles)
  const loadUsers = useCallback(async () => {
    if (!myId) return
    const { data } = await supabase
      .from('profiles_public' as never)
      .select('id, name, avatar_url, position, last_seen')
      .order('name')
    const list: ChatUser[] = (data ?? [])
      .filter((p: any) => p.id !== myId)
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar_url ?? undefined,
        role: p.position ?? undefined,
        unreadCount: 0,
        lastSeen: p.last_seen ?? null,
      }))
    setUsers(prev => list.map(nu => {
      const old = prev.find(o => o.id === nu.id)
      return old ? { ...nu, unreadCount: old.unreadCount } : nu
    }))
  }, [myId])
  useEffect(() => { loadUsers() }, [loadUsers])

  // Heartbeat: refresh my last_seen and refresh peer list periodically
  useEffect(() => {
    if (!myId) return
    const beat = () => { supabase.rpc('touch_last_seen' as never).then(() => loadUsers()) }
    beat()
    const iv = setInterval(beat, 45_000)
    const onVis = () => { if (document.visibilityState === 'visible') beat() }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', onVis) }
  }, [myId, loadUsers])


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

  // Last message time per DM peer (for sorting recent conversations to top)
  const [lastMsgByUser, setLastMsgByUser] = useState<Record<string, string>>({})

  // Compute unread counts + latest message time per DM peer
  const refreshUnread = useCallback(async () => {
    if (!myId) return
    const entries = Object.entries(convByUser)
    if (entries.length === 0) return
    const convIds = entries.map(([, cid]) => cid)
    const convToUser: Record<string, string> = {}
    entries.forEach(([uid, cid]) => { convToUser[cid] = uid })

    const { data: unreadData } = await supabase
      .from('messages')
      .select('conversation_id, sender_id, read_at')
      .in('conversation_id', convIds)
      .is('read_at', null)
      .neq('sender_id', myId)
    const counts: Record<string, number> = {}
    ;(unreadData ?? []).forEach((m: any) => {
      const uid = convToUser[m.conversation_id]
      if (uid) counts[uid] = (counts[uid] || 0) + 1
    })
    setUsers(prev => prev.map(u => ({ ...u, unreadCount: counts[u.id] || 0 })))

    const { data: recentData } = await supabase
      .from('messages')
      .select('conversation_id, created_at')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false })
      .limit(500)
    const latest: Record<string, string> = {}
    ;(recentData ?? []).forEach((m: any) => {
      const uid = convToUser[m.conversation_id]
      if (uid && !latest[uid]) latest[uid] = m.created_at
    })
    setLastMsgByUser(latest)
  }, [myId, convByUser])

  useEffect(() => { refreshUnread() }, [refreshUnread])

  // Load groups
  const refreshGroups = useCallback(async () => {
    if (!myId) return
    const { data: myMems } = await supabase.from('conversation_members').select('conversation_id')
    const convIds = (myMems ?? []).map(m => m.conversation_id)
    if (convIds.length === 0) { setGroups([]); return }
    const { data: convs } = await supabase
      .from('conversations').select('id, name, is_group, created_by').in('id', convIds).eq('is_group', true)
    const gIds = (convs ?? []).map(c => c.id)
    if (gIds.length === 0) { setGroups([]); return }
    const { data: allMems } = await supabase
      .from('conversation_members').select('conversation_id, user_id').in('conversation_id', gIds)
    const counts: Record<string, number> = {}
    ;(allMems ?? []).forEach(m => { counts[m.conversation_id] = (counts[m.conversation_id] || 0) + 1 })
    setGroups((convs ?? []).map((c: any) => ({ id: c.id, name: c.name || 'Untitled group', memberCount: counts[c.id] || 0, created_by: c.created_by ?? null })))
  }, [myId])
  useEffect(() => { refreshGroups() }, [refreshGroups])

  const loadGroupMembers = useCallback(async (convId: string) => {
    const { data: mems } = await supabase
      .from('conversation_members').select('user_id').eq('conversation_id', convId)
    const ids = (mems ?? []).map(m => m.user_id)
    if (ids.length === 0) { setGroupMemberProfiles([]); return }
    const { data: profs } = await supabase
      .from('profiles_public' as never).select('id, name, avatar_url, position').in('id', ids)
    setGroupMemberProfiles((profs ?? []).map((p: any) => ({
      id: p.id, name: p.name, avatar: p.avatar_url ?? undefined, role: p.position ?? undefined,
    })))
  }, [])

  const openGroupSettings = async () => {
    if (!selectedGroupId) return
    await loadGroupMembers(selectedGroupId)
    setGroupSettingsOpen(true)
  }

  const deleteGroup = async () => {
    if (!selectedGroupId) return
    const { error } = await supabase.from('conversations').delete().eq('id', selectedGroupId)
    if (error) { toast({ title: 'Failed to delete group', description: error.message, variant: 'destructive' }); return }
    toast({ title: 'Group deleted' })
    setGroupSettingsOpen(false)
    setSelectedGroupId(null)
    await refreshGroups()
  }


  // Incoming ring channel
  useEffect(() => {
    if (!myId) return
    const ch = supabase.channel(`ring-${myId}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'ring' }, ({ payload }) => {
        if (payload.from === myId || callRef.current) return
        const peer = usersRef.current.find(u => u.id === payload.from)
        // Defer to next tick so we don't block the realtime callback
        setTimeout(() => {
          const accept = window.confirm(`${peer?.name || 'Someone'} is calling (${payload.mode}). Accept?`)
          if (accept) {
            setCall({ mode: payload.mode, role: 'callee', conversationId: payload.conversationId, peer: { id: payload.from, name: peer?.name || 'Caller', avatar: peer?.avatar } })
          } else {
            supabase.channel(`call-${payload.conversationId}`).send({ type: 'broadcast', event: 'call-end', payload: { from: myId } })
          }
        }, 0)
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [myId])

  const startCall = async (mode: 'audio' | 'video') => {
    if (!selectedUser || !myId) return
    const convId = await getOrCreateDm(selectedUser.id)
    if (!convId) return
    const ringCh = supabase.channel(`ring-${selectedUser.id}`)
    await new Promise<void>((resolve) => { ringCh.subscribe((st) => { if (st === 'SUBSCRIBED') resolve() }) })
    await ringCh.send({ type: 'broadcast', event: 'ring', payload: { from: myId, conversationId: convId, mode } })
    supabase.removeChannel(ringCh)
    setCall({ mode, role: 'caller', conversationId: convId, peer: { id: selectedUser.id, name: selectedUser.name, avatar: selectedUser.avatar } })
  }

  const createGroup = async () => {
    if (!myId || !groupName.trim() || groupMembers.size === 0) return
    const { data: conv, error } = await supabase
      .from('conversations').insert({ is_group: true, name: groupName.trim(), created_by: myId }).select('id').single()
    if (error || !conv) { toast({ title: 'Failed to create group', description: error?.message, variant: 'destructive' }); return }
    const members = [myId, ...Array.from(groupMembers)].map(uid => ({ conversation_id: conv.id, user_id: uid }))
    const { error: mErr } = await supabase.from('conversation_members').insert(members)
    if (mErr) { toast({ title: 'Failed to add members', description: mErr.message, variant: 'destructive' }); return }
    toast({ title: 'Group created', description: groupName })
    setGroupName(''); setGroupMembers(new Set()); setNewGroupOpen(false)
    await refreshGroups()
    setTimeout(() => { setListTab('groups'); setSelectedUser(null); setSelectedGroupId(conv.id) }, 50)
  }


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
  const activeConvId = selectedGroupId ?? (selectedUser ? convByUser[selectedUser.id] : undefined)
  const lastLoadedConvIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (!myId) return
    if (!activeConvId) {
      // Only clear when the user actually deselected a conversation, not on transient recomputes
      if (!selectedUser && !selectedGroupId) {
        lastLoadedConvIdRef.current = null
        setMessages([])
      }
      return
    }
    const convChanged = lastLoadedConvIdRef.current !== activeConvId
    lastLoadedConvIdRef.current = activeConvId
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, content, created_at, edited, attachments, read_at')
        .eq('conversation_id', activeConvId)
        .order('created_at', { ascending: true })
        .limit(500)
      if (cancelled) return
      if (error) {
        console.error('[chat] load messages failed', error)
        return
      }
      setMessages(prev => {
        const fetched = ((data ?? []) as any[]).map(r => ({ ...r, attachments: Array.isArray(r.attachments) ? r.attachments : [] })) as Message[]
        const ids = new Set(fetched.map(m => m.id))
        // Preserve any local (optimistic or realtime) messages for the current conv that the fetch missed
        const extras = prev.filter(m => m.conversation_id === activeConvId && !ids.has(m.id))
        // On conv switch we replace; on refetch for the same conv we merge without losing local state
        if (convChanged) return [...fetched, ...extras]
        // Same-conv refetch: keep local ordering, only add fetched rows we don't yet have
        const existingIds = new Set(prev.filter(m => m.conversation_id === activeConvId).map(m => m.id))
        const additions = fetched.filter(m => !existingIds.has(m.id))
        if (additions.length === 0) return prev
        const merged = [...prev.filter(m => m.conversation_id === activeConvId), ...additions]
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        return merged
      })
      // Mark incoming messages as read
      await supabase.rpc('mark_messages_read' as never, { _conv: activeConvId } as never)
      if (selectedUser) {
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, unreadCount: 0 } : u))
      }
    })()
    return () => { cancelled = true }
  }, [activeConvId, myId, selectedUser, selectedGroupId])


  // Active conversation realtime subscription (INSERT + UPDATE for read receipts)
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
        if (m.sender_id !== myId && document.visibilityState === 'visible') {
          supabase.rpc('mark_messages_read' as never, { _conv: activeConvId } as never)
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${activeConvId}`,
      }, (payload) => {
        const m = payload.new as Message
        setMessages(prev => prev.map(x => x.id === m.id ? { ...x, ...m, attachments: Array.isArray((m as any).attachments) ? (m as any).attachments : x.attachments } : x))
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

  // Auto-select first, or a user requested via sessionStorage (e.g. from Organizations "Message" button)
  useEffect(() => {
    if (users.length === 0) return
    const pending = typeof window !== 'undefined' ? sessionStorage.getItem('chat.startWithUser') : null
    if (pending) {
      const target = users.find(u => u.id === pending)
      if (target) {
        sessionStorage.removeItem('chat.startWithUser')
        setListTab('people')
        setSelectedGroupId(null)
        setSelectedUser(target)
        return
      }
    }
    if (!selectedUser && !selectedGroupId) setSelectedUser(users[0])
  }, [users, selectedUser, selectedGroupId])


  const uploadFilesToConv = async (convId: string, files: File[]): Promise<Attachment[]> => {
    const uploaded: Attachment[] = []
    for (const f of files) {
      if (f.size > 50 * 1024 * 1024) {
        toast({ title: 'File too large', description: `${f.name} exceeds 50MB`, variant: 'destructive' })
        continue
      }
      const safeName = f.name.replace(/[^\w.\-]+/g, '_')
      const path = `${convId}/${crypto.randomUUID()}-${safeName}`
      const { error } = await supabase.storage.from('chat-attachments').upload(path, f, {
        contentType: f.type || 'application/octet-stream',
        upsert: false,
      })
      if (error) {
        toast({ title: 'Upload failed', description: `${f.name}: ${error.message}`, variant: 'destructive' })
        continue
      }
      uploaded.push({ path, name: f.name, size: f.size, type: f.type || 'application/octet-stream' })
    }
    return uploaded
  }

  const handleSend = async () => {
    if ((!draft.trim() && pendingFiles.length === 0) || !myId) return
    let convId: string | null = null
    if (selectedGroupId) convId = selectedGroupId
    else if (selectedUser) convId = await getOrCreateDm(selectedUser.id)
    if (!convId) return
    const content = draft.trim()
    const filesToSend = pendingFiles
    setDraft('')
    setPendingFiles([])
    let attachments: Attachment[] = []
    if (filesToSend.length > 0) {
      setUploading(true)
      attachments = await uploadFilesToConv(convId, filesToSend)
      setUploading(false)
      if (attachments.length === 0 && !content) return
    }
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: convId, sender_id: myId, content, attachments: attachments as any })
      .select('id, conversation_id, sender_id, content, created_at, edited, attachments, read_at')
      .single()
    if (error) {
      toast({ title: 'Failed to send', description: error.message, variant: 'destructive' })
      setDraft(content)
      setPendingFiles(filesToSend)
      return
    }
    if (data) {
      const msg = { ...(data as any), attachments: Array.isArray((data as any).attachments) ? (data as any).attachments : [] } as Message
      setMessages(prev => prev.some(x => x.id === msg.id) ? prev : [...prev, msg])
    }
  }

  const getSignedUrl = useCallback(async (path: string): Promise<string | null> => {
    if (signedUrls[path]) return signedUrls[path]
    const { data } = await supabase.storage.from('chat-attachments').createSignedUrl(path, 3600)
    if (data?.signedUrl) {
      setSignedUrls(prev => ({ ...prev, [path]: data.signedUrl }))
      return data.signedUrl
    }
    return null
  }, [signedUrls])

  // Pre-sign attachments in the current view
  useEffect(() => {
    const paths = messages.flatMap(m => (m.attachments ?? []).map(a => a.path)).filter(p => !signedUrls[p])
    if (paths.length === 0) return
    ;(async () => {
      const entries: Record<string, string> = {}
      for (const p of paths) {
        const { data } = await supabase.storage.from('chat-attachments').createSignedUrl(p, 3600)
        if (data?.signedUrl) entries[p] = data.signedUrl
      }
      if (Object.keys(entries).length) setSignedUrls(prev => ({ ...prev, ...entries }))
    })()
  }, [messages, signedUrls])

  const activeGroup = groups.find(g => g.id === selectedGroupId) || null

  const insertEmoji = (e: string) => setDraft(prev => prev + e)

  const onFilesPicked = (files: FileList | null) => {
    if (!files) return
    const arr = Array.from(files).slice(0, 10)
    setPendingFiles(prev => [...prev, ...arr].slice(0, 10))
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const files = Array.from(e.clipboardData.files || [])
    if (files.length) {
      e.preventDefault()
      setPendingFiles(prev => [...prev, ...files].slice(0, 10))
    }
  }

  const fmtSize = (b: number) => b < 1024 ? `${b} B` : b < 1024*1024 ? `${(b/1024).toFixed(1)} KB` : `${(b/1024/1024).toFixed(1)} MB`
  const fileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-4 h-4" />
    if (type.startsWith('video/')) return <Film className="w-4 h-4" />
    if (type.startsWith('audio/')) return <Music className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }

  return (
    <div className="chat-surface -m-4 md:-m-6 p-4 md:p-6 min-h-[calc(100vh-4rem)] space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {t('pages.chat.subtitle', 'Send messages to your team in real time')}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t('pages.chat.title', 'Chat')}</h1>
        </div>
        <Button
          variant="outline"
          className="rounded-full backdrop-blur bg-background/70"
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

      <div className="flex h-[calc(100vh-13rem)] min-h-[28rem] gap-4 overflow-hidden">
        {/* List */}
        <Card className="chat-card w-80 shrink-0 flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border-0">
          <CardHeader className="shrink-0 pb-3 space-y-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Messages</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost"><Plus className="w-4 h-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setNewChatOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" /> New chat
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setNewGroupOpen(true)}>
                    <Users className="w-4 h-4 mr-2" /> New group
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={listTab} onValueChange={(v) => setListTab(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="people">People</TabsTrigger>
                <TabsTrigger value="groups">Groups</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 p-0 overflow-hidden">
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pr-1">
              <div className="min-w-0 space-y-1 p-2 pr-1">
                {listTab === 'people' ? (
                  <>
                    {filteredUsers.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-8">No users</p>
                    )}
                    {filteredUsers.map((u) => {
                      const isOnline = u.lastSeen && (Date.now() - new Date(u.lastSeen).getTime()) < 90_000
                      return (
                      <div
                        key={u.id}
                        className={cn(
                          'flex min-w-0 items-center gap-3 overflow-hidden p-2.5 rounded-xl cursor-pointer transition-all',
                          selectedUser?.id === u.id && !selectedGroupId ? 'chat-row-active' : 'hover:bg-accent/60'
                        )}
                        onClick={() => { setSelectedGroupId(null); setSelectedUser(u) }}
                      >
                        <div className="relative shrink-0">
                          <Avatar className="w-11 h-11 ring-2 ring-background">
                            <AvatarImage src={u.avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold">{u.name.split(' ').map(n => n[0]).join('').slice(0,2)}</AvatarFallback>
                          </Avatar>
                          {isOnline && <span className="online-dot absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex min-w-0 items-center justify-between gap-2">
                            <p className="min-w-0 flex-1 truncate font-semibold text-sm">{u.name}</p>
                            {u.unreadCount > 0 && (
                              <Badge className="shrink-0 text-[10px] h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground border-0">{u.unreadCount}</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{translatePosition(u.role, chatLang) || '—'}</p>
                        </div>
                      </div>
                    )})}
                  </>
                ) : (
                  <>
                    {groups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-8">No groups yet</p>
                    )}
                    {groups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase())).map(g => (
                      <div
                        key={g.id}
                        className={cn(
                          'flex min-w-0 items-center gap-3 overflow-hidden p-3 rounded-lg cursor-pointer transition-colors',
                          selectedGroupId === g.id ? 'bg-accent' : 'hover:bg-accent/50'
                        )}
                        onClick={() => { setSelectedUser(null); setSelectedGroupId(g.id) }}
                      >
                        <Avatar className="w-10 h-10 shrink-0"><AvatarFallback><Users className="w-4 h-4" /></AvatarFallback></Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{g.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{formatMemberCount(g.memberCount, chatLang)}</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat Window */}
        {(selectedUser || activeGroup) ? (
          <Card className="chat-card flex-1 flex flex-col min-w-0 rounded-2xl border-0 overflow-hidden">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center space-x-3">
                {activeGroup ? (
                  <>
                    <button
                      className="flex items-center space-x-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
                      onClick={openGroupSettings}
                      title="Group settings"
                    >
                      <Avatar className="w-10 h-10"><AvatarFallback><Users className="w-4 h-4" /></AvatarFallback></Avatar>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold truncate">{activeGroup.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {formatMemberCount(activeGroup.memberCount, chatLang)} · {chatLang === 'ru' ? 'нажмите для информации' : chatLang === 'uz' ? "ma'lumot uchun bosing" : 'tap for info'}
                        </p>
                      </div>
                    </button>
                    <Button size="icon" variant="ghost" title="Group settings" onClick={openGroupSettings}>
                      <Settings className="w-4 h-4" />
                    </Button>
                  </>
                ) : selectedUser ? (
                  <>
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={selectedUser.avatar} />
                      <AvatarFallback>{selectedUser.name.split(' ').map(n => n[0]).join('').slice(0,2)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold truncate">{selectedUser.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {formatLastSeen(selectedUser.lastSeen, chatLang)}{selectedUser.role ? ` · ${translatePosition(selectedUser.role, chatLang)}` : ''}
                      </p>
                    </div>
                    <Button size="icon" variant="ghost" title="Voice call" onClick={() => startCall('audio')}>
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" title="Video call" onClick={() => startCall('video')}>
                      <Video className="w-4 h-4" />
                    </Button>
                  </>
                ) : null}
              </div>
            </CardHeader>


            <CardContent className="flex-1 p-0 min-h-0">
              <ScrollArea className="h-full p-4">
                <div className="space-y-3">
                  {messages.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-12">No messages yet. Say hi 👋</p>
                  )}
                  {messages.map((m, idx) => {
                    const mine = m.sender_id === myId
                    const prev = idx > 0 ? messages[idx - 1] : null
                    const showDay = !prev || !isSameDay(prev.created_at, m.created_at)
                    return (
                      <React.Fragment key={m.id}>
                        {showDay && (
                          <div className="flex justify-center my-2">
                            <span className="text-[11px] px-3 py-1 rounded-full bg-muted text-muted-foreground">
                              {dayLabel(m.created_at)}
                            </span>
                          </div>
                        )}
                        <div className={cn('flex items-end gap-2', mine ? 'justify-end' : 'justify-start')}>
                        {!mine && selectedUser && (
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={selectedUser.avatar} />
                            <AvatarFallback className="text-xs">{selectedUser.name.split(' ').map(n => n[0]).join('').slice(0,2)}</AvatarFallback>
                          </Avatar>
                        )}
                        {!mine && activeGroup && (
                          <Avatar className="w-7 h-7">
                            <AvatarFallback className="text-xs">{(users.find(u => u.id === m.sender_id)?.name || '?').slice(0,2)}</AvatarFallback>
                          </Avatar>
                        )}

                        <div className={cn(
                          'max-w-xs lg:max-w-md px-3.5 py-2.5 rounded-2xl space-y-2',
                          mine ? 'chat-bubble-mine rounded-br-md' : 'chat-bubble-theirs rounded-bl-md'
                        )}>
                          {(m.attachments ?? []).length > 0 && (
                            <div className="space-y-2">
                              {(m.attachments ?? []).map((a, i) => {
                                const url = signedUrls[a.path]
                                if (a.type.startsWith('image/') && url) {
                                  return (
                                    <a key={i} href={url} target="_blank" rel="noreferrer" className="block">
                                      <img src={url} alt={a.name} className="rounded-lg max-h-64 object-cover" />
                                    </a>
                                  )
                                }
                                if (a.type.startsWith('video/') && url) {
                                  return <video key={i} src={url} controls className="rounded-lg max-h-64 w-full" />
                                }
                                if (a.type.startsWith('audio/') && url) {
                                  return <audio key={i} src={url} controls className="w-full" />
                                }
                                return (
                                  <a
                                    key={i}
                                    href={url || '#'}
                                    target="_blank"
                                    rel="noreferrer"
                                    download={a.name}
                                    className={cn(
                                      'flex items-center gap-2 p-2 rounded-lg border text-xs hover:opacity-90 transition',
                                      mine ? 'border-primary-foreground/30 bg-primary-foreground/10' : 'bg-background/60 border-border'
                                    )}
                                  >
                                    {fileIcon(a.type)}
                                    <div className="flex-1 min-w-0">
                                      <p className="truncate font-medium">{a.name}</p>
                                      <p className="opacity-70">{fmtSize(a.size)}</p>
                                    </div>
                                    <Download className="w-3.5 h-3.5 opacity-70" />
                                  </a>
                                )
                              })}
                            </div>
                          )}
                          {m.content && <p className="whitespace-pre-wrap break-words text-sm">{m.content}</p>}
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-[10px] opacity-70">{fmtTime(m.created_at)}</span>
                            {mine && (
                              m.read_at
                                ? <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
                                : <Check className="w-3.5 h-3.5 opacity-70" />
                            )}
                          </div>
                        </div>
                      </div>
                      </React.Fragment>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>

            <div className="border-t p-3 space-y-2">
              {pendingFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {pendingFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 bg-accent rounded-lg pl-2 pr-1 py-1 text-xs">
                      {fileIcon(f.type)}
                      <span className="max-w-[160px] truncate">{f.name}</span>
                      <span className="opacity-60">{fmtSize(f.size)}</span>
                      <button
                        className="p-1 hover:bg-background rounded"
                        onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))}
                        aria-label="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div
                className="flex items-center gap-2 rounded-2xl border border-border bg-background/70 backdrop-blur px-2 py-1.5"
                onDragOver={(e) => { e.preventDefault() }}
                onDrop={(e) => { e.preventDefault(); onFilesPicked(e.dataTransfer.files) }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => { onFilesPicked(e.target.files); if (fileInputRef.current) fileInputRef.current.value = '' }}
                />
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full shrink-0" title="Attach files" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full shrink-0"><Smile className="w-4 h-4" /></Button>
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
                  onPaste={handlePaste}
                  placeholder={pendingFiles.length ? 'Add a caption...' : 'Type a message, drop files, or paste an image...'}
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 shadow-none px-1"
                  disabled={uploading}
                />
                <Button onClick={handleSend} disabled={uploading || (!draft.trim() && pendingFiles.length === 0)} size="icon" className="h-9 w-9 rounded-full shrink-0 bg-gradient-to-br from-primary to-primary/80 shadow-md">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>

          </Card>
        ) : (
          <Card className="chat-card flex-1 flex flex-col items-center justify-center rounded-2xl border-0 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-primary" />
            </div>
            <p className="text-muted-foreground text-sm">Select a person to start chatting</p>
          </Card>
        )}
      </div>

      {/* New chat dialog */}
      <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Start a new chat</DialogTitle></DialogHeader>
          <Input placeholder="Search people..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <ScrollArea className="h-72">
            <div className="space-y-1">
              {filteredUsers.map(u => (
                <div key={u.id}
                  className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-accent"
                  onClick={() => {
                    setNewChatOpen(false)
                    setTimeout(() => {
                      setSelectedGroupId(null)
                      setSelectedUser(u)
                      setListTab('people')
                    }, 50)
                  }}>

                  <Avatar className="w-9 h-9"><AvatarImage src={u.avatar} /><AvatarFallback>{u.name.slice(0,2)}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.role || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* New group dialog */}
      <Dialog open={newGroupOpen} onOpenChange={setNewGroupOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create a group</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Group name</Label>
              <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g. Production Team" />
            </div>
            <div>
              <Label className="text-xs">Add members</Label>
              <ScrollArea className="h-60 mt-1 border rounded-md p-2">
                <div className="space-y-1">
                  {users.map(u => {
                    const checked = groupMembers.has(u.id)
                    return (
                      <label key={u.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer">
                        <Checkbox checked={checked} onCheckedChange={(v) => {
                          setGroupMembers(prev => { const next = new Set(prev); if (v) next.add(u.id); else next.delete(u.id); return next })
                        }} />
                        <Avatar className="w-8 h-8"><AvatarImage src={u.avatar} /><AvatarFallback>{u.name.slice(0,2)}</AvatarFallback></Avatar>
                        <span className="text-sm">{u.name}</span>
                      </label>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewGroupOpen(false)}>Cancel</Button>
            <Button onClick={createGroup} disabled={!groupName.trim() || groupMembers.size === 0}>Create group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group settings dialog */}
      <Dialog open={groupSettingsOpen} onOpenChange={setGroupSettingsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" /> {activeGroup?.name || 'Group'}
            </DialogTitle>
            <DialogDescription>
              {formatMemberCount(groupMemberProfiles.length, chatLang)}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="members">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>

            <div className="mt-3">
              <TabsContent value="members">
                <ScrollArea className="h-72">
                  <div className="space-y-1">
                    {groupMemberProfiles.map(p => (
                      <div key={p.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent">
                        <Avatar className="w-9 h-9"><AvatarImage src={p.avatar} /><AvatarFallback>{p.name.slice(0,2)}</AvatarFallback></Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.name}{p.id === activeGroup?.created_by && <span className="ml-2 text-[10px] text-muted-foreground">{chatLang === 'ru' ? '(создатель)' : chatLang === 'uz' ? '(yaratuvchi)' : '(creator)'}</span>}</p>
                          <p className="text-xs text-muted-foreground truncate">{translatePosition(p.role, chatLang) || '—'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="media">
                <ScrollArea className="h-72">
                  <div className="grid grid-cols-3 gap-2">
                    {messages.flatMap(m => (m.attachments ?? []).filter(a => a.type.startsWith('image/') || a.type.startsWith('video/'))).map((a, i) => {
                      const url = signedUrls[a.path]
                      if (!url) return null
                      if (a.type.startsWith('image/')) {
                        return <a key={i} href={url} target="_blank" rel="noreferrer"><img src={url} alt={a.name} className="w-full h-24 object-cover rounded-md" /></a>
                      }
                      return <video key={i} src={url} className="w-full h-24 object-cover rounded-md" />
                    })}
                    {messages.flatMap(m => (m.attachments ?? []).filter(a => a.type.startsWith('image/') || a.type.startsWith('video/'))).length === 0 && (
                      <p className="col-span-3 text-center text-sm text-muted-foreground py-8">No media shared</p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="files">
                <ScrollArea className="h-72">
                  <div className="space-y-2">
                    {messages.flatMap(m => (m.attachments ?? []).filter(a => !a.type.startsWith('image/') && !a.type.startsWith('video/'))).map((a, i) => {
                      const url = signedUrls[a.path]
                      return (
                        <a key={i} href={url || '#'} target="_blank" rel="noreferrer" download={a.name}
                          className="flex items-center gap-2 p-2 rounded-md border hover:bg-accent">
                          {fileIcon(a.type)}
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium">{a.name}</p>
                            <p className="text-xs text-muted-foreground">{fmtSize(a.size)}</p>
                          </div>
                          <Download className="w-4 h-4 opacity-70" />
                        </a>
                      )
                    })}
                    {messages.flatMap(m => (m.attachments ?? []).filter(a => !a.type.startsWith('image/') && !a.type.startsWith('video/'))).length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-8">No files shared</p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>

          </Tabs>

          <DialogFooter className="flex sm:justify-between gap-2">
            {activeGroup?.created_by === myId ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive"><Trash2 className="w-4 h-4 mr-2" /> Delete group</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this group?</AlertDialogTitle>
                    <AlertDialogDescription>
                      All messages and files shared in this group will be permanently removed. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteGroup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : <span />}
            <Button variant="outline" onClick={() => setGroupSettingsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {call && myId && (
        <CallDialog
          open={!!call}
          onClose={() => setCall(null)}
          mode={call.mode}
          role={call.role}
          conversationId={call.conversationId}
          myId={myId}
          peer={call.peer}
        />
      )}
    </div>
  )
}

